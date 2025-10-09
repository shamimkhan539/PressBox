import { spawn, ChildProcess, exec } from "child_process";
import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";
import { promisify } from "util";
import { WordPressDownloader } from "./wordpressDownloader";
import { PortablePHPManager } from "./portablePHPManager";
import { WPCLIManager } from "./wpCliManager";

const execAsync = promisify(exec);

export interface LocalServerConfig {
    siteName: string;
    domain: string;
    port: number;
    phpVersion: string;
    wordpressVersion: string;
    sitePath: string;
    dbName: string;
}

export interface PHPInfo {
    version: string;
    path: string;
    available: boolean;
}

export interface LocalServer {
    process: ChildProcess | null;
    port: number;
    url: string;
    status: "running" | "stopped" | "error";
}

/**
 * Local Server Manager - Non-Docker WordPress Environment
 *
 * Manages WordPress sites using local PHP and file-based approach
 * Works without Docker by using system PHP or portable PHP
 */
export class LocalServerManager {
    private servers: Map<string, LocalServer> = new Map();
    private phpPath: string | null = null;
    private composerPath: string | null = null;
    private basePort = 8080;
    private sitesPath: string;

    constructor() {
        this.sitesPath = path.join(os.homedir(), "PressBox", "sites");
        this.initialize();
    }

    /**
     * Initialize the local server manager
     */
    async initialize(): Promise<void> {
        try {
            // Ensure sites directory exists
            await fs.mkdir(this.sitesPath, { recursive: true });

            // Detect system PHP
            await this.detectPHP();

            // Create resources directory for portable tools if needed
            const resourcesPath = path.join(
                os.homedir(),
                "PressBox",
                "resources"
            );
            await fs.mkdir(resourcesPath, { recursive: true });

            console.log("LocalServerManager initialized");
            console.log(`Sites path: ${this.sitesPath}`);
            console.log(`PHP available: ${this.phpPath ? "Yes" : "No"}`);
        } catch (error) {
            console.error("Failed to initialize LocalServerManager:", error);
        }
    }

    /**
     * Detect system PHP installation
     */
    private async detectPHP(): Promise<PHPInfo> {
        const phpCommands = ["php", "php.exe"];

        // First, try system PHP
        for (const cmd of phpCommands) {
            try {
                const { stdout } = await execAsync(`${cmd} --version`);
                const versionMatch = stdout.match(/PHP (\d+\.\d+\.\d+)/);

                if (versionMatch) {
                    this.phpPath = cmd;
                    return {
                        version: versionMatch[1],
                        path: cmd,
                        available: true,
                    };
                }
            } catch {
                // Continue to next command
            }
        }

        // If system PHP not found, check for portable PHP
        const portablePHP = PortablePHPManager.getInstance();
        await portablePHP.initialize();

        if (await portablePHP.isPortablePHPAvailable()) {
            const portablePath = portablePHP.getPortablePHPPath();
            if (portablePath) {
                try {
                    const testResult = await portablePHP.testPortablePHP();
                    if (testResult.success) {
                        this.phpPath = portablePath;
                        return {
                            version: testResult.version || "Unknown",
                            path: portablePath,
                            available: true,
                        };
                    }
                } catch (error) {
                    console.error("Error testing portable PHP:", error);
                }
            }
        }

        // No PHP found
        return {
            version: "",
            path: "",
            available: false,
        };
    }

    /**
     * Create a new WordPress site locally
     */
    async createSite(config: LocalServerConfig): Promise<void> {
        try {
            const sitePath = path.join(this.sitesPath, config.siteName);

            // Create site directory
            await fs.mkdir(sitePath, { recursive: true });

            // Download and extract WordPress
            await this.downloadWordPress(sitePath, config.wordpressVersion);

            // Create WordPress config
            await this.createWordPressConfig(sitePath, config);

            // Create SQLite database setup (fallback for MySQL)
            await this.setupDatabase(sitePath, config);

            // Save site configuration
            await this.saveSiteConfig(sitePath, config);

            console.log(`Created WordPress site: ${config.siteName}`);
        } catch (error) {
            throw new Error(
                `Failed to create site ${config.siteName}: ${error}`
            );
        }
    }

