import { app, BrowserWindow, ipcMain, Menu, shell, dialog } from "electron";
import { join } from "path";
import { autoUpdater } from "electron-updater";
import Store from "electron-store";
import { WordPressManager } from "./services/wordpressManager";
import { DockerManager } from "./services/dockerManager";
import { PluginManager } from "./services/pluginManager";
import { ExportManager } from "./services/exportManager";
import { BlueprintManager } from "./services/blueprintManager";
import { EnvironmentManager } from "./services/environmentManager";
import { IPCHandlers } from "./ipc/handlers";
import { createApplicationMenu } from "./menu";

/**
 * PressBox Main Process
 *
 * This is the main entry point for the Electron application.
 * It manages the application lifecycle, creates windows, and handles
 * communication between the renderer and main processes.
 */

class PressBoxApp {
    private mainWindow: BrowserWindow | null = null;
    private store: Store;
    private wordPressManager: WordPressManager;
    private dockerManager: DockerManager;
    private pluginManager: PluginManager;
    private exportManager: ExportManager;
    private blueprintManager: BlueprintManager;
    private environmentManager: EnvironmentManager;
    private ipcHandlers: IPCHandlers;

    constructor() {
        console.log("🚀 PressBox Main Process Starting...");

        console.log("🔧 Creating Store...");
        this.store = new Store();

        console.log("🐳 Creating DockerManager...");
        this.dockerManager = DockerManager.getInstance();

        console.log("🌐 Creating WordPressManager...");
        this.wordPressManager = new WordPressManager(this.dockerManager);

        console.log("🔌 Creating PluginManager...");
        this.pluginManager = new PluginManager();

        console.log("📦 Creating ExportManager...");
        this.exportManager = new ExportManager(this.dockerManager);

        console.log("🌍 Creating EnvironmentManager...");
        this.environmentManager = EnvironmentManager.getInstance();

        console.log("📋 Creating BlueprintManager...");
        this.blueprintManager = new BlueprintManager(
            this.dockerManager,
            this.wordPressManager
        );

        console.log("📡 Creating IPCHandlers...");
        this.ipcHandlers = new IPCHandlers(
            this.wordPressManager,
            this.dockerManager,
            this.pluginManager,
            this.blueprintManager,
            this.environmentManager,
            this.store
        );

        this.init();
    }

    private async init(): Promise<void> {
        console.log("⏳ Waiting for app ready...");
        // Handle app ready
        await app.whenReady();
        console.log("✅ App is ready!");

        console.log("🪟 Creating main window...");
        this.createWindow();

        console.log("📡 Setting up IPC...");
        this.setupIPC();

        console.log("📋 Setting up menu...");
        this.setupMenu();

        console.log("🔄 Setting up auto updater...");
        this.setupAutoUpdater();

        // Initialize services
        await this.environmentManager.initialize();
        await this.pluginManager.loadPlugins();

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

        // Prevent navigation to external URLs
        app.on("web-contents-created", (_, contents) => {
            contents.setWindowOpenHandler(({ url }) => {
                shell.openExternal(url);
                return { action: "deny" };
            });
        });
    }

    private createWindow(): void {
        const windowState = (this.store as any).get("windowState", {
            width: 1200,
            height: 800,
            x: undefined,
            y: undefined,
        }) as any;

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
                // enableRemoteModule: false, // Deprecated
                preload:
                    process.env.NODE_ENV === "development"
                        ? join(__dirname, "../../dist/main/preload/preload.js")
                        : join(__dirname, "../preload/preload.js"),
                webSecurity: true,
            },
            icon: join(__dirname, "../../assets/icon.png"),
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
    }

    private setupIPC(): void {
        console.log("📡 Setting up IPC handlers...");
        // Register all IPC handlers
        this.ipcHandlers.registerHandlers();
        console.log("✅ IPC handlers registered successfully");
    }

    private setupMenu(): void {
        const menu = createApplicationMenu(this.mainWindow);
        Menu.setApplicationMenu(menu);
    }

    private setupAutoUpdater(): void {
        if (process.env.NODE_ENV === "production") {
            autoUpdater.checkForUpdatesAndNotify();

            autoUpdater.on("update-available", () => {
                dialog.showMessageBox(this.mainWindow!, {
                    type: "info",
                    title: "Update Available",
                    message:
                        "A new version of PressBox is available. It will be downloaded in the background.",
                    buttons: ["OK"],
                });
            });

            autoUpdater.on("update-downloaded", () => {
                dialog
                    .showMessageBox(this.mainWindow!, {
                        type: "info",
                        title: "Update Ready",
                        message:
                            "Update downloaded. The application will restart to apply the update.",
                        buttons: ["Restart Now", "Later"],
                    })
                    .then((result) => {
                        if (result.response === 0) {
                            autoUpdater.quitAndInstall();
                        }
                    });
            });
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
