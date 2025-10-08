import { join } from "path";
import { promises as fs } from "fs";
import { createWriteStream, createReadStream } from "fs";
import { pipeline } from "stream/promises";
import * as crypto from "crypto";
import * as zlib from "zlib";
import { v4 as uuidv4 } from "uuid";
import { WordPressSite, PressBoxError } from "../../shared/types";
import { DockerManager } from "./dockerManager";

export interface ExportOptions {
    includeFiles: boolean;
    includeDatabases: boolean;
    includeConfigs: boolean;
    includeLogFiles: boolean;
    includePressBoxSettings: boolean;
    excludePatterns: string[];
    compressionLevel: "none" | "fast" | "best";
}

export interface ImportOptions {
    targetSiteId?: string;
    overwriteExisting: boolean;
    preserveSiteSettings: boolean;
    selectiveImport?: {
        files: boolean;
        database: boolean;
        configs: boolean;
        pressboxSettings: boolean;
    };
}

export interface ExportManifest {
    version: string;
    exportId: string;
    site: {
        id: string;
        name: string;
        domain: string;
        phpVersion: string;
        webServer: string;
        database: string;
    };
    exportOptions: ExportOptions;
    components: string[];
    createdAt: Date;
    totalSize: number;
    checksums: Record<string, string>;
}

export interface ExportResult {
    exportId: string;
    exportPath: string;
    size: number;
    manifest: ExportManifest;
    checksums: Record<string, string>;
    duration: number;
}

export interface ImportResult {
    success: boolean;
    siteId: string;
    componentsImported: string[];
    warnings: string[];
    errors: string[];
    duration: number;
}

/**
 * Export Manager
 *
 * Handles comprehensive site export and import functionality with
 * selective component inclusion and advanced archiving capabilities.
 */
export class ExportManager {
    private exportsPath: string;
    private dockerManager: DockerManager;

    constructor(dockerManager: DockerManager) {
        this.dockerManager = dockerManager;
        this.exportsPath = join(
            process.env.HOME || process.env.USERPROFILE || ".",
            "PressBox",
            "exports"
        );
        this.initialize();
    }

    /**
     * Initialize the Export Manager
     */
    private async initialize(): Promise<void> {
        try {
            await fs.mkdir(this.exportsPath, { recursive: true });
            console.log("Export Manager initialized");
        } catch (error) {
            console.error("Failed to initialize Export Manager:", error);
            throw new PressBoxError(
                "Failed to initialize Export Manager",
                "EXPORT_INIT_ERROR",
                { error }
            );
        }
    }

