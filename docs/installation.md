# Installation Guide

This guide will help you install PressBox on your system and get started with local WordPress development.

## 📋 System Requirements

### Minimum Requirements

- **RAM**: 4GB (8GB recommended)
- **Storage**: 2GB free space (plus space for WordPress sites)
- **CPU**: 64-bit processor
- **Internet**: Required for initial setup and Docker images

### Supported Operating Systems

- **Windows 10/11** (x64, ARM64)
- **macOS 10.15+** (Intel and Apple Silicon)
- **Linux** (Ubuntu 18.04+, Debian 10+, Fedora 32+, Arch Linux)

### Required Dependencies

- **Docker Desktop** - Required for running WordPress sites
- **Node.js 18+** - For development builds only

## 🖥️ Windows Installation

### Option 1: Installer (.exe)

1. **Download** the latest installer from [GitHub Releases](https://github.com/pressbox/releases)
2. **Run** `PressBox-Setup-1.0.0.exe` as administrator
3. **Follow** the installation wizard
4. **Launch** PressBox from Start Menu or Desktop

### Option 2: Portable (.zip)

1. **Download** `PressBox-1.0.0-win32-portable.zip`
2. **Extract** to your preferred location (e.g., `C:\PressBox\`)
3. **Run** `PressBox.exe` from the extracted folder
4. **Optional**: Create desktop shortcut

### Windows-Specific Setup

```powershell
# Enable WSL2 (if not already enabled)
wsl --install

# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop
```

## 🍎 macOS Installation

### Option 1: DMG Installer

1. **Download** `PressBox-1.0.0.dmg` from releases
2. **Open** the DMG file
3. **Drag** PressBox to Applications folder
4. **Launch** from Applications or Spotlight

### Option 2: Homebrew (Community)

```bash
# Install via Homebrew Cask
brew install --cask pressbox

# Launch PressBox
open -a PressBox
```

### macOS-Specific Setup

```bash
# Install Docker Desktop
brew install --cask docker

# Start Docker Desktop
open -a Docker
```

### Security Notice

On first launch, you may see a security warning:

1. Go to **System Preferences > Security & Privacy**
2. Click **"Open Anyway"** next to PressBox
3. Confirm by clicking **"Open"**

## 🐧 Linux Installation

### Ubuntu/Debian (.deb)

```bash
# Download and install
wget https://github.com/pressbox/releases/download/v1.0.0/pressbox_1.0.0_amd64.deb
sudo dpkg -i pressbox_1.0.0_amd64.deb

# Fix dependencies if needed
sudo apt-get install -f

# Launch PressBox
pressbox
```

### Fedora/CentOS (.rpm)

```bash
# Download and install
wget https://github.com/pressbox/releases/download/v1.0.0/pressbox-1.0.0.x86_64.rpm
sudo rpm -i pressbox-1.0.0.x86_64.rpm

# Launch PressBox
pressbox
```

### AppImage (Universal)

```bash
# Download AppImage
wget https://github.com/pressbox/releases/download/v1.0.0/PressBox-1.0.0.AppImage

# Make executable
chmod +x PressBox-1.0.0.AppImage

# Run PressBox
./PressBox-1.0.0.AppImage
```

### Arch Linux (AUR)

```bash
# Install from AUR
yay -S pressbox

# Or with paru
paru -S pressbox
```

## 🐳 Docker Desktop Setup

PressBox requires Docker Desktop for running WordPress sites. Here's how to set it up:

### Install Docker Desktop

**Windows & macOS:**

1. Download from [docker.com](https://www.docker.com/products/docker-desktop)
2. Run installer and follow setup wizard
3. Restart computer when prompted
4. Launch Docker Desktop

**Linux:**

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Configure Docker Desktop

**Recommended Settings:**

- **Memory**: 4GB minimum, 8GB recommended
- **CPU**: 2 cores minimum, 4 cores recommended
- **Disk**: 64GB minimum for image storage
- **WSL2 Integration**: Enable on Windows

**To configure:**

1. Open Docker Desktop
2. Go to **Settings > Resources**
3. Adjust **Memory** and **CPU** allocation
4. Click **Apply & Restart**

## ✅ Verify Installation

### Check PressBox Installation

1. **Launch PressBox** from your applications menu
2. **Verify** the application starts without errors
3. **Check version** in Help > About

### Check Docker Integration

1. In PressBox, go to **Tools** page
2. **Verify** Docker status shows "✅ Installed" and "🟢 Running"
3. If not running, start Docker Desktop

### Create Test Site

1. Click **"Create New Site"** in PressBox
2. Enter **site name**: "Test Site"
3. Click **"Create Site"**
4. Wait for setup to complete (2-3 minutes on first run)
5. Click **"Open Site"** to verify WordPress is running

## 🚨 Troubleshooting Installation

### Common Issues

**PressBox won't start:**

```bash
# Check if another instance is running
# Kill existing processes if needed

# Windows
taskkill /f /im PressBox.exe

# macOS/Linux
pkill -f PressBox
```

**Docker not detected:**

1. Ensure Docker Desktop is installed and running
2. Restart Docker Desktop service
3. Check Docker version: `docker --version`
4. Restart PressBox

**Permission errors (Linux):**

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again, or run:
newgrp docker
```

**Antivirus blocking (Windows):**

1. Add PressBox to antivirus exclusions
2. Add PressBox installation folder to exclusions
3. Temporarily disable real-time protection during installation

### Getting Help

If you encounter issues:

1. **Check logs** in PressBox > Help > Open Logs
2. **Search** [known issues](https://github.com/pressbox/issues)
3. **Ask community** on [Discord](https://discord.gg/pressbox)
4. **Create issue** on [GitHub](https://github.com/pressbox/issues/new)

## 🔄 Updating PressBox

### Automatic Updates

PressBox will check for updates automatically and notify you when available.

### Manual Updates

1. **Download** latest version from releases
2. **Backup** your sites (optional, recommended)
3. **Install** new version (will upgrade existing installation)
4. **Launch** and verify your sites are still accessible

### Beta Versions

To receive beta updates:

1. Go to **Settings > Updates**
2. Enable **"Receive beta updates"**
3. Restart PressBox to check for betas

---

## 🎉 Next Steps

Once PressBox is installed:

1. **Read** the [Quick Start Guide](quick-start.md)
2. **Create** your first WordPress site
3. **Explore** the WP-CLI terminal and database tools
4. **Join** our [community Discord](https://discord.gg/pressbox)

Happy WordPress development with PressBox! 🚀
