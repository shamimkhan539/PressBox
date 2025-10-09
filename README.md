# PressBox: The Ultimate WordPress Development Environment - From Vision to Revolutionary Reality.

![PressBox Logo](https://via.placeholder.com/200x80/1e40af/ffffff?text=PressBox)

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/shamimkhan539/PressBox/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/shamimkhan539/PressBox/releases)
[![Docker](https://img.shields.io/badge/docker-required-blue.svg)](https://www.docker.com/products/docker-desktop)

**Cross-platform local WordPress development environment** - A modern, open-source alternative to LocalWP

PressBox is a desktop application built with Electron, React, and TypeScript that provides a fast, extensible, and user-friendly way to create and manage local WordPress development sites.

## ✨ Features

### Core Features

- 🚀 **One-click WordPress site creation** with auto-setup
- 🐳 **Docker-powered environments** for consistency and isolation
- 🔧 **Multiple PHP versions** support per site
- 🌐 **SSL certificate generation** for local HTTPS
- 📁 **File browser integration** with VS Code quick-open
- 🔄 **Site cloning and import/export** functionality
- 📊 **Real-time logs and monitoring**
- 💻 **WP-CLI Terminal** with full WordPress command-line access
- 🗄️ **Database Management** with Adminer integration and SQL tools
- 🔧 **Professional Site Details** with comprehensive management modals

### Architecture

- 🖥️ **Cross-platform**: Windows, macOS, and Linux support
- ⚡ **Modern stack**: Electron + React + TypeScript
- 🔌 **Plugin system**: Extensible with third-party addons
- 🎨 **Dark/Light themes** with system preference detection
- 🔒 **Secure IPC** communication between processes

### Plugin System

- 📦 **Addon SDK** for developers
- 🎯 **Widget registration** for custom UI components
- 🪝 **Event hooks** for site lifecycle integration
- ⚙️ **Settings API** for plugin configuration
- 🎨 **Theme support** for custom styling

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Electron + Node.js
- **Containerization**: Docker + Docker Compose
- **Package Manager**: npm
- **Build Tools**: Vite + Electron Forge
- **Code Quality**: ESLint + TypeScript strict mode

## 📋 Prerequisites

Before running PressBox, ensure you have:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Docker Desktop** (for site containerization)
- **Git** (for version control)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/pressbox/pressbox.git
cd pressbox
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

This will start both the Electron main process and the React development server.

### 4. Build for Production

```bash
npm run build
npm run package
```

## 📁 Project Structure

```
pressbox/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── services/         # Core services (Docker, WordPress, Plugins)
│   │   ├── ipc/             # IPC handlers
│   │   └── main.ts          # Main entry point
│   ├── preload/             # Preload scripts (secure bridge)
│   │   └── preload.ts       # API exposure to renderer
│   ├── renderer/            # React frontend
│   │   ├── src/
│   │   │   ├── components/  # Reusable UI components
│   │   │   ├── pages/       # Page components
│   │   │   ├── contexts/    # React contexts
│   │   │   └── utils/       # Utility functions
│   │   └── index.html       # HTML entry point
│   └── shared/              # Shared types and utilities
│       └── types.ts         # TypeScript type definitions
├── assets/                  # Static assets
├── dist/                    # Built application
└── docs/                    # Documentation
```

## 🔌 Plugin Development

PressBox supports a powerful plugin system that allows developers to extend functionality:

### Creating a Plugin

1. Create a new directory in the plugins folder
2. Add a `package.json` with plugin manifest:

```json
{
    "id": "my-awesome-plugin",
    "name": "My Awesome Plugin",
    "version": "1.0.0",
    "description": "Adds awesome functionality to PressBox",
    "author": "Your Name",
    "main": "index.js",
    "contributes": {
        "commands": [
            {
                "id": "myPlugin.doSomething",
                "title": "Do Something Awesome"
            }
        ],
        "menus": [
            {
                "id": "myPlugin.menu",
                "label": "My Plugin"
            }
        ]
    }
}
```

3. Create your plugin's main file:

```typescript
// index.js
export function activate(api: PluginAPI) {
    // Register commands, views, etc.
    api.addCommand(
        {
            id: "myPlugin.doSomething",
            title: "Do Something Awesome",
        },
        () => {
            api.showNotification("Hello from my plugin!", "success");
        }
    );
}

export function deactivate() {
    // Cleanup when plugin is disabled
}
```

### Plugin API

The Plugin API provides access to:

- **Site Management**: Create, start, stop, delete sites
- **UI Extensions**: Add commands, menus, views
- **Settings**: Store and retrieve plugin configuration
- **Events**: Listen to application events
- **File System**: Read/write files (with security restrictions)

## 🐳 Docker Integration

PressBox uses Docker to provide isolated, consistent development environments:

### Supported Services

- **WordPress**: Latest and specific versions
- **PHP**: 7.4, 8.0, 8.1, 8.2, 8.3
- **MySQL/MariaDB**: Database options
- **Nginx/Apache**: Web server options
- **Redis**: Caching (via plugins)
- **Mailcatcher**: Email testing (via plugins)

### Container Management

- Automatic container lifecycle management
- Port allocation and SSL certificate generation
- Volume mounting for persistent data
- Log aggregation and viewing

## 🛡️ Security

PressBox implements several security measures:

- **Context Isolation**: Renderer process runs in isolated context
- **Preload Scripts**: Secure API exposure with limited surface
- **CSP Headers**: Content Security Policy for web content
- **Sandboxing**: Renderer process sandboxing enabled
- **Plugin Security**: Limited plugin API with permission system

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow the existing code formatting (ESLint + Prettier)
- Write meaningful commit messages
- Add JSDoc comments for public APIs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [LocalWP](https://localwp.com/) for inspiration
- [Docker](https://www.docker.com/) for containerization
- [Electron](https://www.electronjs.org/) for cross-platform desktop apps
- [React](https://reactjs.org/) for the user interface
- [Tailwind CSS](https://tailwindcss.com/) for styling

## 📞 Support

- 📖 **Documentation**: [docs.pressbox.dev](https://docs.pressbox.dev)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/pressbox/pressbox/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/pressbox/pressbox/discussions)
- 🆘 **Help**: [Discord Community](https://discord.gg/pressbox)

---

**Made with ❤️ by the PressBox team**