    /**
     * Export a complete WordPress site with selective components
     */
    async exportSite(
        site: WordPressSite,
        options: ExportOptions
    ): Promise<ExportResult> {
        const startTime = Date.now();
        const exportId = uuidv4();
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const exportFileName = `${site.name}-${timestamp}.pbx`;
        const exportPath = join(this.exportsPath, exportFileName);

        try {
            console.log(
                `Starting export for site ${site.name} with ID ${exportId}`
            );

            // Create temporary directory for export preparation
            const tempDir = join(this.exportsPath, `temp-${exportId}`);
            await fs.mkdir(tempDir, { recursive: true });

            const manifest: ExportManifest = {
                version: "1.0",
                exportId,
                site: {
                    id: site.id,
                    name: site.name,
                    domain: site.domain,
                    phpVersion: site.phpVersion,
                    webServer: site.webServer,
                    database: site.database,
                },
                exportOptions: options,
                components: [],
                createdAt: new Date(),
                totalSize: 0,
                checksums: {},
            };

            // Export components based on options
            if (options.includeFiles) {
                console.log("Exporting site files...");
                await this.exportSiteFiles(
                    site,
                    tempDir,
                    options.excludePatterns
                );
                manifest.components.push("files");
            }

            if (options.includeDatabases) {
                console.log("Exporting database...");
                await this.exportDatabase(site, tempDir);
                manifest.components.push("database");
            }

            if (options.includeConfigs) {
                console.log("Exporting configurations...");
                await this.exportConfigurations(site, tempDir);
                manifest.components.push("configs");
            }

            if (options.includeLogFiles) {
                console.log("Exporting log files...");
                await this.exportLogFiles(site, tempDir);
                manifest.components.push("logs");
            }

            if (options.includePressBoxSettings) {
                console.log("Exporting PressBox settings...");
                await this.exportPressBoxSettings(site, tempDir);
                manifest.components.push("pressbox-settings");
            }

            // Generate checksums for all exported files
            manifest.checksums = await this.generateChecksums(tempDir);

            // Create manifest file
            await fs.writeFile(
                join(tempDir, "manifest.json"),
                JSON.stringify(manifest, null, 2)
            );

            // Create compressed archive
            console.log("Creating compressed archive...");
            await this.createArchive(
                tempDir,
                exportPath,
                options.compressionLevel
            );

            // Calculate final size and checksums
            const stats = await fs.stat(exportPath);
            const finalChecksums = await this.calculateFileChecksum(exportPath);

            // Cleanup temp directory
            await fs.rm(tempDir, { recursive: true, force: true });

            const result: ExportResult = {
                exportId,
                exportPath,
                size: stats.size,
                manifest: {
                    ...manifest,
                    totalSize: stats.size,
                },
                checksums: { [exportFileName]: finalChecksums },
                duration: Date.now() - startTime,
            };

            console.log(
                `Export completed successfully in ${result.duration}ms`
            );
            return result;
        } catch (error) {
            console.error("Export failed:", error);
            throw new PressBoxError(
                `Site export failed: ${error instanceof Error ? error.message : String(error)}`,
                "EXPORT_FAILED",
                { siteId: site.id, options, exportId }
            );
        }
    }

    /**
     * Import a WordPress site from an archive
     */
    async importSite(
        archivePath: string,
        options: ImportOptions = {
            overwriteExisting: false,
            preserveSiteSettings: true,
        }
    ): Promise<ImportResult> {
        const startTime = Date.now();
        const importId = uuidv4();

        try {
            console.log(
                `Starting import from ${archivePath} with ID ${importId}`
            );

            // Create temporary directory for extraction
            const tempDir = join(this.exportsPath, `import-${importId}`);
            await fs.mkdir(tempDir, { recursive: true });

            // Extract archive
            console.log("Extracting archive...");
            await this.extractArchive(archivePath, tempDir);

            // Read and validate manifest
            const manifestPath = join(tempDir, "manifest.json");
            const manifest: ExportManifest = JSON.parse(
                await fs.readFile(manifestPath, "utf-8")
            );

            // Validate checksums
            console.log("Validating checksums...");
            await this.validateChecksums(tempDir, manifest.checksums);

            // Determine target site ID
            const targetSiteId = options.targetSiteId || manifest.site.id;

            const result: ImportResult = {
                success: false,
                siteId: targetSiteId,
                componentsImported: [],
                warnings: [],
                errors: [],
                duration: 0,
            };

            try {
                // Import components based on manifest and options
                if (
                    manifest.components.includes("files") &&
                    (!options.selectiveImport || options.selectiveImport.files)
                ) {
                    console.log("Importing site files...");
                    await this.importSiteFiles(
                        tempDir,
                        targetSiteId,
                        options.overwriteExisting
                    );
                    result.componentsImported.push("files");
                }

                if (
                    manifest.components.includes("database") &&
                    (!options.selectiveImport ||
                        options.selectiveImport.database)
                ) {
                    console.log("Importing database...");
                    await this.importDatabase(
                        tempDir,
                        targetSiteId,
                        manifest.site
                    );
                    result.componentsImported.push("database");
                }

                if (
                    manifest.components.includes("configs") &&
                    (!options.selectiveImport ||
                        options.selectiveImport.configs)
                ) {
                    console.log("Importing configurations...");
                    await this.importConfigurations(tempDir, targetSiteId);
                    result.componentsImported.push("configs");
                }

                if (
                    manifest.components.includes("pressbox-settings") &&
                    (!options.selectiveImport ||
                        options.selectiveImport.pressboxSettings) &&
                    !options.preserveSiteSettings
                ) {
                    console.log("Importing PressBox settings...");
                    await this.importPressBoxSettings(tempDir, targetSiteId);
                    result.componentsImported.push("pressbox-settings");
                }

                result.success = true;
                result.duration = Date.now() - startTime;

                console.log(
                    `Import completed successfully in ${result.duration}ms`
                );
            } catch (importError) {
                result.errors.push(
                    importError instanceof Error
                        ? importError.message
                        : String(importError)
                );
                result.success = false;
            }

            // Cleanup temp directory
            await fs.rm(tempDir, { recursive: true, force: true });

            if (!result.success) {
                throw new PressBoxError(
                    `Import failed: ${result.errors.join(", ")}`,
                    "IMPORT_FAILED",
                    { archivePath, options, result }
                );
            }

            return result;
        } catch (error) {
            console.error("Import failed:", error);
            throw new PressBoxError(
                `Site import failed: ${error instanceof Error ? error.message : String(error)}`,
                "IMPORT_FAILED",
                { archivePath, options, importId }
            );
        }
    }

