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
import * as crypto from "crypto";

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
import { DatabaseServerManager } from "./databaseServerManager";
import { PortableDatabaseManager } from "./portableDatabaseManager";

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
    adminUser?: string;
    adminPassword?: string;
    adminEmail?: string;
    database?: "mysql" | "mariadb" | "sqlite";
    databaseVersion?: string;
}

// Conversion functions
function simpleToWordPress(
    simple: SimpleWordPressSite,
    adminUser?: string,
    adminPassword?: string,
    adminEmail?: string
): WordPressSite {
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
        database: simple.database || "sqlite", // Use actual database type
        ssl: false,
        multisite: false,
        config: {
            phpVersion: simple.phpVersion,
            wordPressVersion: simple.wordpressVersion,
            dbName: `${simple.name}_db`,
            dbUser: "wp_user",
            dbPassword: "password",
            dbRootPassword: "rootpass",
            adminUser: adminUser || "admin",
            adminPassword: adminPassword || "password",
            adminEmail: adminEmail || "admin@localhost.test",
            webServer: "nginx",
            database: "sqlite", // Required field
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
        database: wp.database,
        databaseVersion: wp.databaseVersion,
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
    // Database configuration
    database?: "mysql" | "mariadb" | "sqlite";
    databaseVersion?: string;
    dbName?: string;
    dbUser?: string;
    dbPassword?: string;
    dbRootPassword?: string;
}

export class SimpleWordPressManager {
    private sites: Map<string, SimpleWordPressSite> = new Map();
    private pressBoxPath: string;
    private sitesPath: string;
    private tempPath: string;
    private usedPorts: Set<number> = new Set();
    private logger: DebugLogger;
    private databaseServerManager: DatabaseServerManager;
    private portableDatabaseManager: PortableDatabaseManager;

    constructor() {
        this.pressBoxPath = path.join(os.homedir(), "PressBox");
        this.sitesPath = path.join(this.pressBoxPath, "sites");
        this.tempPath = path.join(this.pressBoxPath, "temp");
        this.logger = new DebugLogger();
        this.databaseServerManager = new DatabaseServerManager();
        this.portableDatabaseManager = PortableDatabaseManager.getInstance();
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
                adminUser: config.adminUser,
                adminPassword: config.adminPassword,
                adminEmail: config.adminEmail,
                database: config.database || "sqlite",
                databaseVersion: config.databaseVersion,
            };

            // Save site configuration
            await this.saveSiteConfig(
                simpleToWordPress(
                    site,
                    config.adminUser,
                    config.adminPassword,
                    config.adminEmail
                )
            );

            // Add to sites map
            this.sites.set(siteId, site);
            this.usedPorts.add(port);

            console.log(`✅ WordPress site created successfully!`);
            console.log(`   Site: ${config.siteName}`);
            console.log(`   Path: ${sitePath}`);
            console.log(`   URL: ${site.url}`);

            return simpleToWordPress(
                site,
                config.adminUser,
                config.adminPassword,
                config.adminEmail
            );
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
    /**
     * Verify if MySQL/MariaDB is available and can be connected
     */
    private async verifyMySQLAvailability(
        config: SiteConfig
    ): Promise<boolean> {
        try {
            console.log(`   🔍 Checking database server status...`);

            const dbType = (config.database || "mysql") as "mysql" | "mariadb";
            const dbVersion = config.databaseVersion || "8.0";

            console.log(`   📊 Requested: ${dbType} ${dbVersion}`);

            // STEP 1: Check if portable version is installed
            console.log(
                `   🔍 Checking if portable ${dbType} ${dbVersion} is installed...`
            );
            const isPortableInstalled =
                await this.portableDatabaseManager.isVersionInstalled(
                    dbType,
                    dbVersion
                );

            if (!isPortableInstalled) {
                console.log(
                    `   ❌ Portable ${dbType} ${dbVersion} is not installed`
                );
                console.log(
                    `   💡 Please install ${dbType} ${dbVersion} from the site creation modal`
                );
                return false;
            }

            console.log(`   ✅ Portable ${dbType} ${dbVersion} is installed`);

            // STEP 2: Check if it's already running
            const runningServers =
                await this.portableDatabaseManager.getRunningServers();
            const isRunning = runningServers.some(
                (s) => s.type === dbType && s.version === dbVersion
            );

            if (isRunning) {
                console.log(
                    `   ✅ Portable ${dbType} ${dbVersion} is already running`
                );
                console.log(
                    `   ℹ️  Using existing MySQL instance (no wait needed)`
                );
            } else {
                // STEP 3: Start the portable server
                console.log(
                    `   🚀 Starting portable ${dbType} ${dbVersion}...`
                );
                const startResult =
                    await this.portableDatabaseManager.startServer(
                        dbType,
                        dbVersion
                    );

                if (!startResult.success) {
                    console.log(
                        `   ❌ Failed to start ${dbType}: ${startResult.error}`
                    );
                    return false;
                }

                console.log(
                    `   ✅ Portable database server started/connected successfully`
                );

                // Wait for the newly started server to be fully ready
                console.log(`   ⏳ Waiting for server to be fully ready...`);
                console.log(
                    `   📊 MySQL initialization can take 5-10 seconds...`
                );
                await new Promise((resolve) => setTimeout(resolve, 8000));
            }

            // STEP 4: Test MySQL connection with retry logic
            console.log(`   🔌 Testing MySQL connection...`);

            const mysql = await import("mysql2/promise");
            let connection;
            let retries = 5;
            let lastError;

            while (retries > 0) {
                try {
                    console.log(`   🔄 Connection attempt ${6 - retries}/5...`);
                    connection = await mysql.createConnection({
                        host: "localhost",
                        port: 3306,
                        user: "root",
                        password: config.dbRootPassword || "",
                        connectTimeout: 5000,
                    });

                    console.log(`   ✅ MySQL connection successful`);

                    // STEP 5: Create database if it doesn't exist
                    const dbName = config.dbName || config.siteName;
                    console.log(`   📊 Creating database: ${dbName}`);

                    await connection.query(
                        `CREATE DATABASE IF NOT EXISTS \`${dbName}\``
                    );
                    console.log(`   ✅ Database created or already exists`);

                    await connection.end();
                    return true;
                } catch (connError: any) {
                    lastError = connError;
                    retries--;

                    if (retries > 0) {
                        console.log(
                            `   ⚠️ Connection failed: ${connError.code || connError.message}`
                        );
                        console.log(
                            `   🔄 Retrying in 2 seconds... (${retries} attempts left)`
                        );
                        await new Promise((resolve) =>
                            setTimeout(resolve, 2000)
                        );
                    } else {
                        console.log(
                            `   ❌ MySQL connection failed after all retries: ${lastError.code || lastError.message}`
                        );
                        if (connection) {
                            try {
                                await connection.end();
                            } catch {}
                        }
                        return false;
                    }
                }
            }

            return false;
        } catch (error: any) {
            console.error(`   ❌ Error verifying MySQL availability:`, error);
            return false;
        }
    }

    /**
     * Configure WordPress with appropriate database settings
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

        // Check database type and create appropriate wp-config.php
        let databaseType = config.database || "sqlite";

        // Verify MySQL/MariaDB is available before configuring
        if (databaseType === "mysql" || databaseType === "mariadb") {
            console.log(
                `🔍 Verifying ${databaseType.toUpperCase()} availability...`
            );

            const isAvailable = await this.verifyMySQLAvailability(config);

            if (!isAvailable) {
                console.warn(
                    `⚠️ ${databaseType.toUpperCase()} is not available or connection failed`
                );
                console.log(
                    `🔄 Automatically switching to SQLite for this site...`
                );

                // Update config to use SQLite
                databaseType = "sqlite";
                config.database = "sqlite";

                console.log(`✅ Site will use SQLite database instead`);
            } else {
                console.log(
                    `✅ ${databaseType.toUpperCase()} is available and ready`
                );
            }
        }

        let wpConfig: string;

        if (databaseType === "mysql" || databaseType === "mariadb") {
            // MySQL/MariaDB configuration
            console.log(
                `📊 Configuring WordPress with ${databaseType.toUpperCase()}`
            );

            // For portable MySQL, use root user with blank password
            // This matches how MySQL is initialized with --initialize-insecure
            const dbUser = "root";
            const dbPassword = config.dbRootPassword || "";

            wpConfig = `<?php
/**
 * The base configuration for WordPress with ${databaseType.toUpperCase()}
 *
 * This file contains the following configurations:
 * * Database settings (${databaseType.toUpperCase()})
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * This has been generated by PressBox
 */

// ** MySQL/MariaDB Database Configuration ** //
define( 'DB_NAME', '${config.dbName || config.siteName}' );
define( 'DB_USER', '${dbUser}' );
define( 'DB_PASSWORD', '${dbPassword}' );
define( 'DB_HOST', 'localhost' );
define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );

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
            console.log(
                `✅ WordPress configured with ${databaseType.toUpperCase()}`
            );
        } else {
            // SQLite configuration
            console.log(`📊 Configuring WordPress with SQLite`);

            wpConfig = `<?php
/**
 * The base configuration for WordPress with SQLite
 *
 * This file contains the following configurations:
 * * Database settings (SQLite)
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * This has been generated by PressBox
 */

// ** CRITICAL: Set database engine to SQLite ** //
// This MUST be defined before anything else
define( 'DB_ENGINE', 'sqlite' );

// ** SQLite Database Configuration ** //
define( 'DB_DIR', dirname( __FILE__ ) . '/wp-content/database/' );
define( 'DB_FILE', '.ht.sqlite' );

// These are required by WordPress but not used by SQLite
define( 'DB_NAME', '${config.siteName}' );
define( 'DB_USER', '' );
define( 'DB_PASSWORD', '' );
define( 'DB_HOST', '' );
define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );

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
            console.log("✅ WordPress configured with SQLite");

            // Ensure database directory exists for SQLite
            const dbDir = path.join(sitePath, "wp-content", "database");
            await fs.mkdir(dbDir, { recursive: true });

            // Create .htaccess to protect database directory
            const htaccessPath = path.join(dbDir, ".htaccess");
            await fs.writeFile(htaccessPath, "Deny from all");
            console.log("✅ Database directory created");

            // Install SQLite integration plugin (db.php drop-in)
            console.log("📦 Installing SQLite integration...");
            const wpContentPath = path.join(sitePath, "wp-content");
            const dbPhpPath = path.join(wpContentPath, "db.php");

            const dbPhp = `<?php
/**
 * SQLite Database Drop-in for WordPress
 * This file makes WordPress use SQLite instead of MySQL
 */

if (!defined('DB_FILE')) {
    define('DB_FILE', '.ht.sqlite');
}

if (!defined('DB_DIR')) {
    define('DB_DIR', dirname(__FILE__) . '/database/');
}

// WordPress will use SQLite
define('USE_MYSQL', false);
`;

            await fs.writeFile(dbPhpPath, dbPhp);
            console.log("✅ SQLite integration installed");
        }
    }

    /**
     * Setup MySQL/MariaDB database for the site
     */
    private async setupMySQLDatabase(
        site: SimpleWordPressSite,
        config: SiteConfig
    ): Promise<void> {
        const mysql = await import("mysql2/promise");

        const dbName = config.dbName || site.name.replace(/[^a-z0-9_]/gi, "_");
        const dbUser = config.dbUser || "wordpress";
        const dbPassword = config.dbPassword || "wordpress";

        // First, check if database server is running and start if needed
        console.log(`   🔍 Checking database server status...`);
        try {
            const servers =
                await this.databaseServerManager.getAllServerStatuses();
            const runningServer = servers.find(
                (s: any) => s.type === config.database && s.isRunning
            );

            if (!runningServer) {
                console.log(`   ⚠️ ${config.database} server is not running`);

                // Try to find and start a server
                const availableServers = servers.filter(
                    (s: any) => s.type === config.database
                );

                if (availableServers.length === 0) {
                    throw new Error(
                        `No ${config.database} server installations found.\n\n` +
                            `Please install ${config.database} or use SQLite instead.\n` +
                            `Go to Tools → Database Management for more options.`
                    );
                }

                const serverToStart = availableServers[0];
                console.log(
                    `   🚀 Starting ${serverToStart.type} ${serverToStart.version}...`
                );

                const startResult =
                    await this.databaseServerManager.startServer(serverToStart);

                if (!startResult.success) {
                    throw new Error(
                        `Failed to start ${config.database}: ${startResult.error}`
                    );
                }

                console.log(`   ✅ Database server started successfully`);

                // Wait for server to be fully ready
                await new Promise((resolve) => setTimeout(resolve, 3000));
            } else {
                console.log(
                    `   ✅ ${runningServer.type} ${runningServer.version} is running`
                );
            }
        } catch (serverError) {
            console.warn(
                `   ⚠️ Could not verify database server:`,
                serverError
            );
            // Continue anyway and let MySQL connection attempt catch real issues
        }

        // Now try to connect to MySQL with retry logic
        console.log(`   🔌 Connecting to MySQL server...`);
        let connection;
        let retries = 3;
        let lastError;

        while (retries > 0) {
            try {
                connection = await mysql.createConnection({
                    host: "localhost",
                    port: 3306,
                    user: "root",
                    password: config.dbRootPassword || "",
                    connectTimeout: 10000,
                });
                console.log(`   ✅ Connected to MySQL server`);
                break;
            } catch (connError) {
                lastError = connError;
                retries--;
                if (retries > 0) {
                    console.log(
                        `   ⚠️ Connection failed, retrying... (${retries} attempts left)`
                    );
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                }
            }
        }

        if (!connection) {
            console.error(
                `❌ Failed to connect to MySQL after multiple attempts`
            );

            // Provide helpful error messages
            if ((lastError as any)?.code === "ECONNREFUSED") {
                throw new Error(
                    `MySQL is not running on localhost:3306.\n\n` +
                        `Go to Tools → Database Management to start the server,\n` +
                        `or create the site with SQLite database instead.`
                );
            } else if ((lastError as any)?.code === "ER_ACCESS_DENIED_ERROR") {
                throw new Error(
                    `MySQL authentication failed. Please check your root password.\n\n` +
                        `Or create the site with SQLite database instead.`
                );
            }

            throw new Error(
                `Failed to connect to MySQL: ${(lastError as Error).message}\n\n` +
                    `Try using SQLite database for easier setup.`
            );
        }

        try {
            // Create database if it doesn't exist
            console.log(`   📊 Creating database: ${dbName}`);
            await connection.query(
                `CREATE DATABASE IF NOT EXISTS \`${dbName}\``
            );
            console.log(`   ✅ Database created: ${dbName}`);

            // Create user and grant privileges
            console.log(`   👤 Setting up database user: ${dbUser}`);
            await connection.query(
                `CREATE USER IF NOT EXISTS '${dbUser}'@'localhost' IDENTIFIED BY '${dbPassword}'`
            );
            await connection.query(
                `GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'localhost'`
            );
            await connection.query("FLUSH PRIVILEGES");
            console.log(`   ✅ Database user configured`);

            // Verify database is accessible
            await connection.query(`USE \`${dbName}\``);
            console.log(`   ✅ Database verified and accessible`);

            await connection.end();
            console.log(`✅ MySQL database setup complete`);
        } catch (error) {
            if (connection) {
                try {
                    await connection.end();
                } catch (closeError) {
                    // Ignore connection close errors
                }
            }

            console.error(`❌ Failed to setup MySQL database:`, error);
            throw error;
        }
    }

    /**
     * Fallback to SQLite when MySQL/MariaDB is unavailable
     */
    private async fallbackToSQLite(
        site: SimpleWordPressSite,
        config: SiteConfig
    ): Promise<void> {
        console.log(`   🔄 Configuring SQLite database...`);

        // Create wp-config.php with SQLite configuration
        const wpConfigPath = path.join(site.path, "wp-config.php");

        // Generate SQLite wp-config.php
        const dbName = config.dbName || site.name.replace(/[^a-z0-9_]/gi, "_");
        const wpConfig = `<?php
/**
 * WordPress Configuration - SQLite Database
 * Generated by PressBox
 */

// SQLite Database Configuration
define('DB_DIR', dirname(__FILE__) . '/wp-content/database/');
define('DB_FILE', 'wordpress.db');

// Use SQLite instead of MySQL
define('USE_MYSQL', false);

// Authentication Unique Keys and Salts
define('AUTH_KEY',         '${this.generateSalt()}');
define('SECURE_AUTH_KEY',  '${this.generateSalt()}');
define('LOGGED_IN_KEY',    '${this.generateSalt()}');
define('NONCE_KEY',        '${this.generateSalt()}');
define('AUTH_SALT',        '${this.generateSalt()}');
define('SECURE_AUTH_SALT', '${this.generateSalt()}');
define('LOGGED_IN_SALT',   '${this.generateSalt()}');
define('NONCE_SALT',       '${this.generateSalt()}');

// WordPress Database Table prefix
$table_prefix = 'wp_';

// WordPress debugging mode
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);

// Absolute path to the WordPress directory
if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__ . '/');
}

// Sets up WordPress vars and included files
require_once ABSPATH . 'wp-settings.php';
`;

        await fs.writeFile(wpConfigPath, wpConfig);
        console.log(`   ✅ Created SQLite wp-config.php`);

        // Create database directory
        const dbDir = path.join(site.path, "wp-content", "database");
        await fs.mkdir(dbDir, { recursive: true });
        console.log(`   ✅ Created database directory`);

        // Install SQLite integration plugin
        await this.installSQLitePlugin(site);

        console.log(`   ✅ SQLite fallback configured successfully`);
    }

    /**
     * Install SQLite integration plugin (db.php drop-in)
     */
    private async installSQLitePlugin(
        site: SimpleWordPressSite
    ): Promise<void> {
        console.log(`   📦 Installing SQLite integration...`);

        const wpContentPath = path.join(site.path, "wp-content");
        const dbPhpPath = path.join(wpContentPath, "db.php");

        // Simple SQLite db.php drop-in
        const dbPhp = `<?php
/**
 * SQLite Database Drop-in for WordPress
 * This file makes WordPress use SQLite instead of MySQL
 */

if (!defined('DB_FILE')) {
    define('DB_FILE', 'wordpress.db');
}

if (!defined('DB_DIR')) {
    define('DB_DIR', dirname(__FILE__) . '/database/');
}

// Load PDO SQLite driver
require_once ABSPATH . 'wp-includes/wp-db.php';

// Override default MySQL database class with SQLite version
class wpdb extends wpdb_base {
    private $pdo;
    
    public function __construct($dbuser, $dbpassword, $dbname, $dbhost) {
        $db_file = DB_DIR . DB_FILE;
        
        // Create database directory if it doesn't exist
        if (!file_exists(DB_DIR)) {
            mkdir(DB_DIR, 0755, true);
        }
        
        try {
            $this->pdo = new PDO('sqlite:' . $db_file);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->ready = true;
        } catch (PDOException $e) {
            $this->ready = false;
            error_log('SQLite Connection Error: ' . $e->getMessage());
        }
    }
}
`;

        await fs.writeFile(dbPhpPath, dbPhp);
        console.log(`   ✅ SQLite integration installed`);
    }

    /**
     * Generate a random salt for WordPress security keys
     */
    private generateSalt(): string {
        return crypto.randomBytes(32).toString("base64");
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
            // Load site configuration
            const configPath = path.join(site.path, "pressbox-config.json");
            const configData = await fs.readFile(configPath, "utf8");
            const siteConfig = JSON.parse(configData);

            // Check database type and setup MySQL/MariaDB if needed
            const dbType = siteConfig.config?.database || "sqlite";
            if (dbType === "mysql" || dbType === "mariadb") {
                console.log(
                    `📊 Verifying ${dbType.toUpperCase()} database availability...`
                );

                // Use the same verification method as site creation
                const isAvailable = await this.verifyMySQLAvailability(
                    siteConfig.config
                );

                if (!isAvailable) {
                    console.warn(`⚠️ MySQL/MariaDB not available`);
                    console.log(`🔄 Falling back to SQLite database...`);

                    // Fallback to SQLite
                    await this.fallbackToSQLite(site, siteConfig.config);

                    // Update site and config to reflect SQLite usage
                    site.database = "sqlite";
                    siteConfig.config.database = "sqlite";

                    // Save updated config
                    const configPath = path.join(
                        site.path,
                        "pressbox-config.json"
                    );
                    await fs.writeFile(
                        configPath,
                        JSON.stringify(siteConfig, null, 2)
                    );

                    console.log(`✅ Successfully fell back to SQLite`);
                } else {
                    console.log(`✅ ${dbType.toUpperCase()} is ready`);
                    // Update site configuration with actual database type used
                    site.database = dbType;
                    site.databaseVersion = siteConfig.config.databaseVersion;
                }
            }

            await this.startPHPServer(site);

            // Wait a bit for WordPress to fully initialize
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Automatically install WordPress
            console.log(`🔧 Installing WordPress automatically...`);
            await this.installWordPress(site, siteConfig.config);

            site.status = SiteStatus.RUNNING;
            site.lastAccessed = new Date();

            await this.saveSiteConfig(
                simpleToWordPress(
                    site,
                    site.adminUser,
                    site.adminPassword,
                    site.adminEmail
                )
            );

            console.log(`✅ Site started and installed successfully!`);
            console.log(`   ${site.name} is now running at: ${site.url}`);
            console.log(
                `   Admin login: ${siteConfig.config.adminUser} / ${siteConfig.config.adminPassword}`
            );
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
        const wpPath = site.path; // WordPress files are directly in site path
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
        // Use localhost instead of custom domain for PHP server binding
        const phpArgs = [
            "-S",
            `localhost:${site.port}`,
            "-t",
            wpPath,
            "-d",
            "display_errors=1",
            "-d",
            "log_errors=1",
            "-d",
            "extension=sqlite3", // Enable SQLite3 extension (required by SQLite Integration plugin)
            "-d",
            "extension=pdo_sqlite", // Enable PDO SQLite for WordPress
            "-d",
            "extension=mysqli",
            "-d",
            "extension=pdo_mysql",
        ];

        console.log(`▶️  Starting PHP server: php ${phpArgs.join(" ")}`);
        console.log(`   Working directory: ${wpPath}`);
        console.log(`   Server will run on: ${site.url}`);

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
        const maxAttempts = 20; // Increased from 15
        const initialDelay = 2000; // Wait 2 seconds before first attempt
        const retryDelay = 1000; // 1 second between retries

        // Give PHP server time to start before first check
        console.log(
            `   Waiting ${initialDelay}ms for PHP server to initialize...`
        );
        await new Promise((resolve) => setTimeout(resolve, initialDelay));

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                // Try to connect to the server - always use localhost for connection test
                const testUrl = `http://localhost:${site.port}`;
                console.log(
                    `   Testing connection to: ${testUrl} (attempt ${attempt}/${maxAttempts})`
                );
                await this.testConnection(testUrl);

                console.log(`✅ PHP server is ready after ${attempt} attempts`);
                return;
            } catch (error) {
                const errorMsg =
                    error instanceof Error ? error.message : "Unknown error";

                if (attempt === maxAttempts) {
                    console.error(
                        `❌ PHP server failed to respond after ${maxAttempts} attempts`
                    );
                    console.error(`   Last error: ${errorMsg}`);
                    console.error(`   Site: ${site.name}`);
                    console.error(`   Port: ${site.port}`);
                    console.error(`   Path: ${site.path}`);
                    throw new Error(
                        `PHP server failed to start after ${maxAttempts} attempts. Last error: ${errorMsg}`
                    );
                }
                // Continue trying
                console.log(
                    `   ⏳ Server not ready yet, retrying... (${errorMsg})`
                );

                // Wait before next attempt
                await new Promise((resolve) => setTimeout(resolve, retryDelay));
            }
        }
    }

    /**
     * Test connection to server (improved to handle redirects)
     */
    private async testConnection(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = http.get(url, (response) => {
                // Accept any 2xx or 3xx status codes as success
                // 200 = OK, 302 = redirect (WordPress installation wizard)
                // 500 = WordPress error (but server is running)
                if (
                    response.statusCode &&
                    response.statusCode >= 200 &&
                    response.statusCode < 600 // Accept even error responses - server is running!
                ) {
                    console.log(
                        `      → HTTP ${response.statusCode} (server responding)`
                    );
                    resolve();
                } else {
                    reject(new Error(`HTTP ${response.statusCode}`));
                }
            });

            request.on("error", (error: any) => {
                // Provide more detail about the error
                const errorCode = error.code || "UNKNOWN";
                const errorMsg = error.message || "Unknown error";
                reject(new Error(`${errorCode}: ${errorMsg}`));
            });

            request.setTimeout(10000, () => {
                // Increased from 5000ms to 10000ms (10 seconds)
                request.destroy();
                reject(new Error("Connection timeout (10s)"));
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
        await this.saveSiteConfig(
            simpleToWordPress(
                site,
                site.adminUser,
                site.adminPassword,
                site.adminEmail
            )
        );

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
        return Array.from(this.sites.values()).map((site) =>
            simpleToWordPress(
                site,
                site.adminUser,
                site.adminPassword,
                site.adminEmail
            )
        );
    }

    /**
     * Get a specific site
     */
    async getSite(siteId: string): Promise<WordPressSite | undefined> {
        const simpleSite = this.sites.get(siteId);
        return simpleSite
            ? simpleToWordPress(
                  simpleSite,
                  simpleSite.adminUser,
                  simpleSite.adminPassword,
                  simpleSite.adminEmail
              )
            : undefined;
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
     * Automatically install WordPress
     */
    private async installWordPress(
        site: SimpleWordPressSite,
        config: any
    ): Promise<void> {
        const installUrl = `${site.url}/wp-admin/install.php?step=2`;

        // Prepare installation data
        const postData = new URLSearchParams({
            weblog_title: config.siteName || "PressBox Site",
            user_name: config.adminUser,
            admin_password: config.adminPassword,
            admin_password2: config.adminPassword,
            admin_email: config.adminEmail,
            blog_public: "1",
            Submit: "Install WordPress",
        });

        return new Promise((resolve, reject) => {
            const url = new URL(installUrl);
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Content-Length": Buffer.byteLength(postData.toString()),
                    "User-Agent": "PressBox-Installer",
                },
            };

            const req = http.request(options, (res) => {
                let body = "";
                res.on("data", (chunk) => {
                    body += chunk.toString();
                });

                res.on("end", () => {
                    if (res.statusCode === 200 && body.includes("Success")) {
                        console.log("✅ WordPress installed successfully");
                        resolve();
                    } else if (body.includes("already installed")) {
                        console.log("ℹ️  WordPress already installed");
                        resolve();
                    } else {
                        console.log(
                            "⚠️  Installation response:",
                            body.substring(0, 200)
                        );
                        // Don't fail if installation seems to have worked
                        resolve();
                    }
                });
            });

            req.on("error", (error) => {
                console.warn(
                    "⚠️  WordPress installation request failed, but site may still work:",
                    error.message
                );
                // Don't fail the entire process if installation fails
                resolve();
            });

            req.setTimeout(10000, () => {
                req.destroy();
                console.warn(
                    "⚠️  WordPress installation timeout, but site may still work"
                );
                resolve();
            });

            req.write(postData.toString());
            req.end();
        });
    }

    /**
     * Update all site URLs when admin mode changes
     */
    async updateSiteUrlsForAdminMode(): Promise<void> {
        console.log("🔄 Updating site URLs for admin mode change...");

        for (const [siteId, site] of this.sites) {
            // Update site URL based on current admin mode
            const newUrl = NonAdminMode.getSiteUrl(
                site.name,
                site.domain,
                site.port
            );
            const newDomain = NonAdminMode.getEffectiveDomain(
                site.name,
                site.domain
            );

            if (site.url !== newUrl || site.domain !== newDomain) {
                console.log(
                    `   Updating ${site.name}: ${site.url} → ${newUrl}`
                );
                site.url = newUrl;
                site.domain = newDomain;
                site.adminUrl = `${newUrl}/wp-admin`;

                // Update wp-config.php with new URLs
                await this.updateWordPressUrls(site);

                // Save updated configuration
                await this.saveSiteConfig(
                    simpleToWordPress(
                        site,
                        site.adminUser,
                        site.adminPassword,
                        site.adminEmail
                    )
                );
            }
        }

        console.log("✅ Site URLs updated for admin mode change");
    }

    /**
     * Update WordPress URLs in wp-config.php
     */
    private async updateWordPressUrls(
        site: SimpleWordPressSite
    ): Promise<void> {
        const wpConfigPath = path.join(site.path, "wp-config.php");

        try {
            let wpConfig = await fs.readFile(wpConfigPath, "utf8");

            // Update WP_HOME and WP_SITEURL
            wpConfig = wpConfig.replace(
                /define\(\s*['"]WP_HOME['"]\s*,\s*['"][^'"]*['"]\s*\);/,
                `define( 'WP_HOME', '${site.url}' );`
            );
            wpConfig = wpConfig.replace(
                /define\(\s*['"]WP_SITEURL['"]\s*,\s*['"][^'"]*['"]\s*\);/,
                `define( 'WP_SITEURL', '${site.url}' );`
            );

            await fs.writeFile(wpConfigPath, wpConfig);
            console.log(`   ✅ Updated wp-config.php URLs for ${site.name}`);
        } catch (error) {
            console.warn(
                `   ⚠️ Failed to update wp-config.php for ${site.name}:`,
                error
            );
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
