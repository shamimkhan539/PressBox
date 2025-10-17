# 🚀 Quick Start - Build Windows Installer

## Build Installer NOW (3 Simple Steps)

### Step 1: Make sure everything is built

```powershell
npm run build
```

**Wait for:** "Build completed successfully"

### Step 2: Create Windows installer

```powershell
npm run dist:win:installer
```

**Wait for:** "Building... Packaging... Done!"

### Step 3: Find your installer

```
📁 release\PressBox-1.0.0-x64.exe  ← Your installer! (~150-200 MB)
```

## Installation

**Double-click** `PressBox-1.0.0-x64.exe` to install:

1. Choose installation location
2. Creates desktop shortcut
3. Creates Start Menu entry
4. Launches PressBox automatically

## What You Get

✅ **Full Windows Installer**

- Professional installation wizard
- Custom install location
- Desktop + Start Menu shortcuts
- Uninstaller in Windows Settings
- No dependencies needed
- Ready to distribute!

✅ **Portable Version** (Optional)

```powershell
npm run dist:win:portable
```

Creates: `PressBox-1.0.0-portable.exe` (no installation needed)

## Both Versions at Once

```powershell
npm run dist:win
```

Creates both installer + portable versions

## Troubleshooting

### "npm ERR! Missing script"

**Solution:** You're in wrong directory

```powershell
cd D:\test\extension\PressBox
```

### "electron-builder not found"

**Solution:** Install dependencies

```powershell
npm install
```

### Build takes 2-5 minutes

✅ **Normal!** First build is always slow.

### Installer is ~150-200 MB

✅ **Normal!** Includes entire Electron runtime and Node.js.

## Next Steps

After building:

1. **Test the installer** - Install on your machine
2. **Test the app** - Create a WordPress site
3. **Share with users** - Send them the .exe file
4. **Upload to GitHub** - Create a release

## Add Custom Icon (Optional)

1. Create icon file: `assets/icon.ico` (256x256, 128x128, 64x64, 48x48, 32x32, 16x16)
2. Update `package.json`:

```json
"win": {
    "icon": "assets/icon.ico"  // Add this line
}
```

3. Rebuild: `npm run dist:win:installer`

See `BUILD_INSTALLER_GUIDE.md` for detailed instructions!

---

**Need help?** Check `BUILD_INSTALLER_GUIDE.md` for full documentation.