    /**
     * List available export files
     */
    async listExports(): Promise<
        Array<{
            filename: string;
            path: string;
            size: number;
            created: Date;
            manifest?: ExportManifest;
        }>
    > {
        try {
            const files = await fs.readdir(this.exportsPath);
            const exports = [];

            for (const file of files) {
                if (file.endsWith(".pbx")) {
                    const filePath = join(this.exportsPath, file);
                    const stats = await fs.stat(filePath);

                    const exportInfo = {
                        filename: file,
                        path: filePath,
                        size: stats.size,
                        created: stats.birthtime,
                        manifest: undefined as ExportManifest | undefined,
                    };

                    // Try to read manifest from archive
                    try {
                        const manifest =
                            await this.readManifestFromArchive(filePath);
                        exportInfo.manifest = manifest;
                    } catch (error) {
                        console.warn(
                            `Could not read manifest from ${file}:`,
                            error
                        );
                    }

                    exports.push(exportInfo);
                }
            }

            return exports.sort(
                (a, b) => b.created.getTime() - a.created.getTime()
            );
        } catch (error) {
            console.error("Failed to list exports:", error);
            return [];
        }
    }

    /**
     * Delete an export file
     */
    async deleteExport(exportPath: string): Promise<void> {
        try {
            await fs.unlink(exportPath);
            console.log(`Deleted export: ${exportPath}`);
        } catch (error) {
            throw new PressBoxError(
                `Failed to delete export: ${error instanceof Error ? error.message : String(error)}`,
                "EXPORT_DELETE_ERROR",
                { exportPath }
            );
        }
    }

    /**
     * Export site files with exclusion patterns
     */
    private async exportSiteFiles(
        site: WordPressSite,
        tempDir: string,
        excludePatterns: string[]
    ): Promise<void> {
        const filesDir = join(tempDir, "files");
        await fs.mkdir(filesDir, { recursive: true });

        try {
            await this.copyDirectoryWithExclusions(
                site.path,
                filesDir,
                excludePatterns
            );
        } catch (error) {
            throw new PressBoxError(
                "Failed to export site files",
                "EXPORT_FILES_ERROR",
                { error, sitePath: site.path }
            );
        }
    }

