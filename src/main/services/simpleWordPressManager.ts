/**
 * Simple Native WordPress Manager
 *
 * A simplified implementation that downloads WordPress and runs it with PHP built-in server
 * No external dependencies required - uses only Node.js built-ins
 */

import { spawn, ChildProcess } from "child_process";
import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";
import * as https from "https";
import * as http from "http";
import { promisify } from "util";
import { pipeline } from "stream";
import { createWriteStream, createReadStream } from "fs";

const streamPipeline = promisify(pipeline);
const execAsync = promisify(require("child_process").exec);

// Import adm-zip for WordPress extraction
let AdmZip: any;
try {
    AdmZip = require("adm-zip");
} catch (error) {
    console.warn(
        "⚠️  adm-zip not available, will use basic structure creation"
    );
}

import {
    WordPressSite,
    SiteStatus,
    CreateSiteRequest,
} from "../../shared/types";
import { DebugLogger } from "./debugLogger";
import { NonAdminMode } from "./nonAdminMode";
import { FileLogger } from "./fileLogger";

// Internal site type with process tracking
interface SimpleWordPressSite {
    id: string;
    name: string;
    domain: string;
    path: string;
    port: number;
    status: SiteStatus;
    wordpressVersion: string;
    url: string;
    adminUrl: string;
    process?: ChildProcess;
    phpVersion: string;
    created: Date;
    lastAccessed?: Date;
}

// Conversion functions
function simpleToWordPress(simple: SimpleWordPressSite): WordPressSite {
    return {
        id: simple.id,
        name: simple.name,
        domain: simple.domain,
        path: simple.path,
        port: simple.port,
        status: simple.status,
        wordPressVersion: simple.wordpressVersion,
        url: simple.url,
        phpVersion: simple.phpVersion,
        created: simple.created,
        lastAccessed: simple.lastAccessed,
        webServer: "nginx",
        database: "mysql",
        ssl: false,
        multisite: false,
        config: {
            phpVersion: simple.phpVersion,
            wordPressVersion: simple.wordpressVersion,
            dbName: `${simple.name}_db`,
            dbUser: "wp_user",
            dbPassword: "password",
            dbRootPassword: "rootpass",
            adminUser: "admin",
            adminPassword: "password",
            adminEmail: "admin@localhost.test",
            webServer: "nginx",
            ssl: false,
            multisite: false,
        },
    };
}

function wordPressToSimple(wp: WordPressSite): SimpleWordPressSite {
    return {
        id: wp.id,
        name: wp.name,
        domain: wp.domain,
        path: wp.path,
        port: wp.port || 8080,
        status: wp.status,
        wordpressVersion: wp.wordPressVersion,
        url: wp.url || `http://${wp.domain}:${wp.port}`,
        adminUrl: `${wp.url || `http://${wp.domain}:${wp.port}`}/wp-admin`,
        phpVersion: wp.phpVersion,
        created: wp.created,
        lastAccessed: wp.lastAccessed,
    };
}

export interface SiteConfig {
    siteName: string;
    domain: string;
    phpVersion?: string;
    wordpressVersion: string;
    adminUser: string;
    adminPassword: string;
    adminEmail: string;
}

export class SimpleWordPressManager {
    private sites: Map<string, SimpleWordPressSite> = new Map();
    private pressBoxPath: string;
    private sitesPath: string;
    private tempPath: string;
    private usedPorts: Set<number> = new Set();
    private logger: DebugLogger;

    constructor() {
        this.pressBoxPath = path.join(os.homedir(), "PressBox");
        this.sitesPath = path.join(this.pressBoxPath, "sites");
        this.tempPath = path.join(this.pressBoxPath, "temp");
        this.logger = new DebugLogger();
        this.logger.clearLog();
        this.logger.log("SimpleWordPressManager constructor called");

        // Display current mode info (mode is already initialized from settings)
        const modeInfo = NonAdminMode.getExplanation();
        console.log(`🔓 Running in ${modeInfo.mode}`);
        console.log(`   ${modeInfo.description}`);
        console.log(`   URLs: ${modeInfo.urls}`);
    }

