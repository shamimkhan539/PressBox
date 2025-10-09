# 🚀 PressBox User Guide

**Version:** 1.0.0  
**Complete LocalWP Alternative with Advanced Features**

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [Creating WordPress Sites](#creating-wordpress-sites)
3. [Site Management](#site-management)
4. [Advanced Features](#advanced-features)
5. [Developer Tools](#developer-tools)
6. [Export & Import](#export--import)
7. [Troubleshooting](#troubleshooting)

---

## 🌟 Getting Started

### First Launch

1. **Start PressBox**: Launch the application from your desktop or start menu
2. **Docker Check**: Ensure Docker Desktop is installed and running
3. **Navigate**: Use the sidebar to access different sections

### Application Layout

- **Dashboard**: Overview and quick actions
- **Sites**: Manage all WordPress installations
- **Docker**: Container and image management
- **Plugins**: PressBox plugin ecosystem
- **Tools**: Utilities and developer tools
- **Settings**: Application configuration

---

## 🎯 Creating WordPress Sites

### Method 1: Basic Templates

1. **Click "Create New Site"** on the Sites page
2. **Choose "Basic Templates"** for simple setups
3. **Select Template**: Choose from common configurations
    - Basic WordPress
    - Developer Setup
    - Blog Template
    - Business Site
4. **Configure Settings**:
    - Site Name: `my-awesome-site`
    - Domain: `mysite.local` (auto-generated)
    - PHP Version: 7.4, 8.0, 8.1, 8.2, 8.3
    - WordPress Version: Latest, 6.4, 6.3
5. **Review & Create**: Confirm settings and create site

### Method 2: Site Blueprints ⭐ **NEW**

1. **Click "Create New Site"** on the Sites page
2. **Choose "Site Blueprints"** for professional templates
3. **Browse Categories**:
    - **Blog**: Magazine, Personal Blog, News Site
    - **Business**: Corporate, Agency, Consultancy
    - **E-commerce**: WooCommerce stores, Marketplaces
    - **Portfolio**: Creative, Photography, Design
    - **Documentation**: Knowledge Base, Docs Site
    - **Community**: Forums, Social Networks
4. **Search & Filter**: Find specific blueprint types
5. **Select Blueprint**: Choose from 50+ professional templates
6. **Auto-Configuration**: Settings populated from blueprint
7. **One-Click Creation**: Complete setup with plugins/themes/content

### Blueprint Features

- **Pre-installed Plugins**: Essential plugins ready to use
- **Professional Themes**: Industry-specific designs
- **Sample Content**: Starter content and configurations
- **Optimized Settings**: Performance and SEO optimizations

---

## 🏗️ Site Management

### Site Actions

#### Basic Operations

- **Start Site**: Launch WordPress containers
- **Stop Site**: Shutdown site containers
- **Open Site**: Launch in browser (`http://localhost:PORT`)
- **View Details**: Comprehensive site information

#### Advanced Operations

- **Server Config** ⚙️: Real-time server management
- **WP-CLI Terminal** 💻: Execute WordPress commands
- **Export Site** 📤: Create .pbx backup files
- **Delete Site** 🗑️: Remove site and containers

### Site Status Indicators

- 🟢 **Running**: Site accessible at local URL
- 🔴 **Stopped**: Containers not running
- 🟡 **Starting**: Containers initializing
- ⚠️ **Error**: Issues detected (check logs)

---

## ⚡ Advanced Features

### Multi-Server Support

**Hot-Swap Web Servers**:

1. Click the **Server Config** button (⚙️) on running sites
2. Choose between **NGINX** and **Apache**
3. **Zero Downtime**: Switch without stopping the site
4. **Real-time Stats**: Monitor performance impact

**PHP Version Management**:

1. Access **Server Configuration** panel
2. Select PHP version: 7.4, 8.0, 8.1, 8.2, 8.3
3. **Instant Switch**: No container rebuilding required
4. **Compatibility Check**: Automatic plugin/theme validation

### Server Management Panel Features

- **Live Statistics**: CPU, Memory, Request counts
- **Performance Monitoring**: Real-time metrics
- **Configuration Editor**: Direct server config modification
- **Health Checks**: Automated service validation
- **Quick Actions**: Restart services, clear caches

---

## 💻 Developer Tools

### WP-CLI Integration

**Access Terminal**:

1. Click the **Terminal** button (💻) on running sites
2. Execute any WP-CLI command directly
3. **Common Commands**:
    ```bash
    wp plugin list
    wp theme install twentytwentyfour
    wp db export backup.sql
    wp search-replace old.com new.com
    wp user create developer dev@site.com --role=administrator
    ```

**Terminal Features**:

- **Command History**: Navigate previous commands with ↑/↓
- **Auto-completion**: Intelligent command suggestions
- **Real-time Output**: Live command execution results
- **Saved Commands**: Bookmark frequently used commands
- **Multi-tab Support**: Multiple terminal sessions

### File Management

- **Direct Access**: Open site files in VS Code
- **Live Editing**: Real-time file synchronization
- **Theme Development**: Automatic reload on changes
- **Plugin Development**: Integrated debugging tools

---

## 📦 Export & Import

### Export Sites (.pbx format)

**Full Site Export**:

1. Click **Export** button (📤) on any site
2. Choose export components:
    - ✅ WordPress Files
    - ✅ Database
    - ✅ Configuration
    - ✅ Docker Settings
    - ✅ Custom Plugins/Themes
3. **Select Destination**: Choose save location
4. **Create Archive**: Generate .pbx file

**Selective Export**:

- **Files Only**: WordPress core and uploads
- **Database Only**: SQL dump with search/replace
- **Config Only**: Docker and WordPress settings
- **Custom Combination**: Mix and match components

### Import Sites

**Import Process**:

1. Click **"Import Site"** from Sites page
2. **Select .pbx File**: Browse and choose backup
3. **Review Contents**: Preview import components
4. **Configure Import**:
    - New site name
    - Domain customization
    - Port assignment
    - PHP/WordPress versions
5. **Import & Launch**: Automatic site recreation

**Import Features**:

- **Smart Conflicts**: Handle existing site conflicts
- **URL Replacement**: Automatic domain updates
- **Database Migration**: Safe import with cleanup
- **Validation**: Pre-import compatibility checks

---

## 🔧 Advanced Configuration

### Blueprint Development

**Create Custom Blueprints**:

1. Export an existing configured site
2. Edit blueprint metadata in .pbx file
3. Add to custom blueprint library
4. Share with team or community

**Blueprint Structure**:

```json
{
    "name": "My Custom Blueprint",
    "category": "business",
    "description": "Professional business site setup",
    "plugins": ["yoast-seo", "contact-form-7"],
    "theme": "business-pro",
    "content": "sample-pages.xml",
    "config": {
        "phpVersion": "8.2",
        "wordpressVersion": "latest"
    }
}
```

### Plugin Ecosystem

- **Core Plugins**: Essential PressBox extensions
- **Community Plugins**: User-contributed tools
- **API Integration**: Third-party service connections
- **Custom Development**: Plugin SDK and examples

---

## 🚨 Troubleshooting

### Common Issues

**Site Won't Start**:

- Check Docker Desktop is running
- Verify port availability (3000-3100 range)
- Review site logs in Details panel
- Restart Docker service

**Blueprint Loading Issues**:

- Clear browser cache and restart
- Check internet connection for blueprint downloads
- Verify disk space for large blueprints
- Update PressBox to latest version

**Performance Issues**:

- Allocate more resources to Docker Desktop
- Close unused sites to free up ports/memory
- Use NGINX over Apache for better performance
- Monitor resource usage in site details

### Log Access

- **Site Logs**: Available in Site Details modal
- **System Logs**: Check Docker Desktop logs
- **Error Reporting**: Built-in error tracking
- **Debug Mode**: Enable in Settings for verbose logging

---

## 🎉 Pro Tips

### Workflow Optimization

1. **Use Blueprints** for consistent project setups
2. **Export Templates** of your common configurations
3. **Utilize WP-CLI** for bulk operations
4. **Hot-swap Servers** to test compatibility
5. **Monitor Performance** during development

### Team Collaboration

1. **Share .pbx Files** for consistent environments
2. **Create Team Blueprints** for standardized setups
3. **Version Control** blueprint configurations
4. **Document Custom Workflows** in team guides

### Performance Best Practices

1. **Stop Unused Sites** to conserve resources
2. **Use Specific PHP Versions** matching production
3. **Regular Database Optimization** via WP-CLI
4. **Monitor Resource Usage** in site details
5. **Clean Docker Images** periodically

---

## 📞 Support & Community

- **Documentation**: [GitHub Wiki](https://github.com/shamimkhan539/PressBox/wiki)
- **Issues**: [GitHub Issues](https://github.com/shamimkhan539/PressBox/issues)
- **Discussions**: [GitHub Discussions](https://github.com/shamimkhan539/PressBox/discussions)
- **Updates**: Check for updates in Settings panel

**Happy WordPress Development! 🚀**