    /**
     * Export database using Docker mysqldump
     */
    private async exportDatabase(
        site: WordPressSite,
        tempDir: string
    ): Promise<void> {
        const dbDir = join(tempDir, "database");
        await fs.mkdir(dbDir, { recursive: true });

        try {
            const dumpPath = join(dbDir, "wordpress.sql");

            // Use Docker exec to create database dump
            const dumpCommand = [
                "mysqldump",
                "-u",
                "root",
                "-proot_password", // This should come from site config
                "--single-transaction",
                "--routines",
                "--triggers",
                "--add-drop-database",
                "--databases",
                "wordpress",
            ];

            const dumpOutput = await this.dockerManager.execInContainer(
                `${site.id}_mysql`,
                dumpCommand
            );

            await fs.writeFile(dumpPath, dumpOutput);

            // Also create a metadata file
            const metadata = {
                database: site.database,
                phpVersion: site.phpVersion,
                webServer: site.webServer,
                exportDate: new Date().toISOString(),
            };

            await fs.writeFile(
                join(dbDir, "metadata.json"),
                JSON.stringify(metadata, null, 2)
            );
        } catch (error) {
            throw new PressBoxError(
                "Failed to export database",
                "EXPORT_DATABASE_ERROR",
                { error, siteId: site.id }
            );
        }
    }

    /**
     * Export configuration files
     */
    private async exportConfigurations(
        site: WordPressSite,
        tempDir: string
    ): Promise<void> {
        const configDir = join(tempDir, "configs");
        await fs.mkdir(configDir, { recursive: true });

        const configsPath = join(
            process.env.HOME || process.env.USERPROFILE || ".",
            "PressBox",
            "configs",
            site.id
        );

        try {
            // Check if configs exist and copy them
            try {
                await fs.access(configsPath);
                await this.copyDirectory(configsPath, configDir);
            } catch {
                console.warn(
                    `No configuration files found for site ${site.id}`
                );

                // Create a basic config export with current settings
                const basicConfig = {
                    webServer: site.webServer,
                    phpVersion: site.phpVersion,
                    database: site.database,
                    ssl: site.ssl,
                    xdebug: site.xdebug || false,
                };

                await fs.writeFile(
                    join(configDir, "site-config.json"),
                    JSON.stringify(basicConfig, null, 2)
                );
            }
        } catch (error) {
            throw new PressBoxError(
                "Failed to export configurations",
                "EXPORT_CONFIG_ERROR",
                { error, siteId: site.id }
            );
        }
    }

    /**
     * Export log files
     */
    private async exportLogFiles(
        site: WordPressSite,
        tempDir: string
    ): Promise<void> {
        const logsDir = join(tempDir, "logs");
        await fs.mkdir(logsDir, { recursive: true });

        const logsPath = join(
            process.env.HOME || process.env.USERPROFILE || ".",
            "PressBox",
            "logs",
            site.id
        );

        try {
            try {
                await fs.access(logsPath);
                await this.copyDirectory(logsPath, logsDir);
            } catch {
                console.warn(`No log files found for site ${site.id}`);
                // Create an empty logs directory with a readme
                await fs.writeFile(
                    join(logsDir, "README.txt"),
                    "No log files were available at the time of export."
                );
            }
        } catch (error) {
            throw new PressBoxError(
                "Failed to export log files",
                "EXPORT_LOGS_ERROR",
                { error, siteId: site.id }
            );
        }
    }

    /**
     * Export PressBox-specific settings
     */
    private async exportPressBoxSettings(
        site: WordPressSite,
        tempDir: string
    ): Promise<void> {
        const settingsDir = join(tempDir, "pressbox-settings");
        await fs.mkdir(settingsDir, { recursive: true });

        try {
            // Export site configuration
            const siteConfig = {
                site: site,
                exportedAt: new Date().toISOString(),
                version: "1.0",
            };

            await fs.writeFile(
                join(settingsDir, "site.json"),
                JSON.stringify(siteConfig, null, 2)
            );
        } catch (error) {
            throw new PressBoxError(
                "Failed to export PressBox settings",
                "EXPORT_SETTINGS_ERROR",
                { error, siteId: site.id }
            );
        }
    }

