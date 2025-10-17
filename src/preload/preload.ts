import { contextBridge, ipcRenderer } from "electron";
import { WordPressSite } from "../shared/types";

/**
 * Preload Script - Secure Bridge between Main and Renderer
 *
 * This script runs in a privileged context and exposes specific APIs
 * to the renderer process while maintaining security through context isolation.
 */

// Define the API interface that will be available in the renderer
export interface ElectronAPI {
    // WordPress Site Management
    sites: {
        list: () => Promise<WordPressSite[]>;
        create: (config: CreateSiteConfig) => Promise<WordPressSite>;
        start: (siteId: string) => Promise<void>;
        stop: (siteId: string) => Promise<void>;
        delete: (siteId: string) => Promise<void>;
        clone: (siteId: string, newName: string) => Promise<WordPressSite>;
        export: (siteId: string, path: string) => Promise<void>;
        import: (path: string) => Promise<WordPressSite>;
        getLogs: (siteId: string) => Promise<string>;
        openInVSCode: (siteId: string) => Promise<void>;
        openInBrowser: (siteId: string) => Promise<void>;
    };

    // Docker Management
    docker: {
        isInstalled: () => Promise<boolean>;
        isRunning: () => Promise<boolean>;
        getImages: () => Promise<DockerImage[]>;
        pullImage: (image: string) => Promise<void>;
        getContainers: () => Promise<DockerContainer[]>;
    };

    // Plugin System
    plugins: {
        list: () => Promise<PluginInfo[]>;
        install: (pluginPath: string) => Promise<void>;
        uninstall: (pluginId: string) => Promise<void>;
        enable: (pluginId: string) => Promise<void>;
        disable: (pluginId: string) => Promise<void>;
        getSettings: (pluginId: string) => Promise<any>;
        updateSettings: (pluginId: string, settings: any) => Promise<void>;
    };

    // Blueprint Management
    blueprints: {
        getAll: () => Promise<any[]>;
        getByCategory: (category: string) => Promise<any[]>;
        get: (blueprintId: string) => Promise<any>;
        createSite: (blueprintId: string, config: any) => Promise<any>;
        saveCustom: (blueprint: any) => Promise<void>;
        deleteCustom: (blueprintId: string) => Promise<void>;
    };

    // Export/Import Management
    export: {
        site: (siteId: string, options: any) => Promise<any>;
        import: (filePath: string, options: any) => Promise<any>;
        selectFile: () => Promise<string | null>;
        selectDestination: (suggestedName?: string) => Promise<string | null>;
    };

