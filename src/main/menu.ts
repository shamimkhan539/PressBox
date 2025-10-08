import { Menu, MenuItem, BrowserWindow, shell, app } from "electron";

/**
 * Application Menu
 *
 * Creates the native application menu for different platforms.
 */
export function createApplicationMenu(mainWindow: BrowserWindow | null): Menu {
    const template: any[] = [
        // Application menu (macOS)
        ...(process.platform === "darwin"
            ? [
                  {
                      label: app.getName(),
                      submenu: [
                          { role: "about" },
                          { type: "separator" },
                          { role: "services" },
                          { type: "separator" },
                          { role: "hide" },
                          { role: "hideothers" },
                          { role: "unhide" },
                          { type: "separator" },
                          { role: "quit" },
                      ],
                  },
              ]
            : []),

        // File Menu
        {
            label: "File",
            submenu: [
                {
                    label: "New Site...",
                    accelerator: "CmdOrCtrl+N",
                    click: () => {
                        mainWindow?.webContents.send("menu:new-site");
                    },
                },
                { type: "separator" },
                {
                    label: "Import Site...",
                    accelerator: "CmdOrCtrl+I",
                    click: () => {
                        mainWindow?.webContents.send("menu:import-site");
                    },
                },
                {
                    label: "Export Site...",
                    accelerator: "CmdOrCtrl+E",
                    click: () => {
                        mainWindow?.webContents.send("menu:export-site");
                    },
                },
                { type: "separator" },
                ...(process.platform !== "darwin" ? [{ role: "quit" }] : []),
            ],
        },

        // Edit Menu
        {
            label: "Edit",
            submenu: [
                { role: "undo" },
                { role: "redo" },
                { type: "separator" },
                { role: "cut" },
                { role: "copy" },
                { role: "paste" },
                ...(process.platform === "darwin"
                    ? [
                          { role: "pasteAndMatchStyle" },
                          { role: "delete" },
                          { role: "selectAll" },
                          { type: "separator" },
                          {
                              label: "Speech",
                              submenu: [
                                  { role: "startSpeaking" },
                                  { role: "stopSpeaking" },
                              ],
                          },
                      ]
                    : [
                          { role: "delete" },
                          { type: "separator" },
                          { role: "selectAll" },
                      ]),
            ],
        },

        // Sites Menu
        {
            label: "Sites",
            submenu: [
                {
                    label: "Start All Sites",
                    click: () => {
                        mainWindow?.webContents.send("menu:start-all-sites");
                    },
                },
                {
                    label: "Stop All Sites",
                    click: () => {
                        mainWindow?.webContents.send("menu:stop-all-sites");
                    },
                },
                { type: "separator" },
                {
                    label: "Refresh Sites",
                    accelerator: "CmdOrCtrl+R",
                    click: () => {
                        mainWindow?.webContents.send("menu:refresh-sites");
                    },
                },
            ],
        },

        // Tools Menu
        {
            label: "Tools",
            submenu: [
                {
                    label: "Docker Management",
                    click: () => {
                        mainWindow?.webContents.send(
                            "menu:open-docker-management"
                        );
                    },
                },
                {
                    label: "Plugin Manager",
                    click: () => {
                        mainWindow?.webContents.send(
                            "menu:open-plugin-manager"
                        );
                    },
                },
                { type: "separator" },
                {
                    label: "Open Sites Folder",
                    click: async () => {
                        const { homedir } = require("os");
                        const { join } = require("path");
                        const sitesPath = join(homedir(), "PressBox", "sites");
                        await shell.openPath(sitesPath);
                    },
                },
                {
                    label: "Open Plugins Folder",
                    click: async () => {
                        const { homedir } = require("os");
                        const { join } = require("path");
                        const pluginsPath = join(
                            homedir(),
                            "PressBox",
                            "plugins"
                        );
                        await shell.openPath(pluginsPath);
                    },
                },
                { type: "separator" },
                {
                    label: "Settings...",
                    accelerator:
                        process.platform === "darwin" ? "Cmd+," : "Ctrl+,",
                    click: () => {
                        mainWindow?.webContents.send("menu:open-settings");
                    },
                },
            ],
        },

        // View Menu
        {
            label: "View",
            submenu: [
                { role: "reload" },
                { role: "forceReload" },
                { role: "toggleDevTools" },
                { type: "separator" },
                { role: "resetZoom" },
                { role: "zoomIn" },
                { role: "zoomOut" },
                { type: "separator" },
                { role: "togglefullscreen" },
            ],
        },

        // Window Menu
        {
            label: "Window",
            submenu: [
                { role: "minimize" },
                { role: "close" },
                ...(process.platform === "darwin"
                    ? [
                          { type: "separator" },
                          { role: "front" },
                          { type: "separator" },
                          { role: "window" },
                      ]
                    : []),
            ],
        },

        // Help Menu
        {
            label: "Help",
            submenu: [
                {
                    label: "Documentation",
                    click: async () => {
                        await shell.openExternal(
                            "https://github.com/pressbox/pressbox#readme"
                        );
                    },
                },
                {
                    label: "Report Issue",
                    click: async () => {
                        await shell.openExternal(
                            "https://github.com/pressbox/pressbox/issues"
                        );
                    },
                },
                { type: "separator" },
                {
                    label: "Check for Updates",
                    click: () => {
                        mainWindow?.webContents.send("menu:check-updates");
                    },
                },
                ...(process.platform !== "darwin"
                    ? [
                          { type: "separator" },
                          {
                              label: "About PressBox",
                              click: () => {
                                  mainWindow?.webContents.send("menu:about");
                              },
                          },
                      ]
                    : []),
            ],
        },
    ];

    return Menu.buildFromTemplate(template);
}