    /**
     * Initialize the WordPress manager
     */
    async initialize(): Promise<void> {
        try {
            this.logger.log("🚀 Initializing Simple WordPress Manager...");
            this.logger.log(`📍 PressBox path: ${this.pressBoxPath}`);
            this.logger.log(`📍 Sites path: ${this.sitesPath}`);
            this.logger.log(`📍 Temp path: ${this.tempPath}`);
            console.log("🚀 Initializing Simple WordPress Manager...");
            console.log(`📍 PressBox path: ${this.pressBoxPath}`);
            console.log(`📍 Sites path: ${this.sitesPath}`);
            console.log(`📍 Temp path: ${this.tempPath}`);

            // Create directory structure
            this.logger.log("📁 Creating directories...");
            console.log("📁 Creating directories...");
            await this.createDirectories();
            this.logger.log("✅ Directories created successfully");
            console.log("✅ Directories created successfully");

            // Check if PHP is available
            this.logger.log("🔍 Checking PHP availability...");
            console.log("🔍 Checking PHP availability...");
            await this.checkPHPAvailability();
            this.logger.log("✅ PHP availability checked");
            console.log("✅ PHP availability checked");

            // Load existing sites
            this.logger.log("📄 Loading existing sites...");
            console.log("📄 Loading existing sites...");
            await this.loadExistingSites();
            this.logger.log("✅ Existing sites loaded");
            console.log("✅ Existing sites loaded");

            this.logger.log("✅ Simple WordPress Manager initialized");
            this.logger.log(`📁 Sites directory: ${this.sitesPath}`);
            this.logger.log(`📊 Loaded ${this.sites.size} existing sites`);
            console.log("✅ Simple WordPress Manager initialized");
            console.log(`📁 Sites directory: ${this.sitesPath}`);
            console.log(`📊 Loaded ${this.sites.size} existing sites`);
        } catch (error) {
            this.logger.error(
                "❌ Failed to initialize Simple WordPress Manager:",
                error
            );
            console.error(
                "❌ Failed to initialize Simple WordPress Manager:",
                error
            );
            throw error;
        }
    }

    /**
     * Create required directories
     */
    private async createDirectories(): Promise<void> {
        const directories = [this.pressBoxPath, this.sitesPath, this.tempPath];

        for (const dir of directories) {
            try {
                console.log(`   Creating directory: ${dir}`);
                await fs.mkdir(dir, { recursive: true });
                console.log(`   ✅ Created: ${dir}`);
            } catch (error) {
                console.error(
                    `   ❌ Failed to create directory ${dir}:`,
                    error
                );
                throw error;
            }
        }

        console.log("📁 All directories created successfully");
    }

    /**
     * Check if PHP is available on the system
     */
    private async checkPHPAvailability(): Promise<void> {
        try {
            const { stdout } = await execAsync("php --version");
            const versionMatch = stdout.match(/PHP (\d+\.\d+\.\d+)/);

            if (versionMatch) {
                console.log(`✅ PHP ${versionMatch[1]} is available`);
            } else {
                console.log("✅ PHP is available (version unknown)");
            }
        } catch (error) {
            console.warn("⚠️  PHP not found in system PATH");
            console.warn("   Please install PHP or ensure it's in your PATH");
            console.warn(
                "   You can download PHP from: https://www.php.net/downloads"
            );
        }
    }

