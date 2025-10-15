import { join, basename } from "path";
import { promises as fs } from "fs";
import { v4 as uuidv4 } from "uuid";
import { spawn, ChildProcess } from "child_process";
import { DockerManager } from "./dockerManager";
import { LocalServerManager } from "./localServerManager";
import { HostsFileService } from "./hostsFileService";
import { PortManager } from "./portManager";
import { SimpleWordPressManager } from "./simpleWordPressManager";
import { NonAdminMode } from "./nonAdminMode";
import {
    WordPressSite,
    SiteStatus,
    CreateSiteRequest,
    SiteConfig,
    PressBoxError,
    SiteError,
} from "../../shared/types";

/**
 * WordPress Manager
 *
 * Handles WordPress site creation, management, and lifecycle operations.
 * Uses Docker containers to run isolated WordPress environments.
 */
export class WordPressManager {
    private sites: Map<string, WordPressSite> = new Map();
    private sitesPath: string;
    private dockerManager: DockerManager;
    private localServerManager: LocalServerManager;
    private portManager: PortManager;
    private simpleManager: SimpleWordPressManager;
    private useDocker: boolean = false;
    private useSimpleMode: boolean = true; // Use simple native mode by default

    constructor(dockerManager: DockerManager) {
        console.log("🌐 WordPressManager constructor called");
        this.dockerManager = dockerManager;
        this.localServerManager = new LocalServerManager();
        this.portManager = new PortManager();
        console.log("🔧 Creating SimpleWordPressManager instance...");
        this.simpleManager = new SimpleWordPressManager();
        console.log("✅ SimpleWordPressManager instance created");
        this.sitesPath = join(
            process.env.HOME || process.env.USERPROFILE || ".",
            "PressBox",
            "sites"
        );
        console.log("🚀 Calling WordPressManager.initialize()...");
        this.initialize();
    }

    /**
     * Initialize the WordPress manager
     */
    private async initialize(): Promise<void> {
        try {
            console.log("📁 WordPressManager.initialize() started");
            console.log(`📍 Sites path: ${this.sitesPath}`);
            console.log(`🔄 useSimpleMode: ${this.useSimpleMode}`);

            // Ensure sites directory exists
            console.log("📁 Creating sites directory...");
            await fs.mkdir(this.sitesPath, { recursive: true });
            console.log("✅ Sites directory created");

            if (this.useSimpleMode) {
                // Use simple native WordPress manager (no Docker)
                console.log(
                    "Using Simple Native WordPress Manager (no Docker required)"
                );
                console.log("🚀 Calling simpleManager.initialize()...");
                await this.simpleManager.initialize();
                console.log("✅ simpleManager.initialize() completed");
                console.log("📄 Loading simple sites...");
                await this.loadSimpleSites();
                console.log("✅ Simple sites loaded");
            } else {
                // Check if Docker is available, otherwise use local server
                try {
                    await this.dockerManager.initialize();
                    this.useDocker = true;
                    console.log("Using Docker for WordPress environments");
                } catch (error) {
                    console.log(
                        "Docker not available, using local server manager"
                    );
                    this.useDocker = false;
                    await this.localServerManager.initialize();
                }

                // Load existing sites
                await this.loadSites();
            }

            const modeText = this.useSimpleMode
                ? "Simple Native"
                : this.useDocker
                  ? "Docker"
                  : "Local";
            console.log(
                `WordPress Manager initialized with ${this.sites.size} sites (${modeText} mode)`
            );
        } catch (error) {
            console.error("Failed to initialize WordPress Manager:", error);
            throw new SiteError(
                "Failed to initialize WordPress Manager",
                error
            );
        }
    }

    /**
     * Load existing sites from disk
     */
    private async loadSites(): Promise<void> {
        try {
            const siteDirectories = await fs.readdir(this.sitesPath);

            for (const siteDir of siteDirectories) {
                const sitePath = join(this.sitesPath, siteDir);
                const configPath = join(sitePath, "pressbox.json");

                try {
                    const configData = await fs.readFile(configPath, "utf-8");
                    const site: WordPressSite = JSON.parse(configData);

                    // Update site status based on container state
                    await this.updateSiteStatus(site);

                    this.sites.set(site.id, site);
                } catch (error) {
                    console.warn(
                        `Failed to load site from ${sitePath}:`,
                        error
                    );
                }
            }
        } catch (error) {
            console.warn("No existing sites directory found, starting fresh");
        }
    }

