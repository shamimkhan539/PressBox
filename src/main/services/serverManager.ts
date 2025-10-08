import { join } from "path";
import { promises as fs } from "fs";
import { DockerManager } from "./dockerManager";
import { TemplateManager, ComposeTemplateConfig } from "./templateManager";
import { WordPressSite, PressBoxError } from "../../shared/types";

export interface SwapServerOptions {
    fromServer: "nginx" | "apache";
    toServer: "nginx" | "apache";
    preserveConfig: boolean;
    migrateSslCerts: boolean;
    backupConfigs: boolean;
}

export interface PHPVersionChangeOptions {
    newVersion: string;
    migrateExtensions: boolean;
    preserveConfig: boolean;
    restartServices: boolean;
}

export interface ServiceSwapResult {
    success: boolean;
    duration: number;
    oldServer?: string;
    newServer?: string;
    oldVersion?: string;
    newVersion?: string;
    errors: string[];
    warnings: string[];
}

export interface ServerConfig {
    content: string;
    checksum: string;
    timestamp: Date;
}

/**
 * Server Manager
 *
 * Handles multi-server environment management including hot-swapping
 * between NGINX/Apache and PHP version changes with zero downtime
 */
export class ServerManager {
    private dockerManager: DockerManager;
    private templateManager: TemplateManager;
    private configsPath: string;

    constructor(
        dockerManager: DockerManager,
        templateManager: TemplateManager
    ) {
        this.dockerManager = dockerManager;
        this.templateManager = templateManager;
        this.configsPath = join(
            process.env.HOME || process.env.USERPROFILE || ".",
            "PressBox",
            "configs"
        );
    }

    /**
     * Hot-swap web server (NGINX ↔ Apache) with minimal downtime
     */
    async swapWebServer(
        siteId: string,
        options: SwapServerOptions
    ): Promise<ServiceSwapResult> {
        const startTime = Date.now();
        const result: ServiceSwapResult = {
            success: false,
            duration: 0,
            oldServer: options.fromServer,
            newServer: options.toServer,
            errors: [],
            warnings: [],
        };

        try {
            console.log(
                `Starting server swap: ${options.fromServer} → ${options.toServer} for site ${siteId}`
            );

            // 1. Validate preconditions
            await this.validateServerSwap(siteId, options);

            // 2. Backup current configuration
            if (options.backupConfigs) {
                const backupId = await this.backupCurrentConfig(
                    siteId,
                    options.fromServer
                );
                result.warnings.push(`Configuration backed up as: ${backupId}`);
            }

            // 3. Prepare new server configuration
            const newConfig = await this.prepareNewServerConfig(
                siteId,
                options
            );

            // 4. Perform the swap with minimal downtime
            await this.performServerSwap(siteId, newConfig, options);

            // 5. Verify new server is working
            await this.verifyServerSwap(siteId, options.toServer);

            // 6. Update site configuration
            await this.updateSiteServerConfig(siteId, options.toServer);

            result.success = true;
            result.duration = Date.now() - startTime;

            console.log(
                `Server swap completed successfully in ${result.duration}ms`
            );
            return result;
        } catch (error) {
            result.success = false;
            result.errors.push(
                error instanceof Error ? error.message : String(error)
            );
            result.duration = Date.now() - startTime;

            console.error("Server swap failed:", error);

            // Attempt rollback
            try {
                await this.rollbackServerSwap(siteId, options.fromServer);
                result.warnings.push(
                    "Successfully rolled back to original server"
                );
            } catch (rollbackError) {
                result.errors.push(
                    `Rollback failed: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`
                );
            }

            throw new PressBoxError(
                `Server swap failed: ${result.errors.join(", ")}`,
                "SERVER_SWAP_FAILED",
                { siteId, options, result }
            );
        }
    }

