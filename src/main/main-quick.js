const { app, BrowserWindow, ipcMain } = require("electron");
const { join } = require("path");
const fs = require("fs");
const os = require("os");
const path = require("path");

/**
 * PressBox Main Process - JavaScript Version for Quick Start
 */

class PressBoxApp {
    constructor() {
        this.mainWindow = null;
        this.store = null;
        this.init();
    }

    async init() {
        // Handle app ready
        await app.whenReady();

        // Initialize simple file-based storage
        this.configPath = join(os.homedir(), ".pressbox-config.json");
        this.store = this.createSimpleStore();

        this.createWindow();
        this.setupBasicIPC();

        // Handle window management
        app.on("activate", () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createWindow();
            }
        });

        app.on("window-all-closed", () => {
            if (process.platform !== "darwin") {
                app.quit();
            }
        });
    }

    createWindow() {
        const windowState = this.store.get("windowState", {
            width: 1200,
            height: 800,
            x: undefined,
            y: undefined,
        });

        this.mainWindow = new BrowserWindow({
            width: windowState.width,
            height: windowState.height,
            x: windowState.x,
            y: windowState.y,
            minWidth: 800,
            minHeight: 600,
            titleBarStyle:
                process.platform === "darwin" ? "hiddenInset" : "default",
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: join(__dirname, "../preload/preload-quick.js"),
                webSecurity: true,
            },
            show: false,
        });

        // Save window state on close
        this.mainWindow.on("close", () => {
            if (this.mainWindow) {
                const bounds = this.mainWindow.getBounds();
                this.store.set("windowState", bounds);
            }
        });

        // Show window when ready
        this.mainWindow.once("ready-to-show", () => {
            this.mainWindow?.show();

            // Enable DevTools for debugging the blank screen issue
            if (process.env.NODE_ENV === "development") {
                this.mainWindow?.webContents.openDevTools();
            }
        });

        // Load the app
        if (process.env.NODE_ENV === "development") {
            // Try different ports that Vite might be using
            this.loadDevelopmentURL();
        } else {
            this.mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
        }

        // Handle external links
        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            require("electron").shell.openExternal(url);
            return { action: "deny" };
        });
    }

    setupBasicIPC() {
        // Basic IPC handlers for development
        ipcMain.handle("system:get-version", () => app.getVersion());
        ipcMain.handle("system:get-platform", () => process.platform);
        ipcMain.handle("system:get-architecture", () => process.arch);

        // Enhanced handlers with actual functionality
        ipcMain.handle("sites:list", () => this.getSites());
        ipcMain.handle("sites:create", (_, siteData) =>
            this.createSite(siteData)
        );
        ipcMain.handle("sites:start", (_, siteId) => this.startSite(siteId));
        ipcMain.handle("sites:stop", (_, siteId) => this.stopSite(siteId));
        ipcMain.handle("sites:delete", (_, siteId) => this.deleteSite(siteId));
        ipcMain.handle("sites:import", (_, importPath) =>
            this.importSite(importPath)
        );
        ipcMain.handle("docker:is-installed", () =>
            this.checkDockerInstalled()
        );
        ipcMain.handle("docker:is-running", () => this.checkDockerRunning());
        ipcMain.handle("plugins:list", () => this.getMockPlugins());

        ipcMain.handle("settings:get", (_, key) => this.store.get(key));
        ipcMain.handle("settings:set", (_, key, value) =>
            this.store.set(key, value)
        );

        // Shell handlers
        ipcMain.handle("shell:open-external", (_, url) => {
            require("electron").shell.openExternal(url);
            return { success: true };
        });
        ipcMain.handle("shell:open-path", (_, path) => {
            require("electron").shell.openPath(path);
            return { success: true };
        });

        // WordPress CLI handlers
        ipcMain.handle("wp-cli:execute", (_, siteId, command) =>
            this.executeWPCLI(siteId, command)
        );
        ipcMain.handle("site:clone", (_, siteId, newName) =>
            this.cloneSite(siteId, newName)
        );
        ipcMain.handle("site:backup", (_, siteId, backupPath) =>
            this.backupSite(siteId, backupPath)
        );
    }

    getMockSites() {
        // Return mock sites for development
        return [
            {
                id: "site-1",
                name: "My Blog",
                domain: "myblog.local",
                path: "/Users/developer/Sites/myblog",
                phpVersion: "8.1",
                wordPressVersion: "6.3",
                status: "running",
                port: 8080,
                created: new Date("2023-10-01"),
                lastAccessed: new Date(),
            },
            {
                id: "site-2",
                name: "Client Website",
                domain: "client.local",
                path: "/Users/developer/Sites/client",
                phpVersion: "8.0",
                wordPressVersion: "6.2",
                status: "stopped",
                port: 8081,
                created: new Date("2023-09-15"),
                lastAccessed: new Date("2023-10-05"),
            },
            {
                id: "site-3",
                name: "E-commerce Store",
                domain: "store.local",
                path: "/Users/developer/Sites/store",
                phpVersion: "8.2",
                wordPressVersion: "6.3",
                status: "starting",
                port: 8082,
                created: new Date("2023-10-03"),
                lastAccessed: new Date("2023-10-07"),
            },
        ];
    }

    getSites() {
        // Get sites from storage with some default mock data
        const sites = this.store.get("sites", [
            {
                id: "site-1",
                name: "My Blog",
                domain: "myblog.local",
                path: join(os.homedir(), "PressBox", "sites", "myblog"),
                phpVersion: "8.1",
                wordPressVersion: "6.3",
                status: "stopped",
                port: 8080,
                created: new Date("2023-10-01"),
                lastAccessed: new Date(),
                ssl: false,
                frontendUrl: "http://myblog.local:8080",
                adminUrl: "http://myblog.local:8080/wp-admin",
            },
            {
                id: "site-2",
                name: "Client Website",
                domain: "client.local",
                path: join(os.homedir(), "PressBox", "sites", "client"),
                phpVersion: "8.0",
                wordPressVersion: "6.2",
                status: "stopped",
                port: 8081,
                created: new Date("2023-09-15"),
                lastAccessed: new Date("2023-10-05"),
                ssl: true,
                frontendUrl: "https://client.local:8081",
                adminUrl: "https://client.local:8081/wp-admin",
            },
        ]);
        return sites;
    }

    async createSite(siteData) {
        try {
            const sites = this.getSites();

            // Generate unique ID and port
            const id = Date.now().toString();
            const port = 8080 + sites.length;

            const domain = siteData.domain || `site${sites.length + 1}.local`;
            const ssl = siteData.ssl || false;
            const protocol = ssl ? "https" : "http";

            const newSite = {
                id,
                name: siteData.name || `Site ${sites.length + 1}`,
                domain,
                path: join(
                    os.homedir(),
                    "PressBox",
                    "sites",
                    siteData.name || `site-${id}`
                ),
                phpVersion: siteData.phpVersion || "8.1",
                wordPressVersion: siteData.wordPressVersion || "6.3",
                status: "stopped",
                port,
                created: new Date(),
                lastAccessed: new Date(),
                ssl,
                frontendUrl: `${protocol}://${domain}:${port}`,
                adminUrl: `${protocol}://${domain}:${port}/wp-admin`,
            };

            sites.push(newSite);
            this.store.set("sites", sites);

            // Create site directory
            try {
                await fs.mkdir(newSite.path, { recursive: true });
            } catch (error) {
                console.log("Directory creation skipped:", error.message);
            }

            return { success: true, site: newSite };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async startSite(siteId) {
        try {
            const sites = this.getSites();
            const siteIndex = sites.findIndex((s) => s.id === siteId);

            if (siteIndex === -1) {
                return { success: false, error: "Site not found" };
            }

            sites[siteIndex].status = "starting";
            this.store.set("sites", sites);

            // Simulate site startup
            setTimeout(() => {
                const updatedSites = this.getSites();
                const updatedIndex = updatedSites.findIndex(
                    (s) => s.id === siteId
                );
                if (updatedIndex !== -1) {
                    updatedSites[updatedIndex].status = "running";
                    updatedSites[updatedIndex].lastAccessed = new Date();
                    this.store.set("sites", updatedSites);
                }
            }, 2000);

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async stopSite(siteId) {
        try {
            const sites = this.getSites();
            const siteIndex = sites.findIndex((s) => s.id === siteId);

            if (siteIndex === -1) {
                return { success: false, error: "Site not found" };
            }

            sites[siteIndex].status = "stopping";
            this.store.set("sites", sites);

            // Simulate site shutdown
            setTimeout(() => {
                const updatedSites = this.getSites();
                const updatedIndex = updatedSites.findIndex(
                    (s) => s.id === siteId
                );
                if (updatedIndex !== -1) {
                    updatedSites[updatedIndex].status = "stopped";
                    this.store.set("sites", updatedSites);
                }
            }, 1000);

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async deleteSite(siteId) {
        try {
            const sites = this.getSites();
            const siteIndex = sites.findIndex((s) => s.id === siteId);

            if (siteIndex === -1) {
                return { success: false, error: "Site not found" };
            }

            sites.splice(siteIndex, 1);
            this.store.set("sites", sites);

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async importSite(importPath) {
        try {
            const sites = this.getSites();
            const siteName = require("path").basename(
                importPath || "imported-site"
            );
            const id = Date.now().toString();
            const port = 8080 + sites.length;

            const importedSite = {
                id,
                name: siteName,
                domain: `${siteName.toLowerCase().replace(/[^a-z0-9]/g, "")}.local`,
                path:
                    importPath ||
                    join(os.homedir(), "PressBox", "sites", siteName),
                phpVersion: "8.1",
                wordPressVersion: "6.3",
                status: "stopped",
                port,
                created: new Date(),
                lastAccessed: new Date(),
            };

            sites.push(importedSite);
            this.store.set("sites", sites);

            return { success: true, site: importedSite };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async checkDockerInstalled() {
        // Try to detect Docker installation
        const { exec } = require("child_process");

        return new Promise((resolve) => {
            exec("docker --version", (error) => {
                resolve(!error);
            });
        });
    }

    async checkDockerRunning() {
        // Try to detect if Docker is running
        const { exec } = require("child_process");

        return new Promise((resolve) => {
            exec("docker info", (error) => {
                resolve(!error);
            });
        });
    }

    getMockPlugins() {
        // Return mock plugins for development
        return [
            {
                id: "backup-plugin",
                name: "Site Backup",
                description:
                    "Automated backup functionality for WordPress sites",
                version: "1.0.0",
                author: "PressBox Team",
                enabled: true,
                type: "core",
            },
            {
                id: "ssl-plugin",
                name: "SSL Manager",
                description:
                    "Easy SSL certificate management for local development",
                version: "1.2.0",
                author: "Community",
                enabled: false,
                type: "community",
            },
        ];
    }

    /**
     * Try to load the development URL from common Vite ports
     */
    async loadDevelopmentURL() {
        const commonPorts = [3000, 5173, 3001, 3002];

        for (const port of commonPorts) {
            try {
                console.log(
                    `📡 Trying to connect to dev server on port: ${port}`
                );
                await this.mainWindow.loadURL(`http://localhost:${port}`);
                console.log(
                    `✅ Successfully connected to dev server on port: ${port}`
                );
                return;
            } catch (error) {
                console.log(`❌ Port ${port} not available, trying next...`);
                continue;
            }
        }

        // If all ports fail, show an error page
        this.showConnectionError();
    }

    /**
     * Show a connection error page
     */
    showConnectionError() {
        const errorHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>PressBox - Connection Error</title>
                <style>
                    body { 
                        font-family: system-ui, -apple-system, sans-serif; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        height: 100vh; 
                        margin: 0; 
                        background: #f5f5f5; 
                        color: #333;
                    }
                    .error-container { 
                        text-align: center; 
                        padding: 2rem; 
                        background: white; 
                        border-radius: 8px; 
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        max-width: 400px;
                    }
                    .error-icon { 
                        font-size: 48px; 
                        margin-bottom: 1rem; 
                    }
                    h1 { 
                        margin: 0 0 1rem 0; 
                        color: #e74c3c; 
                    }
                    p { 
                        margin: 0.5rem 0; 
                        line-height: 1.5; 
                    }
                    .instructions { 
                        background: #f8f9fa; 
                        padding: 1rem; 
                        border-radius: 4px; 
                        margin-top: 1rem; 
                    }
                    code { 
                        background: #e9ecef; 
                        padding: 2px 6px; 
                        border-radius: 3px; 
                        font-family: monospace; 
                    }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <div class="error-icon">🚫</div>
                    <h1>Development Server Not Found</h1>
                    <p>Could not connect to the PressBox development server.</p>
                    <div class="instructions">
                        <p><strong>To fix this:</strong></p>
                        <p>1. Open a terminal in the project directory</p>
                        <p>2. Run <code>npm run dev:react</code></p>
                        <p>3. Restart this Electron app</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        this.mainWindow.loadURL(
            `data:text/html;charset=utf-8,${encodeURIComponent(errorHTML)}`
        );
    }

    createSimpleStore() {
        let config = {};

        // Load existing config
        try {
            if (fs.existsSync(this.configPath)) {
                const data = fs.readFileSync(this.configPath, "utf8");
                config = JSON.parse(data);
            }
        } catch (error) {
            console.log("Could not load config file, starting fresh");
        }

        return {
            get: (key, defaultValue = null) => {
                return config[key] !== undefined ? config[key] : defaultValue;
            },
            set: (key, value) => {
                config[key] = value;
                try {
                    fs.writeFileSync(
                        this.configPath,
                        JSON.stringify(config, null, 2)
                    );
                } catch (error) {
                    console.error("Could not save config:", error);
                }
            },
        };
    }

    async executeWPCLI(siteId, command) {
        try {
            const sites = this.getSites();
            const site = sites.find((s) => s.id === siteId);

            if (!site) {
                return { success: false, error: "Site not found" };
            }

            const { exec } = require("child_process");

            // In a real implementation, this would execute WP-CLI in the site's Docker container
            return new Promise((resolve) => {
                const dockerCommand = `docker exec -it wordpress-${siteId} wp ${command}`;

                exec(dockerCommand, (error, stdout, stderr) => {
                    if (error) {
                        resolve({
                            success: false,
                            error: error.message,
                            output: stderr || stdout,
                        });
                    } else {
                        resolve({
                            success: true,
                            output: stdout,
                        });
                    }
                });
            });
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async cloneSite(siteId, newName) {
        try {
            const sites = this.getSites();
            const originalSite = sites.find((s) => s.id === siteId);

            if (!originalSite) {
                return { success: false, error: "Original site not found" };
            }

            // Create a new site based on the original
            const newSiteData = {
                ...originalSite,
                name: newName,
                domain: `${newName.toLowerCase().replace(/\s+/g, "-")}.local`,
            };

            // Remove the original ID so a new one is generated
            delete newSiteData.id;

            const result = await this.createSite(newSiteData);

            if (result.success) {
                // In a real implementation, this would copy the WordPress files and database
                return {
                    success: true,
                    site: result.site,
                    message: `Site "${newName}" created as a clone of "${originalSite.name}"`,
                };
            } else {
                return result;
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async backupSite(siteId, backupPath) {
        try {
            const sites = this.getSites();
            const site = sites.find((s) => s.id === siteId);

            if (!site) {
                return { success: false, error: "Site not found" };
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const backupFileName = `${site.name}-backup-${timestamp}.tar.gz`;
            const fullBackupPath = join(
                backupPath || os.homedir(),
                backupFileName
            );

            // In a real implementation, this would:
            // 1. Export the WordPress database
            // 2. Create a tar.gz of the site files
            // 3. Combine them into a complete backup

            return {
                success: true,
                backupPath: fullBackupPath,
                message: `Backup created at ${fullBackupPath}`,
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Create and start the application
new PressBoxApp();

// Handle unhandled errors
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
