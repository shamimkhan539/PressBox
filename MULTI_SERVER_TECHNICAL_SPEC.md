# 🔧 Multi-Server Environment Technical Specification

## Overview

This document provides the detailed technical specification for implementing multi-server support in PressBox, allowing users to hot-swap between NGINX and Apache web servers, switch PHP versions, and manage advanced configurations.

---

## 🏗️ Architecture Overview

### Current State

- Single Docker container per WordPress site
- Basic WordPress + MySQL setup
- Limited configuration options

### Target State

- Multi-service Docker Compose orchestration
- Hot-swappable web servers (NGINX ↔ Apache)
- Multiple PHP versions with zero-downtime switching
- Advanced configuration management
- Service-specific logging and monitoring

---

## 📁 File Structure

```
src/main/services/
├── serverManager.ts          # New: Multi-server management
├── configManager.ts          # New: Configuration file management
├── templateManager.ts        # New: Docker Compose template engine
└── serviceMonitor.ts         # New: Service health monitoring

src/main/templates/           # New directory
├── docker-compose/
│   ├── nginx-mysql.yml      # NGINX + PHP + MySQL
│   ├── apache-mysql.yml     # Apache + PHP + MySQL
│   ├── nginx-mariadb.yml    # NGINX + PHP + MariaDB
│   └── apache-mariadb.yml   # Apache + PHP + MariaDB
├── configs/
│   ├── nginx/
│   │   ├── default.conf     # Default NGINX configuration
│   │   └── ssl.conf         # SSL-enabled NGINX config
│   ├── apache/
│   │   ├── default.conf     # Default Apache virtualhost
│   │   └── ssl.conf         # SSL-enabled Apache config
│   ├── php/
│   │   ├── php7.4.ini       # PHP 7.4 configuration
│   │   ├── php8.0.ini       # PHP 8.0 configuration
│   │   ├── php8.1.ini       # PHP 8.1 configuration
│   │   └── xdebug.ini       # Xdebug configuration
│   └── mysql/
│       └── custom.cnf       # MySQL custom configuration
```

---

## 🐳 Docker Compose Templates

### NGINX Template (`nginx-mysql.yml`)

```yaml
version: "3.8"

services:
    nginx:
        image: nginx:alpine
        container_name: "${SITE_ID}_nginx"
        ports:
            - "${HTTP_PORT}:80"
            - "${HTTPS_PORT}:443"
        volumes:
            - "${SITE_PATH}:/var/www/html"
            - "${CONFIG_PATH}/nginx/site.conf:/etc/nginx/conf.d/default.conf"
            - "${SSL_PATH}:/etc/nginx/ssl"
            - "${LOGS_PATH}/nginx:/var/log/nginx"
        depends_on:
            - php
            - mysql
        networks:
            - pressbox-network
        labels:
            - "pressbox.site=${SITE_ID}"
            - "pressbox.service=nginx"

    php:
        image: "pressbox/php:${PHP_VERSION}-fpm"
        container_name: "${SITE_ID}_php"
        volumes:
            - "${SITE_PATH}:/var/www/html"
            - "${CONFIG_PATH}/php/php.ini:/usr/local/etc/php/php.ini"
            - "${CONFIG_PATH}/php/www.conf:/usr/local/etc/php-fpm.d/www.conf"
            - "${LOGS_PATH}/php:/var/log/php"
        environment:
            - WORDPRESS_DB_HOST=mysql:3306
            - WORDPRESS_DB_NAME=${DB_NAME}
            - WORDPRESS_DB_USER=${DB_USER}
            - WORDPRESS_DB_PASSWORD=${DB_PASSWORD}
            - XDEBUG_MODE=${XDEBUG_MODE:-off}
            - XDEBUG_CONFIG=client_host=host.docker.internal client_port=9003
        networks:
            - pressbox-network
        labels:
            - "pressbox.site=${SITE_ID}"
            - "pressbox.service=php"

    mysql:
        image: "mysql:${MYSQL_VERSION}"
        container_name: "${SITE_ID}_mysql"
        environment:
            MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
            MYSQL_DATABASE: ${DB_NAME}
            MYSQL_USER: ${DB_USER}
            MYSQL_PASSWORD: ${DB_PASSWORD}
        volumes:
            - "${DATA_PATH}/mysql:/var/lib/mysql"
            - "${CONFIG_PATH}/mysql/custom.cnf:/etc/mysql/conf.d/custom.cnf"
            - "${LOGS_PATH}/mysql:/var/log/mysql"
        ports:
            - "${MYSQL_PORT}:3306"
        networks:
            - pressbox-network
        labels:
            - "pressbox.site=${SITE_ID}"
            - "pressbox.service=mysql"

    adminer:
        image: adminer:latest
        container_name: "${SITE_ID}_adminer"
        ports:
            - "${ADMINER_PORT}:8080"
        environment:
            ADMINER_DEFAULT_SERVER: mysql
        depends_on:
            - mysql
        networks:
            - pressbox-network
        labels:
            - "pressbox.site=${SITE_ID}"
            - "pressbox.service=adminer"

networks:
    pressbox-network:
        external: true
```

