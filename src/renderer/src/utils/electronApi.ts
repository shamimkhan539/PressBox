/**
 * Utility to wait for Electron API to be available
 */

export const waitForElectronAPI = (
    timeout: number = 10000
): Promise<typeof window.electronAPI> => {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const checkAPI = () => {
            if (
                window.electronAPI &&
                window.electronAPI.sites &&
                window.electronAPI.nonAdminMode
            ) {
                resolve(window.electronAPI);
                return;
            }

            if (Date.now() - startTime > timeout) {
                reject(new Error("Timeout waiting for Electron API"));
                return;
            }

            setTimeout(checkAPI, 100);
        };

        checkAPI();
    });
};

export const isElectronAPIReady = (): boolean => {
    return !!(window.electronAPI && window.electronAPI.sites);
};