    /**
     * Load sites from simple manager
     */
    private async loadSimpleSites(): Promise<void> {
        if (this.useSimpleMode) {
            const simpleSites = await this.simpleManager.getSites();
            this.sites.clear();

            for (const site of simpleSites) {
                this.sites.set(site.id, site);
            }
        }
    }

    /**
     * Get all WordPress sites
     */
    async getSites(): Promise<WordPressSite[]> {
        if (this.useSimpleMode) {
            // Refresh from simple manager
            await this.loadSimpleSites();
        }
        return Array.from(this.sites.values());
    }

    /**
     * Get a specific WordPress site by ID
     */
    async getSite(siteId: string): Promise<WordPressSite | null> {
        return this.sites.get(siteId) || null;
    }

    /**
     * Create a new WordPress site
     */
    async createSite(request: CreateSiteRequest): Promise<WordPressSite> {
        try {
            console.log(
                `🏗 WordPressManager.createSite called with: ${request.name}`
            );
            console.log(`🔧 UseSimpleMode: ${this.useSimpleMode}`);
            console.log(
                `🔧 SimpleManager instance:`,
                this.simpleManager ? "available" : "null"
            );

            if (this.useSimpleMode) {
                console.log(
                    `🚀 Using simple native manager for ${request.name}`
                );
                // Use simple native manager
                const simpleConfig = {
                    siteName: request.name,
                    domain: request.domain || `${request.name}.local`,
                    phpVersion: request.phpVersion,
                    wordpressVersion: request.wordPressVersion || "latest",
                    adminUser: request.adminUser || "admin",
                    adminPassword:
                        request.adminPassword || this.generatePassword(),
                    adminEmail: request.adminEmail || "admin@local.dev",
                };

                console.log(`🔧 Simple config prepared:`, simpleConfig);
                console.log(`🚀 Calling simpleManager.createSite()...`);
                const nativeSite =
                    await this.simpleManager.createSite(simpleConfig);
                console.log(`✅ SimpleManager returned:`, nativeSite);

                // Convert to WordPressSite format
                const site: WordPressSite = {
                    id: nativeSite.id,
                    name: nativeSite.name,
                    domain: nativeSite.domain,
                    url: nativeSite.url,
                    path: nativeSite.path,
                    port: nativeSite.port,
                    phpVersion: nativeSite.phpVersion,
                    wordPressVersion: nativeSite.wordPressVersion,
                    webServer: "nginx",
                    database: "mysql",
                    status: nativeSite.status as SiteStatus,
                    ssl: false,
                    multisite: false,
                    xdebug: false,
                    created: nativeSite.created,
                    config: {
                        phpVersion: nativeSite.phpVersion,
                        wordPressVersion: nativeSite.wordPressVersion,
                        dbName: `wp_${nativeSite.name}`,
                        dbUser: "root",
                        dbPassword: "",
                        dbRootPassword: "",
                        adminUser: simpleConfig.adminUser,
                        adminPassword: simpleConfig.adminPassword,
                        adminEmail: simpleConfig.adminEmail,
                        webServer: "nginx",
                        ssl: false,
                        multisite: false,
                    },
                };

                // Register domain in hosts file (only if not in non-admin mode)
                if (!NonAdminMode.shouldBlockAdminOperations()) {
                    try {
                        await HostsFileService.addWordPressSiteEntry(
                            site.id,
                            site.domain
                        );
                        console.log(
                            `✅ Registered domain ${site.domain} in hosts file`
                        );
                    } catch (error) {
                        console.warn(
                            "Failed to register domain in hosts file:",
                            error
                        );
                    }
                } else {
                    console.log(
                        `🔓 Skipping hosts file registration for ${site.domain} (non-admin mode)`
                    );
                }

                // Store in our sites map for compatibility
                this.sites.set(site.id, site);

                console.log(
                    `✅ Created WordPress site: ${site.name} at ${site.url}`
                );
                return site;
            } else {
                // Original Docker/Local implementation
                return await this.createSiteOriginal(request);
            }
        } catch (error) {
            console.error(`❌ Failed to create site '${request.name}':`, error);
            throw new SiteError(
                `Failed to create site '${request.name}'`,
                error
            );
        }
    }

