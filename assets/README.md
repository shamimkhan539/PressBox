# Assets Directory

This directory contains application icons and resources needed for building installers.

## Required Icon Files

### 1. Windows Icon (icon.ico)

**Required for:** Windows installer and executable

**Specifications:**

- Format: ICO file
- Required sizes: 256x256, 128x128, 64x64, 48x48, 32x32, 16x16
- Color depth: 32-bit (with transparency)

**How to create:**

1. Create or obtain a square PNG logo (512x512 or larger)
2. Use online converter: https://convertio.co/png-ico/
3. Select "Multi-size ICO" option
4. Save as `icon.ico` in this directory

### 2. macOS Icon (icon.icns) - Optional

**Required for:** macOS DMG installer

**Specifications:**

- Format: ICNS file
- Sizes: 16x16 to 1024x1024 (multiple sizes in one file)

**How to create:**

1. Use PNG logo (1024x1024)
2. Convert online: https://cloudconvert.com/png-to-icns
3. Save as `icon.icns` in this directory

### 3. Linux Icon (icon.png) - Optional

**Required for:** Linux AppImage, DEB, RPM

**Specifications:**

- Format: PNG file
- Size: 512x512 or 1024x1024
- With transparency (alpha channel)

**How to create:**

1. Export your logo as PNG
2. Resize to 512x512 or 1024x1024
3. Save as `icon.png` in this directory

## Temporary Solution (No Icons Yet)

If you don't have icons ready, you can temporarily build without them:

1. Comment out icon settings in `package.json`:

```json
"win": {
    "target": [...],
    // "icon": "assets/icon.ico",  // Commented out
}
```

2. Or use the electron default icon (will look unprofessional)

## Icon Design Tips

- **Simple and recognizable** - Works at small sizes (16x16)
- **Square format** - No text (text doesn't scale well)
- **Transparency** - Use alpha channel for transparency
- **High contrast** - Visible on light and dark backgrounds
- **Consistent** - Same design across all platforms

## Example Logo Ideas for PressBox

- Stylized "P" letter
- Box with WordPress logo
- Container/package icon
- Toolbox icon
- Developer tools icon

## Free Icon Resources

- **Figma:** Design custom icon
- **Flaticon:** https://www.flaticon.com/ (commercial license)
- **Icons8:** https://icons8.com/ (attribution required for free)
- **Iconfinder:** https://www.iconfinder.com/

## Testing Icons

After creating icons:

1. Build the installer:

```powershell
npm run dist:win:installer
```

2. Check icon appears in:
    - Installer window
    - Installed application
    - Desktop shortcut
    - Start menu
    - Taskbar when running
    - Windows taskbar notification area

## Current Status

- [ ] Windows icon (icon.ico) - **MISSING**
- [ ] macOS icon (icon.icns) - **MISSING**
- [ ] Linux icon (icon.png) - **MISSING**

**Action needed:** Create and add icon files before building installer!