### Apache Template (`apache-mysql.yml`)

```yaml
version: "3.8"

services:
    apache:
        image: pressbox/apache-php:${PHP_VERSION}
        container_name: "${SITE_ID}_apache"
        ports:
            - "${HTTP_PORT}:80"
            - "${HTTPS_PORT}:443"
        volumes:
            - "${SITE_PATH}:/var/www/html"
            - "${CONFIG_PATH}/apache/site.conf:/etc/apache2/sites-available/000-default.conf"
            - "${CONFIG_PATH}/php/php.ini:/usr/local/etc/php/php.ini"
            - "${SSL_PATH}:/etc/apache2/ssl"
            - "${LOGS_PATH}/apache:/var/log/apache2"
        environment:
            - WORDPRESS_DB_HOST=mysql:3306
            - WORDPRESS_DB_NAME=${DB_NAME}
            - WORDPRESS_DB_USER=${DB_USER}
            - WORDPRESS_DB_PASSWORD=${DB_PASSWORD}
            - XDEBUG_MODE=${XDEBUG_MODE:-off}
            - XDEBUG_CONFIG=client_host=host.docker.internal client_port=9003
        depends_on:
            - mysql
        networks:
            - pressbox-network
        labels:
            - "pressbox.site=${SITE_ID}"
            - "pressbox.service=apache"

    mysql:
        # Same as NGINX template

    adminer:
        # Same as NGINX template

networks:
    pressbox-network:
        external: true
```

---

## 💻 Core Service Implementation

### ServerManager Class

