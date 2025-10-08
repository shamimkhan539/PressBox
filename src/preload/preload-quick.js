const { contextBridge, ipcRenderer } = require("electron");

/**
 * Simplified Preload Script - JavaScript Version
 */

// Expose the API to the renderer process
const electronAPI = {
    system: {
        getVersion: () => ipcRenderer.invoke("system:get-version"),
        getPlatform: () => ipcRenderer.invoke("system:get-platform"),
        getArchitecture: () => ipcRenderer.invoke("system:get-architecture"),
    },

    sites: {
        list: () => ipcRenderer.invoke("sites:list"),
        create: (siteData) => ipcRenderer.invoke("sites:create", siteData),
        start: (siteId) => ipcRenderer.invoke("sites:start", siteId),
        stop: (siteId) => ipcRenderer.invoke("sites:stop", siteId),
        delete: (siteId) => ipcRenderer.invoke("sites:delete", siteId),
        import: (importPath) => ipcRenderer.invoke("sites:import", importPath),
    },

    docker: {
        isInstalled: () => ipcRenderer.invoke("docker:is-installed"),
        isRunning: () => ipcRenderer.invoke("docker:is-running"),
    },

    plugins: {
        list: () => ipcRenderer.invoke("plugins:list"),
    },

    settings: {
        get: (key) => ipcRenderer.invoke("settings:get", key),
        set: (key, value) => ipcRenderer.invoke("settings:set", key, value),
    },

    shell: {
        openExternal: (url) => ipcRenderer.invoke("shell:open-external", url),
        openPath: (path) => ipcRenderer.invoke("shell:open-path", path),
    },

    "wp-cli": {
        execute: (siteId, command) =>
            ipcRenderer.invoke("wp-cli:execute", siteId, command),
    },

    site: {
        clone: (siteId, newName) =>
            ipcRenderer.invoke("site:clone", siteId, newName),
        backup: (siteId, backupPath) =>
            ipcRenderer.invoke("site:backup", siteId, backupPath),
    },
};

// Expose the API to the window object
contextBridge.exposeInMainWorld("electronAPI", electronAPI);
