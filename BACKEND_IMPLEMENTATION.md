# PressBox Backend System Implementation

## Overview

PressBox now has a complete backend system that handles system-level operations required for local WordPress development, including hosts file management, Docker container orchestration, and privilege management.

## Backend Services Architecture

### 1. **WordPressManager** (`src/main/services/wordpressManager.ts`)

- **Purpose**: Manages WordPress site creation, configuration, and lifecycle
- **Key Features**:
    - Site creation with Docker containers
    - **NEW**: Automatic hosts file registration during site creation
    - **NEW**: Hosts file cleanup during site deletion
    - PHP version management
    - WordPress version control
    - SSL and multisite support

### 2. **HostsFileService** (`src/main/services/hostsFileService.ts`)

- **Purpose**: Manages Windows/Linux/macOS hosts file for local domain registration
- **Key Features**:
    - Cross-platform hosts file modification
    - Automatic domain registration (e.g., `mysite.local` → `127.0.0.1`)
    - PressBox section management with markers
    - Backup and restore functionality
    - Site-specific entry tracking

### 3. **DockerManager** (`src/main/services/dockerManager.ts`)

- **Purpose**: Docker container orchestration for WordPress environments
- **Key Features**:
    - Container lifecycle management
    - Image pulling and management
    - Network configuration
    - Volume management for persistent data

### 4. **AdminChecker** (`src/main/services/adminChecker.ts`) ⭐ **NEW**

- **Purpose**: Validates and manages administrator privileges
- **Key Features**:
    - Cross-platform admin/root privilege detection
    - Hosts file access validation
    - Windows UAC elevation requests
    - Detailed privilege status reporting

## System File Modifications

### Hosts File Management

PressBox automatically modifies the system hosts file to enable local domain access:

**Windows Location**: `C:\Windows\System32\drivers\etc\hosts`
**Linux/macOS Location**: `/etc/hosts`

**Example Entry**:

```
127.0.0.1    mysite.local    # PressBox WordPress Site - MyAwesomeSite (Site ID: abc123)
```

### Required Privileges

#### Windows

- **Administrator privileges** required
- PressBox must be "Run as administrator"
- UAC (User Account Control) elevation

#### Linux/macOS

- **Root/sudo privileges** required
- Must run with `sudo pressbox` or as root user

## Frontend Integration

### AdminNotification Component ⭐ **NEW**

- **Location**: `src/renderer/src/components/AdminNotification.tsx`
- **Purpose**: Guides users through privilege elevation process
- **Features**:
    - Platform-specific instructions (Windows/macOS/Linux)
    - Automatic Windows elevation via UAC
    - Real-time privilege status checking
    - User-friendly explanation of requirements

### API Integration

The frontend communicates with backend services through:

1. **System API**:

    ```typescript
    window.electronAPI.system.checkAdmin();
    window.electronAPI.system.requestElevation();
    ```

2. **Hosts API**:

    ```typescript
    window.electronAPI.hosts.list();
    window.electronAPI.hosts.add(entry);
    window.electronAPI.hosts.remove(hostname);
    ```

3. **Sites API**:
    ```typescript
    window.electronAPI.sites.create(config); // Now includes hosts registration
    window.electronAPI.sites.delete(siteId); // Now includes hosts cleanup
    ```

## Workflow: Creating a WordPress Site

### 1. **Privilege Check**

```typescript
const adminStatus = await window.electronAPI.system.checkAdmin();
if (!adminStatus.canModifyHosts) {
    // Show AdminNotification modal
}
```

### 2. **Site Creation Process**

```typescript
// User creates site via CreateSiteModal
const siteConfig = {
    name: "MyAwesomeSite",
    domain: "mysite.local",
    phpVersion: "8.2",
    wordPressVersion: "latest",
};

// Backend processes:
// 1. Create Docker containers (web + database)
// 2. Generate WordPress configuration
// 3. Register domain in hosts file automatically
// 4. Start containers

const site = await window.electronAPI.sites.create(siteConfig);
```

### 3. **Domain Registration** (Automatic)

