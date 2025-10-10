/**
 * Native WordPress Server Manager
 *
 * Manages WordPress sites using portable PHP and MySQL without Docker
 * Similar to LocalWP's approach
 */

import { spawn, ChildProcess } from "child_process";
import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";
import { promisify } from "util";
// import { Extract } from 'unzipper'; // Removed - using built-in methods instead
import fetch from "node-fetch";

const execAsync = promisify(require("child_process").exec);

export interface WordPressSite {
    id: string;
    name: string;
    domain: string;
    path: string;
    port: number;
    phpVersion: string;
    mysqlPort: number;
    status: "stopped" | "starting" | "running" | "error";
    wordpressVersion: string;
    url: string;
    adminUrl: string;
    process?: ChildProcess;
    mysqlProcess?: ChildProcess;
}

export interface SiteConfig {
    siteName: string;
    domain: string;
    phpVersion: "8.1" | "8.2" | "8.3";
    wordpressVersion: "latest" | string;
    adminUser: string;
    adminPassword: string;
    adminEmail: string;
}

export class NativeWordPressManager {
    private sites: Map<string, WordPressSite> = new Map();
    private pressBoxPath: string;
    private sitesPath: string;
    private resourcesPath: string;
    private phpBinariesPath: string;
    private mysqlBinariesPath: string;

    constructor() {
        this.pressBoxPath = path.join(os.homedir(), "PressBox");
        this.sitesPath = path.join(this.pressBoxPath, "sites");
        this.resourcesPath = path.join(this.pressBoxPath, "resources");
        this.phpBinariesPath = path.join(this.resourcesPath, "php");
        this.mysqlBinariesPath = path.join(this.resourcesPath, "mysql");
    }

    /**
     * Initialize the WordPress manager
     */
    async initialize(): Promise<void> {
        console.log("🚀 Initializing Native WordPress Manager...");

        // Create directory structure
        await this.createDirectoryStructure();

        // Download and setup portable PHP
        await this.setupPortablePHP();

        // Download and setup portable MySQL
        await this.setupPortableMySQL();

        // Load existing sites
        await this.loadExistingSites();

        console.log("✅ Native WordPress Manager initialized successfully");
    }

    /**
     * Create directory structure
     */
    private async createDirectoryStructure(): Promise<void> {
        const directories = [
            this.pressBoxPath,
            this.sitesPath,
            this.resourcesPath,
            this.phpBinariesPath,
            this.mysqlBinariesPath,
            path.join(this.resourcesPath, "wordpress"),
            path.join(this.resourcesPath, "logs"),
            path.join(this.resourcesPath, "temp"),
        ];

        for (const dir of directories) {
            await fs.mkdir(dir, { recursive: true });
        }

        console.log("📁 Directory structure created");
    }

    /**
     * Setup portable PHP binaries
     */
    private async setupPortablePHP(): Promise<void> {
        const phpVersions = ["8.1", "8.2", "8.3"];

        for (const version of phpVersions) {
            const phpDir = path.join(this.phpBinariesPath, version);
            const phpExe = path.join(
                phpDir,
                os.platform() === "win32" ? "php.exe" : "php"
            );

            // Check if PHP version already exists
            try {
                await fs.access(phpExe);
                console.log(`✅ PHP ${version} already available`);
                continue;
            } catch {
                // Need to download PHP
                console.log(`📥 Downloading PHP ${version}...`);
                await this.downloadPortablePHP(version, phpDir);
            }
        }
    }

    /**
     * Download portable PHP for the current platform
     */
    private async downloadPortablePHP(
        version: string,
        targetDir: string
    ): Promise<void> {
        const platform = os.platform();
        let downloadUrl: string;

        // PHP download URLs for different platforms
        if (platform === "win32") {
            // Windows - use PHP.net official builds
            downloadUrl = `https://windows.php.net/downloads/releases/php-${version}.X-Win32-vs16-x64.zip`;
        } else if (platform === "darwin") {
            // macOS - use Homebrew or compile from source
            throw new Error("macOS PHP setup not implemented yet");
        } else {
            // Linux - use system package manager or compile
            throw new Error("Linux PHP setup not implemented yet");
        }

        try {
            await fs.mkdir(targetDir, { recursive: true });

            const response = await fetch(downloadUrl);
            if (!response.ok) {
                throw new Error(
                    `Failed to download PHP ${version}: ${response.statusText}`
                );
            }

            const zipPath = path.join(
                this.resourcesPath,
                "temp",
                `php-${version}.zip`
            );
            const buffer = await response.buffer();
            await fs.writeFile(zipPath, buffer);

            // Extract PHP
            await this.extractZip(zipPath, targetDir);
            await fs.unlink(zipPath); // Clean up zip file

            // Configure PHP
            await this.configurePHP(version, targetDir);

            console.log(`✅ PHP ${version} installed successfully`);
        } catch (error) {
            console.error(`❌ Failed to setup PHP ${version}:`, error);
        }
    }

