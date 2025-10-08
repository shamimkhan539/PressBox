import { contextBridge, ipcRenderer } from "electron";

/**
 * Simplified Preload Script for Development
 */

// Basic API interface
export interface ElectronAPI {
    system: {
        getVersion: () => Promise<string>;
        getPlatform: () => Promise<string>;
        getArchitecture: () => Promise<string>;
    };

    sites: {
        list: () => Promise<any[]>;
    };

    docker: {
        isInstalled: () => Promise<boolean>;
        isRunning: () => Promise<boolean>;
    };

    plugins: {
        list: () => Promise<any[]>;
    };

    settings: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<void>;
    };
}

// Expose the API to the renderer process
const electronAPI: ElectronAPI = {
    system: {
        getVersion: () => ipcRenderer.invoke("system:get-version"),
        getPlatform: () => ipcRenderer.invoke("system:get-platform"),
        getArchitecture: () => ipcRenderer.invoke("system:get-architecture"),
    },

    sites: {
        list: () => ipcRenderer.invoke("sites:list"),
    },

    docker: {
        isInstalled: () => ipcRenderer.invoke("docker:is-installed"),
        isRunning: () => ipcRenderer.invoke("docker:is-running"),
    },

    plugins: {
        list: () => ipcRenderer.invoke("plugins:list"),
    },

    settings: {
        get: (key: string) => ipcRenderer.invoke("settings:get", key),
        set: (key: string, value: any) =>
            ipcRenderer.invoke("settings:set", key, value),
    },
};

// Expose the API to the window object
contextBridge.exposeInMainWorld("electronAPI", electronAPI);
