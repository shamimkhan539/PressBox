import { LocalServerManager, LocalServerConfig } from "./localServerManager";
import { DockerManager, DockerWordPressConfig } from "./dockerManager";

export type EnvironmentType = "local" | "docker";

export interface EnvironmentConfig {
    type: EnvironmentType;
    preferred: boolean;
    available: boolean;
    description: string;
}

export interface UnifiedSiteConfig extends LocalServerConfig {
    environment: EnvironmentType;
    dockerOptions?: {
        mysqlVersion?: string;
        nginxEnabled?: boolean;
        sslEnabled?: boolean;
        volumes?: string[];
        environment?: Record<string, string>;
    };
}

/**
 * Environment Manager
 *
 * Provides unified interface for managing WordPress sites across
 * both local PHP environment and Docker containers.
 * Automatically detects best environment and handles switching.
 */
export class EnvironmentManager {
    private static instance: EnvironmentManager;
    private localManager: LocalServerManager;
    private dockerManager: DockerManager;
    private currentEnvironment: EnvironmentType = "local";

    private constructor() {
        this.localManager = LocalServerManager.getInstance();
        this.dockerManager = DockerManager.getInstance();
    }

    public static getInstance(): EnvironmentManager {
        if (!EnvironmentManager.instance) {
            EnvironmentManager.instance = new EnvironmentManager();
        }
        return EnvironmentManager.instance;
    }

    /**
     * Initialize both environment managers
     */
    async initialize(): Promise<void> {
        console.log("🔧 Initializing Environment Manager...");

        // Initialize local manager (always available)
        await this.localManager.initialize();

        // Try to initialize Docker manager
        try {
            await this.dockerManager.initialize();
            console.log("✅ Both Local and Docker environments available");
        } catch (error) {
            console.log(
                "⚠️  Docker not available, using Local environment only"
            );
        }

        // Determine best environment
        await this.detectBestEnvironment();
    }

    /**
     * Detect and set the best available environment
     */
    private async detectBestEnvironment(): Promise<void> {
        const capabilities = await this.getEnvironmentCapabilities();

        if (capabilities.docker.available && capabilities.docker.preferred) {
            this.currentEnvironment = "docker";
            console.log("🐳 Using Docker environment as preferred");
        } else {
            this.currentEnvironment = "local";
            console.log("🖥️ Using Local environment as preferred");
        }
    }

    /**
     * Get capabilities of all environments
     */
    async getEnvironmentCapabilities(): Promise<
        Record<EnvironmentType, EnvironmentConfig>
    > {
        const dockerRunning = await this.dockerManager.isDockerRunning();
        const localPHP = await this.localManager.detectPHP();

        return {
            local: {
                type: "local",
                available: localPHP.available,
                preferred: !dockerRunning || !localPHP.available,
                description: localPHP.available
                    ? `Local PHP ${localPHP.version} + Built-in Server`
                    : "Local PHP not available - install PHP or use Portable PHP",
            },
            docker: {
                type: "docker",
                available: dockerRunning,
                preferred: dockerRunning,
                description: dockerRunning
                    ? "Docker containers with WordPress + MySQL + Nginx"
                    : "Docker not available - install Docker Desktop",
            },
        };
    }

    /**
     * Create WordPress site using the specified or best environment
     */
    async createSite(config: UnifiedSiteConfig): Promise<boolean> {
        const targetEnvironment = config.environment || this.currentEnvironment;

        console.log(
            `🚀 Creating WordPress site in ${targetEnvironment} environment`
        );

        try {
            if (targetEnvironment === "docker") {
                return await this.createDockerSite(config);
            } else {
                return await this.createLocalSite(config);
            }
        } catch (error) {
            console.error(
                `❌ Failed to create site in ${targetEnvironment} environment:`,
                error
            );

            // Fallback to alternative environment
            const fallbackEnvironment =
                targetEnvironment === "docker" ? "local" : "docker";
            console.log(
                `🔄 Attempting fallback to ${fallbackEnvironment} environment`
            );

            try {
                if (fallbackEnvironment === "docker") {
                    return await this.createDockerSite(config);
                } else {
                    return await this.createLocalSite(config);
                }
            } catch (fallbackError) {
                console.error(`❌ Fallback also failed:`, fallbackError);
                const errorMsg =
                    error instanceof Error ? error.message : "Unknown error";
                throw new Error(
                    `Failed to create site in both environments: ${errorMsg}`
                );
            }
        }
    }

    /**
     * Create site using Docker environment
     */
    private async createDockerSite(
        config: UnifiedSiteConfig
    ): Promise<boolean> {
        const dockerConfig: DockerWordPressConfig = {
            ...config,
            mysqlVersion: config.dockerOptions?.mysqlVersion || "8.0",
            nginxEnabled: config.dockerOptions?.nginxEnabled || false,
            sslEnabled: config.dockerOptions?.sslEnabled || false,
            volumes: config.dockerOptions?.volumes || [],
            environment: config.dockerOptions?.environment || {},
        };

        return await this.dockerManager.createWordPressSite(dockerConfig);
    }

