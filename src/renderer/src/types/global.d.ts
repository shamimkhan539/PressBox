export interface ElectronAPI {
    system: {
        getVersion: () => Promise<string>;
        getPlatform: () => Promise<string>;
        getArchitecture: () => Promise<string>;
    };

    sites: {
        list: () => Promise<any[]>;
        create: (siteData: any) => Promise<any>;
        start: (siteId: string) => Promise<any>;
        stop: (siteId: string) => Promise<any>;
        delete: (siteId: string) => Promise<any>;
        import: (importPath: string) => Promise<any>;
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

    shell: {
        openExternal: (url: string) => Promise<{ success: boolean }>;
        openPath: (path: string) => Promise<{ success: boolean }>;
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
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

export {};