```typescript
// src/main/services/serverManager.ts
import { join } from "path";
import { promises as fs } from "fs";
import { DockerManager } from "./dockerManager";
import { ConfigManager } from "./configManager";
import { TemplateManager } from "./templateManager";
import {
    WordPressSite,
    ServerConfig,
    ServiceSwapResult,
} from "../../shared/types";

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

export class ServerManager {
    private dockerManager: DockerManager;
    private configManager: ConfigManager;
    private templateManager: TemplateManager;

    constructor(
        dockerManager: DockerManager,
        configManager: ConfigManager,
        templateManager: TemplateManager
    ) {
        this.dockerManager = dockerManager;
        this.configManager = configManager;
        this.templateManager = templateManager;
    }

    /**
     * Hot-swap web server (NGINX ↔ Apache) with zero downtime
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

            // 1. Validate site exists and is running
            const site = await this.validateSiteForSwap(siteId);

            // 2. Backup current configuration
            if (options.backupConfigs) {
                await this.backupCurrentConfig(site, options.fromServer);
            }

            // 3. Prepare new server configuration
            const newConfig = await this.prepareNewServerConfig(site, options);

            // 4. Perform the swap with minimal downtime
            await this.performServerSwap(site, newConfig, options);

            // 5. Migrate configurations if requested
            if (options.preserveConfig) {
                await this.migrateServerConfiguration(site, options);
            }

            // 6. Migrate SSL certificates
            if (options.migrateSslCerts) {
                await this.migrateSslCertificates(site, options);
            }

            // 7. Verify new server is working
            await this.verifyServerSwap(site, options.toServer);

            result.success = true;
            result.duration = Date.now() - startTime;

            console.log(
                `Server swap completed successfully in ${result.duration}ms`
            );
            return result;
        } catch (error) {
            result.success = false;
            result.errors.push(error.message);
            result.duration = Date.now() - startTime;

            console.error("Server swap failed:", error);

            // Attempt rollback
            await this.rollbackServerSwap(siteId, options.fromServer, error);

            throw error;
        }
    }

    /**
     * Change PHP version with zero downtime
     */
    async changePHPVersion(
        siteId: string,
        options: PHPVersionChangeOptions
    ): Promise<ServiceSwapResult> {
        const startTime = Date.now();
        const result: ServiceSwapResult = {
            success: false,
            duration: 0,
            oldVersion: "", // Will be set from current site config
            newVersion: options.newVersion,
            errors: [],
            warnings: [],
        };

        try {
            const site = await this.validateSiteForPHPChange(siteId);
            result.oldVersion = site.phpVersion;

            console.log(
                `Changing PHP version: ${site.phpVersion} → ${options.newVersion} for site ${siteId}`
            );

            // 1. Validate PHP version is supported
            await this.validatePHPVersion(options.newVersion);

            // 2. Prepare new PHP configuration
            const phpConfig = await this.preparePHPConfig(site, options);

            // 3. Update PHP service with rolling update
            await this.updatePHPService(site, options, phpConfig);

            // 4. Migrate PHP extensions if requested
            if (options.migrateExtensions) {
                await this.migratePHPExtensions(
                    site,
                    result.oldVersion,
                    options.newVersion
                );
            }

            // 5. Verify PHP version change
            await this.verifyPHPVersionChange(site, options.newVersion);

            result.success = true;
            result.duration = Date.now() - startTime;

            console.log(
                `PHP version change completed successfully in ${result.duration}ms`
            );
            return result;
        } catch (error) {
            result.success = false;
            result.errors.push(error.message);
            result.duration = Date.now() - startTime;

            console.error("PHP version change failed:", error);
            throw error;
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
        const site = await this.validateSiteExists(siteId);

        try {
            console.log(
                `Updating site URL: ${site.url} → ${newUrl} for site ${siteId}`
            );

            // 1. Validate new URL format
            await this.validateUrl(newUrl);

            // 2. Update WordPress database if requested
            if (updateDatabase) {
                await this.updateWordPressDatabase(site, newUrl);
            }

            // 3. Update site configuration
            await this.updateSiteConfig(siteId, { url: newUrl });

            // 4. Update proxy/server configuration
            await this.updateProxyConfiguration(site, newUrl);

            // 5. Update SSL certificate if needed
            if (site.ssl) {
                await this.updateSslCertificate(site, newUrl);
            }

            console.log(`Site URL updated successfully to ${newUrl}`);
        } catch (error) {
            console.error("Site URL update failed:", error);
            throw error;
        }
    }

    /**
     * Perform the actual server swap with minimal downtime
     */
    private async performServerSwap(
        site: WordPressSite,
        newConfig: ServerConfig,
        options: SwapServerOptions
    ): Promise<void> {
        // 1. Generate new Docker Compose configuration
        const composeConfig = await this.templateManager.generateCompose(
            site.id,
            {
                webServer: options.toServer,
                phpVersion: site.phpVersion,
                database: site.database,
                ssl: site.ssl,
            }
        );

        // 2. Write new configuration files
        await this.configManager.writeServerConfig(
            site.id,
            options.toServer,
            newConfig
        );

        // 3. Stop old web server container
        await this.dockerManager.stopService(site.id, options.fromServer);

        // 4. Start new web server container
        await this.dockerManager.startServices(site.id, composeConfig);

        // 5. Wait for health check
        await this.waitForServiceHealth(site.id, options.toServer);
    }

    /**
     * Update PHP service with rolling deployment
     */
    private async updatePHPService(
        site: WordPressSite,
        options: PHPVersionChangeOptions,
        phpConfig: any
    ): Promise<void> {
        const newImage = `pressbox/php:${options.newVersion}-fpm`;

        // 1. Pull new PHP image
        await this.dockerManager.pullImage(newImage);

        // 2. Update PHP configuration
        await this.configManager.writePHPConfig(
            site.id,
            options.newVersion,
            phpConfig
        );

        // 3. Update service with new image
        await this.dockerManager.updateService(site.id, "php", {
            image: newImage,
            restartPolicy: "unless-stopped",
        });

        // 4. Wait for PHP-FPM to be ready
        await this.waitForPHPReady(site.id, options.newVersion);
    }

    /**
     * Migrate server configuration between NGINX and Apache
     */
    private async migrateServerConfiguration(
        site: WordPressSite,
        options: SwapServerOptions
    ): Promise<void> {
        const converter = new ServerConfigConverter();

        // Get old configuration
        const oldConfig = await this.configManager.getServerConfig(
            site.id,
            options.fromServer
        );

        // Convert configuration format
        const newConfig = await converter.convert(
            oldConfig,
            options.fromServer,
            options.toServer
        );

        // Apply converted configuration
        await this.configManager.writeServerConfig(
            site.id,
            options.toServer,
            newConfig
        );
    }

    /**
     * Verify server swap was successful
     */
    private async verifyServerSwap(
        site: WordPressSite,
        newServer: string
    ): Promise<void> {
        const maxRetries = 30;
        const retryDelay = 1000; // 1 second

        for (let i = 0; i < maxRetries; i++) {
            try {
                // Check if container is running
                const isRunning = await this.dockerManager.isServiceRunning(
                    site.id,
                    newServer
                );
                if (!isRunning) {
                    throw new Error(`${newServer} container is not running`);
                }

                // Check if WordPress is responding
                const response = await fetch(`http://localhost:${site.port}`);
                if (response.ok) {
                    console.log(
                        `Server swap verification successful for ${newServer}`
                    );
                    return;
                }
            } catch (error) {
                if (i === maxRetries - 1) {
                    throw new Error(
                        `Server swap verification failed: ${error.message}`
                    );
                }

                await new Promise((resolve) => setTimeout(resolve, retryDelay));
            }
        }
    }

    /**
     * Rollback server swap in case of failure
     */
    private async rollbackServerSwap(
        siteId: string,
        originalServer: string,
        error: Error
    ): Promise<void> {
        try {
            console.log(
                `Attempting rollback to ${originalServer} for site ${siteId}`
            );

            // Stop new server
            await this.dockerManager.stopAllServices(siteId);

            // Start original server
            await this.dockerManager.startService(siteId, originalServer);

            console.log(`Rollback completed successfully`);
        } catch (rollbackError) {
            console.error("Rollback failed:", rollbackError);
            throw new Error(
                `Server swap failed and rollback failed: ${error.message}. Rollback error: ${rollbackError.message}`
            );
        }
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
}
```

---

## 🔧 Configuration Management

### ConfigManager Class

```typescript
// src/main/services/configManager.ts
import { join } from "path";
import { promises as fs } from "fs";