    /**
     * Original site creation method (Docker/Local)
     */
    private async createSiteOriginal(
        request: CreateSiteRequest
    ): Promise<WordPressSite> {
        // Generate site configuration
        const siteId = uuidv4();
        const siteName = this.sanitizeSiteName(request.name);
        const domain = request.domain || `${siteName}.local`;
        const sitePath = join(this.sitesPath, siteName);

        // Check if site already exists
        if (await this.siteExists(siteName)) {
            throw new SiteError(`Site with name '${siteName}' already exists`);
        }

        // Create site directory
        await fs.mkdir(sitePath, { recursive: true });

        // Generate site configuration
        const config: SiteConfig = {
            phpVersion: request.phpVersion,
            wordPressVersion: request.wordPressVersion || "latest",
            dbName: `wp_${siteName}`,
            dbUser: "wordpress",
            dbPassword: this.generatePassword(),
            dbRootPassword: this.generatePassword(),
            adminUser: request.adminUser || "admin",
            adminPassword: request.adminPassword || this.generatePassword(),
            adminEmail: request.adminEmail || "admin@local.dev",
            webServer: "nginx",
            ssl: request.ssl || false,
            multisite: request.multisite || false,
        };

        // Create site object
        const site: WordPressSite = {
            id: siteId,
            name: siteName,
            domain,
            url: domain,
            path: sitePath,
            phpVersion: request.phpVersion,
            wordPressVersion: config.wordPressVersion || "latest",
            webServer: config.webServer,
            database: "mysql",
            status: SiteStatus.STOPPED,
            ssl: config.ssl,
            multisite: config.multisite,
            xdebug: false,
            created: new Date(),
            config,
        };

        // Save site configuration
        await this.saveSiteConfig(site);

        // Create site environment (Docker or Local)
        if (this.useDocker) {
            await this.createSiteContainers(site);
        } else {
            await this.createLocalSite(site);
        }

        // Register domain in hosts file (only if not in non-admin mode)
        if (!NonAdminMode.shouldBlockAdminOperations()) {
            try {
                await HostsFileService.addWordPressSiteEntry(siteId, domain);
                console.log(`✅ Registered domain ${domain} in hosts file`);
            } catch (error) {
                console.warn("Failed to register domain in hosts file:", error);
            }
        } else {
            console.log(
                `🔓 Skipping hosts file registration for ${domain} (non-admin mode)`
            );
        }

        // Store site in memory
        this.sites.set(siteId, site);

        console.log(`Created new WordPress site: ${siteName}`);
        return site;
    }

    /**
     * Start a WordPress site
     */
    async startSite(siteId: string): Promise<void> {
        if (this.useSimpleMode) {
            // Use simple manager
            console.log(`🚀 Starting site via Simple Manager: ${siteId}`);
            await this.simpleManager.startSite(siteId);

            // Update our local cache
            const nativeSite = await this.simpleManager.getSite(siteId);
            if (nativeSite) {
                const site = this.sites.get(siteId);
                if (site) {
                    site.status = nativeSite.status as SiteStatus;
                    site.lastAccessed = new Date();
                }
            }

            console.log(`✅ Started WordPress site via Simple Manager`);
            return;
        }

        // Original implementation
        const site = this.sites.get(siteId);
        if (!site) {
            throw new SiteError(`Site with ID '${siteId}' not found`);
        }

        try {
            site.status = SiteStatus.STARTING;
            await this.saveSiteConfig(site);

            if (this.useDocker) {
                // Ensure port is allocated
                if (!site.port) {
                    site.port = await this.portManager.allocatePort(
                        site.id,
                        site.name
                    );
                    await this.saveSiteConfig(site);
                }

                // Start database container first
                await this.dockerManager.startContainer(`${site.name}_mysql`);

                // Wait a bit for database to be ready
                await this.sleep(5000);

                // Start web container
                await this.dockerManager.startContainer(
                    `${site.name}_wordpress`
                );
            } else {
                // Start local server
                const server = await this.localServerManager.startSite(
                    site.name
                );
                site.port = server.port;
                site.url = server.url;
            }

            site.status = SiteStatus.RUNNING;
            site.lastAccessed = new Date();
            await this.saveSiteConfig(site);

            console.log(
                `Started WordPress site: ${site.name} on port ${site.port}`
            );
        } catch (error) {
            site.status = SiteStatus.ERROR;
            await this.saveSiteConfig(site);
            throw new SiteError(`Failed to start site '${site.name}'`, error);
        }
    }

