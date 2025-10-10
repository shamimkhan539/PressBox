# LocalWP-Style WordPress Development Server - Complete Guide

## 🎯 Project Overview

Create a desktop application using Electron that allows users to create and manage multiple local WordPress development environments without Docker, similar to LocalWP by Flywheel.

## 🏗️ Architecture Breakdown

### Technology Stack

```
Frontend (Renderer Process):
├── React 18 + TypeScript
├── Tailwind CSS for styling
├── Vite for build tooling
└── React Context for state management

Backend (Main Process):
├── Node.js + TypeScript
├── Electron for desktop wrapper
├── Native PHP server (built-in)
├── SQLite/MySQL for databases
└── File system operations

System Integration:
├── Hosts file management
├── Port allocation system
├── Process management
├── File permissions handling
```

## 📁 Project Structure

```
wordpress-dev-app/
├── src/
│   ├── main/                    # Electron main process (Backend)
│   │   ├── main.ts             # Entry point
│   │   ├── menu.ts             # Application menu
│   │   ├── ipc/                # Inter-process communication
│   │   │   └── handlers.ts     # IPC handlers
│   │   └── services/           # Core business logic
│   │       ├── wordpressManager.ts      # WordPress site management
│   │       ├── phpServerManager.ts      # PHP built-in server
│   │       ├── databaseManager.ts       # SQLite/MySQL handling
│   │       ├── hostsFileService.ts      # Domain management
│   │       ├── portManager.ts           # Port allocation
│   │       ├── fileManager.ts           # File operations
│   │       └── configManager.ts         # App configuration
│   │
│   ├── preload/                 # Security bridge
│   │   └── preload.ts          # Secure API exposure
│   │
│   ├── renderer/                # Frontend (React app)
│   │   ├── src/
│   │   │   ├── components/     # React components
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── SiteCard.tsx
│   │   │   │   ├── CreateSiteModal.tsx
│   │   │   │   └── Settings.tsx
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── contexts/       # React contexts
│   │   │   ├── types/          # TypeScript types
│   │   │   └── utils/          # Utility functions
│   │   └── index.html
│   │
│   └── shared/                  # Shared types and utilities
│       ├── types.ts            # Common TypeScript interfaces
│       └── constants.ts        # Shared constants
│
├── assets/                     # Static assets
├── scripts/                    # Build and utility scripts
├── dist/                       # Built application
├── package.json
├── tsconfig.json
└── electron-forge.config.js
```

## 🔧 Core Components

### 1. WordPress Manager Service

```typescript
interface WordPressSite {
    id: string;
    name: string;
    domain: string;
    path: string;
    port: number;
    phpVersion: string;
    wordPressVersion: string;
    status: "stopped" | "starting" | "running" | "error";
    created: Date;
    lastAccessed?: Date;
}

class WordPressManager {
    // Site creation with WordPress download
    async createSite(config: SiteConfig): Promise<WordPressSite>;

    // Start PHP built-in server
    async startSite(siteId: string): Promise<void>;

    // Stop site and cleanup
    async stopSite(siteId: string): Promise<void>;

    // List all sites
    async getSites(): Promise<WordPressSite[]>;

    // Delete site completely
    async deleteSite(siteId: string): Promise<void>;
}
```

### 2. PHP Server Manager

```typescript
class PHPServerManager {
    // Start PHP built-in development server
    async startPHPServer(sitePath: string, port: number): Promise<ChildProcess>;

    // Check PHP installation
    async checkPHPInstallation(): Promise<PHPInfo>;

    // Install portable PHP (if needed)
    async installPortablePHP(): Promise<void>;

    // Get available PHP versions
    async getAvailablePHPVersions(): Promise<string[]>;
}
```

### 3. Database Manager

```typescript
class DatabaseManager {
    // Create SQLite database for site
    async createSiteDatabase(siteName: string): Promise<string>;

    // Setup MySQL connection (optional)
    async setupMySQLDatabase(config: MySQLConfig): Promise<void>;

    // Import/Export database
    async exportDatabase(siteId: string): Promise<string>;
    async importDatabase(siteId: string, sqlFile: string): Promise<void>;
}
```

### 4. Hosts File Service

```typescript
class HostsFileService {
    // Add domain to hosts file
    static async addHostEntry(
        domain: string,
        ip: string = "127.0.0.1"
    ): Promise<void>;

    // Remove domain from hosts file
    static async removeHostEntry(domain: string): Promise<void>;

    // Check admin privileges
    static async checkAdminPrivileges(): Promise<boolean>;

    // Request elevation (Windows/macOS/Linux)
    static async requestElevation(): Promise<boolean>;
}
```

## 🚀 Step-by-Step Implementation

### Phase 1: Project Setup (Week 1)

#### 1.1 Initialize Project

```bash
# Create new project
mkdir wordpress-dev-app
cd wordpress-dev-app

# Initialize package.json
npm init -y

# Install Electron and development dependencies
npm install --save-dev electron
npm install --save-dev @electron-forge/cli
npm install --save-dev typescript
npm install --save-dev @types/node

# Initialize Electron Forge
npx electron-forge init . --template=typescript
```

