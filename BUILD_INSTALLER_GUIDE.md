# Building PressBox Windows Installer

## 🎯 Quick Start - Build Windows Installer

### Option 1: NSIS Installer (Recommended)

```powershell
npm run dist:win:installer
```

**Creates:** `release/PressBox-1.0.0-x64.exe`

- Full Windows installer with uninstaller
- Creates Start Menu shortcuts
- Creates Desktop shortcut
- Allows custom install location
- Professional installation experience

### Option 2: Portable Executable

```powershell
npm run dist:win:portable
```

**Creates:** `release/PressBox-1.0.0-portable.exe`

- Single executable file
- No installation required
- Run from USB drive or any location
- Stores settings in app directory

### Option 3: Both (Installer + Portable)

```powershell
npm run dist:win
```

**Creates both:**

- `PressBox-1.0.0-x64.exe` (installer)
- `PressBox-1.0.0-portable.exe` (portable)

## 📋 Prerequisites

### 1. Install Dependencies

```powershell
npm install
```

### 2. Create Icon Files (Required)

You need to create icon files in the `assets/` directory:

#### Windows Icon (assets/icon.ico)

- **Format:** ICO file
- **Sizes:** 256x256, 128x128, 64x64, 48x48, 32x32, 16x16
- **Tool:** Use https://convertio.co/png-ico/ or https://icoconvert.com/

**Steps:**

1. Create or find a PNG logo (512x512 or larger)
2. Convert to ICO with multiple sizes
3. Save as `assets/icon.ico`

#### macOS Icon (assets/icon.icns) - Optional

- **Format:** ICNS file
- **Tool:** Use https://cloudconvert.com/png-to-icns

#### Linux Icon (assets/icon.png) - Optional

- **Format:** PNG file
- **Size:** 512x512 or 1024x1024

### 3. Temporary Icon Solution

If you don't have an icon yet, you can temporarily remove the icon configuration:

**Edit package.json:**

```json
"win": {
    "target": [
        { "target": "nsis", "arch": ["x64"] },
        { "target": "portable", "arch": ["x64"] }
    ],
    // Comment out or remove:
    // "icon": "assets/icon.ico",
    "artifactName": "${productName}-${version}-${arch}.${ext}"
}
```

## 🏗️ Build Process

### Step-by-Step Build

1. **Clean previous builds**

```powershell
npm run clean
```

2. **Build the application**

```powershell
npm run build
```

This compiles:

- React frontend → `dist/renderer/`
- Electron main process → `dist/main/`
- Preload scripts → `dist/preload/`

3. **Create Windows installer**

```powershell
npm run dist:win:installer
```

### Full Build Command

```powershell
npm run clean && npm run build && npm run dist:win:installer
```

## 📦 Output Files

After successful build, find installers in `release/` directory:

```
release/
├── PressBox-1.0.0-x64.exe              # NSIS Installer (~150-200 MB)
├── PressBox-1.0.0-portable.exe         # Portable EXE (~150-200 MB)
├── win-unpacked/                       # Unpacked files (for testing)
│   ├── PressBox.exe
│   ├── resources/
│   └── ...
└── builder-effective-config.yaml       # Build configuration used
```

## 🔧 Installer Configuration

### NSIS Installer Features (package.json)

```json
"nsis": {
    "oneClick": false,                    // Allow custom install location
    "allowToChangeInstallationDirectory": true,
    "perMachine": false,                  // Install for current user
    "createDesktopShortcut": true,        // Desktop icon
    "createStartMenuShortcut": true,      // Start menu entry
    "shortcutName": "PressBox",
    "deleteAppDataOnUninstall": false,    // Keep user data on uninstall
    "runAfterFinish": true,               // Launch app after install
    "license": "LICENSE",                 // Show license during install
    "displayLanguageSelector": false      // English only
}
```

### Portable Configuration

```json
"portable": {
    "artifactName": "${productName}-${version}-portable.${ext}"
}
```

## 🎨 Customizing the Build

### Change Version Number

**Edit package.json:**

```json
{
    "version": "1.0.0" // Change to 1.0.1, 2.0.0, etc.
}
```

### Change App Name

**Edit package.json:**

```json
{
    "name": "pressbox",
    "build": {
        "productName": "PressBox" // Display name
    }
}
```

### Change Install Location

Users can choose install location during installation (NSIS installer).

Default locations:

- **Per-User:** `C:\Users\[Username]\AppData\Local\Programs\PressBox`
- **All Users:** `C:\Program Files\PressBox` (requires admin)

### Add License Text

Create `LICENSE` file in root directory with your license text.
It will be displayed during installation.

## 🧪 Testing the Installer

### Test NSIS Installer

1. **Run the installer:**

```powershell
.\release\PressBox-1.0.0-x64.exe
```

2. **Installation wizard will:**
    - Show license agreement (if LICENSE file exists)
    - Let user choose install location
    - Create shortcuts
    - Install the application
    - Optionally launch the app