    /**
     * Create a new WordPress site
     */
    async createSite(config: SiteConfig): Promise<WordPressSite> {
        const logger = FileLogger.getInstance("site-creation.log");

        try {
            await logger.info(
                `Starting WordPress site creation: ${config.siteName}`
            );
            await logger.info("Site configuration", config);

            console.log(`🏗 Creating WordPress site: ${config.siteName}`);
            console.log(
                `📋 Site configuration:`,
                JSON.stringify(config, null, 2)
            );

            // Generate site ID and paths
            console.log(`🔢 Generating site ID...`);
            const siteId = this.generateSiteId();
            console.log(`   Site ID: ${siteId}`);

            const sitePath = path.join(this.sitesPath, config.siteName);
            console.log(`   Site path: ${sitePath}`);

            console.log(`🔌 Getting available port...`);
            const port = await this.getAvailablePort();
            console.log(`   Assigned port: ${port}`);

            // Check if site already exists
            if (await this.siteDirectoryExists(sitePath)) {
                throw new Error(
                    `Site directory already exists: ${config.siteName}`
                );
            }

            // Create site directory
            console.log(`📁 Creating site directory...`);
            await fs.mkdir(sitePath, { recursive: true });
            console.log(`   ✅ Directory created: ${sitePath}`);

            // Download and extract WordPress
            console.log(`📥 Downloading WordPress...`);
            await this.downloadAndExtractWordPress(
                config.wordpressVersion,
                sitePath
            );
            console.log(`   ✅ WordPress downloaded and extracted`);

            // Configure WordPress
            console.log(`⚙️  Configuring WordPress...`);
            await this.configureWordPress(sitePath, config);
            console.log(`   ✅ WordPress configured`);

            // Create site object
            console.log(`📝 Creating site object...`);
            const effectiveDomain = NonAdminMode.getEffectiveDomain(
                config.siteName,
                config.domain
            );
            const siteUrl = NonAdminMode.getSiteUrl(
                config.siteName,
                config.domain,
                port
            );

            const site: SimpleWordPressSite = {
                id: siteId,
                name: config.siteName,
                domain: effectiveDomain,
                path: sitePath,
                port,
                status: SiteStatus.STOPPED,
                wordpressVersion: config.wordpressVersion,
                url: siteUrl,
                adminUrl: `${siteUrl}/wp-admin`,
                phpVersion: config.phpVersion || "system",
                created: new Date(),
            };

            // Save site configuration
            await this.saveSiteConfig(simpleToWordPress(site));

            // Add to sites map
            this.sites.set(siteId, site);
            this.usedPorts.add(port);

            console.log(`✅ WordPress site created successfully!`);
            console.log(`   Site: ${config.siteName}`);
            console.log(`   Path: ${sitePath}`);
            console.log(`   URL: ${site.url}`);

            return simpleToWordPress(site);
        } catch (error) {
            console.error(
                `❌ Failed to create site ${config.siteName}:`,
                error
            );
            // Clean up on error
            try {
                const sitePath = path.join(this.sitesPath, config.siteName);
                await fs.rmdir(sitePath, { recursive: true });
                console.log(`🧹 Cleaned up failed site directory: ${sitePath}`);
            } catch (cleanupError) {
                console.warn("Failed to cleanup site directory:", cleanupError);
            }
            throw error;
        }
    }