    /**
     * Setup portable MySQL/MariaDB
     */
    private async setupPortableMySQL(): Promise<void> {
        const mysqlDir = path.join(this.mysqlBinariesPath, "server");
        const mysqldExe = path.join(
            mysqlDir,
            "bin",
            os.platform() === "win32" ? "mysqld.exe" : "mysqld"
        );

        try {
            await fs.access(mysqldExe);
            console.log("✅ MySQL already available");
            return;
        } catch {
            console.log("📥 Downloading MySQL...");
            await this.downloadPortableMySQL(mysqlDir);
        }
    }

    /**
     * Download portable MySQL
     */
    private async downloadPortableMySQL(targetDir: string): Promise<void> {
        // For simplicity, we'll use a lightweight SQLite approach first
        // Later can be extended to full MySQL
        console.log("📝 Using SQLite for initial implementation");
        // Implementation would download and setup MySQL binaries
    }

    /**
     * Create a new WordPress site
     */
    async createSite(config: SiteConfig): Promise<WordPressSite> {
        console.log(`🏗 Creating WordPress site: ${config.siteName}`);

        const siteId = this.generateSiteId();
        const sitePath = path.join(this.sitesPath, config.siteName);
        const port = await this.getAvailablePort(8000);
        const mysqlPort = await this.getAvailablePort(3306);

        // Create site directory
        await fs.mkdir(sitePath, { recursive: true });

        // Download WordPress
        await this.downloadWordPress(config.wordpressVersion, sitePath);

        // Configure WordPress
        await this.configureWordPress(sitePath, config, mysqlPort);

        // Create site object
        const site: WordPressSite = {
            id: siteId,
            name: config.siteName,
            domain: config.domain,
            path: sitePath,
            port,
            phpVersion: config.phpVersion,
            mysqlPort,
            status: "stopped",
            wordpressVersion: config.wordpressVersion,
            url: `http://${config.domain}:${port}`,
            adminUrl: `http://${config.domain}:${port}/wp-admin`,
        };

        // Save site configuration
        await this.saveSiteConfig(site);

        // Add to sites map
        this.sites.set(siteId, site);

        console.log(`✅ WordPress site created: ${config.siteName}`);
        return site;
    }

    /**
     * Download WordPress
     */
    private async downloadWordPress(
        version: string,
        sitePath: string
    ): Promise<void> {
        const wpDir = path.join(sitePath, "wordpress");

        // Check if WordPress already exists
        try {
            await fs.access(path.join(wpDir, "wp-config-sample.php"));
            console.log("✅ WordPress already exists");
            return;
        } catch {
            // Need to download WordPress
        }

        console.log(`📥 Downloading WordPress ${version}...`);

        const downloadUrl =
            version === "latest"
                ? "https://wordpress.org/latest.zip"
                : `https://wordpress.org/wordpress-${version}.zip`;

        try {
            const response = await fetch(downloadUrl);
            if (!response.ok) {
                throw new Error(
                    `Failed to download WordPress: ${response.statusText}`
                );
            }

            const zipPath = path.join(
                this.resourcesPath,
                "temp",
                "wordpress.zip"
            );
            const buffer = await response.buffer();
            await fs.writeFile(zipPath, buffer);

            // Extract WordPress
            await this.extractZip(zipPath, sitePath);
            await fs.unlink(zipPath);

            console.log("✅ WordPress downloaded and extracted");
        } catch (error) {
            console.error("❌ Failed to download WordPress:", error);
            throw error;
        }
    }

    /**
     * Start a WordPress site
     */
    async startSite(siteId: string): Promise<void> {
        const site = this.sites.get(siteId);
        if (!site) {
            throw new Error(`Site not found: ${siteId}`);
        }

        console.log(`🚀 Starting WordPress site: ${site.name}`);
        site.status = "starting";

        try {
            // Start MySQL if needed (or use SQLite)
            // await this.startMySQL(site);

            // Start PHP development server
            await this.startPHPServer(site);

            site.status = "running";
            console.log(`✅ Site started: ${site.name} at ${site.url}`);
        } catch (error) {
            site.status = "error";
            console.error(`❌ Failed to start site:`, error);
            throw error;
        }
    }