3. **Verify installed files:**
    - Check: `C:\Users\[You]\AppData\Local\Programs\PressBox`
    - Desktop shortcut created
    - Start menu entry created

4. **Test the application:**
    - Launch from desktop shortcut
    - Create a test WordPress site
    - Verify all features work

5. **Test uninstaller:**
    - Go to: Settings → Apps → PressBox → Uninstall
    - OR: Run uninstaller from install directory

### Test Portable Version

1. **Run portable EXE:**

```powershell
.\release\PressBox-1.0.0-portable.exe
```

2. **Verify:**
    - No installation required
    - App data stored in same directory
    - Can run from USB drive
    - Can move to any location

## 🚀 Distribution

### Upload to GitHub Releases

1. **Create a release on GitHub:**

```bash
git tag v1.0.0
git push origin v1.0.0
```

2. **Upload installers:**
    - Go to GitHub → Releases → Create new release
    - Tag version: `v1.0.0`
    - Upload: `PressBox-1.0.0-x64.exe`
    - Upload: `PressBox-1.0.0-portable.exe`
    - Add release notes

### Create Update Package

electron-updater can auto-update from GitHub releases.

**Add to releases:**

- `PressBox-1.0.0-x64.exe` (installer)
- `latest.yml` (auto-generated update manifest)

## 📊 Build Sizes

Typical sizes:

- **NSIS Installer:** ~150-200 MB
- **Portable EXE:** ~150-200 MB
- **Unpacked:** ~400-500 MB

Includes:

- Electron runtime (~100 MB)
- Node.js modules
- Your application code
- Assets and resources

## 🐛 Troubleshooting

### Error: "icon.ico not found"

**Solution:**

1. Create icon file: `assets/icon.ico`
2. OR temporarily remove icon from config:

```json
"win": {
    "target": [...],
    // "icon": "assets/icon.ico",  // Comment out
}
```

### Error: "Cannot find module"

**Solution:**

```powershell
npm install
npm run build
```

### Error: "Application failed to start"

**Check:**

1. Did `npm run build` complete successfully?
2. Are all files in `dist/` directory?
3. Check console for errors: `npm run dev` to test first

### Large Installer Size

**Normal:** Electron apps are 150-200 MB
**To reduce:**

- Remove unused dependencies
- Use `devDependencies` for build tools
- Compress assets

### Slow Build Time

**First build:** 2-5 minutes (normal)
**Subsequent builds:** 30-60 seconds

**Speed up:**

```powershell
# Skip compression
npm run dist:win -- --config.compression=store
```

## 🔍 Advanced Configuration

### Build for 32-bit Windows

**Edit package.json:**

```json
"win": {
    "target": [
        { "target": "nsis", "arch": ["x64", "ia32"] }
    ]
}
```

### Add Auto-Update

**Already configured in code!**

Users will get update notifications automatically from GitHub releases.

### Code Signing (Optional)

For production releases, sign your installer:

**Install certificate:**

1. Get code signing certificate (DigiCert, etc.)
2. Install certificate on Windows

**Update package.json:**

```json
"win": {
    "certificateFile": "path/to/cert.pfx",
    "certificatePassword": "your-password",
    "signingHashAlgorithms": ["sha256"],
    "sign": "./sign.js"  // Custom signing script
}
```

**Security note:** Never commit certificates or passwords to Git!

## 📝 Build Scripts Reference

| Command                      | Description                | Output                      |
| ---------------------------- | -------------------------- | --------------------------- |
| `npm run dist`               | Build for current platform | Platform-specific installer |
| `npm run dist:win`           | Build all Windows versions | NSIS + Portable             |
| `npm run dist:win:installer` | NSIS installer only        | .exe installer              |
| `npm run dist:win:portable`  | Portable version only      | Portable .exe               |
| `npm run dist:mac`           | macOS DMG + ZIP            | .dmg + .zip                 |
| `npm run dist:linux`         | Linux packages             | .AppImage, .deb, .rpm       |
| `npm run build`              | Compile code only          | No installer                |
| `npm run clean`              | Remove build artifacts     | -                           |

## 🎉 Success!

After running `npm run dist:win:installer`, you should see:

```
✔ Building...
✔ Packaging...
✔ Creating installer...
✔ Done!

Output: release/PressBox-1.0.0-x64.exe
```

**Next steps:**

1. Test the installer
2. Share with users
3. Upload to GitHub releases
4. Celebrate! 🎊

---

## 📚 Additional Resources

- **electron-builder docs:** https://www.electron.build/
- **NSIS installer:** https://www.electron.build/configuration/nsis
- **Icon tools:** https://www.electronjs.org/docs/latest/tutorial/application-icons
- **Code signing:** https://www.electron.build/code-signing

## 💡 Tips

1. **Always test on clean Windows machine** before distributing
2. **Version number matters** - increment for each release
3. **Icon is important** - users see it everywhere
4. **Sign your installer** for production (removes SmartScreen warning)
5. **Compress assets** to reduce installer size
6. **Update electron regularly** for security patches

---

**Need help?** Check the GitHub issues or create a new one!