export class ConfigManager {
    private configsPath: string;

    constructor() {
        this.configsPath = join(
            process.env.HOME || process.env.USERPROFILE || ".",
            "PressBox",
            "configs"
        );
    }

    /**
     * Get server configuration for a site
     */
    async getServerConfig(
        siteId: string,
        serverType: "nginx" | "apache"
    ): Promise<string> {
        const configPath = join(this.configsPath, siteId, `${serverType}.conf`);
        try {
            return await fs.readFile(configPath, "utf-8");
        } catch (error) {
            // Return default configuration if none exists
            return await this.getDefaultServerConfig(serverType);
        }
    }

    /**
     * Write server configuration for a site
     */
    async writeServerConfig(
        siteId: string,
        serverType: "nginx" | "apache",
        config: string
    ): Promise<void> {
        const configDir = join(this.configsPath, siteId);
        await fs.mkdir(configDir, { recursive: true });

        const configPath = join(configDir, `${serverType}.conf`);
        await fs.writeFile(configPath, config);
    }

    /**
     * Get PHP configuration for a site and version
     */
    async getPHPConfig(siteId: string, phpVersion: string): Promise<string> {
        const configPath = join(
            this.configsPath,
            siteId,
            `php-${phpVersion}.ini`
        );
        try {
            return await fs.readFile(configPath, "utf-8");
        } catch (error) {
            return await this.getDefaultPHPConfig(phpVersion);
        }
    }

