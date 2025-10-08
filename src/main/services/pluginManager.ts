import { join, resolve, basename } from "path";
import { promises as fs } from "fs";
import { EventEmitter } from "events";
import {
    Plugin,
    PluginManifest,
    PluginAPI,
    PluginCommand,
    PluginMenu,
    PluginView,
    PluginError,
    AppEvent,
} from "../../shared/types";

/**
 * Plugin Manager
 *
 * Manages the plugin system including loading, unloading, and providing
 * the plugin API for third-party extensions.
 */
export class PluginManager extends EventEmitter {
    private plugins: Map<string, Plugin> = new Map();
    private pluginsPath: string;
    private api: PluginAPI;
    private commands: Map<string, () => void> = new Map();
    private menus: PluginMenu[] = [];
    private views: Map<string, any> = new Map();

    constructor() {
        super();
        this.pluginsPath = join(
            process.env.HOME || process.env.USERPROFILE || ".",
            "PressBox",
            "plugins"
        );
        this.api = this.createPluginAPI();
        this.initialize();
    }

    /**
     * Initialize the plugin manager
     */
    private async initialize(): Promise<void> {
        try {
            // Ensure plugins directory exists
            await fs.mkdir(this.pluginsPath, { recursive: true });

            console.log("Plugin Manager initialized");
        } catch (error) {
            console.error("Failed to initialize Plugin Manager:", error);
            throw new PluginError("Failed to initialize Plugin Manager", error);
        }
    }

    /**
     * Load all plugins from the plugins directory
     */
    async loadPlugins(): Promise<void> {
        try {
            const pluginDirs = await fs.readdir(this.pluginsPath);

            for (const pluginDir of pluginDirs) {
                try {
                    await this.loadPlugin(join(this.pluginsPath, pluginDir));
                } catch (error) {
                    console.warn(
                        `Failed to load plugin from ${pluginDir}:`,
                        error
                    );
                }
            }

            console.log(`Loaded ${this.plugins.size} plugins`);
        } catch (error) {
            console.warn(
                "No plugins directory found or failed to read plugins"
            );
        }
    }

    /**
     * Load a single plugin from a directory
     */
    async loadPlugin(pluginPath: string): Promise<Plugin> {
        try {
            // Read plugin manifest
            const manifestPath = join(pluginPath, "package.json");
            const manifestData = await fs.readFile(manifestPath, "utf-8");
            const manifest: PluginManifest = JSON.parse(manifestData);

            // Validate manifest
            this.validateManifest(manifest);

            // Check if plugin is already loaded
            if (this.plugins.has(manifest.id)) {
                throw new PluginError(
                    `Plugin '${manifest.id}' is already loaded`
                );
            }

            // Load the main plugin file
            const mainPath = join(pluginPath, manifest.main);

            // Clear require cache to ensure fresh load
            delete require.cache[require.resolve(mainPath)];

            const pluginModule = require(mainPath);

            // Create plugin object
            const plugin: Plugin = {
                id: manifest.id,
                name: manifest.name,
                version: manifest.version,
                description: manifest.description,
                author: manifest.author,
                website: manifest.website,
                repository: manifest.repository,
                enabled: true,
                path: pluginPath,
                manifest,
                main: pluginModule,
            };

            // Initialize plugin if it has an activate method
            if (typeof pluginModule.activate === "function") {
                await pluginModule.activate(this.api);
            }

            // Register plugin contributions
            if (manifest.contributes) {
                this.registerContributions(plugin, manifest.contributes);
            }

            this.plugins.set(manifest.id, plugin);

            this.emit(AppEvent.PLUGIN_INSTALLED, plugin);
            console.log(`Loaded plugin: ${manifest.name} v${manifest.version}`);

            return plugin;
        } catch (error) {
            throw new PluginError(
                `Failed to load plugin from ${pluginPath}`,
                error
            );
        }
    }

