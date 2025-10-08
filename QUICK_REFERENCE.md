# PressBox Quick Reference

**Version 1.0.0** | **Updated: October 8, 2025**

## 🚀 Quick Commands

### Development

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run package      # Package for current platform
npm run lint         # Run linting
npm run type-check   # TypeScript validation
```

### Platform-Specific Packaging

```bash
npm run package:win    # Package for Windows
npm run package:mac    # Package for macOS
npm run package:linux  # Package for Linux
npm run make:all       # Build all platforms
```

## 📁 Project Structure

```
PressBox/
├── src/
│   ├── main/               # Electron main process
│   │   └── main-quick.js   # Application entry point
│   ├── renderer/           # React frontend
│   │   ├── src/
│   │   │   ├── components/ # React components
│   │   │   ├── pages/      # Page components
│   │   │   ├── utils/      # Utility functions
│   │   │   └── types/      # TypeScript definitions
│   │   └── index.html      # Entry HTML
│   ├── preload/            # IPC bridge
│   │   └── preload-quick.js
│   └── shared/             # Shared utilities
├── docs/                   # Documentation
├── .github/                # GitHub workflows & templates
└── dist/                   # Build output
```

## 🔧 Key APIs

### Site Management

```typescript
window.electronAPI.sites.list(); // Get all sites
window.electronAPI.sites.create(config); // Create new site
window.electronAPI.sites.start(id); // Start site
window.electronAPI.sites.stop(id); // Stop site
window.electronAPI.sites.delete(id); // Delete site
```

### WP-CLI Integration

```typescript
window.electronAPI["wp-cli"].execute(siteId, command);
```

### Database Operations

```typescript
window.electronAPI.sites.backup(siteId); // Backup site
window.electronAPI.sites.clone(id, name); // Clone site
```

### System Integration

```typescript
window.electronAPI.shell.openExternal(url); // Open URL
window.electronAPI.shell.openPath(path); // Open folder
window.electronAPI.docker.isRunning(); // Check Docker
```

## 🎨 UI Components

### Core Components

- **`SiteDetailsModal`** - Comprehensive site management
- **`WPCLITerminal`** - WordPress command line interface
- **`DatabaseModal`** - Database management tools
- **`CreateSiteModal`** - New site creation wizard
- **`ImportSiteModal`** - Site import functionality

### Layout Components

- **`Dashboard`** - Main overview page
- **`Sites`** - Site management page
- **`Tools`** - Developer utilities page
- **`Header`** - Application header
- **`Sidebar`** - Navigation sidebar

## 🔒 Security Guidelines

### IPC Security

```typescript
// ✅ Good - Validate all inputs
const result = await window.electronAPI.sites.create({
    name: sanitize(siteName),
    domain: validateDomain(domain),
});

// ❌ Bad - Direct string passing
await window.electronAPI.sites.create(userInput);
```

### File Operations

```typescript
// ✅ Good - Use provided APIs
await window.electronAPI.shell.openPath(safePath);

// ❌ Bad - Direct file system access
fs.readFileSync(userPath); // Not available in renderer
```

## 📦 Configuration

### Environment Variables

```bash
NODE_ENV=development    # Development mode
NODE_ENV=production     # Production build
DEBUG=true             # Enable debug logs
```

### Docker Configuration

```yaml
# WordPress site structure
services:
    wordpress:
        image: wordpress:latest
        ports: ["8080:80"]
    mysql:
        image: mysql:5.7
        environment:
            MYSQL_ROOT_PASSWORD: wordpress
```

## 🐛 Common Issues

### Development

```bash
# Port already in use
netstat -ano | findstr :3001    # Windows
lsof -ti:3001 | xargs kill     # macOS/Linux

# Docker not detected
docker --version               # Check Docker installation
docker info                   # Verify Docker is running

# Module resolution issues
rm -rf node_modules package-lock.json
npm install
```

### Production

```bash
# App won't start
# Check logs in: %APPDATA%/PressBox/logs/ (Windows)
# Check logs in: ~/Library/Logs/PressBox/ (macOS)
# Check logs in: ~/.config/PressBox/logs/ (Linux)

# Permission issues (Linux)
sudo usermod -aG docker $USER
newgrp docker
```

## 📊 Performance Tips

### Development

- Use `npm run dev` for hot reload
- Enable Docker BuildKit for faster builds
- Allocate sufficient RAM to Docker (4GB+)
- Use SSD storage for better I/O performance

### Production

- Package with `NODE_ENV=production`
- Optimize Docker images for size
- Use container health checks
- Monitor resource usage

## 🔗 Useful Links

- **Repository**: https://github.com/shamimkhan539/PressBox
- **Documentation**: [docs/README.md](docs/README.md)
- **Issues**: https://github.com/shamimkhan539/PressBox/issues
- **Releases**: https://github.com/shamimkhan539/PressBox/releases
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Security**: [SECURITY.md](SECURITY.md)

## 📋 Checklists

### Before Pull Request

- [ ] Code follows style guidelines
- [ ] TypeScript compilation passes
- [ ] Linting passes without errors
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Changelog entry added

### Before Release

- [ ] Version numbers updated
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Cross-platform testing done
- [ ] Documentation reviewed
- [ ] Release notes prepared
- [ ] Distribution packages built

---

**Need help?** Check the [troubleshooting guide](docs/troubleshooting/common-issues.md) or ask in [GitHub Discussions](https://github.com/shamimkhan539/PressBox/discussions)
