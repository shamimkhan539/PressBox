import { ipcMain, dialog, shell, app } from "electron";
import Store from "electron-store";
import { WordPressManager } from "../services/wordpressManager";
import { DockerManager } from "../services/dockerManager";
import { PluginManager } from "../services/pluginManager";
import { BlueprintManager } from "../services/blueprintManager";
import { HostsFileService } from "../services/hostsFileService";
import { AdminChecker } from "../services/adminChecker";
import { PortablePHPManager } from "../services/portablePHPManager";
import { WPCLIManager } from "../services/wpCliManager";
import { EnvironmentManager } from "../services/environmentManager";
import { NonAdminMode } from "../services/nonAdminMode";
import { CreateSiteRequest } from "../../shared/types";
import { databaseService } from "../services/databaseService";
import { databaseBrowserService } from "../services/databaseBrowserService";
import { DatabaseServerManager } from "../services/databaseServerManager";
import * as path from "path";
import * as fs from "fs";

/**
 * IPC Handlers
 *
 * Handles all Inter-Process Communication between the main and renderer processes.
 * Provides secure access to system resources and services.
 */
export class IPCHandlers {
    constructor(
        private wordpressManager: WordPressManager,
        private dockerManager: DockerManager,
        private pluginManager: PluginManager,
        private blueprintManager: BlueprintManager,
        private environmentManager: EnvironmentManager,
        private store: Store
    ) {
        console.log("🔧 IPCHandlers constructor called");
        console.log(
            "📝 WordPressManager:",
            this.wordpressManager ? "initialized" : "null"
        );

        // Initialize database server manager
        this.databaseServerManager = new DatabaseServerManager();
    }

    private databaseServerManager: DatabaseServerManager;

    /**
     * Register all IPC handlers
     */
    registerHandlers(): void {
        console.log("🚀 Starting IPC handler registration...");
        this.registerSiteHandlers();
        this.registerDockerHandlers();
        this.registerPluginHandlers();
        this.registerBlueprintHandlers();
        this.registerSettingsHandlers();
        this.registerFileSystemHandlers();
        this.registerFileHandlers();
        this.registerSystemHandlers();
        this.registerServerHandlers();
        this.registerNonAdminHandlers();
        this.registerDatabaseHandlers();

        // Only register hosts file handlers if non-admin mode is disabled
        if (!NonAdminMode.isEnabled()) {
            console.log("🔒 Registering hosts file handlers (admin mode)");
            this.registerHostsFileHandlers();
        } else {
            console.log("🔓 Skipping hosts file handlers (non-admin mode)");
        }

        this.registerEnvironmentHandlers();
        console.log("✅ All IPC handlers registered");
    }

    /**
     * Register Non-Admin Mode IPC handlers
     * Note: Non-admin handlers are now registered in registerSettingsHandlers()
     */
    registerNonAdminHandlers(): void {
        // Handlers moved to registerSettingsHandlers to avoid duplication
        console.log("✅ Non-admin handlers registered via settings handlers");
    }

    /**
     * Register WordPress site management handlers
     */
    private registerSiteHandlers(): void {
        ipcMain.handle("sites:list", async () => {
            try {
                return await this.wordpressManager.getSites();
            } catch (error) {
                console.error("Failed to list sites:", error);
                throw error;
            }
        });

        ipcMain.handle("sites:create", async (_, config: CreateSiteRequest) => {
            try {
                console.log(
                    "🔥 IPC Handler: sites:create called with config:",
                    config
                );
                console.log(
                    "🔥 WordPressManager instance:",
                    this.wordpressManager ? "available" : "null"
                );
                const result = await this.wordpressManager.createSite(config);
                console.log("🔥 Site creation result:", result);
                return result;
            } catch (error) {
                console.error("❌ Failed to create site:", error);
                throw error;
            }
        });

        ipcMain.handle("sites:start", async (_, siteId: string) => {
            try {
                await this.wordpressManager.startSite(siteId);
                return { success: true };
            } catch (error) {
                console.error("Failed to start site:", error);
                throw error;
            }
        });

        ipcMain.handle("sites:stop", async (_, siteId: string) => {
            try {
                await this.wordpressManager.stopSite(siteId);
                return { success: true };
            } catch (error) {
                console.error("Failed to stop site:", error);
                throw error;
            }
        });

        ipcMain.handle("sites:delete", async (_, siteId: string) => {
            try {
                console.log(`🗑️  Attempting to delete site: ${siteId}`);
                await this.wordpressManager.deleteSite(siteId);
                console.log(`✅ Site deleted successfully: ${siteId}`);
                return { success: true };
            } catch (error) {
                console.error("❌ Failed to delete site:", error);
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred";
                throw new Error(`Failed to delete site: ${errorMessage}`);
            }
        });

        ipcMain.handle(
            "sites:clone",
            async (_, siteId: string, newName: string) => {
                try {
                    return await this.wordpressManager.cloneSite(
                        siteId,
                        newName
                    );
                } catch (error) {
                    console.error("Failed to clone site:", error);
                    throw error;
                }
            }
        );

        ipcMain.handle(
            "sites:export",
            async (_, siteId: string, exportPath: string) => {
                try {
                    // Implementation would depend on export requirements
                    console.log(`Exporting site ${siteId} to ${exportPath}`);
                } catch (error) {
                    console.error("Failed to export site:", error);
                    throw error;
                }
            }
        );

        ipcMain.handle("sites:import", async (_, importPath: string) => {
            try {
                // Implementation would depend on import requirements
                console.log(`Importing site from ${importPath}`);
                return null;
            } catch (error) {
                console.error("Failed to import site:", error);
                throw error;
            }
        });

        ipcMain.handle("sites:logs", async (_, siteId: string) => {
            try {
                return await this.wordpressManager.getSiteLogs(siteId);
            } catch (error) {
                console.error("Failed to get site logs:", error);
                throw error;
            }
        });

        ipcMain.handle("sites:open-vscode", async (_, siteId: string) => {
            try {
                const site = await this.wordpressManager.getSite(siteId);
                if (site) {
                    await shell.openPath(site.path);
                }
            } catch (error) {
                console.error("Failed to open site in VS Code:", error);
                throw error;
            }
        });

        ipcMain.handle("sites:open-browser", async (_, siteId: string) => {
            try {
                const site = await this.wordpressManager.getSite(siteId);
                if (site) {
                    // Try custom domain first, then fallback to localhost
                    let siteUrl = site.url;

                    if (!siteUrl && site.domain) {
                        siteUrl = `http://${site.domain}`;
                    }

                    if (!siteUrl && site.port) {
                        siteUrl = `http://localhost:${site.port}`;
                    }

                    if (siteUrl) {
                        console.log(`Opening site ${site.name} at ${siteUrl}`);
                        await shell.openExternal(siteUrl);
                    } else {
                        throw new Error(
                            `No URL available for site ${site.name}`
                        );
                    }
                }
            } catch (error) {
                console.error("Failed to open site in browser:", error);
                throw error;
            }
        });
    }