    /**
     * Write PHP configuration
     */
    async writePHPConfig(
        siteId: string,
        phpVersion: string,
        config: string
    ): Promise<void> {
        const configDir = join(this.configsPath, siteId);
        await fs.mkdir(configDir, { recursive: true });

        const configPath = join(configDir, `php-${phpVersion}.ini`);
        await fs.writeFile(configPath, config);
    }

    /**
     * Backup configuration before changes
     */
    async backupConfig(
        siteId: string,
        configType: string,
        identifier: string
    ): Promise<string> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupId = `${configType}-${identifier}-${timestamp}`;

        const backupDir = join(this.configsPath, siteId, "backups");
        await fs.mkdir(backupDir, { recursive: true });

        const originalPath = join(
            this.configsPath,
            siteId,
            `${configType}.conf`
        );
        const backupPath = join(backupDir, `${backupId}.conf`);

        try {
            await fs.copyFile(originalPath, backupPath);
            return backupId;
        } catch (error) {
            console.warn(`Could not backup ${configType} config:`, error);
            return "";
        }
    }

    /**
     * Get default NGINX configuration
     */
    private async getDefaultServerConfig(
        serverType: "nginx" | "apache"
    ): Promise<string> {
        const templatePath = join(
            __dirname,
            "..",
            "templates",
            "configs",
            serverType,
            "default.conf"
        );
        return await fs.readFile(templatePath, "utf-8");
    }

    /**
     * Get default PHP configuration for version
     */
    private async getDefaultPHPConfig(phpVersion: string): Promise<string> {
        const templatePath = join(
            __dirname,
            "..",
            "templates",
            "configs",
            "php",
            `php${phpVersion}.ini`
        );
        try {
            return await fs.readFile(templatePath, "utf-8");
        } catch (error) {
            // Fallback to generic PHP config
            const genericPath = join(
                __dirname,
                "..",
                "templates",
                "configs",
                "php",
                "php.ini"
            );
            return await fs.readFile(genericPath, "utf-8");
        }
    }
}
```

---

## 🎨 UI Components

### Server Management Panel

```typescript
// src/renderer/components/ServerManagementPanel.tsx
import React, { useState, useEffect } from 'react';
import { WordPressSite, ServerSwapResult } from '../../shared/types';

interface ServerManagementPanelProps {
    site: WordPressSite;
    onServerChange: (result: ServerSwapResult) => void;
}