    /**
     * Download and extract WordPress
     */
    private async downloadAndExtractWordPress(
        version: string,
        sitePath: string
    ): Promise<void> {
        console.log(`📥 Downloading WordPress ${version}...`);

        const downloadUrl =
            version === "latest"
                ? "https://wordpress.org/latest.zip"
                : `https://wordpress.org/wordpress-${version}.zip`;

        const zipPath = path.join(this.tempPath, `wordpress-${Date.now()}.zip`);

        try {
            // Download WordPress
            await this.downloadFile(downloadUrl, zipPath);
            console.log("✅ WordPress downloaded");

            // Extract WordPress
            console.log("📦 Extracting WordPress...");
            await this.extractWordPress(zipPath, sitePath);
            console.log("✅ WordPress extracted");

            // Clean up zip file
            await fs.unlink(zipPath);
        } catch (error) {
            console.error("❌ Failed to download/extract WordPress:", error);
            throw new Error(
                `Failed to setup WordPress: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Download a file from URL
     */
    private async downloadFile(url: string, filePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const file = createWriteStream(filePath);
            const request = url.startsWith("https") ? https : http;

            request
                .get(url, (response) => {
                    if (
                        response.statusCode === 302 ||
                        response.statusCode === 301
                    ) {
                        // Handle redirect
                        const redirectUrl = response.headers.location;
                        if (redirectUrl) {
                            return this.downloadFile(redirectUrl, filePath)
                                .then(resolve)
                                .catch(reject);
                        }
                    }

                    if (response.statusCode !== 200) {
                        reject(
                            new Error(
                                `HTTP ${response.statusCode}: ${response.statusMessage}`
                            )
                        );
                        return;
                    }

                    response.pipe(file);

                    file.on("finish", () => {
                        file.close();
                        resolve();
                    });

                    file.on("error", (error) => {
                        fs.unlink(filePath).catch(() => {}); // Clean up on error
                        reject(error);
                    });
                })
                .on("error", (error) => {
                    reject(error);
                });
        });
    }

    /**
     * Extract WordPress from zip file
     */
    private async extractWordPress(
        zipPath: string,
        sitePath: string
    ): Promise<void> {
        const logger = FileLogger.getInstance("wordpress.log");

        try {
            await logger.info("Starting WordPress extraction", {
                zipPath,
                sitePath,
            });

            if (AdmZip) {
                // Use real WordPress extraction
                await logger.info("Using adm-zip for extraction");
                const zip = new AdmZip(zipPath);

                // Extract to temporary location first
                const tempExtractPath = path.join(
                    this.tempPath,
                    `extract-${Date.now()}`
                );
                await fs.mkdir(tempExtractPath, { recursive: true });

                zip.extractAllTo(tempExtractPath, true);
                await logger.success(
                    "WordPress extracted to temporary location"
                );

                // WordPress extracts to a 'wordpress' folder, move contents to site directory
                const wpExtractDir = path.join(tempExtractPath, "wordpress");

                if (await this.siteDirectoryExists(wpExtractDir)) {
                    // Move all files from wordpress folder to site directory
                    const files = await fs.readdir(wpExtractDir);
                    await logger.info(`Moving ${files.length} WordPress files`);

                    for (const file of files) {
                        const srcPath = path.join(wpExtractDir, file);
                        const destPath = path.join(sitePath, file);
                        await fs.rename(srcPath, destPath);
                    }

                    // Clean up temporary extraction folder
                    await fs.rmdir(tempExtractPath, { recursive: true });
                    await logger.success(
                        "Real WordPress files extracted and moved"
                    );
                } else {
                    await logger.error(
                        "WordPress folder not found in extraction"
                    );
                    throw new Error(
                        "WordPress extraction failed - wordpress folder not found"
                    );
                }
            } else {
                // Fallback to creating basic WordPress structure
                await logger.warn(
                    "adm-zip not available, creating basic WordPress structure"
                );
                await this.createBasicWordPressStructure(sitePath);
            }
        } catch (error) {
            await logger.error("WordPress extraction failed", error);
            throw new Error(
                `Failed to extract WordPress: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Create basic WordPress structure (simplified for demo)
     */
    private async createBasicWordPressStructure(wpPath: string): Promise<void> {
        // Create basic WordPress directories
        const directories = [
            "wp-content",
            "wp-content/themes",
            "wp-content/plugins",
            "wp-content/uploads",
            "wp-admin",
            "wp-includes",
        ];

        for (const dir of directories) {
            await fs.mkdir(path.join(wpPath, dir), { recursive: true });
        }

        // Create a basic index.php
        const indexPhp = `<?php
/**
 * Front to the WordPress application. This file doesn't do anything, but loads
 * wp-blog-header.php which does and tells WordPress to load the theme.
 *
 * @package WordPress
 */

/**
 * Tells WordPress to load the WordPress theme and output it.
 */
define( 'WP_USE_THEMES', true );

/** Loads the WordPress Environment and Template */
require __DIR__ . '/wp-blog-header.php';
`;

        await fs.writeFile(path.join(wpPath, "index.php"), indexPhp);

        // Create a basic wp-blog-header.php
        const wpBlogHeader = `<?php
/**
 * Loads the WordPress environment and template.
 *
 * @package WordPress
 */

if ( ! isset( $wp_did_header ) ) {
    $wp_did_header = true;

    // Load the WordPress library.
    require_once __DIR__ . '/wp-load.php';

    // Set up the WordPress query.
    wp();

    // Load the theme template.
    require_once ABSPATH . WPINC . '/template-loader.php';
}
`;

        await fs.writeFile(
            path.join(wpPath, "wp-blog-header.php"),
            wpBlogHeader
        );

        console.log("✅ Basic WordPress structure created");
        console.log(
            "   Note: This is a simplified structure for demonstration"
        );
        console.log(
            "   In production, you would extract the full WordPress zip"
        );
    }

    /**
     * Configure WordPress
     */
    private async configureWordPress(
        sitePath: string,
        config: SiteConfig
    ): Promise<void> {
        const wpConfigPath = path.join(sitePath, "wp-config.php");

        // Get the correct URL based on admin mode
        const port = await this.getAvailablePort();
        const siteUrl = NonAdminMode.getSiteUrl(
            config.siteName,
            config.domain,
            port
        );

        // Create wp-config.php
        const wpConfig = `<?php
/**
 * The base configuration for WordPress
 *
 * This file contains the following configurations:
 * * Database settings (SQLite for simplicity)
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * This has been generated by PressBox
 */

// ** SQLite Database settings ** //
define( 'DB_NAME', '${config.siteName}' );
define( 'DB_USER', 'root' );
define( 'DB_PASSWORD', '' );
define( 'DB_HOST', 'localhost' );
define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );

// For now, we'll use a simple file-based approach
// In production, you'd set up a proper database

/**#@+
 * Authentication unique keys and salts.
 * You can generate these using the WordPress.org secret-key service
 */
define( 'AUTH_KEY',         'put your unique phrase here' );
define( 'SECURE_AUTH_KEY',  'put your unique phrase here' );
define( 'LOGGED_IN_KEY',    'put your unique phrase here' );
define( 'NONCE_KEY',        'put your unique phrase here' );
define( 'AUTH_SALT',        'put your unique phrase here' );
define( 'SECURE_AUTH_SALT', 'put your unique phrase here' );
define( 'LOGGED_IN_SALT',   'put your unique phrase here' );
define( 'NONCE_SALT',       'put your unique phrase here' );

/**#@-*/

/**
 * WordPress database table prefix.
 */
$table_prefix = 'wp_';

/**
 * WordPress debugging mode.
 */
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );

/**
 * WordPress site URLs
 */
define( 'WP_HOME', '${siteUrl}' );
define( 'WP_SITEURL', '${siteUrl}' );

/* Add any custom values between this line and the "stop editing" line. */

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
`;

        await fs.writeFile(wpConfigPath, wpConfig);
        console.log("✅ WordPress configured");
    }

    /**
     * Start a WordPress site
     */
    async startSite(siteId: string): Promise<void> {
        const site = this.sites.get(siteId);
        if (!site) {
            throw new Error(`Site not found: ${siteId}`);
        }

        if (site.status === "running") {
            console.log(`Site ${site.name} is already running`);
            return;
        }

        console.log(`🚀 Starting WordPress site: ${site.name}`);
        site.status = SiteStatus.STARTING;

        try {
            await this.startPHPServer(site);
            site.status = SiteStatus.RUNNING;
            site.lastAccessed = new Date();

            await this.saveSiteConfig(simpleToWordPress(site));

            console.log(`✅ Site started successfully!`);
            console.log(`   ${site.name} is now running at: ${site.url}`);
        } catch (error) {
            site.status = SiteStatus.ERROR;
            await this.saveSiteConfig(simpleToWordPress(site));
            console.error(`❌ Failed to start site ${site.name}:`, error);
            throw error;
        }
    }

    /**
     * Start PHP development server for a site
     */
    private async startPHPServer(site: SimpleWordPressSite): Promise<void> {
        const logger = FileLogger.getInstance("php-server.log");

        await logger.info(`Starting PHP server for site: ${site.name}`, {
            siteName: site.name,
            domain: site.domain,
            port: site.port,
            sitePath: site.path,
        });

        console.log(`🔧 Starting PHP server for site: ${site.name}`);
        const wpPath = path.join(site.path, "wordpress");
        console.log(`   WordPress path: ${wpPath}`);

        // Check if WordPress directory exists
        try {
            await fs.access(wpPath);
            console.log(`   ✅ WordPress directory found`);
        } catch (error) {
            console.error(`   ❌ WordPress directory not found: ${wpPath}`);
            throw new Error(`WordPress directory not found: ${wpPath}`);
        }

        // Start PHP built-in server
        const phpArgs = [
            "-S",
            `${site.domain}:${site.port}`,
            "-t",
            wpPath,
            "-d",
            "display_errors=1",
            "-d",
            "log_errors=1",
        ];

        console.log(`▶️  Starting PHP server: php ${phpArgs.join(" ")}`);
        console.log(`   Working directory: ${wpPath}`);
        console.log(
            `   Server will run on: http://${site.domain}:${site.port}`
        );

        const phpProcess = spawn("php", phpArgs, {
            cwd: wpPath,
            stdio: ["ignore", "pipe", "pipe"],
        });

        console.log(`   PHP process PID: ${phpProcess.pid}`);
        site.process = phpProcess;

        // Handle PHP server output
        phpProcess.stdout?.on("data", (data) => {
            const output = data.toString().trim();
            if (output) {
                console.log(`[${site.name}] ${output}`);
            }
        });

        phpProcess.stderr?.on("data", (data) => {
            const error = data.toString().trim();
            if (error && !error.includes("Development Server")) {
                console.error(`[${site.name}] ${error}`);
            }
        });

        // Handle process events
        phpProcess.on("error", (error) => {
            console.error(`❌ PHP server error for ${site.name}:`, error);
            site.status = SiteStatus.ERROR;
        });

        phpProcess.on("exit", (code, signal) => {
            console.log(
                `PHP server for ${site.name} exited (code: ${code}, signal: ${signal})`
            );
            site.status = SiteStatus.STOPPED;
            site.process = undefined;
        });

        // Wait for server to start
        await this.waitForServerStart(site);
    }

    /**
     * Wait for PHP server to start
     */
    private async waitForServerStart(site: SimpleWordPressSite): Promise<void> {
        const maxAttempts = 10;
        const delay = 500;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await new Promise((resolve) => setTimeout(resolve, delay));

                // Try to connect to the server
                const testUrl = `http://${site.domain}:${site.port}`;
                await this.testConnection(testUrl);

                console.log(`✅ PHP server is ready after ${attempt} attempts`);
                return;
            } catch (error) {
                if (attempt === maxAttempts) {
                    throw new Error(
                        `PHP server failed to start after ${maxAttempts} attempts`
                    );
                }
                // Continue trying
            }
        }
    }

    /**
     * Test connection to server
     */
    private async testConnection(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = http.get(url, (response) => {
                resolve();
            });

            request.on("error", (error) => {
                reject(error);
            });

            request.setTimeout(1000, () => {
                request.destroy();
                reject(new Error("Connection timeout"));
            });
        });
    }

    /**
     * Stop a WordPress site
     */
    async stopSite(siteId: string): Promise<void> {
        const site = this.sites.get(siteId);
        if (!site) {
            throw new Error(`Site not found: ${siteId}`);
        }

        if (site.status === "stopped") {
            console.log(`Site ${site.name} is already stopped`);
            return;
        }

        console.log(`🛑 Stopping WordPress site: ${site.name}`);

        if (site.process) {
            site.process.kill("SIGTERM");
            site.process = undefined;
        }

        site.status = SiteStatus.STOPPED;
        await this.saveSiteConfig(simpleToWordPress(site));

        console.log(`✅ Site ${site.name} stopped`);
    }

    /**
     * Delete a WordPress site
     */
    async deleteSite(siteId: string): Promise<void> {
        const site = this.sites.get(siteId);
        if (!site) {
            throw new Error(`Site not found: ${siteId}`);
        }

        // Stop site first
        if (site.status === "running") {
            await this.stopSite(siteId);
        }

        console.log(`🗑 Deleting WordPress site: ${site.name}`);

        // Remove site directory
        try {
            await fs.rmdir(site.path, { recursive: true });
        } catch (error) {
            console.warn(`Failed to remove site directory: ${error}`);
        }

        // Remove from maps
        this.sites.delete(siteId);
        this.usedPorts.delete(site.port);

        console.log(`✅ Site ${site.name} deleted`);
    }

    /**
     * Get all sites
     */
    async getSites(): Promise<WordPressSite[]> {
        return Array.from(this.sites.values()).map(simpleToWordPress);
    }

    /**
     * Get a specific site
     */
    async getSite(siteId: string): Promise<WordPressSite | undefined> {
        const simpleSite = this.sites.get(siteId);
        return simpleSite ? simpleToWordPress(simpleSite) : undefined;
    }

    // Helper methods

    private generateSiteId(): string {
        return (
            Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
        );
    }

    private async getAvailablePort(): Promise<number> {
        let port = 8000;
        while (this.usedPorts.has(port)) {
            port++;
        }
        return port;
    }

    private async siteDirectoryExists(sitePath: string): Promise<boolean> {
        try {
            await fs.access(sitePath);
            return true;
        } catch {
            return false;
        }
    }

    private async saveSiteConfig(site: WordPressSite): Promise<void> {
        const configPath = path.join(site.path, "pressbox-config.json");
        const config = {
            ...site,
            process: undefined, // Don't serialize the process
        };
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    }

    private async loadExistingSites(): Promise<void> {
        try {
            const siteDirectories = await fs.readdir(this.sitesPath);
            this.logger.log(
                `🔍 Found ${siteDirectories.length} potential site directories to load`
            );

            for (const siteDir of siteDirectories) {
                const configPath = path.join(
                    this.sitesPath,
                    siteDir,
                    "pressbox-config.json"
                );

                try {
                    // Check if config file exists before trying to read it
                    const configExists = await fs
                        .access(configPath)
                        .then(() => true)
                        .catch(() => false);

                    if (!configExists) {
                        console.log(
                            `⏭️ Skipping ${siteDir}: missing pressbox-config.json`
                        );
                        continue;
                    }

                    const configData = await fs.readFile(configPath, "utf-8");
                    const site: WordPressSite = JSON.parse(configData);

                    // Validate required fields
                    if (!site.id || !site.name) {
                        console.warn(
                            `⚠️ Skipping ${siteDir}: invalid config (missing id or name)`
                        );
                        continue;
                    }

                    // Convert to simple site and reset status to stopped on load
                    const simpleSite = wordPressToSimple(site);
                    simpleSite.status = SiteStatus.STOPPED;
                    simpleSite.process = undefined;

                    this.sites.set(site.id, simpleSite);
                    if (site.port) {
                        this.usedPorts.add(site.port);
                    }

                    console.log(`✅ Loaded site: ${site.name} (${site.id})`);
                } catch (error) {
                    const errorMessage =
                        error instanceof Error ? error.message : String(error);
                    console.warn(
                        `⚠️ Failed to load site config for ${siteDir}:`,
                        errorMessage
                    );
                    // Continue loading other sites even if one fails
                    continue;
                }
            }
        } catch (error) {
            console.log("No existing sites directory found");
        }
    }

    /**
     * Clean up broken site directories (folders without proper config)
     */
    async cleanupBrokenSites(): Promise<{ cleaned: string[]; kept: string[] }> {
        const cleaned: string[] = [];
        const kept: string[] = [];

        try {
            const siteDirectories = await fs.readdir(this.sitesPath);

            for (const siteDir of siteDirectories) {
                const configPath = path.join(
                    this.sitesPath,
                    siteDir,
                    "pressbox-config.json"
                );
                const sitePath = path.join(this.sitesPath, siteDir);

                try {
                    // Check if it's actually a directory
                    const stat = await fs.stat(sitePath);
                    if (!stat.isDirectory()) {
                        continue;
                    }

                    // Check if config exists and is valid
                    const configExists = await fs
                        .access(configPath)
                        .then(() => true)
                        .catch(() => false);

                    if (!configExists) {
                        console.log(
                            `🧹 Cleaning up broken site directory: ${siteDir}`
                        );
                        await fs.rm(sitePath, { recursive: true, force: true });
                        cleaned.push(siteDir);
                    } else {
                        // Try to parse the config to make sure it's valid
                        try {
                            const configData = await fs.readFile(
                                configPath,
                                "utf-8"
                            );
                            const site = JSON.parse(configData);
                            if (!site.id || !site.name) {
                                console.log(
                                    `🧹 Cleaning up invalid site directory: ${siteDir}`
                                );
                                await fs.rm(sitePath, {
                                    recursive: true,
                                    force: true,
                                });
                                cleaned.push(siteDir);
                            } else {
                                kept.push(siteDir);
                            }
                        } catch (parseError) {
                            console.log(
                                `🧹 Cleaning up site with corrupted config: ${siteDir}`
                            );
                            await fs.rm(sitePath, {
                                recursive: true,
                                force: true,
                            });
                            cleaned.push(siteDir);
                        }
                    }
                } catch (error) {
                    console.warn(
                        `⚠️ Error checking site directory ${siteDir}:`,
                        error
                    );
                }
            }

            console.log(
                `🧹 Cleanup complete: ${cleaned.length} broken sites removed, ${kept.length} valid sites kept`
            );
            return { cleaned, kept };
        } catch (error) {
            console.error("Failed to cleanup broken sites:", error);
            return { cleaned: [], kept: [] };
        }
    }
}