    /**
     * Register Docker management handlers
     */
    private registerDockerHandlers(): void {
        ipcMain.handle("docker:is-installed", async () => {
            try {
                return await this.dockerManager.isDockerRunning();
            } catch (error) {
                return false;
            }
        });

        ipcMain.handle("docker:is-running", async () => {
            try {
                return await this.dockerManager.isDockerRunning();
            } catch (error) {
                return false;
            }
        });

        ipcMain.handle("docker:get-images", async () => {
            try {
                return await this.dockerManager.getImages();
            } catch (error) {
                console.error("Failed to get Docker images:", error);
                throw error;
            }
        });

        ipcMain.handle("docker:pull-image", async (_, image: string) => {
            try {
                await this.dockerManager.pullImage(image);
            } catch (error) {
                console.error("Failed to pull Docker image:", error);
                throw error;
            }
        });

        ipcMain.handle("docker:get-containers", async () => {
            try {
                return await this.dockerManager.getContainers();
            } catch (error) {
                console.error("Failed to get Docker containers:", error);
                throw error;
            }
        });
    }

    /**
     * Register plugin system handlers
     */
    private registerPluginHandlers(): void {
        ipcMain.handle("plugins:list", async () => {
            try {
                return this.pluginManager.getPlugins();
            } catch (error) {
                console.error("Failed to list plugins:", error);
                throw error;
            }
        });

        ipcMain.handle("plugins:install", async (_, pluginPath: string) => {
            try {
                await this.pluginManager.installPlugin(pluginPath);
            } catch (error) {
                console.error("Failed to install plugin:", error);
                throw error;
            }
        });

        ipcMain.handle("plugins:uninstall", async (_, pluginId: string) => {
            try {
                await this.pluginManager.uninstallPlugin(pluginId);
            } catch (error) {
                console.error("Failed to uninstall plugin:", error);
                throw error;
            }
        });

        ipcMain.handle("plugins:enable", async (_, pluginId: string) => {
            try {
                await this.pluginManager.enablePlugin(pluginId);
            } catch (error) {
                console.error("Failed to enable plugin:", error);
                throw error;
            }
        });

        ipcMain.handle("plugins:disable", async (_, pluginId: string) => {
            try {
                await this.pluginManager.disablePlugin(pluginId);
            } catch (error) {
                console.error("Failed to disable plugin:", error);
                throw error;
            }
        });

        ipcMain.handle("plugins:get-settings", async (_, pluginId: string) => {
            try {
                return (this.store as any).get(
                    `plugins.${pluginId}.settings`,
                    {}
                );
            } catch (error) {
                console.error("Failed to get plugin settings:", error);
                throw error;
            }
        });

        ipcMain.handle(
            "plugins:update-settings",
            async (_, pluginId: string, settings: any) => {
                try {
                    (this.store as any).set(
                        `plugins.${pluginId}.settings`,
                        settings
                    );
                } catch (error) {
                    console.error("Failed to update plugin settings:", error);
                    throw error;
                }
            }
        );
    }

    /**
     * Register blueprint system handlers
     */
    private registerBlueprintHandlers(): void {
        ipcMain.handle("blueprints:get-all", async () => {
            try {
                return this.blueprintManager.getAllBlueprints();
            } catch (error) {
                console.error("Failed to get blueprints:", error);
                throw error;
            }
        });

        ipcMain.handle(
            "blueprints:get-by-category",
            async (_, category: string) => {
                try {
                    return this.blueprintManager.getBlueprintsByCategory(
                        category as any
                    );
                } catch (error) {
                    console.error(
                        "Failed to get blueprints by category:",
                        error
                    );
                    throw error;
                }
            }
        );

        ipcMain.handle("blueprints:get", async (_, blueprintId: string) => {
            try {
                return this.blueprintManager.getBlueprint(blueprintId);
            } catch (error) {
                console.error("Failed to get blueprint:", error);
                throw error;
            }
        });

        ipcMain.handle(
            "blueprints:create-site",
            async (_, blueprintId: string, config: any) => {
                try {
                    return await this.blueprintManager.createSiteFromBlueprint(
                        blueprintId,
                        config
                    );
                } catch (error) {
                    console.error(
                        "Failed to create site from blueprint:",
                        error
                    );
                    throw error;
                }
            }
        );

        ipcMain.handle("blueprints:save-custom", async (_, blueprint: any) => {
            try {
                return await this.blueprintManager.saveCustomBlueprint(
                    blueprint
                );
            } catch (error) {
                console.error("Failed to save custom blueprint:", error);
                throw error;
            }
        });

        ipcMain.handle(
            "blueprints:delete-custom",
            async (_, blueprintId: string) => {
                try {
                    return await this.blueprintManager.deleteCustomBlueprint(
                        blueprintId
                    );
                } catch (error) {
                    console.error("Failed to delete custom blueprint:", error);
                    throw error;
                }
            }
        );
    }