    /**
     * Create site using local environment
     */
    private async createLocalSite(config: UnifiedSiteConfig): Promise<boolean> {
        return await this.localManager.createSite(config);
    }

    /**
     * Start a WordPress site
     */
    async startSite(
        siteName: string,
        environment?: EnvironmentType
    ): Promise<boolean> {
        const targetEnv =
            environment || (await this.detectSiteEnvironment(siteName));

        if (targetEnv === "docker") {
            return await this.dockerManager.startSite(siteName);
        } else {
            const server = await this.localManager.startSite(siteName);
            return server !== null;
        }
    }

    /**
     * Stop a WordPress site
     */
    async stopSite(
        siteName: string,
        environment?: EnvironmentType
    ): Promise<boolean> {
        const targetEnv =
            environment || (await this.detectSiteEnvironment(siteName));

        if (targetEnv === "docker") {
            return await this.dockerManager.stopSite(siteName);
        } else {
            return await this.localManager.stopSite(siteName);
        }
    }

    /**
     * Delete a WordPress site
     */
    async deleteSite(
        siteName: string,
        environment?: EnvironmentType
    ): Promise<boolean> {
        const targetEnv =
            environment || (await this.detectSiteEnvironment(siteName));

        try {
            if (targetEnv === "docker") {
                await this.dockerManager.cleanupSite(siteName);
                return true;
            } else {
                return await this.localManager.deleteSite(siteName);
            }
        } catch (error) {
            console.error(`Failed to delete site ${siteName}:`, error);
            return false;
        }
    }

    /**
     * Get all WordPress sites from both environments
     */
    async getAllSites(): Promise<
        Array<{
            name: string;
            environment: EnvironmentType;
            status: string;
            url: string;
            config: any;
        }>
    > {
        const sites: any[] = [];

        try {
            // Get local sites
            const localSites = await this.localManager.getSites();
            sites.push(
                ...localSites.map((site) => ({
                    ...site,
                    environment: "local" as EnvironmentType,
                }))
            );
        } catch (error) {
            console.error("Failed to get local sites:", error);
        }

        try {
            // Get Docker sites
            const dockerSites = await this.dockerManager.getSites();
            sites.push(
                ...dockerSites.map((site) => ({
                    ...site,
                    environment: "docker" as EnvironmentType,
                }))
            );
        } catch (error) {
            console.error("Failed to get Docker sites:", error);
        }

        return sites;
    }

    /**
     * Detect which environment a site is running in
     */
    private async detectSiteEnvironment(
        siteName: string
    ): Promise<EnvironmentType> {
        // Check Docker first
        try {
            const dockerSites = await this.dockerManager.getSites();
            if (dockerSites.some((site) => site.name === siteName)) {
                return "docker";
            }
        } catch (error) {
            // Docker not available or error
        }

        // Default to local
        return "local";
    }

    /**
     * Switch primary environment preference
     */
    async switchEnvironment(environment: EnvironmentType): Promise<boolean> {
        const capabilities = await this.getEnvironmentCapabilities();

        if (!capabilities[environment].available) {
            throw new Error(`${environment} environment is not available`);
        }

        this.currentEnvironment = environment;
        console.log(`🔄 Switched to ${environment} environment`);
        return true;
    }

    /**
     * Get current environment status
     */
    getCurrentEnvironment(): EnvironmentType {
        return this.currentEnvironment;
    }

    /**
     * Migrate a site between environments
     */
    async migrateSite(
        siteName: string,
        fromEnvironment: EnvironmentType,
        toEnvironment: EnvironmentType
    ): Promise<boolean> {
        console.log(
            `🚚 Migrating site ${siteName} from ${fromEnvironment} to ${toEnvironment}`
        );

        try {
            // Export site data from source environment
            const siteData = await this.exportSiteData(
                siteName,
                fromEnvironment
            );

            // Create site in target environment
            const migrated = await this.createSite({
                ...siteData.config,
                environment: toEnvironment,
            });

            if (migrated) {
                // Import data to new environment
                await this.importSiteData(siteName, siteData, toEnvironment);

                // Optionally remove from source environment
                // await this.deleteSite(siteName, fromEnvironment);

                console.log(
                    `✅ Successfully migrated ${siteName} to ${toEnvironment}`
                );
                return true;
            }

            return false;
        } catch (error) {
            console.error(`❌ Failed to migrate site ${siteName}:`, error);
            return false;
        }
    }

    /**
     * Export site data for migration
     */
    private async exportSiteData(
        siteName: string,
        environment: EnvironmentType
    ): Promise<any> {
        // Implementation depends on the specific environment
        // This would export WordPress files, database, configurations
        throw new Error(
            "Site migration not yet implemented - coming in next update"
        );
    }

    /**
     * Import site data after migration
     */
    private async importSiteData(
        siteName: string,
        siteData: any,
        environment: EnvironmentType
    ): Promise<void> {
        // Implementation depends on the specific environment
        // This would import WordPress files, database, configurations
        throw new Error(
            "Site migration not yet implemented - coming in next update"
        );
    }
}