    /**
     * Stop a WordPress site
     */
    async stopSite(siteId: string): Promise<void> {
        if (this.useSimpleMode) {
            // Use simple manager
            console.log(`🛑 Stopping site via Simple Manager: ${siteId}`);
            await this.simpleManager.stopSite(siteId);

            // Update our local cache
            const site = this.sites.get(siteId);
            if (site) {
                site.status = SiteStatus.STOPPED;
            }

            console.log(`✅ Stopped WordPress site via Simple Manager`);
            return;
        }

        // Original implementation
        const site = this.sites.get(siteId);
        if (!site) {
            throw new SiteError(`Site with ID '${siteId}' not found`);
        }

        try {
            site.status = SiteStatus.STOPPING;
            await this.saveSiteConfig(site);

            if (this.useDocker) {
                // Stop web container first
                await this.dockerManager.stopContainer(
                    `${site.name}_wordpress`
                );

                // Stop database container
                await this.dockerManager.stopContainer(`${site.name}_mysql`);
            } else {
                // Stop local server
                await this.localServerManager.stopSite(site.name);
            }

            site.status = SiteStatus.STOPPED;
            await this.saveSiteConfig(site);

            // Release port when stopping
            this.portManager.releasePort(site.id);

            console.log(`Stopped WordPress site: ${site.name}`);
        } catch (error) {
            site.status = SiteStatus.ERROR;
            await this.saveSiteConfig(site);
            throw new SiteError(`Failed to stop site '${site.name}'`, error);
        }
    }

    /**
     * Delete a WordPress site
     */
    async deleteSite(siteId: string): Promise<void> {
        const site = this.sites.get(siteId);
        if (!site) {
            throw new SiteError(`Site with ID '${siteId}' not found`);
        }

        try {
            // Stop site if running
            if (site.status === SiteStatus.RUNNING) {
                await this.stopSite(siteId);
            }

            // Remove containers
            await this.dockerManager.removeContainer(
                `${site.name}_wordpress`,
                true
            );
            await this.dockerManager.removeContainer(
                `${site.name}_mysql`,
                true
            );

            // Remove site directory
            await fs.rmdir(site.path, { recursive: true });

            // Remove domain from hosts file (only if not in non-admin mode)
            if (!NonAdminMode.shouldBlockAdminOperations()) {
                try {
                    await HostsFileService.removeHostEntry(site.domain);
                    console.log(
                        `✅ Removed domain ${site.domain} from hosts file`
                    );
                } catch (error) {
                    console.warn(
                        `Failed to remove domain ${site.domain} from hosts file:`,
                        error
                    );
                    // Don't fail site deletion if hosts file cleanup fails
                }
            } else {
                console.log(
                    `🔓 Skipping hosts file cleanup for ${site.domain} (non-admin mode)`
                );
            }

            // Remove from memory
            this.sites.delete(siteId);

            console.log(`Deleted WordPress site: ${site.name}`);
        } catch (error) {
            throw new SiteError(`Failed to delete site '${site.name}'`, error);
        }
    }

    /**
     * Clone a WordPress site
     */
    async cloneSite(siteId: string, newName: string): Promise<WordPressSite> {
        const originalSite = this.sites.get(siteId);
        if (!originalSite) {
            throw new SiteError(`Site with ID '${siteId}' not found`);
        }

        const sanitizedName = this.sanitizeSiteName(newName);

        if (await this.siteExists(sanitizedName)) {
            throw new SiteError(
                `Site with name '${sanitizedName}' already exists`
            );
        }

        try {
            // Create new site configuration
            const clonedSite: WordPressSite = {
                ...originalSite,
                id: uuidv4(),
                name: sanitizedName,
                domain: `${sanitizedName}.local`,
                path: join(this.sitesPath, sanitizedName),
                created: new Date(),
                status: SiteStatus.STOPPED,
                config: {
                    ...originalSite.config,
                    dbName: `wp_${sanitizedName}`,
                    dbPassword: this.generatePassword(),
                    dbRootPassword: this.generatePassword(),
                },
            };

            // Create site directory and copy files
            await fs.mkdir(clonedSite.path, { recursive: true });
            await this.copySiteFiles(originalSite.path, clonedSite.path);

            // Save cloned site configuration
            await this.saveSiteConfig(clonedSite);

            // Create Docker containers for cloned site
            await this.createSiteContainers(clonedSite);

            this.sites.set(clonedSite.id, clonedSite);

            console.log(
                `Cloned WordPress site: ${originalSite.name} -> ${clonedSite.name}`
            );
            return clonedSite;
        } catch (error) {
            throw new SiteError(
                `Failed to clone site '${originalSite.name}'`,
                error
            );
        }
    }