    /**
     * Register application settings handlers
     */
    private registerSettingsHandlers(): void {
        ipcMain.handle("settings:get", async (_, key: string) => {
            try {
                return (this.store as any).get(key);
            } catch (error) {
                console.error("Failed to get setting:", error);
                throw error;
            }
        });

        ipcMain.handle("settings:set", async (_, key: string, value: any) => {
            try {
                (this.store as any).set(key, value);
            } catch (error) {
                console.error("Failed to set setting:", error);
                throw error;
            }
        });

        ipcMain.handle("settings:get-all", async () => {
            try {
                return (this.store as any).store;
            } catch (error) {
                console.error("Failed to get all settings:", error);
                throw error;
            }
        });

        ipcMain.handle("settings:reset", async () => {
            try {
                (this.store as any).clear();
            } catch (error) {
                console.error("Failed to reset settings:", error);
                throw error;
            }
        });

        // Non-Admin Mode settings handlers
        ipcMain.handle("nonadmin:get-status", async () => {
            try {
                return {
                    enabled: NonAdminMode.isEnabled(),
                    hasUserMadeChoice: NonAdminMode.hasUserMadeChoice(),
                    lastChoice: NonAdminMode.getLastChoice(),
                    explanation: NonAdminMode.getExplanation(),
                };
            } catch (error) {
                console.error("Failed to get non-admin mode status:", error);
                throw error;
            }
        });

        ipcMain.handle("nonadmin:should-prompt-user", async () => {
            try {
                return NonAdminMode.shouldPromptUser();
            } catch (error) {
                console.error("Failed to check if should prompt user:", error);
                throw error;
            }
        });

        ipcMain.handle("nonadmin:enable", async () => {
            try {
                NonAdminMode.enable(this.wordpressManager, true); // Save preference
                console.log("✅ Non-admin mode enabled via IPC");
                return NonAdminMode.getExplanation();
            } catch (error) {
                console.error("Failed to enable non-admin mode:", error);
                throw error;
            }
        });

        ipcMain.handle("nonadmin:disable", async () => {
            try {
                NonAdminMode.disable(this.wordpressManager, true); // Save preference
                console.log("✅ Admin mode enabled via IPC");
                return NonAdminMode.getExplanation();
            } catch (error) {
                console.error("Failed to disable non-admin mode:", error);
                throw error;
            }
        });

        ipcMain.handle("nonadmin:reset-preferences", async () => {
            try {
                NonAdminMode.resetPreferences();
                console.log("✅ Non-admin mode preferences reset via IPC");
                return NonAdminMode.getExplanation();
            } catch (error) {
                console.error(
                    "Failed to reset non-admin mode preferences:",
                    error
                );
                throw error;
            }
        });
    }

    /**
     * Register file system handlers
     */
    private registerFileSystemHandlers(): void {
        ipcMain.handle("fs:select-folder", async () => {
            try {
                const result = await dialog.showOpenDialog({
                    properties: ["openDirectory", "createDirectory"],
                    title: "Select Folder",
                });

                return result.canceled ? null : result.filePaths[0];
            } catch (error) {
                console.error("Failed to select folder:", error);
                throw error;
            }
        });

        ipcMain.handle("fs:select-file", async (_, filters?: any[]) => {
            try {
                const result = await dialog.showOpenDialog({
                    properties: ["openFile"],
                    filters: filters || [
                        { name: "All Files", extensions: ["*"] },
                    ],
                    title: "Select File",
                });

                return result.canceled ? null : result.filePaths[0];
            } catch (error) {
                console.error("Failed to select file:", error);
                throw error;
            }
        });

        ipcMain.handle("fs:open-path", async (_, path: string) => {
            try {
                await shell.openPath(path);
            } catch (error) {
                console.error("Failed to open path:", error);
                throw error;
            }
        });

        ipcMain.handle("fs:exists", async (_, path: string) => {
            try {
                const fs = require("fs").promises;
                await fs.access(path);
                return true;
            } catch {
                return false;
            }
        });

        // Shell operations
        ipcMain.handle("shell:open-external", async (_, url: string) => {
            try {
                await shell.openExternal(url);
                return { success: true };
            } catch (error) {
                console.error("Failed to open external URL:", error);
                return { success: false, error: String(error) };
            }
        });

        ipcMain.handle("shell:open-path", async (_, path: string) => {
            try {
                const result = await shell.openPath(path);
                return { success: !result, error: result || undefined };
            } catch (error) {
                console.error("Failed to open path:", error);
                return { success: false, error: String(error) };
            }
        });
    }