    // Application Settings
    settings: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<void>;
        getAll: () => Promise<Record<string, any>>;
        reset: () => Promise<void>;
    };

    // File System Operations
    fs: {
        selectFolder: () => Promise<string | null>;
        selectFile: (filters?: FileFilter[]) => Promise<string | null>;
        openPath: (path: string) => Promise<void>;
        exists: (path: string) => Promise<boolean>;
    };

    // Shell Operations
    shell: {
        openExternal: (url: string) => Promise<{ success: boolean }>;
        openPath: (path: string) => Promise<{ success: boolean }>;
    };

    // File Management Operations
    files: {
        list: (options: {
            siteId: string;
            path: string;
        }) => Promise<{ files: FileItem[] }>;
        openEditor: (options: {
            siteId: string;
            filePath: string;
        }) => Promise<void>;
        create: (options: {
            siteId: string;
            path: string;
            name: string;
            content?: string;
        }) => Promise<void>;
        createFolder: (options: {
            siteId: string;
            path: string;
            name: string;
        }) => Promise<void>;
        delete: (options: { siteId: string; paths: string[] }) => Promise<void>;
        upload: (options: {
            siteId: string;
            targetPath: string;
        }) => Promise<{ success: boolean; uploadedFiles: string[] }>;
    };

    // System Information
    system: {
        getVersion: () => Promise<string>;
        getPlatform: () => Promise<string>;
        getArchitecture: () => Promise<string>;
        checkAdmin: () => Promise<{
            isAdmin: boolean;
            canModifyHosts: boolean;
            platform: string;
            error?: string;
        }>;
        getElevationInstructions: () => Promise<{
            windows: string[];
            macos: string[];
            linux: string[];
        }>;
        requestElevation: () => Promise<boolean>;
        checkDocker: () => Promise<{
            isInstalled: boolean;
            isRunning: boolean;
            version?: string;
            error?: string;
        }>;
        checkPHP: () => Promise<{
            isInstalled: boolean;
            version?: string;
            path?: string;
            error?: string;
        }>;
        installPortablePHP: (installPath: string) => Promise<boolean>;
        getPHPInstructions: () => Promise<string[]>;
    };

    // Server Management
    swapWebServer: (siteId: string, options: any) => Promise<any>;
    changePHPVersion: (siteId: string, options: any) => Promise<any>;
    updateSiteURL: (
        siteId: string,
        newUrl: string,
        updateDatabase: boolean
    ) => Promise<void>;
    getServiceStats: (siteId: string, serviceName: string) => Promise<any>;

    // Windows Hosts File Management
    hosts: {
        list: () => Promise<HostEntry[]>;
        add: (entry: {
            ip: string;
            hostname: string;
            comment?: string;
            isWordPress?: boolean;
            siteId?: string;
        }) => Promise<{ success: boolean }>;
        remove: (hostname: string) => Promise<{ success: boolean }>;
        toggle: (
            hostname: string,
            enabled: boolean
        ) => Promise<{ success: boolean }>;
        addSite: (
            siteId: string,
            hostname: string,
            ip?: string
        ) => Promise<{ success: boolean }>;
        removeSite: (siteId: string) => Promise<{ success: boolean }>;
        backup: () => Promise<{ success: boolean }>;
        restore: () => Promise<{ success: boolean }>;
        checkAdmin: () => Promise<boolean>;
        getStats: () => Promise<{
            totalEntries: number;
            wordpressEntries: number;
            enabledEntries: number;
            hasBackup: boolean;
            lastModified: Date;
        }>;
    };

    // Environment Management (Local vs Docker)
    environment: {
        getCapabilities: () => Promise<{
            local: {
                type: "local";
                available: boolean;
                preferred: boolean;
                description: string;
            };
            docker: {
                type: "docker";
                available: boolean;
                preferred: boolean;
                description: string;
            };
        }>;
        getCurrent: () => Promise<"local" | "docker">;
        switch: (environment: "local" | "docker") => Promise<boolean>;
        createSite: (
            config: CreateSiteConfig & {
                environment?: "local" | "docker";
                dockerOptions?: {
                    mysqlVersion?: string;
                    nginxEnabled?: boolean;
                    sslEnabled?: boolean;
                    volumes?: string[];
                    environment?: Record<string, string>;
                };
            }
        ) => Promise<boolean>;
        startSite: (
            siteName: string,
            environment?: "local" | "docker"
        ) => Promise<boolean>;
        stopSite: (
            siteName: string,
            environment?: "local" | "docker"
        ) => Promise<boolean>;
        deleteSite: (
            siteName: string,
            environment?: "local" | "docker"
        ) => Promise<boolean>;
        getAllSites: () => Promise<
            Array<{
                name: string;
                environment: "local" | "docker";
                status: string;
                url: string;
                config: any;
            }>
        >;
        migrateSite: (
            siteName: string,
            fromEnvironment: "local" | "docker",
            toEnvironment: "local" | "docker"
        ) => Promise<boolean>;
    };

    // Non-Admin Mode Management
    nonAdminMode: {
        getStatus: () => Promise<{
            enabled: boolean;
            hasUserMadeChoice: boolean;
            lastChoice: "admin" | "non-admin";
            explanation: {
                mode: string;
                description: string;
                urls: string;
                adminRequired: boolean;
            };
        }>;
        shouldPromptUser: () => Promise<boolean>;
        enable: () => Promise<{
            mode: string;
            description: string;
            urls: string;
            adminRequired: boolean;
        }>;
        disable: () => Promise<{
            mode: string;
            description: string;
            urls: string;
            adminRequired: boolean;
        }>;
        resetPreferences: () => Promise<{
            mode: string;
            description: string;
            urls: string;
            adminRequired: boolean;
        }>;
    };

    // Database Browser
    database: {
        getTables: (siteName: string) => Promise<
            Array<{
                name: string;
                sql: string;
                type: string;
            }>
        >;
        getSchema: (
            siteName: string,
            tableName: string
        ) => Promise<
            Array<{
                cid: number;
                name: string;
                type: string;
                notnull: number;
                dflt_value: any;
                pk: number;
            }>
        >;
        getIndexes: (siteName: string, tableName: string) => Promise<any[]>;
        getTableData: (
            siteName: string,
            tableName: string,
            page: number,
            pageSize: number,
            searchTerm?: string,
            searchColumn?: string
        ) => Promise<{
            columns: string[];
            rows: any[];
            rowCount: number;
            executionTime: number;
        }>;
        getRowCount: (
            siteName: string,
            tableName: string,
            searchTerm?: string,
            searchColumn?: string
        ) => Promise<number>;
        query: (
            siteName: string,
            sql: string,
            params?: any[]
        ) => Promise<{
            columns: string[];
            rows: any[];
            rowCount: number;
            executionTime: number;
        }>;
        execute: (
            siteName: string,
            sql: string,
            params?: any[]
        ) => Promise<{
            changes: number;
            lastInsertRowid: number | bigint;
        }>;
        insertRow: (
            siteName: string,
            tableName: string,
            data: Record<string, any>
        ) => Promise<{
            success: boolean;
            id?: number | bigint;
            error?: string;
        }>;
        updateRow: (
            siteName: string,
            tableName: string,
            data: Record<string, any>,
            whereClause: string,
            whereParams: any[]
        ) => Promise<{
            success: boolean;
            changes?: number;
            error?: string;
        }>;
        deleteRow: (
            siteName: string,
            tableName: string,
            whereClause: string,
            whereParams: any[]
        ) => Promise<{
            success: boolean;
            changes?: number;
            error?: string;
        }>;
        exportDatabase: (
            siteName: string,
            exportPath: string,
            tables?: string[]
        ) => Promise<{
            success: boolean;
            error?: string;
        }>;
        importDatabase: (
            siteName: string,
            importPath: string
        ) => Promise<{
            success: boolean;
            error?: string;
        }>;
        executeRaw: (
            siteName: string,
            sql: string
        ) => Promise<{
            success: boolean;
            result?: any;
            error?: string;
        }>;
        getDatabasePath: (siteName: string) => Promise<string>;
        closeDatabase: (siteName: string) => Promise<{ success: boolean }>;
        openBrowser: (siteName: string) => Promise<{ success: boolean }>;
        closeBrowser: () => Promise<{ success: boolean }>;
    };

    // File Dialogs
    dialog: {
        showSaveDialog: (
            options: any
        ) => Promise<{ filePath?: string; canceled: boolean }>;
        showOpenDialog: (
            options: any
        ) => Promise<{ filePaths?: string[]; canceled: boolean }>;
    };

    // Events
    on: (channel: string, callback: (...args: any[]) => void) => void;
    off: (channel: string, callback: (...args: any[]) => void) => void;
    once: (channel: string, callback: (...args: any[]) => void) => void;
}