#### 1.2 Install Dependencies

```bash
# Core dependencies
npm install electron-store        # Configuration storage
npm install node-downloader-helper # WordPress downloads
npm install extract-zip          # Archive extraction
npm install sqlite3             # Database
npm install yaml                # Configuration files

# Frontend dependencies
npm install react react-dom
npm install @types/react @types/react-dom
npm install tailwindcss
npm install vite
npm install @vitejs/plugin-react

# Development dependencies
npm install --save-dev concurrently
npm install --save-dev cross-env
npm install --save-dev rimraf
```

#### 1.3 Configure TypeScript

```json
// tsconfig.json
{
    "compilerOptions": {
        "target": "ES2020",
        "module": "CommonJS",
        "moduleResolution": "node",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "outDir": "dist",
        "baseUrl": ".",
        "paths": {
            "@/*": ["src/*"],
            "@shared/*": ["src/shared/*"]
        }
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist"]
}
```

### Phase 2: Core Backend Services (Week 2-3)

#### 2.1 WordPress Manager Implementation

```typescript
// src/main/services/wordpressManager.ts
export class WordPressManager {
    private sites: Map<string, WordPressSite> = new Map();
    private sitesPath: string;

    constructor() {
        this.sitesPath = path.join(os.homedir(), "WordPressDev", "sites");
    }

    async createSite(config: SiteConfig): Promise<WordPressSite> {
        // 1. Create site directory
        // 2. Download WordPress
        // 3. Extract to site directory
        // 4. Configure wp-config.php
        // 5. Setup database
        // 6. Register domain in hosts file
        // 7. Allocate port
        // 8. Save site configuration
    }

    async startSite(siteId: string): Promise<void> {
        // 1. Get site configuration
        // 2. Start PHP built-in server
        // 3. Update site status
        // 4. Monitor process
    }
}
```

#### 2.2 PHP Server Manager

```typescript
// src/main/services/phpServerManager.ts
export class PHPServerManager {
    async startPHPServer(
        sitePath: string,
        port: number
    ): Promise<ChildProcess> {
        const phpArgs = [
            "-S",
            `localhost:${port}`,
            "-t",
            sitePath,
            "-d",
            "display_errors=1",
            "-d",
            "error_reporting=E_ALL",
        ];

        const phpProcess = spawn("php", phpArgs, {
            cwd: sitePath,
            stdio: ["ignore", "pipe", "pipe"],
        });

        return phpProcess;
    }
}
```

#### 2.3 Hosts File Service

```typescript
// src/main/services/hostsFileService.ts
export class HostsFileService {
    private static getHostsFilePath(): string {
        return process.platform === "win32"
            ? "C:\\Windows\\System32\\drivers\\etc\\hosts"
            : "/etc/hosts";
    }

    static async addHostEntry(
        domain: string,
        ip: string = "127.0.0.1"
    ): Promise<void> {
        // 1. Check admin privileges
        // 2. Read current hosts file
        // 3. Add new entry
        // 4. Write back to hosts file
    }
}
```

### Phase 3: Frontend Development (Week 4-5)

#### 3.1 React Components Structure

```typescript
// src/renderer/src/components/Dashboard.tsx
export const Dashboard: React.FC = () => {
  const [sites, setSites] = useState<WordPressSite[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const loadSites = async () => {
    const siteList = await window.electronAPI.sites.list();
    setSites(siteList);
  };

  const handleCreateSite = async (config: SiteConfig) => {
    const newSite = await window.electronAPI.sites.create(config);
    await loadSites();
  };

  return (
    <div className="p-6">
      <Header onCreateSite={() => setIsCreating(true)} />
      <SiteGrid sites={sites} />
      {isCreating && (
        <CreateSiteModal
          onClose={() => setIsCreating(false)}
          onSubmit={handleCreateSite}
        />
      )}
    </div>
  );
};
```

#### 3.2 Site Management Components

```typescript
// src/renderer/src/components/SiteCard.tsx
export const SiteCard: React.FC<{ site: WordPressSite }> = ({ site }) => {
  const handleStart = async () => {
    await window.electronAPI.sites.start(site.id);
  };

  const handleStop = async () => {
    await window.electronAPI.sites.stop(site.id);
  };

  const handleOpenBrowser = () => {
    window.electronAPI.sites.openInBrowser(site.id);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold">{site.name}</h3>
      <p className="text-gray-600">{site.domain}</p>
      <div className="mt-4 flex space-x-2">
        <StatusIndicator status={site.status} />
        <ActionButtons
          site={site}
          onStart={handleStart}
          onStop={handleStop}
          onOpenBrowser={handleOpenBrowser}
        />
      </div>
    </div>
  );
};
```

### Phase 4: System Integration (Week 6)

#### 4.1 IPC Communication