    /**
     * Register system information handlers
     */
    private registerSystemHandlers(): void {
        ipcMain.handle("system:get-version", async () => {
            return app.getVersion();
        });

        ipcMain.handle("system:get-platform", async () => {
            return process.platform;
        });

        ipcMain.handle("system:get-architecture", async () => {
            return process.arch;
        });

        // Admin privilege checking
        ipcMain.handle("system:check-admin", async () => {
            try {
                return await AdminChecker.checkAdminPrivileges();
            } catch (error) {
                console.error("Failed to check admin privileges:", error);
                return {
                    isAdmin: false,
                    canModifyHosts: false,
                    platform: process.platform,
                    error: `Failed to check privileges: ${error}`,
                };
            }
        });

        ipcMain.handle("system:get-elevation-instructions", () => {
            return AdminChecker.getElevationInstructions();
        });

        ipcMain.handle("system:request-elevation", async () => {
            try {
                return await AdminChecker.requestElevation();
            } catch (error) {
                console.error("Failed to request elevation:", error);
                return false;
            }
        });

        // Environment detection
        ipcMain.handle("system:check-docker", async () => {
            try {
                return await this.dockerManager.isDockerRunning();
            } catch (error) {
                return false;
            }
        });

        ipcMain.handle("system:check-php", async () => {
            try {
                // Check system PHP first via LocalServerManager
                const phpInfo = await this.checkSystemPHP();
                if (phpInfo.available) {
                    return {
                        isInstalled: true,
                        version: phpInfo.version,
                        path: phpInfo.path,
                    };
                }

                // Check portable PHP
                const portablePHP = PortablePHPManager.getInstance();
                await portablePHP.initialize();

                if (await portablePHP.isPortablePHPAvailable()) {
                    const testResult = await portablePHP.testPortablePHP();
                    if (testResult.success) {
                        return {
                            isInstalled: true,
                            version: testResult.version || "Unknown",
                            path: portablePHP.getPortablePHPPath() || "",
                        };
                    }
                }

                return { isInstalled: false, version: "", path: "" };
            } catch (error) {
                console.error("Error checking PHP:", error);
                return { isInstalled: false, version: "", path: "" };
            }
        });

        // Portable PHP management
        ipcMain.handle(
            "system:install-portable-php",
            async (_, installPath: string) => {
                try {
                    const portablePHP = PortablePHPManager.getInstance();
                    return await portablePHP.installPortablePHP(installPath);
                } catch (error) {
                    console.error("Error installing portable PHP:", error);
                    return false;
                }
            }
        );

        ipcMain.handle("system:get-php-instructions", async () => {
            const portablePHP = PortablePHPManager.getInstance();
            return portablePHP.getInstallationInstructions();
        });
    }

    /**
     * Check system PHP installation
     */
    private async checkSystemPHP(): Promise<{
        available: boolean;
        version: string;
        path: string;
    }> {
        try {
            const { spawn } = await import("child_process");
            const { promisify } = await import("util");
            const execAsync = promisify(require("child_process").exec);

            const phpCommands = ["php", "php.exe"];

            for (const cmd of phpCommands) {
                try {
                    const { stdout } = await execAsync(`${cmd} --version`);
                    const versionMatch = stdout.match(/PHP (\d+\.\d+\.\d+)/);

                    if (versionMatch) {
                        return {
                            available: true,
                            version: versionMatch[1],
                            path: cmd,
                        };
                    }
                } catch {
                    // Continue to next command
                }
            }

            return { available: false, version: "", path: "" };
        } catch (error) {
            console.error("Error checking system PHP:", error);
            return { available: false, version: "", path: "" };
        }
    }

    /**
     * Register Windows hosts file management handlers
     */
    private registerHostsFileHandlers(): void {
        ipcMain.handle("hosts:list", async () => {
            try {
                // Check if non-admin mode is enabled
                if (NonAdminMode.isEnabled()) {
                    console.log(
                        "🔓 Hosts file access blocked in non-admin mode"
                    );
                    return [];
                }
                return await HostsFileService.readHostsFile();
            } catch (error) {
                console.error("Failed to read hosts file:", error);
                throw error;
            }
        });

        ipcMain.handle(
            "hosts:add",
            async (
                _,
                entry: {
                    ip: string;
                    hostname: string;
                    comment?: string;
                    isWordPress?: boolean;
                    siteId?: string;
                }
            ) => {
                try {
                    // Check if non-admin mode is enabled
                    if (NonAdminMode.isEnabled()) {
                        console.log(
                            "🔓 Hosts file modification blocked in non-admin mode"
                        );
                        return {
                            success: false,
                            error: "Hosts file modification disabled in non-admin mode",
                        };
                    }
                    await HostsFileService.addHostEntry({
                        ip: entry.ip,
                        hostname: entry.hostname,
                        comment: entry.comment || "Added by PressBox",
                        isWordPress: entry.isWordPress || false,
                        siteId: entry.siteId,
                    });
                    return { success: true };
                } catch (error) {
                    console.error("Failed to add hosts entry:", error);
                    throw error;
                }
            }
        );

        ipcMain.handle("hosts:remove", async (_, hostname: string) => {
            try {
                // Check if non-admin mode is enabled
                if (NonAdminMode.isEnabled()) {
                    console.log(
                        "🔓 Hosts file modification blocked in non-admin mode"
                    );
                    return {
                        success: false,
                        error: "Hosts file modification disabled in non-admin mode",
                    };
                }
                await HostsFileService.removeHostEntry(hostname);
                return { success: true };
            } catch (error) {
                console.error("Failed to remove hosts entry:", error);
                throw error;
            }
        });

        ipcMain.handle(
            "hosts:toggle",
            async (_, hostname: string, enabled: boolean) => {
                try {
                    await HostsFileService.toggleHostEntry(hostname, enabled);
                    return { success: true };
                } catch (error) {
                    console.error("Failed to toggle hosts entry:", error);
                    throw error;
                }
            }
        );

        ipcMain.handle(
            "hosts:add-site",
            async (_, siteId: string, hostname: string, ip?: string) => {
                try {
                    await HostsFileService.addWordPressSiteEntry(
                        siteId,
                        hostname,
                        ip
                    );
                    return { success: true };
                } catch (error) {
                    console.error(
                        "Failed to add WordPress site hosts entry:",
                        error
                    );
                    throw error;
                }
            }
        );

        ipcMain.handle("hosts:remove-site", async (_, siteId: string) => {
            try {
                await HostsFileService.removeWordPressSiteEntry(siteId);
                return { success: true };
            } catch (error) {
                console.error(
                    "Failed to remove WordPress site hosts entries:",
                    error
                );
                throw error;
            }
        });

        ipcMain.handle("hosts:backup", async () => {
            try {
                await HostsFileService.ensureBackup();
                return { success: true };
            } catch (error) {
                console.error("Failed to backup hosts file:", error);
                throw error;
            }
        });

        ipcMain.handle("hosts:restore", async () => {
            try {
                await HostsFileService.restoreFromBackup();
                return { success: true };
            } catch (error) {
                console.error("Failed to restore hosts file:", error);
                throw error;
            }
        });

        ipcMain.handle("hosts:check-admin", async () => {
            try {
                return await HostsFileService.checkAdminPrivileges();
            } catch (error) {
                console.error("Failed to check admin privileges:", error);
                return false;
            }
        });

        ipcMain.handle("hosts:stats", async () => {
            try {
                return await HostsFileService.getHostsStats();
            } catch (error) {
                console.error("Failed to get hosts stats:", error);
                throw error;
            }
        });
    }

