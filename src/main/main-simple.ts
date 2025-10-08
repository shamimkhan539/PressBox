import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import Store from "electron-store";

/**
 * Minimal PressBox Main Process - Development Version
 *
 * This is a simplified version to get the app running quickly.
 * Full services will be integrated once the basic app is working.
 */

class PressBoxApp {
    private mainWindow: BrowserWindow | null = null;
    private store: Store;

    constructor() {
        this.store = new Store();
        this.init();
    }

    private async init(): Promise<void> {
        // Handle app ready
        await app.whenReady();

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

    private createWindow(): void {
        const windowState = (this.store as any).get("windowState", {
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
                preload: join(__dirname, "../preload/preload-simple.js"),
                webSecurity: true,
            },
            show: false,
        });

        // Save window state on close
        this.mainWindow.on("close", () => {
            if (this.mainWindow) {
                const bounds = this.mainWindow.getBounds();
                (this.store as any).set("windowState", bounds);
            }
        });

        // Show window when ready
        this.mainWindow.once("ready-to-show", () => {
            this.mainWindow?.show();

            if (process.env.NODE_ENV === "development") {
                this.mainWindow?.webContents.openDevTools();
            }
        });

        // Load the app
        if (process.env.NODE_ENV === "development") {
            this.mainWindow.loadURL("http://localhost:3000");
        } else {
            this.mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
        }

        // Handle external links
        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            require("electron").shell.openExternal(url);
            return { action: "deny" };
        });
    }

    private setupBasicIPC(): void {
        // Basic IPC handlers for development
        ipcMain.handle("system:get-version", () => app.getVersion());
        ipcMain.handle("system:get-platform", () => process.platform);
        ipcMain.handle("system:get-architecture", () => process.arch);

        // Placeholder handlers
        ipcMain.handle("sites:list", () => []);
        ipcMain.handle("docker:is-installed", () => false);
        ipcMain.handle("docker:is-running", () => false);
        ipcMain.handle("plugins:list", () => []);

        ipcMain.handle("settings:get", (_, key: string) =>
            (this.store as any).get(key)
        );
        ipcMain.handle("settings:set", (_, key: string, value: any) =>
            (this.store as any).set(key, value)
        );
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
