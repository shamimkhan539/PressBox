/**
 * Example Plugin for PressBox
 *
 * This is a demonstration plugin that shows how to use the PressBox Plugin API
 * to extend the application with custom functionality.
 */

let pluginAPI;

/**
 * Plugin activation function
 * Called when the plugin is loaded and enabled
 */
export function activate(api) {
    pluginAPI = api;

    console.log("Example Plugin activated!");

    // Register commands
    registerCommands();

    // Register views
    registerViews();

    // Listen to events
    setupEventListeners();

    // Show activation notification
    api.showNotification("Example Plugin loaded successfully!", "success");
}

/**
 * Plugin deactivation function
 * Called when the plugin is disabled or unloaded
 */
export function deactivate() {
    console.log("Example Plugin deactivated!");

    // Cleanup if needed
    // Remove event listeners, clear timers, etc.
}

/**
 * Register plugin commands
 */
function registerCommands() {
    // Hello World command
    pluginAPI.addCommand(
        {
            id: "example.helloWorld",
            title: "Hello World",
            category: "Example",
        },
        async () => {
            const greeting =
                (await pluginAPI.getSetting("example.greeting")) ||
                "Hello from Example Plugin!";
            pluginAPI.showNotification(greeting, "info");
        }
    );

    // Site Info command
    pluginAPI.addCommand(
        {
            id: "example.siteInfo",
            title: "Show Site Info",
            category: "Example",
        },
        async () => {
            try {
                const sites = await pluginAPI.getSites();
                const siteCount = sites.length;
                const runningSites = sites.filter(
                    (site) => site.status === "running"
                ).length;

                const message = `You have ${siteCount} sites total, ${runningSites} currently running.`;
                pluginAPI.showNotification(message, "info");
            } catch (error) {
                pluginAPI.showNotification(
                    "Failed to get site information",
                    "error"
                );
                console.error("Error getting site info:", error);
            }
        }
    );
}

/**
 * Register plugin views
 */
function registerViews() {
    // Example sidebar view
    pluginAPI.addView(
        {
            id: "example.sidebarView",
            name: "Example View",
            type: "sidebar",
        },
        {
            render: () => {
                return `
        <div class="p-4">
          <h3 class="text-lg font-semibold mb-4">Example Plugin</h3>
          <p class="text-sm text-gray-600 mb-4">
            This is an example view from the Example Plugin.
          </p>
          <button 
            onclick="window.examplePlugin.runHelloWorld()" 
            class="btn-primary w-full mb-2"
          >
            Say Hello
          </button>
          <button 
            onclick="window.examplePlugin.showSiteInfo()" 
            class="btn-secondary w-full"
          >
            Site Info
          </button>
        </div>
      `;
            },
        }
    );

    // Expose functions to the window for button clicks
    window.examplePlugin = {
        runHelloWorld: () => pluginAPI.executeCommand("example.helloWorld"),
        showSiteInfo: () => pluginAPI.executeCommand("example.siteInfo"),
    };
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Listen for site events
    pluginAPI.on("site:created", (site) => {
        pluginAPI.showNotification(`New site created: ${site.name}`, "success");
    });

    pluginAPI.on("site:started", (site) => {
        console.log(`Site started: ${site.name}`);
    });

    pluginAPI.on("site:stopped", (site) => {
        console.log(`Site stopped: ${site.name}`);
    });

    // Listen for settings changes
    pluginAPI.on("settings:changed", (changes) => {
        if (changes.key && changes.key.startsWith("example.")) {
            console.log("Example plugin settings changed:", changes);
        }
    });
}

/**
 * Utility function to demonstrate async operations
 */
async function demonstrateAsyncOperation() {
    try {
        // Example: Read a file from the plugin directory
        const pluginPath = pluginAPI.getPluginPath("example-plugin");
        const configPath = `${pluginPath}/config.json`;

        if (await pluginAPI.exists(configPath)) {
            const config = await pluginAPI.readFile(configPath);
            console.log("Plugin config:", JSON.parse(config));
        } else {
            // Create default config
            const defaultConfig = {
                version: "1.0.0",
                initialized: new Date().toISOString(),
            };

            await pluginAPI.writeFile(
                configPath,
                JSON.stringify(defaultConfig, null, 2)
            );
            console.log("Created default plugin config");
        }
    } catch (error) {
        console.error("Error in async operation:", error);
    }
}

/**
 * Example of plugin lifecycle hook
 */
pluginAPI?.on("plugin:beforeLoad", () => {
    console.log("A plugin is about to be loaded");
});

pluginAPI?.on("plugin:afterLoad", (pluginInfo) => {
    console.log("Plugin loaded:", pluginInfo.name);
});

// Export additional functions that can be called by other plugins
export const examplePluginAPI = {
    getGreeting: async () => {
        return (await pluginAPI?.getSetting("example.greeting")) || "Hello!";
    },

    isEnabled: async () => {
        return (await pluginAPI?.getSetting("example.enabled")) !== false;
    },
};