    /**
     * Register file management handlers
     */
    private registerFileHandlers(): void {
        ipcMain.handle(
            "files:list",
            async (_, options: { siteId: string; path: string }) => {
                try {
                    const sites = await this.wordpressManager.getSites();
                    const site = sites.find((s) => s.id === options.siteId);

                    if (!site) {
                        throw new Error(`Site not found: ${options.siteId}`);
                    }

                    // TODO: Implement actual file listing
                    // For now, return mock file structure
                    const mockFiles = [
                        {
                            name: "wp-config.php",
                            path: "/wp-config.php",
                            type: "file" as const,
                            size: 2048,
                            modified: new Date(),
                            extension: "php",
                        },
                        {
                            name: "wp-content",
                            path: "/wp-content",
                            type: "folder" as const,
                            modified: new Date(),
                        },
                        {
                            name: "wp-admin",
                            path: "/wp-admin",
                            type: "folder" as const,
                            modified: new Date(),
                        },
                        {
                            name: "wp-includes",
                            path: "/wp-includes",
                            type: "folder" as const,
                            modified: new Date(),
                        },
                    ];

                    return { files: mockFiles };
                } catch (error) {
                    console.error("Failed to list files:", error);
                    throw error;
                }
            }
        );

        ipcMain.handle(
            "files:open-editor",
            async (_, options: { siteId: string; filePath: string }) => {
                try {
                    // TODO: Implement file opening in editor
                    console.log(
                        `Opening file ${options.filePath} for site ${options.siteId}`
                    );
                    return { success: true };
                } catch (error) {
                    console.error("Failed to open file in editor:", error);
                    throw error;
                }
            }
        );

        ipcMain.handle(
            "files:create",
            async (
                _,
                options: {
                    siteId: string;
                    path: string;
                    name: string;
                    content?: string;
                }
            ) => {
                try {
                    // TODO: Implement file creation
                    console.log(
                        `Creating file ${options.name} at ${options.path} for site ${options.siteId}`
                    );
                    return { success: true };
                } catch (error) {
                    console.error("Failed to create file:", error);
                    throw error;
                }
            }
        );

        ipcMain.handle(
            "files:create-folder",
            async (
                _,
                options: { siteId: string; path: string; name: string }
            ) => {
                try {
                    // TODO: Implement folder creation
                    console.log(
                        `Creating folder ${options.name} at ${options.path} for site ${options.siteId}`
                    );
                    return { success: true };
                } catch (error) {
                    console.error("Failed to create folder:", error);
                    throw error;
                }
            }
        );

        ipcMain.handle(
            "files:delete",
            async (_, options: { siteId: string; paths: string[] }) => {
                try {
                    // TODO: Implement file/folder deletion
                    console.log(
                        `Deleting files ${options.paths.join(", ")} for site ${options.siteId}`
                    );
                    return { success: true };
                } catch (error) {
                    console.error("Failed to delete files:", error);
                    throw error;
                }
            }
        );

        ipcMain.handle(
            "files:upload",
            async (_, options: { siteId: string; targetPath: string }) => {
                try {
                    // TODO: Implement file upload
                    console.log(
                        `Uploading files to ${options.targetPath} for site ${options.siteId}`
                    );
                    return {
                        success: true,
                        uploadedFiles: ["mock-uploaded-file.txt"],
                    };
                } catch (error) {
                    console.error("Failed to upload files:", error);
                    throw error;
                }
            }
        );
    }

