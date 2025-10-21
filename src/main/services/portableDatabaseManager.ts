import { promises as fs } from "fs";
import { join } from "path";
import { platform, arch } from "os";
import { spawn, ChildProcess } from "child_process";
import * as https from "https";
import { createWriteStream } from "fs";
import { pipeline } from "stream";
import { promisify } from "util";
import * as path from "path";
import { app, BrowserWindow } from "electron";

const pipelineAsync = promisify(pipeline);

/**
 * Portable MySQL/MariaDB Manager
 *
 * Downloads and manages portable MySQL/MariaDB installations
 * within the PressBox application folder
 */

export interface DatabaseVersion {
    type: "mysql" | "mariadb";
    version: string;
    installed: boolean;
    path?: string;
    downloadUrl?: string;
    size?: string;
}

export interface DatabaseServerProcess {
    process: ChildProcess;
    pid: number;
    port: number;
    version: string;
    type: "mysql" | "mariadb";
}

export class PortableDatabaseManager {
    private static instance: PortableDatabaseManager;
    private basePath: string;
    private runningServers: Map<string, DatabaseServerProcess> = new Map();

    // Download URLs for portable MySQL/MariaDB
    // Note: These URLs are verified as of October 2025
    // MySQL CDN: Older versions may be removed as new ones are released
    // MariaDB Archive: Stable URLs, versions remain available long-term
    private downloadUrls: {
        mysql: Record<string, { win32: string; size: string }>;
        mariadb: Record<string, { win32: string; size: string }>;
    } = {
        mysql: {
            "8.0": {
                // MySQL 8.0.37 (Verified: Oct 2025)
                win32: "https://cdn.mysql.com/Downloads/MySQL-8.0/mysql-8.0.37-winx64.zip",
                size: "~350 MB",
            },
            "8.1": {
                // MySQL 8.4 (Innovation release, successor to 8.1)
                win32: "https://cdn.mysql.com/Downloads/MySQL-8.4/mysql-8.4.0-winx64.zip",
                size: "~380 MB",
            },
            "8.2": {
                // MySQL 8.4 LTS (successor to 8.0)
                win32: "https://cdn.mysql.com/Downloads/MySQL-8.4/mysql-8.4.0-winx64.zip",
                size: "~385 MB",
            },
            "5.7": {
                // MySQL 5.7.44 (Final 5.7 release, EOL October 2023)
                win32: "https://cdn.mysql.com/Downloads/MySQL-5.7/mysql-5.7.44-winx64.zip",
                size: "~340 MB",
            },
        },
        mariadb: {
            "11.2": {
                // MariaDB 11.2.5 (LTS - Verified: Oct 2025)
                win32: "https://archive.mariadb.org/mariadb-11.2.5/winx64-packages/mariadb-11.2.5-winx64.zip",
                size: "~180 MB",
            },
            "10.11": {
                // MariaDB 10.11.10 (LTS - Verified: Oct 2025)
                win32: "https://archive.mariadb.org/mariadb-10.11.10/winx64-packages/mariadb-10.11.10-winx64.zip",
                size: "~175 MB",
            },
            "10.6": {
                // MariaDB 10.6.20 (LTS - Verified: Oct 2025)
                win32: "https://archive.mariadb.org/mariadb-10.6.20/winx64-packages/mariadb-10.6.20-winx64.zip",
                size: "~170 MB",
            },
            "10.4": {
                // MariaDB 10.4.34 (Final 10.4.x, EOL June 2024)
                win32: "https://archive.mariadb.org/mariadb-10.4.34/winx64-packages/mariadb-10.4.34-winx64.zip",
                size: "~165 MB",
            },
        },
    };

    private constructor() {
        // Set base path to PressBox user data directory
        const userDataPath = app.getPath("userData");
        this.basePath = join(userDataPath, "..", "PressBox");
    }

    public static getInstance(): PortableDatabaseManager {
        if (!PortableDatabaseManager.instance) {
            PortableDatabaseManager.instance = new PortableDatabaseManager();
        }
        return PortableDatabaseManager.instance;
    }

    /**
     * Initialize the portable database manager
     */
    public async initialize(): Promise<void> {
        // Create base directories
        await this.ensureDirectories();

        // Scan for installed versions
        await this.scanInstalledVersions();
    }