export const ServerManagementPanel: React.FC<ServerManagementPanelProps> = ({
    site,
    onServerChange
}) => {
    const [isSwapping, setIsSwapping] = useState(false);
    const [swapProgress, setSwapProgress] = useState('');
    const [availablePhpVersions] = useState(['7.4', '8.0', '8.1', '8.2', '8.3']);

    const handleServerSwap = async (targetServer: 'nginx' | 'apache') => {
        if (targetServer === site.webServer) return;

        setIsSwapping(true);
        setSwapProgress('Preparing server swap...');

        try {
            const options = {
                fromServer: site.webServer,
                toServer: targetServer,
                preserveConfig: true,
                migrateSslCerts: true,
                backupConfigs: true
            };

            const result = await window.electronAPI.swapWebServer(site.id, options);
            onServerChange(result);

            setSwapProgress(`Successfully switched to ${targetServer.toUpperCase()}`);

        } catch (error) {
            setSwapProgress(`Error: ${error.message}`);
        } finally {
            setIsSwapping(false);
        }
    };

    const handlePHPVersionChange = async (newVersion: string) => {
        if (newVersion === site.phpVersion) return;

        setIsSwapping(true);
        setSwapProgress(`Changing PHP version to ${newVersion}...`);

        try {
            const options = {
                newVersion,
                migrateExtensions: true,
                preserveConfig: true,
                restartServices: true
            };

            const result = await window.electronAPI.changePHPVersion(site.id, options);
            onServerChange(result);

            setSwapProgress(`Successfully changed to PHP ${newVersion}`);

        } catch (error) {
            setSwapProgress(`Error: ${error.message}`);
        } finally {
            setIsSwapping(false);
        }
    };

    return (
        <div className="server-management-panel bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Server Configuration</h3>

            {/* Web Server Selection */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Web Server</label>
                <div className="flex space-x-4">
                    <button
                        className={`px-4 py-2 rounded-lg border ${
                            site.webServer === 'nginx'
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                        }`}
                        onClick={() => handleServerSwap('nginx')}
                        disabled={isSwapping || site.webServer === 'nginx'}
                    >
                        NGINX
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg border ${
                            site.webServer === 'apache'
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                        }`}
                        onClick={() => handleServerSwap('apache')}
                        disabled={isSwapping || site.webServer === 'apache'}
                    >
                        Apache
                    </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                    Current: {site.webServer.toUpperCase()}
                    {isSwapping && site.webServer !== 'nginx' && site.webServer !== 'apache' &&
                        ' (switching...)'
                    }
                </p>
            </div>

            {/* PHP Version Selection */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">PHP Version</label>
                <select
                    value={site.phpVersion}
                    onChange={(e) => handlePHPVersionChange(e.target.value)}
                    disabled={isSwapping}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    {availablePhpVersions.map(version => (
                        <option key={version} value={version}>
                            PHP {version}
                        </option>
                    ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                    Includes Opcache and Xdebug support
                </p>
            </div>

            {/* Progress Indicator */}
            {isSwapping && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                        <span className="text-sm text-blue-700">{swapProgress}</span>
                    </div>
                </div>
            )}

            {/* Advanced Configuration */}
            <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Advanced Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
                        disabled={isSwapping}
                    >
                        Edit Config Files
                    </button>
                    <button
                        className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
                        disabled={isSwapping}
                    >
                        View Logs
                    </button>
                </div>
            </div>
        </div>
    );
};
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// tests/services/serverManager.test.ts
import { ServerManager } from "../../src/main/services/serverManager";
import { MockDockerManager } from "../mocks/dockerManager";

describe("ServerManager", () => {
    let serverManager: ServerManager;
    let mockDockerManager: MockDockerManager;

    beforeEach(() => {
        mockDockerManager = new MockDockerManager();
        serverManager = new ServerManager(mockDockerManager);
    });

    describe("swapWebServer", () => {
        it("should swap from nginx to apache successfully", async () => {
            const siteId = "test-site";
            const options = {
                fromServer: "nginx" as const,
                toServer: "apache" as const,
                preserveConfig: true,
                migrateSslCerts: true,
                backupConfigs: true,
            };

            mockDockerManager.mockServiceRunning(siteId, "nginx", true);
            mockDockerManager.mockServiceRunning(siteId, "apache", true);

            const result = await serverManager.swapWebServer(siteId, options);

            expect(result.success).toBe(true);
            expect(result.oldServer).toBe("nginx");
            expect(result.newServer).toBe("apache");
            expect(result.duration).toBeGreaterThan(0);
        });

        it("should handle swap failure and rollback", async () => {
            const siteId = "test-site";
            const options = {
                fromServer: "nginx" as const,
                toServer: "apache" as const,
                preserveConfig: true,
                migrateSslCerts: true,
                backupConfigs: true,
            };

            mockDockerManager.mockServiceFailure(siteId, "apache");

            await expect(
                serverManager.swapWebServer(siteId, options)
            ).rejects.toThrow();

            // Verify rollback occurred
            expect(mockDockerManager.isServiceRunning(siteId, "nginx")).toBe(
                true
            );
        });
    });

    describe("changePHPVersion", () => {
        it("should change PHP version successfully", async () => {
            const siteId = "test-site";
            const options = {
                newVersion: "8.1",
                migrateExtensions: true,
                preserveConfig: true,
                restartServices: true,
            };

            const result = await serverManager.changePHPVersion(
                siteId,
                options
            );

            expect(result.success).toBe(true);
            expect(result.newVersion).toBe("8.1");
        });
    });
});
```

---

## 📊 Performance Metrics

### Target Performance

- **Server Swap Time**: < 30 seconds
- **PHP Version Change**: < 15 seconds
- **Configuration Update**: < 5 seconds
- **Service Health Check**: < 3 seconds
- **Zero Downtime**: 99.9% success rate

### Monitoring

- Container resource usage
- Service response times
- Error rates and rollback frequency
- User action completion times

---

This technical specification provides a comprehensive foundation for implementing multi-server support in PressBox, enabling users to have the same level of flexibility and control as LocalWP while maintaining PressBox's open-source, cross-platform advantages.