    /**
     * Start a WordPress site server
     */
    async startSite(siteName: string): Promise<LocalServer> {
        try {
            const sitePath = path.join(this.sitesPath, siteName);
            const configPath = path.join(sitePath, "pressbox-config.json");

            // Load site configuration
            const configData = await fs.readFile(configPath, "utf8");
            const config: LocalServerConfig = JSON.parse(configData);

            // Find available port
            const port = await this.findAvailablePort(this.basePort);

            // Start PHP built-in server
            const server = await this.startPHPServer(sitePath, port);

            const localServer: LocalServer = {
                process: server,
                port: port,
                url: `http://localhost:${port}`,
                status: "running",
            };

            this.servers.set(siteName, localServer);

            console.log(`Started site ${siteName} on port ${port}`);
            return localServer;
        } catch (error) {
            throw new Error(`Failed to start site ${siteName}: ${error}`);
        }
    }

    /**
     * Stop a WordPress site server
     */
    async stopSite(siteName: string): Promise<void> {
        const server = this.servers.get(siteName);

        if (server && server.process) {
            server.process.kill();
            server.status = "stopped";
            this.servers.delete(siteName);
            console.log(`Stopped site ${siteName}`);
        }
    }

    /**
     * Get running sites
     */
    async getRunningSites(): Promise<Map<string, LocalServer>> {
        return new Map(this.servers);
    }

    /**
     * Download and extract WordPress
     */
    private async downloadWordPress(
        sitePath: string,
        version: string = "latest"
    ): Promise<void> {
        const wordpressPath = path.join(sitePath, "wordpress");

        try {
            // Check if WordPress already exists
            await fs.access(wordpressPath);
            console.log("WordPress already exists, skipping download");
            return;
        } catch {
            // WordPress doesn't exist, download it
        }

        try {
            console.log(`Downloading WordPress ${version}...`);
            await WordPressDownloader.download(sitePath, version);
        } catch (error) {
            console.warn(
                "Failed to download WordPress, creating basic structure:",
                error
            );
            // Fallback to basic structure
            await fs.mkdir(wordpressPath, { recursive: true });
            await this.createBasicWordPressFiles(wordpressPath);
        }
    }