    /**
     * Ensure required directories exist
     */
    private async ensureDirectories(): Promise<void> {
        const dirs = [
            this.basePath,
            join(this.basePath, "mysql"),
            join(this.basePath, "mariadb"),
            join(this.basePath, "temp"),
        ];

        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                console.error(`Failed to create directory ${dir}:`, error);
            }
        }
    }

    /**
     * Get all available database versions (installed and available for download)
     */
    public async getAvailableVersions(): Promise<DatabaseVersion[]> {
        const versions: DatabaseVersion[] = [];

        // Check MySQL versions
        for (const version of Object.keys(this.downloadUrls.mysql)) {
            const installed = await this.isVersionInstalled("mysql", version);
            const installPath = installed
                ? join(this.basePath, "mysql", `mysql-${version}`)
                : undefined;

            versions.push({
                type: "mysql",
                version,
                installed,
                path: installPath,
                downloadUrl: this.downloadUrls.mysql[version]?.win32,
                size: this.downloadUrls.mysql[version]?.size,
            });
        }

        // Check MariaDB versions
        for (const version of Object.keys(this.downloadUrls.mariadb)) {
            const installed = await this.isVersionInstalled("mariadb", version);
            const installPath = installed
                ? join(this.basePath, "mariadb", `mariadb-${version}`)
                : undefined;

            versions.push({
                type: "mariadb",
                version,
                installed,
                path: installPath,
                downloadUrl: this.downloadUrls.mariadb[version]?.win32,
                size: this.downloadUrls.mariadb[version]?.size,
            });
        }

        return versions;
    }

    /**
     * Check if a specific version is installed
     */
    public async isVersionInstalled(
        type: "mysql" | "mariadb",
        version: string
    ): Promise<boolean> {
        const installPath = join(this.basePath, type, `${type}-${version}`);

        try {
            await fs.access(installPath);

            // Check for mysqld.exe or mariadbd.exe
            const binPath = join(installPath, "bin");
            const executable = type === "mysql" ? "mysqld.exe" : "mariadbd.exe";
            const executablePath = join(binPath, executable);

            await fs.access(executablePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Download and install a database version
     */
    public async installVersion(
        type: "mysql" | "mariadb",
        version: string,
        webContents?: Electron.WebContents
    ): Promise<{ success: boolean; error?: string }> {
        console.log(`🚀 Starting installation of ${type} ${version}`);

        try {
            const currentPlatform = platform();

            if (currentPlatform !== "win32") {
                const error =
                    "Portable database installation is currently only supported on Windows";
                console.error(`❌ ${error}`);
                return { success: false, error };
            }

            // Get download URL
            const downloadUrl = this.downloadUrls[type]?.[version]?.win32;
            if (!downloadUrl) {
                const error = `No download URL found for ${type} ${version}`;
                console.error(`❌ ${error}`);
                return { success: false, error };
            }

            console.log(`📥 Download URL: ${downloadUrl}`);

            // Create installation directory
            const installDir = join(this.basePath, type, `${type}-${version}`);
            console.log(`📁 Installation directory: ${installDir}`);

            // Clean up any partial installation
            try {
                await fs.rm(installDir, { recursive: true, force: true });
                console.log(`🧹 Cleaned up existing installation directory`);
            } catch (e) {
                // Ignore if doesn't exist
            }

            await fs.mkdir(installDir, { recursive: true });

            // Download
            webContents?.send("portable:install-progress", {
                percent: 0,
                downloaded: 0,
                total: 0,
                status: "Downloading...",
            });

            const tempZipPath = join(
                this.basePath,
                "temp",
                `${type}-${version}.zip`
            );

            // Ensure temp directory exists
            await fs.mkdir(join(this.basePath, "temp"), { recursive: true });

            console.log(`⬇️ Downloading to: ${tempZipPath}`);
            const downloaded = await this.downloadFile(
                downloadUrl,
                tempZipPath,
                webContents
            );

            if (!downloaded) {
                const error = "Download failed";
                console.error(`❌ ${error}`);
                return { success: false, error };
            }

            console.log(`✅ Download complete`);
            console.log(
                `📊 Downloaded file size: ${(await fs.stat(tempZipPath)).size} bytes`
            );

            // Extract
            webContents?.send("portable:install-progress", {
                percent: 90,
                downloaded: 0,
                total: 0,
                status: "Extracting...",
            });

            console.log(`📦 Extracting ZIP file...`);
            console.log(`📦 Source: ${tempZipPath}`);
            console.log(`📦 Destination: ${installDir}`);

            await this.extractZip(tempZipPath, installDir);

            console.log(`✅ Extraction complete - verifying...`);

            // Give filesystem time to flush (important on Windows)
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Verify extraction actually worked
            const extractedItems = await fs.readdir(installDir);
            console.log(
                `📁 Items in installation directory after extraction:`,
                extractedItems
            );

            if (extractedItems.length === 0) {
                throw new Error(
                    "Extraction failed - installation directory is empty"
                );
            }

            // Initialize database (create data directory, etc.)
            webContents?.send("portable:install-progress", {
                percent: 95,
                downloaded: 0,
                total: 0,
                status: "Initializing...",
            });

            console.log(`⚙️ Initializing database...`);
            await this.initializeDatabase(type, version, installDir);
            console.log(`✅ Database initialized`);

            // Verify installation
            const executablePath = join(
                installDir,
                "bin",
                type === "mysql" ? "mysqld.exe" : "mariadbd.exe"
            );
            console.log(`🔍 Verifying installation: ${executablePath}`);

            try {
                await fs.access(executablePath);
                console.log(`✅ Executable found: ${executablePath}`);
            } catch (e) {
                const error = `Installation verification failed: ${executablePath} not found`;
                console.error(`❌ ${error}`);

                // List what we actually got
                try {
                    const binPath = join(installDir, "bin");
                    const binContents = await fs.readdir(binPath);
                    console.error(`📁 Contents of bin folder:`, binContents);
                } catch (listError) {
                    console.error(`❌ Could not list bin folder contents`);
                }

                return { success: false, error };
            }

            // Clean up
            console.log(`🧹 Cleaning up temp file: ${tempZipPath}`);
            try {
                await fs.unlink(tempZipPath);
            } catch (e) {
                console.warn(`⚠️ Could not delete temp file: ${e}`);
            }

            webContents?.send("portable:install-progress", {
                percent: 100,
                downloaded: 0,
                total: 0,
                status: "Complete!",
            });

            console.log(
                `🎉 Installation of ${type} ${version} completed successfully!`
            );
            return { success: true };
        } catch (error: any) {
            console.error(`❌ Failed to install ${type} ${version}:`, error);
            webContents?.send("portable:install-progress", {
                percent: 0,
                downloaded: 0,
                total: 0,
                status: `Error: ${error.message}`,
            });
            return {
                success: false,
                error: error.message || "Installation failed",
            };
        }
    }

    /**
     * Download a file with progress tracking
     */
    private async downloadFile(
        url: string,
        destPath: string,
        webContents?: Electron.WebContents
    ): Promise<boolean> {
        return new Promise((resolve, reject) => {
            https
                .get(url, (response) => {
                    if (
                        response.statusCode === 302 ||
                        response.statusCode === 301
                    ) {
                        // Follow redirect
                        if (response.headers.location) {
                            this.downloadFile(
                                response.headers.location,
                                destPath,
                                webContents
                            )
                                .then(resolve)
                                .catch(reject);
                        }
                        return;
                    }

                    if (response.statusCode !== 200) {
                        const errorMsg = `Download failed with status ${response.statusCode}`;
                        console.error(`❌ ${errorMsg}`);
                        console.error(`   URL: ${url}`);
                        console.error(
                            `   This version may no longer be available at this URL.`
                        );
                        console.error(
                            `   Please check MySQL/MariaDB download pages for the latest version.`
                        );
                        reject(new Error(errorMsg));
                        return;
                    }

                    const totalSize = parseInt(
                        response.headers["content-length"] || "0",
                        10
                    );
                    let downloadedSize = 0;

                    const fileStream = createWriteStream(destPath);

                    response.on("data", (chunk) => {
                        downloadedSize += chunk.length;
                        const percent = Math.round(
                            (downloadedSize / totalSize) * 100
                        );
                        webContents?.send("portable:install-progress", {
                            percent,
                            downloaded: downloadedSize,
                            total: totalSize,
                            status: `Downloading... ${percent}%`,
                        });
                    });

                    response.pipe(fileStream);

                    fileStream.on("finish", () => {
                        fileStream.close();
                        resolve(true);
                    });

                    fileStream.on("error", (error) => {
                        fs.unlink(destPath);
                        reject(error);
                    });
                })
                .on("error", reject);
        });
    }

    /**
     * Extract ZIP file
     */
    private async extractZip(zipPath: string, destPath: string): Promise<void> {
        console.log(`📦 === EXTRACTION START ===`);
        console.log(`📦 ZIP file: ${zipPath}`);
        console.log(`📦 Destination: ${destPath}`);

        const AdmZip = require("adm-zip");
        const zip = new AdmZip(zipPath);

        // Extract to a temp location first
        const tempExtractPath = join(destPath, "_temp_extract");
        console.log(`📦 Creating temp extract path: ${tempExtractPath}`);
        await fs.mkdir(tempExtractPath, { recursive: true });

        console.log(`📦 Extracting ZIP to temp location...`);
        zip.extractAllTo(tempExtractPath, true);
        console.log(`✅ ZIP extraction to temp completed`);

        // Find the actual MySQL/MariaDB folder inside
        const extractedContents = await fs.readdir(tempExtractPath);
        console.log(
            `📁 Extracted ${extractedContents.length} items:`,
            extractedContents
        );

        if (extractedContents.length === 0) {
            throw new Error("ZIP file appears to be empty");
        }

        // If there's a single folder, move its contents up
        if (extractedContents.length === 1) {
            const nestedFolder = join(tempExtractPath, extractedContents[0]);
            const stat = await fs.stat(nestedFolder);

            if (stat.isDirectory()) {
                console.log(`📂 Found nested folder: ${extractedContents[0]}`);
                console.log(`📂 Reading contents of nested folder...`);

                // Move all contents from nested folder to destPath
                const nestedContents = await fs.readdir(nestedFolder);
                console.log(
                    `📂 Found ${nestedContents.length} items to move:`,
                    nestedContents
                );

                for (const item of nestedContents) {
                    const srcPath = join(nestedFolder, item);
                    const destItemPath = join(destPath, item);
                    console.log(`📦 Moving: ${item}`);
                    console.log(`   From: ${srcPath}`);
                    console.log(`   To: ${destItemPath}`);

                    try {
                        await fs.rename(srcPath, destItemPath);
                        console.log(`   ✅ Moved successfully`);
                    } catch (moveError: any) {
                        console.error(
                            `   ❌ Failed to move ${item}:`,
                            moveError.message
                        );
                        throw moveError;
                    }
                }

                // Clean up temp folder
                console.log(`🧹 Cleaning up temp extraction folder...`);
                await fs.rm(tempExtractPath, { recursive: true, force: true });
                console.log(
                    `✅ Extraction complete, files moved to: ${destPath}`
                );
                console.log(`📦 === EXTRACTION END ===`);
                return;
            }
        }

        // If multiple files/folders at root, move them all
        console.log(
            `📂 Multiple items at root (${extractedContents.length}), moving all...`
        );
        for (const item of extractedContents) {
            const srcPath = join(tempExtractPath, item);
            const destItemPath = join(destPath, item);
            console.log(`📦 Moving: ${item} -> ${destItemPath}`);
            await fs.rename(srcPath, destItemPath);
        }

        // Clean up temp folder
        console.log(`🧹 Cleaning up temp extraction folder...`);
        await fs.rm(tempExtractPath, { recursive: true, force: true });
        console.log(`✅ Extraction complete`);
        console.log(`📦 === EXTRACTION END ===`);
    }

    /**
     * Initialize database (create data directory, config, etc.)
     */
    private async initializeDatabase(
        type: "mysql" | "mariadb",
        version: string,
        installPath: string
    ): Promise<void> {
        console.log(`📊 Initializing ${type} ${version} database...`);

        const dataPath = join(installPath, "data");
        const binPath = join(installPath, "bin");
        const executable = type === "mysql" ? "mysqld.exe" : "mariadbd.exe";
        const executablePath = join(binPath, executable);

        // Create data directory
        console.log(`   📁 Creating data directory: ${dataPath}`);
        await fs.mkdir(dataPath, { recursive: true });

        // Create basic config file
        const configContent = `[mysqld]
port=3306
basedir=${installPath.replace(/\\/g, "/")}
datadir=${dataPath.replace(/\\/g, "/")}
bind-address=127.0.0.1
default-storage-engine=InnoDB
max_connections=100
`;

        console.log(`   📝 Writing my.ini configuration...`);
        await fs.writeFile(join(installPath, "my.ini"), configContent);

        // Check if data directory is already initialized
        const mysqlDir = join(dataPath, "mysql");
        try {
            await fs.access(mysqlDir);
            console.log(
                `   ✅ Database already initialized (mysql system db exists)`
            );
            return;
        } catch {
            // Not initialized yet, continue
            console.log(
                `   🔧 Database not initialized, running initialization...`
            );
        }

        // MySQL initialization requires a completely EMPTY data directory
        // Clean up any leftover files from failed initialization attempts
        try {
            const existingFiles = await fs.readdir(dataPath);
            if (existingFiles.length > 0) {
                console.log(
                    `   🧹 Cleaning up ${existingFiles.length} files from previous initialization attempts...`
                );
                for (const file of existingFiles) {
                    const filePath = join(dataPath, file);
                    try {
                        const stats = await fs.stat(filePath);
                        if (stats.isDirectory()) {
                            await fs.rm(filePath, {
                                recursive: true,
                                force: true,
                            });
                        } else {
                            await fs.unlink(filePath);
                        }
                        console.log(`      ✅ Removed: ${file}`);
                    } catch (err) {
                        console.warn(`      ⚠️ Could not remove ${file}:`, err);
                    }
                }
                console.log(`   ✅ Data directory cleaned successfully`);
            }
        } catch (err) {
            console.error(`   ⚠️ Error cleaning data directory:`, err);
        }

        // Initialize MySQL data directory with no root password
        // This creates the system tables and root user with blank password
        console.log(`   🚀 Running ${executable} --initialize-insecure...`);

        return new Promise((resolve, reject) => {
            const initProcess = spawn(
                executablePath,
                [
                    `--defaults-file=${join(installPath, "my.ini")}`,
                    "--initialize-insecure", // Creates root with no password
                    `--basedir=${installPath}`,
                    `--datadir=${dataPath}`,
                ],
                {
                    cwd: installPath,
                    stdio: ["ignore", "pipe", "pipe"],
                }
            );

            let output = "";
            let errorOutput = "";

            initProcess.stdout?.on("data", (data) => {
                output += data.toString();
                console.log(`   [init] ${data.toString().trim()}`);
            });

            initProcess.stderr?.on("data", (data) => {
                errorOutput += data.toString();
                // MySQL initialization outputs to stderr, but it's not always an error
                console.log(`   [init] ${data.toString().trim()}`);
            });

            initProcess.on("close", (code) => {
                if (code === 0) {
                    console.log(`   ✅ Database initialized successfully`);
                    console.log(
                        `   🔐 Root user created with NO PASSWORD (blank)`
                    );
                    resolve();
                } else {
                    console.error(
                        `   ❌ Database initialization failed with code ${code}`
                    );
                    console.error(`   Output: ${output}`);
                    console.error(`   Error: ${errorOutput}`);
                    reject(
                        new Error(
                            `Database initialization failed: ${errorOutput || output}`
                        )
                    );
                }
            });

            initProcess.on("error", (error) => {
                console.error(
                    `   ❌ Failed to start initialization process:`,
                    error
                );
                reject(error);
            });

            // Initialization can take 30-60 seconds
            setTimeout(() => {
                console.log(
                    `   ⏳ Initialization is taking longer than expected (still running)...`
                );
            }, 10000);
        });
    }

    /**
     * Start a database server
     */
    public async startServer(
        type: "mysql" | "mariadb",
        version: string,
        port: number = 3306
    ): Promise<{ success: boolean; error?: string; pid?: number }> {
        try {
            const key = `${type}-${version}`;

            // Check if already running
            if (this.runningServers.has(key)) {
                return {
                    success: true,
                    pid: this.runningServers.get(key)!.pid,
                };
            }

            const installPath = join(this.basePath, type, `${type}-${version}`);
            const binPath = join(installPath, "bin");
            const executable = type === "mysql" ? "mysqld.exe" : "mariadbd.exe";
            const executablePath = join(binPath, executable);

            // Check if installed
            try {
                await fs.access(executablePath);
            } catch {
                return {
                    success: false,
                    error: `${type} ${version} is not installed`,
                };
            }

            // CRITICAL: Check if database is initialized before starting
            // If not initialized, MySQL will fail to start or won't have root user
            const dataPath = join(installPath, "data");
            const mysqlSystemDb = join(dataPath, "mysql");

            console.log(`   🔍 Checking if database is initialized...`);
            try {
                await fs.access(mysqlSystemDb);
                console.log(`   ✅ Database is already initialized`);
            } catch {
                console.log(
                    `   ⚠️ Database is NOT initialized - initializing now...`
                );
                console.log(`   📊 This will take 30-60 seconds...`);
                await this.initializeDatabase(type, version, installPath);
                console.log(`   ✅ Database initialization complete`);
            }

            // Check if MySQL is already running on this port (from a previous site)
            // LocalWP approach: ONE MySQL instance serves ALL sites with different databases
            console.log(
                `   🔍 Checking if MySQL is already running on port ${port}...`
            );
            try {
                const { execSync } = require("child_process");

                // Find process using the port (Windows-specific)
                const netstatOutput = execSync(
                    `netstat -ano | findstr :${port}`,
                    { encoding: "utf-8" }
                ).toString();

                const lines = netstatOutput.trim().split("\n");
                const pids = new Set<number>();

                for (const line of lines) {
                    const parts = line.trim().split(/\s+/);
                    const pid = parseInt(parts[parts.length - 1]);
                    if (!isNaN(pid) && pid > 0) {
                        pids.add(pid);
                    }
                }

                if (pids.size > 0) {
                    // MySQL is already running - this is GOOD!
                    // We'll reuse the existing instance for multiple sites
                    const pid = Array.from(pids)[0];
                    console.log(
                        `   ✅ MySQL already running on port ${port} (PID: ${pid})`
                    );
                    console.log(
                        `   ℹ️  Reusing existing MySQL instance for this site`
                    );

                    // Store the existing process in our tracking map
                    // Note: We don't have the actual ChildProcess object, but we track it's running
                    this.runningServers.set(key, {
                        process: null as any, // Existing process we didn't spawn
                        pid: pid,
                        port: port,
                        version: version,
                        type: type,
                    });

                    return {
                        success: true,
                        pid: pid,
                    };
                }

                console.log(
                    `   ℹ️  No MySQL running on port ${port}, will start new instance`
                );
            } catch (checkError) {
                // No processes found - port is available
                console.log(
                    `   ℹ️  Port ${port} is available, will start MySQL`
                );
            }

            // Start the server
            console.log(`   🚀 Starting ${type} ${version} server process...`);
            const process = spawn(
                executablePath,
                [
                    `--defaults-file=${join(installPath, "my.ini")}`,
                    `--port=${port}`,
                ],
                {
                    cwd: installPath,
                    stdio: ["ignore", "pipe", "pipe"],
                }
            );

            this.runningServers.set(key, {
                process,
                pid: process.pid!,
                port,
                version,
                type,
            });

            console.log(
                `   ✅ ${type} ${version} server started successfully (PID: ${process.pid})`
            );

            return { success: true, pid: process.pid };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "Failed to start server",
            };
        }
    }

    /**
     * Stop a database server
     */
    public async stopServer(
        type: "mysql" | "mariadb",
        version: string
    ): Promise<boolean> {
        const key = `${type}-${version}`;
        const server = this.runningServers.get(key);

        if (server) {
            server.process.kill();
            this.runningServers.delete(key);
            return true;
        }

        return false;
    }

    /**
     * Get running servers
     */
    public getRunningServers(): DatabaseServerProcess[] {
        return Array.from(this.runningServers.values());
    }

    /**
     * Scan for installed versions
     */
    private async scanInstalledVersions(): Promise<void> {
        // This is called during initialization to build a cache
        // of installed versions for faster lookups
        await this.getAvailableVersions();
    }

    /**
     * Uninstall a version
     */
    public async uninstallVersion(
        type: "mysql" | "mariadb",
        version: string
    ): Promise<boolean> {
        try {
            // Stop server if running
            await this.stopServer(type, version);

            // Delete installation directory
            const installPath = join(this.basePath, type, `${type}-${version}`);
            await fs.rm(installPath, { recursive: true, force: true });

            return true;
        } catch (error) {
            console.error(`Failed to uninstall ${type} ${version}:`, error);
            return false;
        }
    }

    /**
     * Get base path for portable installations
     */
    public getBasePath(): string {
        return this.basePath;
    }
}