    /**
     * Register server management handlers
     */
    private registerServerHandlers(): void {
        ipcMain.handle(
            "server:get-service-stats",
            async (_, siteId: string, serviceName: string) => {
                try {
                    // Get the site first
                    const sites = await this.wordpressManager.getSites();
                    const site = sites.find((s) => s.id === siteId);

                    if (!site) {
                        throw new Error(`Site not found: ${siteId}`);
                    }

                    // Return mock stats for now - you can implement real stats later
                    const stats = {
                        status: site.status,
                        uptime: site.status === "running" ? "2h 15m" : "0m",
                        memoryUsage:
                            site.status === "running" ? "45.2 MB" : "0 MB",
                        cpuUsage: site.status === "running" ? "2.1%" : "0%",
                        connections: site.status === "running" ? 3 : 0,
                        port: site.port,
                        serviceName: serviceName,
                        lastChecked: new Date().toISOString(),
                    };

                    return stats;
                } catch (error) {
                    console.error("Failed to get service stats:", error);
                    throw error;
                }
            }
        );

        ipcMain.handle(
            "server:swap-web-server",
            async (_, siteId: string, options: any) => {
                try {
                    // For now, return a mock successful response
                    // TODO: Implement actual server swapping logic
                    return {
                        success: true,
                        duration: 2500,
                        fromServer: options.fromServer,
                        toServer: options.toServer,
                        message: `Successfully switched from ${options.fromServer} to ${options.toServer}`,
                    };
                } catch (error) {
                    console.error("Failed to swap web server:", error);
                    return {
                        success: false,
                        errors: [
                            error instanceof Error
                                ? error.message
                                : "Unknown error during server swap",
                        ],
                    };
                }
            }
        );

        ipcMain.handle(
            "server:change-php-version",
            async (_, siteId: string, options: any) => {
                try {
                    // For now, return a mock successful response
                    // TODO: Implement actual PHP version changing logic
                    return {
                        success: true,
                        duration: 3000,
                        oldVersion: "8.2",
                        newVersion: options.newVersion,
                        message: `Successfully changed PHP version to ${options.newVersion}`,
                    };
                } catch (error) {
                    console.error("Failed to change PHP version:", error);
                    return {
                        success: false,
                        errors: [
                            error instanceof Error
                                ? error.message
                                : "Unknown error during PHP version change",
                        ],
                    };
                }
            }
        );

        ipcMain.handle(
            "server:update-site-url",
            async (
                _,
                siteId: string,
                newUrl: string,
                updateDatabase: boolean
            ) => {
                try {
                    // For now, return a mock successful response
                    // TODO: Implement actual site URL updating logic
                    return {
                        success: true,
                        oldUrl: "http://old-site.local:8080",
                        newUrl: newUrl,
                        databaseUpdated: updateDatabase,
                        message: `Successfully updated site URL to ${newUrl}`,
                    };
                } catch (error) {
                    console.error("Failed to update site URL:", error);
                    throw error instanceof Error
                        ? error
                        : new Error("Unknown error during site URL update");
                }
            }
        );
    }

    /**
     * Register environment management handlers
     */
    private registerEnvironmentHandlers(): void {
        // Get environment capabilities
        ipcMain.handle("environment:capabilities", async () => {
            try {
                return await this.environmentManager.getEnvironmentCapabilities();
            } catch (error) {
                console.error("Failed to get environment capabilities:", error);
                throw error;
            }
        });

        // Get current environment
        ipcMain.handle("environment:current", async () => {
            try {
                return this.environmentManager.getCurrentEnvironment();
            } catch (error) {
                console.error("Failed to get current environment:", error);
                throw error;
            }
        });

        // Switch environment
        ipcMain.handle(
            "environment:switch",
            async (_, environment: "local" | "docker") => {
                try {
                    return await this.environmentManager.switchEnvironment(
                        environment
                    );
                } catch (error) {
                    console.error("Failed to switch environment:", error);
                    throw error;
                }
            }
        );

        // Create site with environment selection
        ipcMain.handle("environment:create-site", async (_, config: any) => {
            try {
                return await this.environmentManager.createSite(config);
            } catch (error) {
                console.error("Failed to create site:", error);
                throw error;
            }
        });

        // Start site in appropriate environment
        ipcMain.handle(
            "environment:start-site",
            async (_, siteName: string, environment?: "local" | "docker") => {
                try {
                    return await this.environmentManager.startSite(
                        siteName,
                        environment
                    );
                } catch (error) {
                    console.error("Failed to start site:", error);
                    throw error;
                }
            }
        );

        // Stop site in appropriate environment
        ipcMain.handle(
            "environment:stop-site",
            async (_, siteName: string, environment?: "local" | "docker") => {
                try {
                    return await this.environmentManager.stopSite(
                        siteName,
                        environment
                    );
                } catch (error) {
                    console.error("Failed to stop site:", error);
                    throw error;
                }
            }
        );

        // Delete site from appropriate environment
        ipcMain.handle(
            "environment:delete-site",
            async (_, siteName: string, environment?: "local" | "docker") => {
                try {
                    return await this.environmentManager.deleteSite(
                        siteName,
                        environment
                    );
                } catch (error) {
                    console.error("Failed to delete site:", error);
                    throw error;
                }
            }
        );

        // Get all sites from both environments
        ipcMain.handle("environment:all-sites", async () => {
            try {
                return await this.environmentManager.getAllSites();
            } catch (error) {
                console.error("Failed to get all sites:", error);
                throw error;
            }
        });

        // Migrate site between environments
        ipcMain.handle(
            "environment:migrate-site",
            async (
                _,
                siteName: string,
                fromEnv: "local" | "docker",
                toEnv: "local" | "docker"
            ) => {
                try {
                    return await this.environmentManager.migrateSite(
                        siteName,
                        fromEnv,
                        toEnv
                    );
                } catch (error) {
                    console.error("Failed to migrate site:", error);
                    throw error;
                }
            }
        );
    }