    /**
     * Create compressed archive from directory using tar and gzip
     */
    private async createArchive(
        sourceDir: string,
        outputPath: string,
        compressionLevel: "none" | "fast" | "best"
    ): Promise<void> {
        const { spawn } = await import("child_process");

        return new Promise((resolve, reject) => {
            // Use tar command for archiving (cross-platform compatible)
            const args = ["-czf", outputPath, "-C", sourceDir, "."];

            const tar = spawn("tar", args, {
                stdio: ["pipe", "pipe", "pipe"],
            });

            let stderr = "";

            tar.stderr.on("data", (data) => {
                stderr += data.toString();
            });

            tar.on("close", (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(
                        new PressBoxError(
                            `Archive creation failed: ${stderr}`,
                            "ARCHIVE_ERROR",
                            { code, stderr, sourceDir, outputPath }
                        )
                    );
                }
            });

            tar.on("error", (error) => {
                reject(
                    new PressBoxError(
                        "Failed to execute tar command",
                        "ARCHIVE_EXEC_ERROR",
                        { error, sourceDir, outputPath }
                    )
                );
            });
        });
    }

    /**
     * Extract archive to directory using tar
     */
    private async extractArchive(
        archivePath: string,
        targetDir: string
    ): Promise<void> {
        const { spawn } = await import("child_process");

        return new Promise((resolve, reject) => {
            // Ensure target directory exists
            fs.mkdir(targetDir, { recursive: true })
                .then(() => {
                    const args = ["-xzf", archivePath, "-C", targetDir];

                    const tar = spawn("tar", args, {
                        stdio: ["pipe", "pipe", "pipe"],
                    });

                    let stderr = "";

                    tar.stderr.on("data", (data) => {
                        stderr += data.toString();
                    });

                    tar.on("close", (code) => {
                        if (code === 0) {
                            resolve();
                        } else {
                            reject(
                                new PressBoxError(
                                    `Archive extraction failed: ${stderr}`,
                                    "EXTRACT_ERROR",
                                    { code, stderr, archivePath, targetDir }
                                )
                            );
                        }
                    });

                    tar.on("error", (error) => {
                        reject(
                            new PressBoxError(
                                "Failed to execute tar command",
                                "EXTRACT_EXEC_ERROR",
                                { error, archivePath, targetDir }
                            )
                        );
                    });
                })
                .catch(reject);
        });
    }

    /**
     * Copy directory with exclusion patterns
     */
    private async copyDirectoryWithExclusions(
        source: string,
        target: string,
        excludePatterns: string[]
    ): Promise<void> {
        try {
            await fs.mkdir(target, { recursive: true });
            await this.copyDirectoryRecursive(source, target, excludePatterns);
        } catch (error) {
            throw new PressBoxError(
                "Failed to copy directory with exclusions",
                "COPY_ERROR",
                { error, source, target, excludePatterns }
            );
        }
    }

    /**
     * Copy directory recursively with exclusion patterns
     */
    private async copyDirectoryRecursive(
        source: string,
        target: string,
        excludePatterns: string[],
        relativePath: string = ""
    ): Promise<void> {
        const entries = await fs.readdir(source, { withFileTypes: true });

        for (const entry of entries) {
            const currentPath = join(relativePath, entry.name);
            const sourcePath = join(source, entry.name);
            const targetPath = join(target, entry.name);

            // Check if this path should be excluded
            if (this.shouldExclude(currentPath, excludePatterns)) {
                continue;
            }

            if (entry.isDirectory()) {
                await fs.mkdir(targetPath, { recursive: true });
                await this.copyDirectoryRecursive(
                    sourcePath,
                    targetPath,
                    excludePatterns,
                    currentPath
                );
            } else if (entry.isFile()) {
                await fs.copyFile(sourcePath, targetPath);
            }
        }
    }

    /**
     * Check if a path should be excluded based on patterns
     */
    private shouldExclude(path: string, excludePatterns: string[]): boolean {
        const normalizedPath = path.replace(/\\/g, "/");

        return excludePatterns.some((pattern) => {
            // Simple pattern matching - support for wildcards
            const regex = pattern
                .replace(/\./g, "\\.")
                .replace(/\*/g, ".*")
                .replace(/\?/g, ".");

            return (
                new RegExp(`^${regex}$`).test(normalizedPath) ||
                new RegExp(regex).test(normalizedPath)
            );
        });
    }

    /**
     * Copy directory recursively
     */
    private async copyDirectory(source: string, target: string): Promise<void> {
        try {
            await fs.mkdir(target, { recursive: true });
            const entries = await fs.readdir(source, { withFileTypes: true });

            for (const entry of entries) {
                const sourcePath = join(source, entry.name);
                const targetPath = join(target, entry.name);

                if (entry.isDirectory()) {
                    await this.copyDirectory(sourcePath, targetPath);
                } else {
                    await fs.copyFile(sourcePath, targetPath);
                }
            }
        } catch (error) {
            throw new PressBoxError(
                "Failed to copy directory",
                "COPY_DIRECTORY_ERROR",
                { error, source, target }
            );
        }
    }

    /**
     * Generate checksums for all files in directory
     */
    private async generateChecksums(
        dir: string
    ): Promise<Record<string, string>> {
        const checksums: Record<string, string> = {};
        await this.generateChecksumsRecursive(dir, dir, checksums);
        return checksums;
    }

    /**
     * Generate checksums recursively
     */
    private async generateChecksumsRecursive(
        baseDir: string,
        currentDir: string,
        checksums: Record<string, string>
    ): Promise<void> {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = join(currentDir, entry.name);

            if (entry.isDirectory()) {
                await this.generateChecksumsRecursive(
                    baseDir,
                    fullPath,
                    checksums
                );
            } else if (entry.isFile()) {
                const relativePath = fullPath
                    .replace(baseDir, "")
                    .replace(/^[/\\]/, "")
                    .replace(/\\/g, "/");
                checksums[relativePath] =
                    await this.calculateFileChecksum(fullPath);
            }
        }
    }

    /**
     * Calculate SHA-256 checksum for a file
     */
    private async calculateFileChecksum(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash("sha256");
            const stream = createReadStream(filePath);

            stream.on("error", reject);
            stream.on("data", (chunk) => hash.update(chunk));
            stream.on("end", () => resolve(hash.digest("hex")));
        });
    }

    /**
     * Validate checksums against manifest
     */
    private async validateChecksums(
        dir: string,
        expectedChecksums: Record<string, string>
    ): Promise<void> {
        const actualChecksums = await this.generateChecksums(dir);

        for (const [file, expectedHash] of Object.entries(expectedChecksums)) {
            const actualHash = actualChecksums[file];
            if (!actualHash) {
                throw new PressBoxError(
                    `Missing file during import: ${file}`,
                    "CHECKSUM_VALIDATION_ERROR",
                    { file, expectedHash }
                );
            }

            if (actualHash !== expectedHash) {
                throw new PressBoxError(
                    `Checksum mismatch for file: ${file}`,
                    "CHECKSUM_VALIDATION_ERROR",
                    { file, expectedHash, actualHash }
                );
            }
        }
    }

    /**
     * Read manifest from archive without extracting completely
     */
    private async readManifestFromArchive(
        archivePath: string
    ): Promise<ExportManifest> {
        const { spawn } = await import("child_process");

        return new Promise((resolve, reject) => {
            // Use tar to extract just the manifest file
            const tar = spawn(
                "tar",
                ["-xzf", archivePath, "manifest.json", "--to-stdout"],
                {
                    stdio: ["pipe", "pipe", "pipe"],
                }
            );

            let stdout = "";
            let stderr = "";

            tar.stdout.on("data", (data) => {
                stdout += data.toString();
            });

            tar.stderr.on("data", (data) => {
                stderr += data.toString();
            });

            tar.on("close", (code) => {
                if (code === 0 && stdout.trim()) {
                    try {
                        resolve(JSON.parse(stdout));
                    } catch (error) {
                        reject(
                            new PressBoxError(
                                "Failed to parse manifest",
                                "MANIFEST_PARSE_ERROR",
                                { error }
                            )
                        );
                    }
                } else {
                    reject(
                        new PressBoxError(
                            "Manifest not found in archive",
                            "MANIFEST_NOT_FOUND",
                            { archivePath, stderr }
                        )
                    );
                }
            });

            tar.on("error", (error) => {
                reject(
                    new PressBoxError(
                        "Failed to read manifest from archive",
                        "MANIFEST_READ_ERROR",
                        { error, archivePath }
                    )
                );
            });
        });
    }

    /**
     * Import site files
     */
    private async importSiteFiles(
        tempDir: string,
        targetSiteId: string,
        overwrite: boolean
    ): Promise<void> {
        const filesDir = join(tempDir, "files");
        const targetPath = join(
            process.env.HOME || process.env.USERPROFILE || ".",
            "PressBox",
            "sites",
            targetSiteId
        );

        try {
            await fs.access(filesDir);

            if (overwrite) {
                // Remove existing files first
                try {
                    await fs.rm(targetPath, { recursive: true, force: true });
                } catch (error) {
                    console.warn("Could not remove existing files:", error);
                }
            }

            await this.copyDirectory(filesDir, targetPath);
        } catch (error) {
            throw new PressBoxError(
                "Failed to import site files",
                "IMPORT_FILES_ERROR",
                { error, tempDir, targetSiteId }
            );
        }
    }

    /**
     * Import database
     */
    private async importDatabase(
        tempDir: string,
        targetSiteId: string,
        siteInfo: any
    ): Promise<void> {
        const dbDir = join(tempDir, "database");
        const sqlFile = join(dbDir, "wordpress.sql");

        try {
            await fs.access(sqlFile);
            const sqlContent = await fs.readFile(sqlFile, "utf-8");

            // Import using Docker mysql command
            const importCommand = [
                "mysql",
                "-u",
                "root",
                "-proot_password",
                "--database=wordpress",
            ];

            // Execute the import
            await this.dockerManager.execInContainer(`${targetSiteId}_mysql`, [
                ...importCommand,
                "-e",
                sqlContent,
            ]);
        } catch (error) {
            throw new PressBoxError(
                "Failed to import database",
                "IMPORT_DATABASE_ERROR",
                { error, tempDir, targetSiteId }
            );
        }
    }

    /**
     * Import configurations
     */
    private async importConfigurations(
        tempDir: string,
        targetSiteId: string
    ): Promise<void> {
        const configDir = join(tempDir, "configs");
        const targetConfigPath = join(
            process.env.HOME || process.env.USERPROFILE || ".",
            "PressBox",
            "configs",
            targetSiteId
        );

        try {
            await fs.access(configDir);
            await this.copyDirectory(configDir, targetConfigPath);
        } catch (error) {
            console.warn(
                "No configurations to import or import failed:",
                error
            );
        }
    }

    /**
     * Import PressBox settings
     */
    private async importPressBoxSettings(
        tempDir: string,
        targetSiteId: string
    ): Promise<void> {
        const settingsDir = join(tempDir, "pressbox-settings");

        try {
            await fs.access(settingsDir);
            // Implementation would depend on how settings are stored
            console.log(`Importing PressBox settings for site ${targetSiteId}`);
        } catch (error) {
            console.warn("No PressBox settings to import:", error);
        }
    }
}