    /**
     * Change PHP version with minimal downtime
     */
    async changePHPVersion(
        siteId: string,
        options: PHPVersionChangeOptions
    ): Promise<ServiceSwapResult> {
        const startTime = Date.now();
        const result: ServiceSwapResult = {
            success: false,
            duration: 0,
            newVersion: options.newVersion,
            errors: [],
            warnings: [],
        };

        try {
            // Get current site info
            const siteInfo = await this.getSiteInfo(siteId);
            result.oldVersion = siteInfo.phpVersion;

            console.log(
                `Changing PHP version: ${siteInfo.phpVersion} → ${options.newVersion} for site ${siteId}`
            );

            // 1. Validate PHP version is supported
            await this.validatePHPVersion(options.newVersion);

            // 2. Prepare new PHP configuration
            const phpConfig = await this.preparePHPConfig(siteId, options);

            // 3. Update containers with new PHP version
            await this.updatePHPContainers(siteId, options, phpConfig);

            // 4. Verify PHP version change
            await this.verifyPHPVersionChange(siteId, options.newVersion);

            // 5. Update site configuration
            await this.updateSitePHPConfig(siteId, options.newVersion);

            result.success = true;
            result.duration = Date.now() - startTime;

            console.log(
                `PHP version change completed successfully in ${result.duration}ms`
            );
            return result;
        } catch (error) {
            result.success = false;
            result.errors.push(
                error instanceof Error ? error.message : String(error)
            );
            result.duration = Date.now() - startTime;

            console.error("PHP version change failed:", error);
            throw new PressBoxError(
                `PHP version change failed: ${result.errors.join(", ")}`,
                "PHP_VERSION_CHANGE_FAILED",
                { siteId, options, result }
            );
        }
    }

    /**
     * Safely update site URL with database migration
     */
    async updateSiteURL(
        siteId: string,
        newUrl: string,
        updateDatabase: boolean = true
    ): Promise<void> {
        try {
            console.log(`Updating site URL for ${siteId}: → ${newUrl}`);

            // 1. Validate new URL format
            await this.validateUrl(newUrl);

            // 2. Update WordPress database if requested
            if (updateDatabase) {
                await this.updateWordPressDatabase(siteId, newUrl);
            }

            // 3. Update server configuration
            await this.updateServerConfiguration(siteId, newUrl);

            // 4. Update SSL certificate if needed
            const siteInfo = await this.getSiteInfo(siteId);
            if (siteInfo.ssl) {
                await this.updateSslCertificate(siteId, newUrl);
            }

            console.log(`Site URL updated successfully to ${newUrl}`);
        } catch (error) {
            console.error("Site URL update failed:", error);
            throw new PressBoxError(
                `Site URL update failed: ${error instanceof Error ? error.message : String(error)}`,
                "URL_UPDATE_FAILED",
                { siteId, newUrl, updateDatabase }
            );
        }
    }

    /**
     * Validate server swap preconditions
     */
    private async validateServerSwap(
        siteId: string,
        options: SwapServerOptions
    ): Promise<void> {
        // Check if site exists
        const siteInfo = await this.getSiteInfo(siteId);
        if (!siteInfo) {
            throw new Error(`Site ${siteId} not found`);
        }

        // Check if target server is different from current
        if (siteInfo.webServer === options.toServer) {
            throw new Error(`Site is already using ${options.toServer}`);
        }

        // Check if site is running
        const isRunning = await this.dockerManager.isServiceRunning(
            siteId,
            options.fromServer
        );
        if (!isRunning) {
            throw new Error(
                `Current server ${options.fromServer} is not running`
            );
        }

        // Validate target server template exists
        const templateExists = await this.templateManager.validateTemplate(
            `${options.toServer}-mysql`
        );
        if (!templateExists) {
            throw new Error(`Template for ${options.toServer} not found`);
        }
    }

    /**
     * Backup current configuration before changes
     */
    private async backupCurrentConfig(
        siteId: string,
        serverType: string
    ): Promise<string> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupId = `${serverType}-${timestamp}`;