```typescript
// src/main/ipc/handlers.ts
export class IPCHandlers {
    registerHandlers() {
        // Site management
        ipcMain.handle("sites:list", () => this.wordpressManager.getSites());
        ipcMain.handle("sites:create", (_, config) =>
            this.wordpressManager.createSite(config)
        );
        ipcMain.handle("sites:start", (_, siteId) =>
            this.wordpressManager.startSite(siteId)
        );
        ipcMain.handle("sites:stop", (_, siteId) =>
            this.wordpressManager.stopSite(siteId)
        );

        // System operations
        ipcMain.handle("system:check-admin", () =>
            HostsFileService.checkAdminPrivileges()
        );
        ipcMain.handle("system:request-elevation", () =>
            HostsFileService.requestElevation()
        );
    }
}
```

#### 4.2 Preload Security Bridge

```typescript
// src/preload/preload.ts
const electronAPI = {
    sites: {
        list: () => ipcRenderer.invoke("sites:list"),
        create: (config: SiteConfig) =>
            ipcRenderer.invoke("sites:create", config),
        start: (siteId: string) => ipcRenderer.invoke("sites:start", siteId),
        stop: (siteId: string) => ipcRenderer.invoke("sites:stop", siteId),
    },
    system: {
        checkAdmin: () => ipcRenderer.invoke("system:check-admin"),
        requestElevation: () => ipcRenderer.invoke("system:request-elevation"),
    },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
```

## 🛠️ Advanced Features

### 1. WordPress Download & Installation

```typescript
async downloadWordPress(version: string, sitePath: string): Promise<void> {
  const downloadUrl = version === 'latest'
    ? 'https://wordpress.org/latest.zip'
    : `https://wordpress.org/wordpress-${version}.zip`;

  const dl = new DownloaderHelper(downloadUrl, sitePath);
  await dl.start();
  await extractZip(path.join(sitePath, 'wordpress.zip'), sitePath);
}
```

### 2. Database Configuration

```typescript
async configureWordPress(sitePath: string, config: SiteConfig): Promise<void> {
  const wpConfig = `<?php
define('DB_NAME', '${config.dbName}');
define('DB_USER', '${config.dbUser}');
define('DB_PASSWORD', '${config.dbPassword}');
define('DB_HOST', 'localhost');
define('DB_CHARSET', 'utf8mb4');
// ... additional WordPress configuration
`;

  await fs.writeFile(path.join(sitePath, 'wp-config.php'), wpConfig);
}
```

### 3. Port Management

```typescript
class PortManager {
    private usedPorts = new Set<number>();

    async allocatePort(startFrom: number = 8000): Promise<number> {
        for (let port = startFrom; port < 9000; port++) {
            if (
                !this.usedPorts.has(port) &&
                (await this.isPortAvailable(port))
            ) {
                this.usedPorts.add(port);
                return port;
            }
        }
        throw new Error("No available ports");
    }
}
```

## 📋 Development Workflow

### Build Scripts

```json
{
    "scripts": {
        "dev": "concurrently \"npm run dev:react\" \"npm run dev:electron\"",
        "dev:react": "vite",
        "dev:electron": "electron-forge start",
        "build": "npm run build:react && npm run build:electron",
        "build:react": "vite build",
        "build:electron": "tsc",
        "package": "electron-forge package",
        "make": "electron-forge make"
    }
}
```

### Testing Strategy

```typescript
// Integration tests for WordPress site creation
describe("WordPress Site Management", () => {
    test("should create new WordPress site", async () => {
        const config: SiteConfig = {
            name: "test-site",
            domain: "test-site.local",
            phpVersion: "8.1",
            wordPressVersion: "latest",
        };

        const site = await wordpressManager.createSite(config);
        expect(site.name).toBe("test-site");
        expect(site.status).toBe("stopped");
    });
});
```

## 🚀 Deployment & Distribution

### 1. Code Signing (Production)

```javascript
// electron-forge.config.js
module.exports = {
    makers: [
        {
            name: "@electron-forge/maker-squirrel",
            config: {
                certificateFile: "path/to/certificate.p12",
                certificatePassword: process.env.CERTIFICATE_PASSWORD,
            },
        },
    ],
};
```

### 2. Auto-Updates

```typescript
// Auto-updater configuration
import { autoUpdater } from "electron-updater";

autoUpdater.checkForUpdatesAndNotify();
autoUpdater.on("update-available", () => {
    // Show update available notification
});
```

## 🎯 Key Advantages of This Architecture

1. **No Docker Dependency**: Uses native PHP server and SQLite/MySQL
2. **Fast Site Creation**: Direct WordPress downloads and extraction
3. **System Integration**: Proper hosts file management and port allocation
4. **Cross-Platform**: Works on Windows, macOS, and Linux
5. **Secure**: Proper IPC communication with security isolation
6. **Extensible**: Plugin system for additional functionality
7. **Performance**: Native processes without containerization overhead

This architecture provides a solid foundation for building a LocalWP-style application that's both powerful and user-friendly, without the complexity of Docker containers.
