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

    // System Information
    system: {
        getVersion: () => Promise<string>;
        getPlatform: () => Promise<string>;
        getArchitecture: () => Promise<string>;
    };

    // Events
    on: (channel: string, callback: (...args: any[]) => void) => void;
    off: (channel: string, callback: (...args: any[]) => void) => void;
    once: (channel: string, callback: (...args: any[]) => void) => void;
}

// Type definitions for the API
interface CreateSiteConfig {
    name: string;
    domain?: string;
    phpVersion: string;
    wordPressVersion?: string;
    path?: string;
    ssl?: boolean;
    multisite?: boolean;
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

    // System Information
    system: {
        getVersion: () => ipcRenderer.invoke("system:get-version"),
        getPlatform: () => ipcRenderer.invoke("system:get-platform"),
        getArchitecture: () => ipcRenderer.invoke("system:get-architecture"),
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