    /**
     * Get site logs
     */
    async getSiteLogs(siteId: string): Promise<string> {
        const site = this.sites.get(siteId);
        if (!site) {
            throw new SiteError(`Site with ID '${siteId}' not found`);
        }

        try {
            const webLogs = await this.dockerManager.getContainerLogs(
                `${site.name}_web`
            );
            const dbLogs = await this.dockerManager.getContainerLogs(
                `${site.name}_db`
            );

            return `=== Web Server Logs ===\n${webLogs}\n\n=== Database Logs ===\n${dbLogs}`;
        } catch (error) {
            throw new SiteError(
                `Failed to get logs for site '${site.name}'`,
                error
            );
        }
    }

    /**
     * Execute WP-CLI command in site
     */
    async executeWPCLI(siteId: string, command: string[]): Promise<string> {
        const site = this.sites.get(siteId);
        if (!site) {
            throw new SiteError(`Site with ID '${siteId}' not found`);
        }

        try {
            const wpCommand = [
                "wp",
                "--allow-root",
                "--path=/var/www/html",
                ...command,
            ];
            return await this.dockerManager.execInContainer(
                `${site.name}_web`,
                wpCommand
            );
        } catch (error) {
            throw new SiteError(
                `Failed to execute WP-CLI command in site '${site.name}'`,
                error
            );
        }
    }

    /**
     * Create local site (non-Docker)
     */
    private async createLocalSite(site: WordPressSite): Promise<void> {
        try {
            const localPort = await this.portManager.allocatePort(
                site.id,
                site.name
            );
            const localConfig = {
                siteName: site.name,
                domain: site.domain,
                port: localPort,
                phpVersion: site.phpVersion,
                wordpressVersion: site.wordPressVersion,
                sitePath: site.path,
                dbName: site.config.dbName,
            };

            await this.localServerManager.createSite(localConfig);

            // Update site with local server info
            site.port = localConfig.port;
            site.url = `http://localhost:${localConfig.port}`;

            console.log(
                `Created local site: ${site.name} on port ${localConfig.port}`
            );
        } catch (error) {
            throw new SiteError(
                `Failed to create local site '${site.name}'`,
                error
            );
        }
    }

