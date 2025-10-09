import { join, basename } from "path";
import { promises as fs } from "fs";
import { v4 as uuidv4 } from "uuid";
import { spawn, ChildProcess } from "child_process";
import { DockerManager } from "./dockerManager";
import { LocalServerManager } from "./localServerManager";
import { HostsFileService } from "./hostsFileService";
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
    private useDocker: boolean = false;

    constructor(dockerManager: DockerManager) {
        this.dockerManager = dockerManager;
        this.localServerManager = new LocalServerManager();
        this.sitesPath = join(
            process.env.HOME || process.env.USERPROFILE || ".",
            "PressBox",
            "sites"
        );
        this.initialize();
    }

    /**
     * Initialize the WordPress manager
     */
    private async initialize(): Promise<void> {
        try {
            // Ensure sites directory exists
            await fs.mkdir(this.sitesPath, { recursive: true });

            // Check if Docker is available, otherwise use local server
            try {
                await this.dockerManager.initialize();
                this.useDocker = true;
                console.log("Using Docker for WordPress environments");
            } catch (error) {
                console.log("Docker not available, using local server manager");
                this.useDocker = false;
                await this.localServerManager.initialize();
            }

            // Load existing sites
            await this.loadSites();

            console.log(
                `WordPress Manager initialized with ${this.sites.size} sites (${this.useDocker ? "Docker" : "Local"} mode)`
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
     * Get all WordPress sites
     */
    async getSites(): Promise<WordPressSite[]> {
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
            // Generate site configuration
            const siteId = uuidv4();
            const siteName = this.sanitizeSiteName(request.name);
            const domain = request.domain || `${siteName}.local`;
            const sitePath = join(this.sitesPath, siteName);

            // Check if site already exists
            if (await this.siteExists(siteName)) {
                throw new SiteError(
                    `Site with name '${siteName}' already exists`
                );
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
                url: domain, // Set url same as domain for backward compatibility
                path: sitePath,
                phpVersion: request.phpVersion,
                wordPressVersion: config.wordPressVersion || "latest",
                webServer: config.webServer,
                database: "mysql", // Default to MySQL
                status: SiteStatus.STOPPED,
                ssl: config.ssl,
                multisite: config.multisite,
                xdebug: false, // Default Xdebug off
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

            // Register domain in hosts file
            try {
                await HostsFileService.addHostEntry({
                    ip: "127.0.0.1",
                    hostname: domain,
                    comment: `PressBox WordPress Site - ${siteName} (Site ID: ${siteId})`,
                    isWordPress: true,
                    siteId: siteId,
                });
                console.log(`Registered domain ${domain} in hosts file`);
            } catch (error) {
                console.warn(
                    `Failed to register domain ${domain} in hosts file:`,
                    error
                );
                // Don't fail site creation if hosts file registration fails
            }

            // Store site in memory
            this.sites.set(siteId, site);

            console.log(`Created new WordPress site: ${siteName}`);
            return site;
        } catch (error) {
            throw new SiteError(
                `Failed to create site '${request.name}'`,
                error
            );
        }
    }

    /**
     * Start a WordPress site
     */
    async startSite(siteId: string): Promise<void> {
        const site = this.sites.get(siteId);
        if (!site) {
            throw new SiteError(`Site with ID '${siteId}' not found`);
        }

        try {
            site.status = SiteStatus.STARTING;
            await this.saveSiteConfig(site);

            if (this.useDocker) {
                // Start database container first
                await this.dockerManager.startContainer(`${site.name}_db`);

                // Wait a bit for database to be ready
                await this.sleep(3000);

                // Start web container
                await this.dockerManager.startContainer(`${site.name}_web`);
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

            console.log(`Started WordPress site: ${site.name}`);
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
        const site = this.sites.get(siteId);
        if (!site) {
            throw new SiteError(`Site with ID '${siteId}' not found`);
        }

        try {
            site.status = SiteStatus.STOPPING;
            await this.saveSiteConfig(site);

            if (this.useDocker) {
                // Stop web container first
                await this.dockerManager.stopContainer(`${site.name}_web`);

                // Stop database container
                await this.dockerManager.stopContainer(`${site.name}_db`);
            } else {
                // Stop local server
                await this.localServerManager.stopSite(site.name);
            }

            site.status = SiteStatus.STOPPED;
            await this.saveSiteConfig(site);

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
            await this.dockerManager.removeContainer(`${site.name}_web`, true);
            await this.dockerManager.removeContainer(`${site.name}_db`, true);

            // Remove site directory
            await fs.rmdir(site.path, { recursive: true });

            // Remove domain from hosts file
            try {
                await HostsFileService.removeHostEntry(site.domain);
                console.log(`Removed domain ${site.domain} from hosts file`);
            } catch (error) {
                console.warn(
                    `Failed to remove domain ${site.domain} from hosts file:`,
                    error
                );
                // Don't fail site deletion if hosts file cleanup fails
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
            const localConfig = {
                siteName: site.name,
                domain: site.domain,
                port: await this.findAvailablePort(8080),
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
            // Create database container
            await this.dockerManager.createContainer({
                name: `${name}_db`,
                image: "mysql:8.0",
                environment: [
                    `MYSQL_ROOT_PASSWORD=${config.dbRootPassword}`,
                    `MYSQL_DATABASE=${config.dbName}`,
                    `MYSQL_USER=${config.dbUser}`,
                    `MYSQL_PASSWORD=${config.dbPassword}`,
                ],
                volumes: [`${site.path}/database:/var/lib/mysql`],
                labels: {
                    "pressbox.site": name,
                    "pressbox.service": "database",
                },
            });

            // Determine available port for web server
            const webPort = await this.findAvailablePort(8000);
            site.port = webPort;

            // Create web container
            await this.dockerManager.createContainer({
                name: `${name}_web`,
                image: `wordpress:php${config.phpVersion}-fpm-alpine`,
                ports: {
                    "80/tcp": [{ HostPort: webPort.toString() }],
                },
                environment: [
                    `WORDPRESS_DB_HOST=${name}_db:3306`,
                    `WORDPRESS_DB_NAME=${config.dbName}`,
                    `WORDPRESS_DB_USER=${config.dbUser}`,
                    `WORDPRESS_DB_PASSWORD=${config.dbPassword}`,
                    "WORDPRESS_DEBUG=1",
                ],
                volumes: [
                    `${site.path}/wordpress:/var/www/html`,
                    `${site.path}/uploads:/var/www/html/wp-content/uploads`,
                ],
                labels: {
                    "pressbox.site": name,
                    "pressbox.service": "web",
                },
            });

            // Update site config with port
            await this.saveSiteConfig(site);
        } catch (error) {
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
                (c) => c.name === `${site.name}_web`
            );
            const dbContainer = containers.find(
                (c) => c.name === `${site.name}_db`
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