// Type definitions for the API
interface HostEntry {
    id?: string;
    ip: string;
    hostname: string;
    comment: string;
    enabled: boolean;
    isWordPress: boolean;
    siteId?: string;
    lastModified?: string;
}

interface CreateSiteConfig {
    name: string;
    domain?: string;
    phpVersion: string;
    wordPressVersion?: string;
    path?: string;
    ssl?: boolean;
    multisite?: boolean;
    template?: string;
    plugins?: string[];
    themes?: string[];
    adminUser?: string;
    adminPassword?: string;
    adminEmail?: string;
}

interface DockerImage {
    id: string;
    repository: string;
    tag: string;
    size: number;
    created: Date;
}

interface DockerContainer {
    id: string;
    name: string;
    image: string;
    status: string;
    ports: string[];
    created: Date;
}

interface FileItem {
    name: string;
    path: string;
    type: "file" | "folder";
    size?: number;
    modified?: Date;
    extension?: string;
}

interface PluginInfo {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    enabled: boolean;
    path: string;
}

interface FileFilter {
    name: string;
    extensions: string[];
}

// Expose the API to the renderer process
const electronAPI: ElectronAPI = {
    // WordPress Site Management
    sites: {
        list: () => ipcRenderer.invoke("sites:list"),
        create: (config) => ipcRenderer.invoke("sites:create", config),
        start: (siteId) => ipcRenderer.invoke("sites:start", siteId),
        stop: (siteId) => ipcRenderer.invoke("sites:stop", siteId),
        delete: (siteId) => ipcRenderer.invoke("sites:delete", siteId),
        clone: (siteId, newName) =>
            ipcRenderer.invoke("sites:clone", siteId, newName),
        export: (siteId, path) =>
            ipcRenderer.invoke("sites:export", siteId, path),
        import: (path) => ipcRenderer.invoke("sites:import", path),
        getLogs: (siteId) => ipcRenderer.invoke("sites:logs", siteId),
        openInVSCode: (siteId) =>
            ipcRenderer.invoke("sites:open-vscode", siteId),
        openInBrowser: (siteId) =>
            ipcRenderer.invoke("sites:open-browser", siteId),
    },

    // Docker Management
    docker: {
        isInstalled: () => ipcRenderer.invoke("docker:is-installed"),
        isRunning: () => ipcRenderer.invoke("docker:is-running"),
        getImages: () => ipcRenderer.invoke("docker:get-images"),
        pullImage: (image) => ipcRenderer.invoke("docker:pull-image", image),
        getContainers: () => ipcRenderer.invoke("docker:get-containers"),
    },

    // Plugin System
    plugins: {
        list: () => ipcRenderer.invoke("plugins:list"),
        install: (pluginPath) =>
            ipcRenderer.invoke("plugins:install", pluginPath),
        uninstall: (pluginId) =>
            ipcRenderer.invoke("plugins:uninstall", pluginId),
        enable: (pluginId) => ipcRenderer.invoke("plugins:enable", pluginId),
        disable: (pluginId) => ipcRenderer.invoke("plugins:disable", pluginId),
        getSettings: (pluginId) =>
            ipcRenderer.invoke("plugins:get-settings", pluginId),
        updateSettings: (pluginId, settings) =>
            ipcRenderer.invoke("plugins:update-settings", pluginId, settings),
    },

    // Blueprint Management
    blueprints: {
        getAll: () => ipcRenderer.invoke("blueprints:get-all"),
        getByCategory: (category) =>
            ipcRenderer.invoke("blueprints:get-by-category", category),
        get: (blueprintId) => ipcRenderer.invoke("blueprints:get", blueprintId),
        createSite: (blueprintId, config) =>
            ipcRenderer.invoke("blueprints:create-site", blueprintId, config),
        saveCustom: (blueprint) =>
            ipcRenderer.invoke("blueprints:save-custom", blueprint),
        deleteCustom: (blueprintId) =>
            ipcRenderer.invoke("blueprints:delete-custom", blueprintId),
    },

    // Export/Import Management
    export: {
        site: (siteId, options) =>
            ipcRenderer.invoke("export:site", siteId, options),
        import: (filePath, options) =>
            ipcRenderer.invoke("export:import", filePath, options),
        selectFile: () => ipcRenderer.invoke("export:select-file"),
        selectDestination: (suggestedName) =>
            ipcRenderer.invoke("export:select-destination", suggestedName),
    },

    // Application Settings
    settings: {
        get: (key) => ipcRenderer.invoke("settings:get", key),
        set: (key, value) => ipcRenderer.invoke("settings:set", key, value),
        getAll: () => ipcRenderer.invoke("settings:get-all"),
        reset: () => ipcRenderer.invoke("settings:reset"),
    },

    // File System Operations
    fs: {
        selectFolder: () => ipcRenderer.invoke("fs:select-folder"),
        selectFile: (filters) => ipcRenderer.invoke("fs:select-file", filters),
        openPath: (path) => ipcRenderer.invoke("fs:open-path", path),
        exists: (path) => ipcRenderer.invoke("fs:exists", path),
    },

    // Shell Operations
    shell: {
        openExternal: (url) => ipcRenderer.invoke("shell:open-external", url),
        openPath: (path) => ipcRenderer.invoke("shell:open-path", path),
    },

    // File Management Operations
    files: {
        list: (options) => ipcRenderer.invoke("files:list", options),
        openEditor: (options) =>
            ipcRenderer.invoke("files:open-editor", options),
        create: (options) => ipcRenderer.invoke("files:create", options),
        createFolder: (options) =>
            ipcRenderer.invoke("files:create-folder", options),
        delete: (options) => ipcRenderer.invoke("files:delete", options),
        upload: (options) => ipcRenderer.invoke("files:upload", options),
    },

    // System Information
    system: {
        getVersion: () => ipcRenderer.invoke("system:get-version"),
        getPlatform: () => ipcRenderer.invoke("system:get-platform"),
        getArchitecture: () => ipcRenderer.invoke("system:get-architecture"),
        checkAdmin: () => ipcRenderer.invoke("system:check-admin"),
        getElevationInstructions: () =>
            ipcRenderer.invoke("system:get-elevation-instructions"),
        requestElevation: () => ipcRenderer.invoke("system:request-elevation"),
        checkDocker: () => ipcRenderer.invoke("system:check-docker"),
        checkPHP: () => ipcRenderer.invoke("system:check-php"),
        installPortablePHP: (installPath: string) =>
            ipcRenderer.invoke("system:install-portable-php", installPath),
        getPHPInstructions: () =>
            ipcRenderer.invoke("system:get-php-instructions"),
    },

    // Server Management
    swapWebServer: (siteId, options) =>
        ipcRenderer.invoke("server:swap-web-server", siteId, options),
    changePHPVersion: (siteId, options) =>
        ipcRenderer.invoke("server:change-php-version", siteId, options),
    updateSiteURL: (siteId, newUrl, updateDatabase) =>
        ipcRenderer.invoke(
            "server:update-site-url",
            siteId,
            newUrl,
            updateDatabase
        ),
    getServiceStats: (siteId, serviceName) =>
        ipcRenderer.invoke("server:get-service-stats", siteId, serviceName),

    // Windows Hosts File Management
    hosts: {
        list: () => ipcRenderer.invoke("hosts:list"),
        add: (entry) => ipcRenderer.invoke("hosts:add", entry),
        remove: (hostname) => ipcRenderer.invoke("hosts:remove", hostname),
        toggle: (hostname, enabled) =>
            ipcRenderer.invoke("hosts:toggle", hostname, enabled),
        addSite: (siteId, hostname, ip) =>
            ipcRenderer.invoke("hosts:add-site", siteId, hostname, ip),
        removeSite: (siteId) => ipcRenderer.invoke("hosts:remove-site", siteId),
        backup: () => ipcRenderer.invoke("hosts:backup"),
        restore: () => ipcRenderer.invoke("hosts:restore"),
        checkAdmin: () => ipcRenderer.invoke("hosts:check-admin"),
        getStats: () => ipcRenderer.invoke("hosts:stats"),
    },

    // Environment Management (Local vs Docker)
    environment: {
        getCapabilities: () => ipcRenderer.invoke("environment:capabilities"),
        getCurrent: () => ipcRenderer.invoke("environment:current"),
        switch: (environment) =>
            ipcRenderer.invoke("environment:switch", environment),
        createSite: (config) =>
            ipcRenderer.invoke("environment:create-site", config),
        startSite: (siteName, environment) =>
            ipcRenderer.invoke("environment:start-site", siteName, environment),
        stopSite: (siteName, environment) =>
            ipcRenderer.invoke("environment:stop-site", siteName, environment),
        deleteSite: (siteName, environment) =>
            ipcRenderer.invoke(
                "environment:delete-site",
                siteName,
                environment
            ),
        getAllSites: () => ipcRenderer.invoke("environment:all-sites"),
        migrateSite: (siteName, fromEnvironment, toEnvironment) =>
            ipcRenderer.invoke(
                "environment:migrate-site",
                siteName,
                fromEnvironment,
                toEnvironment
            ),
    },

    // Non-Admin Mode Management
    nonAdminMode: {
        getStatus: () => ipcRenderer.invoke("nonadmin:get-status"),
        shouldPromptUser: () =>
            ipcRenderer.invoke("nonadmin:should-prompt-user"),
        enable: () => ipcRenderer.invoke("nonadmin:enable"),
        disable: () => ipcRenderer.invoke("nonadmin:disable"),
        resetPreferences: () =>
            ipcRenderer.invoke("nonadmin:reset-preferences"),
    },

    // Database Browser
    database: {
        getTables: (siteName: string) =>
            ipcRenderer.invoke("database:get-tables", siteName),
        getSchema: (siteName: string, tableName: string) =>
            ipcRenderer.invoke("database:get-schema", siteName, tableName),
        getIndexes: (siteName: string, tableName: string) =>
            ipcRenderer.invoke("database:get-indexes", siteName, tableName),
        getTableData: (
            siteName: string,
            tableName: string,
            page: number,
            pageSize: number,
            searchTerm?: string,
            searchColumn?: string
        ) =>
            ipcRenderer.invoke(
                "database:get-table-data",
                siteName,
                tableName,
                page,
                pageSize,
                searchTerm,
                searchColumn
            ),
        getRowCount: (
            siteName: string,
            tableName: string,
            searchTerm?: string,
            searchColumn?: string
        ) =>
            ipcRenderer.invoke(
                "database:get-row-count",
                siteName,
                tableName,
                searchTerm,
                searchColumn
            ),
        query: (siteName: string, sql: string, params?: any[]) =>
            ipcRenderer.invoke("database:query", siteName, sql, params),
        execute: (siteName: string, sql: string, params?: any[]) =>
            ipcRenderer.invoke("database:execute", siteName, sql, params),
        insertRow: (
            siteName: string,
            tableName: string,
            data: Record<string, any>
        ) =>
            ipcRenderer.invoke(
                "database:insert-row",
                siteName,
                tableName,
                data
            ),
        updateRow: (
            siteName: string,
            tableName: string,
            data: Record<string, any>,
            whereClause: string,
            whereParams: any[]
        ) =>
            ipcRenderer.invoke(
                "database:update-row",
                siteName,
                tableName,
                data,
                whereClause,
                whereParams
            ),
        deleteRow: (
            siteName: string,
            tableName: string,
            whereClause: string,
            whereParams: any[]
        ) =>
            ipcRenderer.invoke(
                "database:delete-row",
                siteName,
                tableName,
                whereClause,
                whereParams
            ),
        exportDatabase: (
            siteName: string,
            exportPath: string,
            tables?: string[]
        ) =>
            ipcRenderer.invoke("database:export", siteName, exportPath, tables),
        importDatabase: (siteName: string, importPath: string) =>
            ipcRenderer.invoke("database:import", siteName, importPath),
        executeRaw: (siteName: string, sql: string) =>
            ipcRenderer.invoke("database:execute-raw", siteName, sql),
        getDatabasePath: (siteName: string) =>
            ipcRenderer.invoke("database:get-path", siteName),
        closeDatabase: (siteName: string) =>
            ipcRenderer.invoke("database:close", siteName),
        openBrowser: (siteName: string) =>
            ipcRenderer.invoke("database-browser:open", siteName),
        closeBrowser: () => ipcRenderer.invoke("database-browser:close"),
    },

    // File Dialogs
    dialog: {
        showSaveDialog: (options) =>
            ipcRenderer.invoke("dialog:show-save", options),
        showOpenDialog: (options) =>
            ipcRenderer.invoke("dialog:show-open", options),
    },

    // Event Handling
    on: (channel, callback) => {
        ipcRenderer.on(channel, (_, ...args) => callback(...args));
    },

    off: (channel, callback) => {
        ipcRenderer.removeListener(channel, callback);
    },

    once: (channel, callback) => {
        ipcRenderer.once(channel, (_, ...args) => callback(...args));
    },
};

// Expose the API to the window object
contextBridge.exposeInMainWorld("electronAPI", electronAPI);

// Also expose types for TypeScript support in renderer
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