    /**
     * Create Docker containers for a site
     */
    private async createSiteContainers(site: WordPressSite): Promise<void> {
        const { name, config } = site;

        try {
            console.log(`Creating Docker containers for site: ${name}`);

            // Ensure site directories exist
            await fs.mkdir(join(site.path, "database"), { recursive: true });
            await fs.mkdir(join(site.path, "wordpress"), { recursive: true });
            await fs.mkdir(join(site.path, "uploads"), { recursive: true });

            // Create Docker network for this site
            const networkName = `pressbox_${name}`;
            await this.dockerManager.createNetwork(networkName, {
                Labels: {
                    "pressbox.managed": "true",
                    "pressbox.site": name,
                },
            });

            // Get available port using PortManager
            let webPort = site.port;
            if (!webPort) {
                webPort = await this.portManager.allocatePort(
                    site.id,
                    site.name
                );
                site.port = webPort;
                await this.saveSiteConfig(site);
            }

            // Create database container with proper networking
            const dbContainer = await this.dockerManager.createContainer({
                name: `${name}_mysql`,
                image: "mysql:8.0",
                environment: [
                    `MYSQL_ROOT_PASSWORD=${config.dbRootPassword}`,
                    `MYSQL_DATABASE=${config.dbName}`,
                    `MYSQL_USER=${config.dbUser}`,
                    `MYSQL_PASSWORD=${config.dbPassword}`,
                    "MYSQL_ALLOW_EMPTY_PASSWORD=0",
                    "MYSQL_RANDOM_ROOT_PASSWORD=0",
                ],
                volumes: [`${site.path}/database:/var/lib/mysql`],
                labels: {
                    "pressbox.site": name,
                    "pressbox.service": "mysql",
                    "pressbox.managed": "true",
                },
            });

            // Connect database container to network
            await this.dockerManager.connectToNetwork(
                networkName,
                dbContainer.id,
                [`${name}_mysql`, "mysql", "db"]
            );

            // Create WordPress container with proper networking
            const wpContainer = await this.dockerManager.createContainer({
                name: `${name}_wordpress`,
                image: `wordpress:php${config.phpVersion || "8.1"}-apache`,
                ports: {
                    "80/tcp": [{ HostPort: webPort.toString() }],
                },
                environment: [
                    `WORDPRESS_DB_HOST=${name}_mysql:3306`,
                    `WORDPRESS_DB_NAME=${config.dbName}`,
                    `WORDPRESS_DB_USER=${config.dbUser}`,
                    `WORDPRESS_DB_PASSWORD=${config.dbPassword}`,
                    "WORDPRESS_DEBUG=1",
                    "WORDPRESS_CONFIG_EXTRA=define('WP_DEBUG_LOG', true); define('WP_DEBUG_DISPLAY', false);",
                ],
                volumes: [`${site.path}/wordpress:/var/www/html`],
                labels: {
                    "pressbox.site": name,
                    "pressbox.service": "wordpress",
                    "pressbox.managed": "true",
                },
            });

            // Connect WordPress container to network
            await this.dockerManager.connectToNetwork(
                networkName,
                wpContainer.id,
                [`${name}_wordpress`, "wordpress", "web"]
            );

            console.log(
                `✅ Created containers for site: ${name} on port ${webPort}`
            );

            // Update site configuration
            site.url = `http://${site.domain}`;
            await this.saveSiteConfig(site);
        } catch (error) {
            console.error(
                `Failed to create containers for site '${name}':`,
                error
            );
            throw new SiteError(
                `Failed to create containers for site '${name}'`,
                error
            );
        }
    }

    /**
     * Update site status based on container state
     */
    private async updateSiteStatus(site: WordPressSite): Promise<void> {
        try {
            const containers = await this.dockerManager.getContainers();
            const webContainer = containers.find(
                (c) => c.name === `${site.name}_wordpress`
            );
            const dbContainer = containers.find(
                (c) => c.name === `${site.name}_mysql`
            );

            if (webContainer && dbContainer) {
                const webRunning = webContainer.status.includes("Up");
                const dbRunning = dbContainer.status.includes("Up");

                if (webRunning && dbRunning) {
                    site.status = SiteStatus.RUNNING;
                } else {
                    site.status = SiteStatus.STOPPED;
                }
            } else {
                site.status = SiteStatus.STOPPED;
            }
        } catch (error) {
            console.warn(
                `Failed to update status for site ${site.name}:`,
                error
            );
            site.status = SiteStatus.ERROR;
        }
    }

    /**
     * Save site configuration to disk
     */
    private async saveSiteConfig(site: WordPressSite): Promise<void> {
        const configPath = join(site.path, "pressbox.json");
        await fs.writeFile(configPath, JSON.stringify(site, null, 2));
    }

    /**
     * Check if a site exists
     */
    private async siteExists(siteName: string): Promise<boolean> {
        try {
            const sitePath = join(this.sitesPath, siteName);
            await fs.access(sitePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Sanitize site name for file system
     */
    private sanitizeSiteName(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9-_]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
    }

    /**
     * Generate a random password
     */
    private generatePassword(length: number = 16): string {
        const chars =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    /**
     * Find an available port starting from the given port
     */
    private async findAvailablePort(startPort: number): Promise<number> {
        // This is a simplified version - in a real implementation,
        // you'd want to check if ports are actually available
        const usedPorts = Array.from(this.sites.values())
            .map((site) => site.port)
            .filter((port) => port !== undefined);

        let port = startPort;
        while (usedPorts.includes(port)) {
            port++;
        }
        return port;
    }

    /**
     * Copy site files from source to destination
     */
    private async copySiteFiles(
        sourcePath: string,
        destPath: string
    ): Promise<void> {
        // This is a simplified version - you'd want to implement proper file copying
        // For now, we'll create the basic directory structure
        await fs.mkdir(join(destPath, "wordpress"), { recursive: true });
        await fs.mkdir(join(destPath, "database"), { recursive: true });
        await fs.mkdir(join(destPath, "uploads"), { recursive: true });
    }

    /**
     * Sleep for specified milliseconds
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