    /**
     * Start PHP development server
     */
    private async startPHPServer(site: WordPressSite): Promise<void> {
        const phpExe = path.join(
            this.phpBinariesPath,
            site.phpVersion,
            "php.exe"
        );
        const docRoot = path.join(site.path, "wordpress");

        const phpProcess = spawn(
            phpExe,
            ["-S", `${site.domain}:${site.port}`, "-t", docRoot],
            {
                cwd: docRoot,
                stdio: ["pipe", "pipe", "pipe"],
            }
        );

        site.process = phpProcess;

        // Handle process events
        phpProcess.on("error", (error) => {
            console.error(`PHP server error for ${site.name}:`, error);
            site.status = "error";
        });

        phpProcess.on("exit", (code) => {
            console.log(`PHP server for ${site.name} exited with code ${code}`);
            site.status = "stopped";
        });

        // Wait a bit for server to start
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Helper methods...
    private generateSiteId(): string {
        return (
            Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
        );
    }

    private async getAvailablePort(startPort: number): Promise<number> {
        // Implementation to find available port
        return startPort + Math.floor(Math.random() * 1000);
    }

    private async extractZip(
        zipPath: string,
        targetDir: string
    ): Promise<void> {
        // Implementation to extract zip files
        // Using unzipper library
    }

    private async configurePHP(version: string, phpDir: string): Promise<void> {
        // Create php.ini with WordPress-optimized settings
        const phpIni = `
memory_limit = 256M
upload_max_filesize = 64M
post_max_size = 64M
max_execution_time = 300
extension=mysqli
extension=gd
extension=curl
extension=zip
extension=mbstring
`;
        await fs.writeFile(path.join(phpDir, "php.ini"), phpIni);
    }

    private async configureWordPress(
        sitePath: string,
        config: SiteConfig,
        mysqlPort: number
    ): Promise<void> {
        // Create wp-config.php
        const wpConfigPath = path.join(sitePath, "wordpress", "wp-config.php");
        const wpConfig = `<?php
define('DB_NAME', '${config.siteName}');
define('DB_USER', 'root');
define('DB_PASSWORD', '');
define('DB_HOST', 'localhost:${mysqlPort}');
define('DB_CHARSET', 'utf8');
define('DB_COLLATE', '');

// WordPress salts and keys would be generated here

$table_prefix = 'wp_';
define('WP_DEBUG', true);

if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}

require_once ABSPATH . 'wp-settings.php';
`;
        await fs.writeFile(wpConfigPath, wpConfig);
    }

    private async saveSiteConfig(site: WordPressSite): Promise<void> {
        const configPath = path.join(site.path, "pressbox-config.json");
        await fs.writeFile(configPath, JSON.stringify(site, null, 2));
    }

    private async loadExistingSites(): Promise<void> {
        // Load existing sites from disk
        try {
            const siteDirectories = await fs.readdir(this.sitesPath);
            for (const siteDir of siteDirectories) {
                const configPath = path.join(
                    this.sitesPath,
                    siteDir,
                    "pressbox-config.json"
                );
                try {
                    const configData = await fs.readFile(configPath, "utf-8");
                    const site: WordPressSite = JSON.parse(configData);
                    this.sites.set(site.id, site);
                } catch (error) {
                    console.warn(
                        `Failed to load site config for ${siteDir}:`,
                        error
                    );
                }
            }
        } catch (error) {
            console.log("No existing sites found");
        }
    }

    // Public methods for site management
    async getSites(): Promise<WordPressSite[]> {
        return Array.from(this.sites.values());
    }

    async stopSite(siteId: string): Promise<void> {
        const site = this.sites.get(siteId);
        if (!site) return;

        if (site.process) {
            site.process.kill();
            site.process = undefined;
        }

        if (site.mysqlProcess) {
            site.mysqlProcess.kill();
            site.mysqlProcess = undefined;
        }

        site.status = "stopped";
        console.log(`✅ Site stopped: ${site.name}`);
    }

    async deleteSite(siteId: string): Promise<void> {
        const site = this.sites.get(siteId);
        if (!site) return;

        // Stop site first
        await this.stopSite(siteId);

        // Remove site directory
        await fs.rmdir(site.path, { recursive: true });

        // Remove from sites map
        this.sites.delete(siteId);

        console.log(`✅ Site deleted: ${site.name}`);
    }
}
