# LocalWP-Style WordPress Development Server

## Project Structure

```
PressBox/
├── src/
│   ├── main/                          # Electron Main Process
│   │   ├── services/
│   │   │   ├── nativeWordPressManager.ts    # Core WordPress management
│   │   │   ├── portablePHPManager.ts        # PHP runtime management
│   │   │   ├── portableMySQLManager.ts      # MySQL database management
│   │   │   ├── wordPressDownloader.ts       # WordPress core downloads
│   │   │   ├── siteManager.ts               # Site lifecycle management
│   │   │   ├── portManager.ts               # Port allocation
│   │   │   └── hostsFileManager.ts          # Domain management
│   │   ├── ipc/
│   │   │   └── handlers.ts                  # IPC communication
│   │   └── main.ts                          # Main electron process
│   ├── renderer/                      # React Frontend
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx            # Main dashboard
│   │   │   │   ├── Sites.tsx                # Site management
│   │   │   │   └── Settings.tsx             # App settings
│   │   │   ├── components/
│   │   │   │   ├── CreateSiteModal.tsx      # Site creation wizard
│   │   │   │   ├── SiteCard.tsx             # Individual site display
│   │   │   │   └── ServerStatus.tsx         # Server status indicator
│   │   │   └── hooks/
│   │   │       └── useSites.ts              # Site management hooks
│   └── shared/
│       └── types.ts                   # Shared TypeScript types
├── resources/                         # Portable binaries storage
│   ├── php/                          # PHP versions (8.1, 8.2, 8.3)
│   ├── mysql/                        # MySQL/MariaDB server
│   ├── wordpress/                    # WordPress core cache
│   └── tools/                        # Additional tools (WP-CLI, etc.)
└── sites/                            # User WordPress sites
    ├── site1/
    │   ├── wordpress/                # WordPress files
    │   ├── database/                 # Site database
    │   └── pressbox-config.json      # Site configuration
    └── site2/
        ├── wordpress/
        ├── database/
        └── pressbox-config.json
```

## Technology Stack

### Core Technologies

- **Desktop Framework**: Electron 27+
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js (Electron Main Process)
- **State Management**: React Context + Custom Hooks
- **Build Tool**: Vite + TypeScript

### Native Stack (No Docker)

- **PHP Runtime**: Portable PHP binaries (8.1, 8.2, 8.3)
- **Database**: Portable MySQL/MariaDB or SQLite
- **Web Server**: PHP Built-in Development Server
- **Process Management**: Node.js child_process
- **File Operations**: Node.js fs/promises

### Additional Tools

- **WordPress Downloader**: Direct from wordpress.org
- **WP-CLI Integration**: For WordPress management
- **Hosts File Management**: Custom domain support
- **Port Management**: Automatic port allocation

## Implementation Phases

### Phase 1: Core Infrastructure ✅

1. Directory structure setup
2. Portable PHP download and configuration
3. Basic site creation and management
4. WordPress download and extraction

### Phase 2: Site Management 🔄

1. PHP development server integration
2. Database setup (MySQL or SQLite)
3. WordPress configuration automation
4. Site start/stop functionality

### Phase 3: Advanced Features 📋

1. Custom domains and hosts file management
2. Multiple PHP version support
3. Plugin and theme management
4. Database browser and management

### Phase 4: User Experience 📋

1. Modern React UI with real-time updates
2. Site creation wizard
3. Server status monitoring
4. Performance optimization

## Key Features (Like LocalWP)

### Site Management

- ✅ Create multiple WordPress sites
- ✅ Custom domain support (e.g., mysite.local)
- ✅ Multiple PHP versions (8.1, 8.2, 8.3)
- ✅ Isolated environments per site
- ✅ One-click site start/stop

### Development Tools

- 📋 Built-in adminer/phpMyAdmin
- 📋 WP-CLI integration
- 📋 Error logs viewer
- 📋 SSL certificate generation
- 📋 Site cloning and export

### User Interface

- ✅ Modern, intuitive dashboard
- ✅ Real-time server status
- ✅ Easy site creation wizard
- 📋 Performance monitoring
- 📋 Plugin/theme manager

## Installation Requirements

### System Requirements

- Windows 10/11, macOS 10.15+, or Linux
- Node.js 18+ (for development)
- 4GB RAM minimum
- 2GB free disk space

### Auto-Downloaded Components

- Portable PHP binaries
- MySQL/MariaDB server
- WordPress core files
- WP-CLI tool

## File Locations

### Windows

```
%USERPROFILE%/PressBox/
├── sites/              # WordPress sites
├── resources/          # Portable binaries
├── logs/              # Application logs
└── config/            # App configuration
```

### macOS/Linux

```
~/PressBox/
├── sites/              # WordPress sites
├── resources/          # Portable binaries
├── logs/              # Application logs
└── config/            # App configuration
```

## Site Structure

Each WordPress site gets its own isolated environment:

```
~/PressBox/sites/mysite/
├── wordpress/          # WordPress core files
│   ├── wp-content/    # Themes, plugins, uploads
│   ├── wp-config.php  # Auto-generated config
│   └── ...            # WordPress core
├── database/          # MySQL data directory (or SQLite file)
├── logs/              # PHP and access logs
├── ssl/               # SSL certificates (if enabled)
└── pressbox-config.json # Site configuration
```

## Development vs Production

### Development Mode

- Uses PHP built-in development server
- SQLite database for simplicity
- Hot-reload for UI changes
- Debug logging enabled

### Production Mode

- Can use full MySQL server
- Nginx proxy (optional)
- Performance optimizations
- Error logging only

## Comparison with LocalWP

| Feature                 | LocalWP | PressBox |
| ----------------------- | ------- | -------- |
| Docker Free             | ✅      | ✅       |
| Multiple PHP Versions   | ✅      | ✅       |
| Custom Domains          | ✅      | ✅       |
| One-click WordPress     | ✅      | ✅       |
| Built-in Database Tools | ✅      | 📋       |
| SSL Support             | ✅      | 📋       |
| Site Templates          | ✅      | 📋       |
| Cross-platform          | ✅      | ✅       |
| Open Source             | ❌      | ✅       |

## Next Steps

1. **Install Dependencies**: Add required npm packages
2. **Implement Core Services**: Complete WordPress and PHP managers
3. **Build React UI**: Modern dashboard with real-time updates
4. **Test Site Creation**: End-to-end WordPress site creation
5. **Add Advanced Features**: Database tools, SSL, etc.