    /**
     * Unload a plugin
     */
    async unloadPlugin(pluginId: string): Promise<void> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new PluginError(`Plugin '${pluginId}' not found`);
        }

        try {
            // Deactivate plugin if it has a deactivate method
            if (plugin.main && typeof plugin.main.deactivate === "function") {
                await plugin.main.deactivate();
            }

            // Unregister contributions
            this.unregisterContributions(plugin);

            // Remove from loaded plugins
            this.plugins.delete(pluginId);

            console.log(`Unloaded plugin: ${plugin.name}`);
        } catch (error) {
            throw new PluginError(
                `Failed to unload plugin '${pluginId}'`,
                error
            );
        }
    }

    /**
     * Enable a plugin
     */
    async enablePlugin(pluginId: string): Promise<void> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new PluginError(`Plugin '${pluginId}' not found`);
        }

        if (plugin.enabled) {
            return; // Already enabled
        }

        try {
            // Activate plugin
            if (plugin.main && typeof plugin.main.activate === "function") {
                await plugin.main.activate(this.api);
            }

            // Register contributions
            if (plugin.manifest.contributes) {
                this.registerContributions(plugin, plugin.manifest.contributes);
            }

            plugin.enabled = true;
            this.emit(AppEvent.PLUGIN_ENABLED, plugin);

            console.log(`Enabled plugin: ${plugin.name}`);
        } catch (error) {
            throw new PluginError(
                `Failed to enable plugin '${pluginId}'`,
                error
            );
        }
    }

    /**
     * Disable a plugin
     */
    async disablePlugin(pluginId: string): Promise<void> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new PluginError(`Plugin '${pluginId}' not found`);
        }

        if (!plugin.enabled) {
            return; // Already disabled
        }

        try {
            // Deactivate plugin
            if (plugin.main && typeof plugin.main.deactivate === "function") {
                await plugin.main.deactivate();
            }

            // Unregister contributions
            this.unregisterContributions(plugin);

            plugin.enabled = false;
            this.emit(AppEvent.PLUGIN_DISABLED, plugin);

            console.log(`Disabled plugin: ${plugin.name}`);
        } catch (error) {
            throw new PluginError(
                `Failed to disable plugin '${pluginId}'`,
                error
            );
        }
    }

    /**
     * Get all loaded plugins
     */
    getPlugins(): Plugin[] {
        return Array.from(this.plugins.values());
    }

    /**
     * Get a specific plugin by ID
     */
    getPlugin(pluginId: string): Plugin | null {
        return this.plugins.get(pluginId) || null;
    }

    /**
     * Install a plugin from a path (zip file or directory)
     */
    async installPlugin(sourcePath: string): Promise<Plugin> {
        try {
            // For now, assume it's a directory - in a real implementation,
            // you'd handle zip files and downloads
            const pluginName = basename(sourcePath);
            const targetPath = join(this.pluginsPath, pluginName);

            // Copy plugin to plugins directory
            await this.copyDirectory(sourcePath, targetPath);

            // Load the plugin
            return await this.loadPlugin(targetPath);
        } catch (error) {
            throw new PluginError(
                `Failed to install plugin from ${sourcePath}`,
                error
            );
        }
    }

    /**
     * Uninstall a plugin
     */
    async uninstallPlugin(pluginId: string): Promise<void> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new PluginError(`Plugin '${pluginId}' not found`);
        }

        try {
            // Unload plugin first
            await this.unloadPlugin(pluginId);

            // Remove plugin directory
            await fs.rmdir(plugin.path, { recursive: true });

            console.log(`Uninstalled plugin: ${plugin.name}`);
        } catch (error) {
            throw new PluginError(
                `Failed to uninstall plugin '${pluginId}'`,
                error
            );
        }
    }

    /**
     * Execute a plugin command
     */
    async executeCommand(commandId: string): Promise<void> {
        const handler = this.commands.get(commandId);
        if (!handler) {
            throw new PluginError(`Command '${commandId}' not found`);
        }

        try {
            await handler();
        } catch (error) {
            throw new PluginError(
                `Failed to execute command '${commandId}'`,
                error
            );
        }
    }

    /**
     * Get registered commands
     */
    getCommands(): string[] {
        return Array.from(this.commands.keys());
    }

    /**
     * Get registered menus
     */
    getMenus(): PluginMenu[] {
        return [...this.menus];
    }

    /**
     * Get registered views
     */
    getViews(): Map<string, any> {
        return new Map(this.views);
    }

    /**
     * Create the plugin API that will be exposed to plugins
     */
    private createPluginAPI(): PluginAPI {
        return {
            // Core API
            getVersion: () => "1.0.0", // This should come from package.json
            getPluginPath: (pluginId: string) => {
                const plugin = this.plugins.get(pluginId);
                return plugin ? plugin.path : "";
            },

            // Site Management (these would be implemented by injecting the WordPressManager)
            getSites: async () => [],
            getSite: async (siteId: string) => null,
            createSite: async (config: any) => ({}) as any,
            startSite: async (siteId: string) => {},
            stopSite: async (siteId: string) => {},

            // UI Extensions
            addCommand: (command: PluginCommand, handler: () => void) => {
                this.commands.set(command.id, handler);
            },

            addMenuItem: (menu: PluginMenu) => {
                this.menus.push(menu);
            },

            addView: (view: PluginView, component: any) => {
                this.views.set(view.id, { view, component });
            },

            showNotification: (
                message: string,
                type: "info" | "success" | "warning" | "error"
            ) => {
                this.emit("notification", { message, type });
            },

            // Settings (would be implemented with a settings manager)
            getSetting: async (key: string) => null,
            setSetting: async (key: string, value: any) => {},

            // Events
            on: (event: string, handler: (...args: any[]) => void) => {
                this.on(event, handler);
            },

            off: (event: string, handler: (...args: any[]) => void) => {
                this.off(event, handler);
            },

            emit: (event: string, ...args: any[]) => {
                this.emit(event, ...args);
            },

            // File System (simplified - would need proper security)
            readFile: async (path: string) => {
                try {
                    return await fs.readFile(path, "utf-8");
                } catch (error) {
                    throw new PluginError(`Failed to read file ${path}`, error);
                }
            },

            writeFile: async (path: string, content: string) => {
                try {
                    await fs.writeFile(path, content);
                } catch (error) {
                    throw new PluginError(
                        `Failed to write file ${path}`,
                        error
                    );
                }
            },

            exists: async (path: string) => {
                try {
                    await fs.access(path);
                    return true;
                } catch {
                    return false;
                }
            },
        };
    }

    /**
     * Validate plugin manifest
     */
    private validateManifest(manifest: PluginManifest): void {
        const required = [
            "id",
            "name",
            "version",
            "description",
            "author",
            "main",
        ];

        for (const field of required) {
            if (!manifest[field as keyof PluginManifest]) {
                throw new PluginError(
                    `Plugin manifest missing required field: ${field}`
                );
            }
        }

        if (
            typeof manifest.id !== "string" ||
            !/^[a-z0-9-_]+$/.test(manifest.id)
        ) {
            throw new PluginError(
                "Plugin ID must be lowercase alphanumeric with hyphens/underscores"
            );
        }
    }

    /**
     * Register plugin contributions
     */
    private registerContributions(plugin: Plugin, contributions: any): void {
        // Register commands
        if (contributions.commands) {
            contributions.commands.forEach((command: PluginCommand) => {
                // Commands would be registered with handlers from the plugin
                console.log(
                    `Registered command: ${command.id} from plugin ${plugin.id}`
                );
            });
        }

        // Register menus
        if (contributions.menus) {
            contributions.menus.forEach((menu: PluginMenu) => {
                this.menus.push(menu);
                console.log(
                    `Registered menu: ${menu.id} from plugin ${plugin.id}`
                );
            });
        }

        // Register views
        if (contributions.views) {
            contributions.views.forEach((view: PluginView) => {
                console.log(
                    `Registered view: ${view.id} from plugin ${plugin.id}`
                );
            });
        }
    }

    /**
     * Unregister plugin contributions
     */
    private unregisterContributions(plugin: Plugin): void {
        // Remove commands
        if (plugin.manifest.contributes?.commands) {
            plugin.manifest.contributes.commands.forEach((command) => {
                this.commands.delete(command.id);
            });
        }

        // Remove menus
        if (plugin.manifest.contributes?.menus) {
            plugin.manifest.contributes.menus.forEach((menu) => {
                const index = this.menus.findIndex((m) => m.id === menu.id);
                if (index >= 0) {
                    this.menus.splice(index, 1);
                }
            });
        }

        // Remove views
        if (plugin.manifest.contributes?.views) {
            plugin.manifest.contributes.views.forEach((view) => {
                this.views.delete(view.id);
            });
        }
    }

    /**
     * Copy directory recursively (simplified implementation)
     */
    private async copyDirectory(
        source: string,
        destination: string
    ): Promise<void> {
        // This is a simplified implementation - in a real app you'd want
        // to use a proper file copying library or implement proper recursive copy
        await fs.mkdir(destination, { recursive: true });

        const entries = await fs.readdir(source, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = join(source, entry.name);
            const destPath = join(destination, entry.name);

            if (entry.isDirectory()) {
                await this.copyDirectory(srcPath, destPath);
            } else {
                await fs.copyFile(srcPath, destPath);
            }
        }
    }
}