    /**
     * Create basic WordPress file structure (placeholder)
     */
    private async createBasicWordPressFiles(
        wordpressPath: string
    ): Promise<void> {
        const indexContent = `<?php
/**
 * Front to the WordPress application. This file doesn't do anything, but loads
 * wp-blog-header.php which does and tells WordPress to load the theme.
 */

define( 'WP_USE_THEMES', true );

/** Loads the WordPress Environment and Template */
require __DIR__ . '/wp-blog-header.php';
`;

        const wpConfigSample = `<?php
/**
 * WordPress Configuration File
 * Generated by PressBox
 */

// ** Database settings ** //
define( 'DB_NAME', '{{DB_NAME}}' );
define( 'DB_USER', 'root' );
define( 'DB_PASSWORD', '' );
define( 'DB_HOST', 'localhost' );
define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );

// ** Authentication Unique Keys and Salts ** //
define( 'AUTH_KEY',         'put your unique phrase here' );
define( 'SECURE_AUTH_KEY',  'put your unique phrase here' );
define( 'LOGGED_IN_KEY',    'put your unique phrase here' );
define( 'NONCE_KEY',        'put your unique phrase here' );
define( 'AUTH_SALT',        'put your unique phrase here' );
define( 'SECURE_AUTH_SALT', 'put your unique phrase here' );
define( 'LOGGED_IN_SALT',   'put your unique phrase here' );
define( 'NONCE_SALT',       'put your unique phrase here' );

// ** WordPress Database Table prefix ** //
$table_prefix = 'wp_';

// ** WordPress debugging mode ** //
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
`;

        const wpBlogHeader = `<?php
/**
 * Loads the WordPress environment and template.
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

        // Create WordPress core files
        await fs.writeFile(path.join(wordpressPath, "index.php"), indexContent);
        await fs.writeFile(
            path.join(wordpressPath, "wp-config-sample.php"),
            wpConfigSample
        );
        await fs.writeFile(
            path.join(wordpressPath, "wp-blog-header.php"),
            wpBlogHeader
        );

        // Create wp-content structure
        const wpContentPath = path.join(wordpressPath, "wp-content");
        await fs.mkdir(wpContentPath, { recursive: true });
        await fs.mkdir(path.join(wpContentPath, "themes"), { recursive: true });
        await fs.mkdir(path.join(wpContentPath, "plugins"), {
            recursive: true,
        });
        await fs.mkdir(path.join(wpContentPath, "uploads"), {
            recursive: true,
        });

        console.log("Created basic WordPress file structure");
    }

    /**
     * Create WordPress configuration
     */
    private async createWordPressConfig(
        sitePath: string,
        config: LocalServerConfig
    ): Promise<void> {
        const wpConfigPath = path.join(sitePath, "wordpress", "wp-config.php");
        const samplePath = path.join(
            sitePath,
            "wordpress",
            "wp-config-sample.php"
        );

        try {
            let wpConfig = await fs.readFile(samplePath, "utf8");

            // Replace database placeholders
            wpConfig = wpConfig.replace("{{DB_NAME}}", config.dbName);

            // Write wp-config.php
            await fs.writeFile(wpConfigPath, wpConfig);

            console.log(`Created wp-config.php for ${config.siteName}`);
        } catch (error) {
            console.error("Failed to create wp-config.php:", error);
        }
    }

    /**
     * Setup database (SQLite fallback)
     */
    private async setupDatabase(
        sitePath: string,
        config: LocalServerConfig
    ): Promise<void> {
        // For now, just create a database directory
        // TODO: Implement SQLite database setup
        const dbPath = path.join(sitePath, "database");
        await fs.mkdir(dbPath, { recursive: true });

        console.log(`Database setup completed for ${config.siteName}`);
    }

    /**
     * Save site configuration
     */
    private async saveSiteConfig(
        sitePath: string,
        config: LocalServerConfig
    ): Promise<void> {
        const configPath = path.join(sitePath, "pressbox-config.json");
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    }

    /**
     * Start PHP built-in server
     */
    private async startPHPServer(
        sitePath: string,
        port: number
    ): Promise<ChildProcess> {
        const wordpressPath = path.join(sitePath, "wordpress");
        const phpCommand = this.phpPath || "php";

        return new Promise((resolve, reject) => {
            const server = spawn(
                phpCommand,
                ["-S", `localhost:${port}`, "-t", wordpressPath],
                {
                    cwd: wordpressPath,
                    stdio: "pipe",
                }
            );

            server.stdout?.on("data", (data) => {
                console.log(`PHP Server: ${data}`);
            });

            server.stderr?.on("data", (data) => {
                console.error(`PHP Server Error: ${data}`);
            });

            server.on("error", (error) => {
                reject(error);
            });

            // Give server time to start
            setTimeout(() => {
                resolve(server);
            }, 1000);
        });
    }

    /**
     * Find available port
     */
    private async findAvailablePort(startPort: number): Promise<number> {
        return new Promise((resolve) => {
            const server = require("net").createServer();

            server.listen(startPort, () => {
                const port = server.address()?.port;
                server.close(() => {
                    resolve(port || startPort);
                });
            });

            server.on("error", () => {
                // Port is taken, try next one
                resolve(this.findAvailablePort(startPort + 1));
            });
        });
    }

    /**
     * Check if PHP is available
     */
    async isPHPAvailable(): Promise<boolean> {
        return this.phpPath !== null;
    }

    /**
     * Get PHP info
     */
    async getPHPInfo(): Promise<PHPInfo> {
        return this.detectPHP();
    }
}