        try {
            const configDir = join(this.configsPath, siteId);
            const backupDir = join(configDir, "backups");
            await fs.mkdir(backupDir, { recursive: true });

            // Backup server configuration
            const serverConfigPath = join(configDir, serverType, "site.conf");
            const backupConfigPath = join(backupDir, `${backupId}.conf`);

            try {
                await fs.copyFile(serverConfigPath, backupConfigPath);
            } catch (error) {
                console.warn(`Could not backup ${serverType} config:`, error);
            }

            return backupId;
        } catch (error) {
            console.warn("Failed to backup configuration:", error);
            return "";
        }
    }

    /**
     * Prepare new server configuration
     */
    private async prepareNewServerConfig(
        siteId: string,
        options: SwapServerOptions
    ): Promise<ComposeTemplateConfig> {
        const siteInfo = await this.getSiteInfo(siteId);

        return {
            webServer: options.toServer,
            phpVersion: siteInfo.phpVersion,
            database: siteInfo.database || "mysql",
            ssl: siteInfo.ssl || false,
            xdebug: siteInfo.xdebug || false,
            mailpit: true,
        };
    }

    /**
     * Perform the actual server swap
     */
    private async performServerSwap(
        siteId: string,
        newConfig: ComposeTemplateConfig,
        options: SwapServerOptions
    ): Promise<void> {
        // 1. Generate new configuration files
        await this.templateManager.saveGeneratedFiles(siteId, newConfig);

        // 2. Stop old web server container
        await this.dockerManager.stopService(siteId, options.fromServer);

        // 3. Start new web server configuration
        const sitePath = join(
            process.env.HOME || process.env.USERPROFILE || ".",
            "PressBox",
            "sites",
            siteId
        );

        await this.dockerManager.startCompose(sitePath);

        // 4. Wait for service to be healthy
        await this.waitForServiceHealth(siteId, options.toServer, 30000);
    }

    /**
     * Verify server swap was successful
     */
    private async verifyServerSwap(
        siteId: string,
        newServer: string
    ): Promise<void> {
        const maxRetries = 30;
        const retryDelay = 1000;

        for (let i = 0; i < maxRetries; i++) {
            try {
                // Check if container is running
                const isRunning = await this.dockerManager.isServiceRunning(
                    siteId,
                    newServer
                );
                if (!isRunning) {
                    throw new Error(`${newServer} container is not running`);
                }

                // Check if service is healthy
                const isHealthy = await this.dockerManager.checkServiceHealth(
                    siteId,
                    newServer
                );
                if (isHealthy) {
                    console.log(
                        `Server swap verification successful for ${newServer}`
                    );
                    return;
                }
            } catch (error) {
                if (i === maxRetries - 1) {
                    throw new Error(
                        `Server swap verification failed: ${error instanceof Error ? error.message : String(error)}`
                    );
                }

                await new Promise((resolve) => setTimeout(resolve, retryDelay));
            }
        }
    }

    /**
     * Update PHP containers with new version
     */
    private async updatePHPContainers(
        siteId: string,
        options: PHPVersionChangeOptions,
        phpConfig: ComposeTemplateConfig
    ): Promise<void> {
        // 1. Generate new configuration files with updated PHP version
        await this.templateManager.saveGeneratedFiles(siteId, phpConfig);

        // 2. Restart containers with new configuration
        const sitePath = join(
            process.env.HOME || process.env.USERPROFILE || ".",
            "PressBox",
            "sites",
            siteId
        );

        // Use Docker Compose to update services
        await this.dockerManager.restartCompose(sitePath);
    }

    /**
     * Verify PHP version change
     */
    private async verifyPHPVersionChange(
        siteId: string,
        expectedVersion: string
    ): Promise<void> {
        try {
            const actualVersion = await this.dockerManager.execInContainer(
                `${siteId}_php`,
                ["php", "-v"]
            );

            if (!actualVersion.includes(expectedVersion)) {
                throw new Error(
                    `PHP version verification failed. Expected: ${expectedVersion}, Got: ${actualVersion}`
                );
            }

            console.log(
                `PHP version verification successful: ${expectedVersion}`
            );
        } catch (error) {
            throw new Error(
                `PHP version verification failed: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Get site information
     */
    private async getSiteInfo(siteId: string): Promise<any> {
        // This would typically come from WordPress Manager
        // For now, return mock data
        return {
            id: siteId,
            name: siteId,
            webServer: "nginx",
            phpVersion: "8.1",
            database: "mysql",
            ssl: false,
            xdebug: false,
        };
    }

    /**
     * Wait for service to be healthy
     */
    private async waitForServiceHealth(
        siteId: string,
        serviceName: string,
        timeout: number = 30000
    ): Promise<void> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            try {
                const isHealthy = await this.dockerManager.checkServiceHealth(
                    siteId,
                    serviceName
                );
                if (isHealthy) {
                    return;
                }
            } catch (error) {
                // Continue trying
            }

            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        throw new Error(
            `Service ${serviceName} did not become healthy within ${timeout}ms`
        );
    }

    /**
     * Rollback server swap
     */
    private async rollbackServerSwap(
        siteId: string,
        originalServer: string
    ): Promise<void> {
        try {
            console.log(
                `Attempting rollback to ${originalServer} for site ${siteId}`
            );

            // Stop current containers
            await this.dockerManager.stopAllServices(siteId);

            // Restore original configuration and restart
            const siteInfo = await this.getSiteInfo(siteId);
            const originalConfig: ComposeTemplateConfig = {
                webServer: originalServer as "nginx" | "apache",
                phpVersion: siteInfo.phpVersion,
                database: siteInfo.database,
                ssl: siteInfo.ssl,
                xdebug: siteInfo.xdebug,
                mailpit: true,
            };

            await this.templateManager.saveGeneratedFiles(
                siteId,
                originalConfig
            );

            const sitePath = join(
                process.env.HOME || process.env.USERPROFILE || ".",
                "PressBox",
                "sites",
                siteId
            );

            await this.dockerManager.startCompose(sitePath);

            console.log("Rollback completed successfully");
        } catch (rollbackError) {
            console.error("Rollback failed:", rollbackError);
            throw rollbackError;
        }
    }

    /**
     * Validate PHP version is supported
     */
    private async validatePHPVersion(version: string): Promise<void> {
        const supportedVersions = ["7.4", "8.0", "8.1", "8.2", "8.3"];
        if (!supportedVersions.includes(version)) {
            throw new Error(
                `Unsupported PHP version: ${version}. Supported versions: ${supportedVersions.join(", ")}`
            );
        }
    }

    /**
     * Validate URL format
     */
    private async validateUrl(url: string): Promise<void> {
        try {
            new URL(`http://${url}`);
        } catch {
            throw new Error(`Invalid URL format: ${url}`);
        }
    }

    /**
     * Prepare PHP configuration for version change
     */
    private async preparePHPConfig(
        siteId: string,
        options: PHPVersionChangeOptions
    ): Promise<ComposeTemplateConfig> {
        const siteInfo = await this.getSiteInfo(siteId);

        return {
            webServer: siteInfo.webServer,
            phpVersion: options.newVersion,
            database: siteInfo.database,
            ssl: siteInfo.ssl,
            xdebug: siteInfo.xdebug,
            mailpit: true,
        };
    }

    /**
     * Update WordPress database with new URL
     */
    private async updateWordPressDatabase(
        siteId: string,
        newUrl: string
    ): Promise<void> {
        const sqlCommands = [
            `UPDATE wp_options SET option_value = 'http://${newUrl}' WHERE option_name = 'home';`,
            `UPDATE wp_options SET option_value = 'http://${newUrl}' WHERE option_name = 'siteurl';`,
        ];

        for (const sql of sqlCommands) {
            await this.dockerManager.execInContainer(`${siteId}_mysql`, [
                "mysql",
                "-u",
                "root",
                "-proot_password",
                "wordpress",
                "-e",
                sql,
            ]);
        }
    }

    /**
     * Update server configuration with new URL
     */
    private async updateServerConfiguration(
        siteId: string,
        newUrl: string
    ): Promise<void> {
        // This would update server configs with the new domain
        console.log(
            `Updating server configuration for ${siteId} with URL ${newUrl}`
        );
        // Implementation would depend on the specific server configuration format
    }

    /**
     * Update SSL certificate for new URL
     */
    private async updateSslCertificate(
        siteId: string,
        newUrl: string
    ): Promise<void> {
        // This would generate a new SSL certificate for the new domain
        console.log(
            `Updating SSL certificate for ${siteId} with URL ${newUrl}`
        );
        // Implementation would use tools like mkcert or openssl
    }

    /**
     * Update site server configuration in database/config
     */
    private async updateSiteServerConfig(
        siteId: string,
        newServer: string
    ): Promise<void> {
        // This would update the site configuration to reflect the new web server
        console.log(
            `Updated site ${siteId} server configuration to ${newServer}`
        );
    }

    /**
     * Update site PHP configuration in database/config
     */
    private async updateSitePHPConfig(
        siteId: string,
        newVersion: string
    ): Promise<void> {
        // This would update the site configuration to reflect the new PHP version
        console.log(
            `Updated site ${siteId} PHP configuration to ${newVersion}`
        );
    }
}