```typescript
// WordPressManager automatically calls:
await HostsFileService.addHostEntry({
    ip: "127.0.0.1",
    hostname: "mysite.local",
    comment: "PressBox WordPress Site - MyAwesomeSite (Site ID: abc123)",
    isWordPress: true,
    siteId: "abc123",
});
```

### 4. **Access Site**

- User can immediately access `http://mysite.local` in browser
- No manual hosts file editing required
- Automatic SSL support if configured

## Error Handling & Recovery

### Privilege Issues

- **Detection**: `AdminChecker.checkAdminPrivileges()`
- **Resolution**: `AdminNotification` guides user through elevation
- **Fallback**: Sites can still be created, but manual hosts editing required

### Hosts File Corruption

- **Backup**: Automatic backup before any modification
- **Recovery**: `HostsFileService.restore()` restores from backup
- **Validation**: Syntax checking before writing changes

### Docker Issues

- **Detection**: `DockerManager.isRunning()`
- **Resolution**: User guided to start Docker Desktop
- **Fallback**: Traditional XAMPP-style local development

## Security Considerations

### Privilege Elevation

- Only requests elevation when necessary
- Transparent about what system modifications are made
- User can decline and continue without hosts file modification

### File System Access

- Limited to hosts file and PressBox data directories
- No unnecessary system file access
- Automatic cleanup on site deletion

### Docker Security

- Containers run in isolated environments
- Network access restricted to localhost
- No external network exposure by default

## Testing & Validation

### Admin Privilege Testing

```typescript
// Test privilege detection
const status = await AdminChecker.checkAdminPrivileges();
console.log("Admin Status:", status);

// Test hosts file access
const canWrite = await HostsFileService.testAccess();
console.log("Can modify hosts:", canWrite);
```

### Site Creation Testing

```typescript
// Create test site
const testSite = await wordpressManager.createSite({
    name: "TestSite",
    domain: "test.local",
});

// Verify hosts file entry
const entries = await HostsFileService.readHostsFile();
const testEntry = entries.find((e) => e.hostname === "test.local");
console.log("Hosts entry created:", !!testEntry);
```

## Deployment & Distribution

### Installer Requirements

- Windows: Must request administrator privileges in installer
- macOS: May require notarization for system file access
- Linux: Package with appropriate privilege warnings

### User Onboarding

1. **First Launch**: AdminNotification explains requirements
2. **Privilege Grant**: User elevates privileges via platform-specific method
3. **Verification**: System validates access before proceeding
4. **Success**: Full functionality available

## Future Enhancements

### Planned Features

- **SSL Certificate Management**: Automatic HTTPS setup for local domains
- **DNS Management**: Support for custom DNS resolution
- **Network Configuration**: Advanced networking options
- **Performance Monitoring**: Real-time system performance tracking
- **Backup Automation**: Scheduled site and configuration backups

### Scalability

- **Multi-Site Management**: Bulk operations on multiple sites
- **Template Synchronization**: Cloud-based template sharing
- **Team Collaboration**: Shared development environments
- **CI/CD Integration**: GitHub Actions integration for deployment

## Troubleshooting

### Common Issues

**Issue**: "Access Denied" when modifying hosts file
**Solution**: Run PressBox as administrator (Windows) or with sudo (Linux/macOS)

**Issue**: Docker containers fail to start  
**Solution**: Ensure Docker Desktop is running and accessible

**Issue**: Site not accessible via local domain
**Solution**: Check hosts file entries and flush DNS cache

**Issue**: Permission errors during site creation
**Solution**: Verify PressBox has write access to configured sites directory

### Debug Mode

Enable debug logging by setting environment variable:

```bash
DEBUG=pressbox:* npm run dev
```

## Conclusion

PressBox now provides a complete local WordPress development environment with:

✅ **Automatic system file modification** (hosts file)
✅ **Cross-platform privilege management**  
✅ **Docker container orchestration**
✅ **User-friendly privilege elevation**
✅ **Comprehensive error handling**
✅ **Professional documentation**

The backend system eliminates manual configuration steps and provides a seamless "one-click" WordPress development experience similar to LocalWP, but with the flexibility and power of a custom Electron application.