    /**
     * Register Database Browser handlers
     */
    private registerDatabaseHandlers(): void {
        // Test database connection
        ipcMain.handle(
            "database:test-connection",
            async (_, type: string, version: string, port: number) => {
                try {
                    const mysql = await import("mysql2/promise");
                    const connection = await mysql.createConnection({
                        host: "localhost",
                        port: port,
                        user: "root",
                        password: "",
                        connectTimeout: 2000, // 2 second timeout
                    });
                    await connection.end();
                    return true;
                } catch (error) {
                    return false;
                }
            }
        );

        // Get database server statuses
        ipcMain.handle("database-server:get-statuses", async () => {
            try {
                return await this.databaseServerManager.getAllServerStatuses();
            } catch (error) {
                console.error("Failed to get database server statuses:", error);
                throw error;
            }
        });

        // Start database server
        ipcMain.handle("database-server:start", async (_, server: any) => {
            try {
                return await this.databaseServerManager.startServer(server);
            } catch (error) {
                console.error("Failed to start database server:", error);
                throw error;
            }
        });

        // Stop database server
        ipcMain.handle("database-server:stop", async (_, server: any) => {
            try {
                return await this.databaseServerManager.stopServer(server);
            } catch (error) {
                console.error("Failed to stop database server:", error);
                throw error;
            }
        });

        // Initialize database server
        ipcMain.handle("database-server:initialize", async (_, server: any) => {
            try {
                return await this.databaseServerManager.initializeServer(
                    server
                );
            } catch (error) {
                console.error("Failed to initialize database server:", error);
                throw error;
            }
        });

        // Test database connection for diagnostics
        ipcMain.handle(
            "database:test-site-connection",
            async (_, siteName: string) => {
                try {
                    // Get site configuration
                    const sitesPath = path.join(
                        process.env.HOME || process.env.USERPROFILE || "",
                        "PressBox",
                        "sites"
                    );
                    const sitePath = path.join(sitesPath, siteName);
                    const configPath = path.join(
                        sitePath,
                        "pressbox-config.json"
                    );

                    if (!fs.existsSync(configPath)) {
                        return {
                            success: false,
                            error: "Site configuration not found",
                        };
                    }

                    const config = JSON.parse(
                        fs.readFileSync(configPath, "utf-8")
                    );
                    const wpConfigPath = path.join(sitePath, "wp-config.php");

                    if (!fs.existsSync(wpConfigPath)) {
                        return {
                            success: false,
                            error: "wp-config.php not found",
                        };
                    }

                    // Check database type from wp-config.php
                    const wpConfig = fs.readFileSync(wpConfigPath, "utf-8");
                    const isSQLite =
                        wpConfig.includes("DB_ENGINE") &&
                        wpConfig.includes("'sqlite'");

                    if (isSQLite) {
                        // Check SQLite database file
                        const dbDir = path.join(
                            sitePath,
                            "wp-content",
                            "database"
                        );
                        const dbFile = path.join(dbDir, ".ht.sqlite");

                        if (!fs.existsSync(dbDir)) {
                            return {
                                success: false,
                                error: "SQLite database directory not found",
                            };
                        }

                        if (!fs.existsSync(dbFile)) {
                            return {
                                success: false,
                                error: "SQLite database file not found",
                            };
                        }

                        // Try to access SQLite database
                        try {
                            let sqlite3: any = null;
                            let sqlite: any = null;

                            try {
                                sqlite3 = require("sqlite3");
                                sqlite = require("sqlite");
                            } catch (importError) {
                                // SQLite packages not available
                            }

                            if (!sqlite3 || !sqlite) {
                                return {
                                    success: false,
                                    error: "SQLite dependencies not available for diagnostics",
                                };
                            }

                            const db = await sqlite.open({
                                filename: dbFile,
                                driver: sqlite3.Database,
                            });
                            await db.close();
                            return {
                                success: true,
                                type: "sqlite",
                                message: "SQLite database accessible",
                            };
                        } catch (sqliteError: any) {
                            return {
                                success: false,
                                error: `SQLite database error: ${sqliteError.message}`,
                            };
                        }
                    } else {
                        // Test MySQL/MariaDB connection
                        const dbType = config.database || "mysql";
                        const port = dbType === "mysql" ? 3306 : 3307;

                        try {
                            const mysql = await import("mysql2/promise");
                            const connection = await mysql.createConnection({
                                host: "localhost",
                                port: port,
                                user: "root",
                                password: "",
                                database: config.dbName || `${siteName}_db`,
                                connectTimeout: 5000,
                            });
                            await connection.end();
                            return {
                                success: true,
                                type: dbType,
                                message: `${dbType.toUpperCase()} connection successful`,
                            };
                        } catch (mysqlError: any) {
                            return {
                                success: false,
                                error: `${dbType.toUpperCase()} connection failed: ${mysqlError.message}`,
                            };
                        }
                    }
                } catch (error: any) {
                    return {
                        success: false,
                        error: `Diagnostic error: ${error.message}`,
                    };
                }
            }
        );

        // Get list of tables
        ipcMain.handle("database:get-tables", async (_, siteName: string) => {
            try {
                return databaseService.getTables(siteName);
            } catch (error) {
                console.error("Failed to get tables:", error);
                throw error;
            }
        });

        // Get table schema
        ipcMain.handle(
            "database:get-schema",
            async (_, siteName: string, tableName: string) => {
                try {
                    return databaseService.getTableSchema(siteName, tableName);
                } catch (error) {
                    console.error("Failed to get table schema:", error);
                    throw error;
                }
            }
        );

        // Get table indexes
        ipcMain.handle(
            "database:get-indexes",
            async (_, siteName: string, tableName: string) => {
                try {
                    return databaseService.getTableIndexes(siteName, tableName);
                } catch (error) {
                    console.error("Failed to get table indexes:", error);
                    throw error;
                }
            }
        );

        // Get table data with pagination
        ipcMain.handle(
            "database:get-table-data",
            async (
                _,
                siteName: string,
                tableName: string,
                page: number,
                pageSize: number,
                searchTerm?: string,
                searchColumn?: string
            ) => {
                try {
                    return databaseService.getTableData(
                        siteName,
                        tableName,
                        page,
                        pageSize,
                        searchTerm,
                        searchColumn
                    );
                } catch (error) {
                    console.error("Failed to get table data:", error);
                    throw error;
                }
            }
        );

        // Get table row count
        ipcMain.handle(
            "database:get-row-count",
            async (
                _,
                siteName: string,
                tableName: string,
                searchTerm?: string,
                searchColumn?: string
            ) => {
                try {
                    return databaseService.getTableRowCount(
                        siteName,
                        tableName,
                        searchTerm,
                        searchColumn
                    );
                } catch (error) {
                    console.error("Failed to get row count:", error);
                    throw error;
                }
            }
        );

        // Execute query
        ipcMain.handle(
            "database:query",
            async (_, siteName: string, sql: string, params?: any[]) => {
                try {
                    return databaseService.query(siteName, sql, params);
                } catch (error) {
                    console.error("Failed to execute query:", error);
                    throw error;
                }
            }
        );

        // Execute SQL statement
        ipcMain.handle(
            "database:execute",
            async (_, siteName: string, sql: string, params?: any[]) => {
                try {
                    return databaseService.execute(siteName, sql, params);
                } catch (error) {
                    console.error("Failed to execute SQL:", error);
                    throw error;
                }
            }
        );

        // Insert row
        ipcMain.handle(
            "database:insert-row",
            async (
                _,
                siteName: string,
                tableName: string,
                data: Record<string, any>
            ) => {
                try {
                    return databaseService.insertRow(siteName, tableName, data);
                } catch (error) {
                    console.error("Failed to insert row:", error);
                    throw error;
                }
            }
        );

        // Update row
        ipcMain.handle(
            "database:update-row",
            async (
                _,
                siteName: string,
                tableName: string,
                data: Record<string, any>,
                whereClause: string,
                whereParams: any[]
            ) => {
                try {
                    return databaseService.updateRow(
                        siteName,
                        tableName,
                        data,
                        whereClause,
                        whereParams
                    );
                } catch (error) {
                    console.error("Failed to update row:", error);
                    throw error;
                }
            }
        );

        // Delete row
        ipcMain.handle(
            "database:delete-row",
            async (
                _,
                siteName: string,
                tableName: string,
                whereClause: string,
                whereParams: any[]
            ) => {
                try {
                    return databaseService.deleteRow(
                        siteName,
                        tableName,
                        whereClause,
                        whereParams
                    );
                } catch (error) {
                    console.error("Failed to delete row:", error);
                    throw error;
                }
            }
        );

        // Export database
        ipcMain.handle(
            "database:export",
            async (
                _,
                siteName: string,
                exportPath: string,
                tables?: string[]
            ) => {
                try {
                    return await databaseService.exportDatabase(
                        siteName,
                        exportPath,
                        tables
                    );
                } catch (error) {
                    console.error("Failed to export database:", error);
                    throw error;
                }
            }
        );

        // Import database
        ipcMain.handle(
            "database:import",
            async (_, siteName: string, importPath: string) => {
                try {
                    return await databaseService.importDatabase(
                        siteName,
                        importPath
                    );
                } catch (error) {
                    console.error("Failed to import database:", error);
                    throw error;
                }
            }
        );

        // Execute raw SQL
        ipcMain.handle(
            "database:execute-raw",
            async (_, siteName: string, sql: string) => {
                try {
                    return databaseService.executeRaw(siteName, sql);
                } catch (error) {
                    console.error("Failed to execute raw SQL:", error);
                    throw error;
                }
            }
        );

        // Get database path
        ipcMain.handle("database:get-path", async (_, siteName: string) => {
            try {
                return databaseService.getDatabasePath(siteName);
            } catch (error) {
                console.error("Failed to get database path:", error);
                throw error;
            }
        });

        // Close database connection
        ipcMain.handle("database:close", async (_, siteName: string) => {
            try {
                databaseService.closeDatabase(siteName);
                return { success: true };
            } catch (error) {
                console.error("Failed to close database:", error);
                throw error;
            }
        });

        // File dialog handlers
        ipcMain.handle("dialog:show-save", async (_, options) => {
            try {
                return await dialog.showSaveDialog(options);
            } catch (error) {
                console.error("Failed to show save dialog:", error);
                throw error;
            }
        });

        ipcMain.handle("dialog:show-open", async (_, options) => {
            try {
                return await dialog.showOpenDialog(options);
            } catch (error) {
                console.error("Failed to show open dialog:", error);
                throw error;
            }
        });

        // Database browser handlers
        ipcMain.handle("database-browser:open", async (_, siteName: string) => {
            try {
                await databaseBrowserService.openDatabaseBrowser(siteName);
                return { success: true };
            } catch (error) {
                console.error("Failed to open database browser:", error);
                throw error;
            }
        });

        ipcMain.handle("database-browser:close", async () => {
            try {
                databaseBrowserService.closeDatabaseBrowser();
                return { success: true };
            } catch (error) {
                console.error("Failed to close database browser:", error);
                throw error;
            }
        });
    }
}
