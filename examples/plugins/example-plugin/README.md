# Example Plugin

This is an example plugin that demonstrates the PressBox Plugin API capabilities.

## Features

- **Commands**: Adds custom commands to the application
- **Views**: Provides a custom sidebar view
- **Settings**: Configurable plugin settings
- **Events**: Listens to application events
- **Notifications**: Shows user notifications

## Installation

1. Copy this plugin directory to your PressBox plugins folder
2. Restart PressBox or use the Plugin Manager to load the plugin
3. The plugin will be automatically activated

## Usage

Once installed, you can:

- Use the "Hello World" command from the command palette
- View site information using the "Show Site Info" command
- Access the example view from the sidebar
- Configure plugin settings in the Settings page

## API Demonstration

This plugin shows how to:

### Register Commands

```javascript
pluginAPI.addCommand(
    {
        id: "example.helloWorld",
        title: "Hello World",
        category: "Example",
    },
    async () => {
        // Command handler
    }
);
```

### Add Views

```javascript
pluginAPI.addView(
    {
        id: "example.sidebarView",
        name: "Example View",
        type: "sidebar",
    },
    {
        render: () => {
            return "<div>Custom view content</div>";
        },
    }
);
```

### Listen to Events

```javascript
pluginAPI.on("site:created", (site) => {
    console.log("New site created:", site.name);
});
```

### Use Settings

```javascript
const greeting = await pluginAPI.getSetting("example.greeting");
await pluginAPI.setSetting("example.greeting", "New greeting!");
```

## Development

To modify this plugin:

1. Edit the `index.js` file
2. Update the `package.json` manifest if needed
3. Reload the plugin in PressBox

## Plugin Structure

```
example-plugin/
├── package.json    # Plugin manifest
├── index.js        # Main plugin code
├── README.md       # This file
└── config.json     # Plugin configuration (created at runtime)
```
