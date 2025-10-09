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
import { CreateSiteRequest } from "../../shared/types";

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
        private store: Store
    ) {}

    /**
     * Register all IPC handlers
     */
    registerHandlers(): void {
        this.registerSiteHandlers();
        this.registerDockerHandlers();
        this.registerPluginHandlers();
        this.registerBlueprintHandlers();
        this.registerSettingsHandlers();
        this.registerFileSystemHandlers();
        this.registerSystemHandlers();
        this.registerHostsFileHandlers();
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
                return await this.wordpressManager.createSite(config);
            } catch (error) {
                console.error("Failed to create site:", error);
                throw error;
            }
        });

        ipcMain.handle("sites:start", async (_, siteId: string) => {
            try {
                await this.wordpressManager.startSite(siteId);
            } catch (error) {
                console.error("Failed to start site:", error);
                throw error;
            }
        });

        ipcMain.handle("sites:stop", async (_, siteId: string) => {
            try {
                await this.wordpressManager.stopSite(siteId);
            } catch (error) {
                console.error("Failed to stop site:", error);
                throw error;
            }
        });

        ipcMain.handle("sites:delete", async (_, siteId: string) => {
            try {
                await this.wordpressManager.deleteSite(siteId);
            } catch (error) {
                console.error("Failed to delete site:", error);
                throw error;
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
                if (site && site.port) {
                    await shell.openExternal(`http://localhost:${site.port}`);
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
}
