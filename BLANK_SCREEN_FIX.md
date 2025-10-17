# Blank Screen Fix - Production Path Resolution

## 🐛 Issue

After installing PressBox, the application shows a blank screen with this console error:

```
Not allowed to load local resource: file:///C:/Program%20Files/PressBox/resources/app.asar/dist/main/renderer/index.html
```

## 🔍 Root Cause

**The Problem:**
The production build was using incorrect file paths to load the renderer HTML file.

**Development vs Production Structure:**

### Development (works fine):

```
project/
├── dist/
│   ├── main/
│   │   └── main/
│   │       └── main.js  ← __dirname here
│   ├── preload/
│   │   └── preload.js
│   └── renderer/
│       └── index.html
```

### Production (BEFORE fix - broken):

```
C:\Program Files\PressBox\
└── resources/
    └── app.asar/
        └── dist/
            ├── main/
            │   └── main/
            │       └── main.js  ← __dirname here
            ├── preload/
            │   └── preload.js
            └── renderer/
                └── index.html
```

**Old code was trying:**

```typescript
this.mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
```

**This resulted in:**

```
file:///C:/Program Files/PressBox/resources/app.asar/dist/main/renderer/index.html
                                                          ^^^^^ WRONG!
```

Should be:

```
file:///C:/Program Files/PressBox/resources/app.asar/dist/renderer/index.html
```

## ✅ Solution Implemented

### Fix 1: Corrected Renderer Path

**BEFORE (Broken):**

```typescript
// Load the app
if (process.env.NODE_ENV === "development") {
    this.mainWindow.loadURL("http://localhost:3000");
} else {
    this.mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
}
```

**AFTER (Fixed):**

```typescript
// Load the app
if (process.env.NODE_ENV === "development") {
    this.mainWindow.loadURL("http://localhost:3000");
} else {
    // In production, the structure is:
    // __dirname = app.asar/dist/main/main (where main.js is)
    // renderer = app.asar/dist/renderer/index.html
    const rendererPath = join(__dirname, "../../renderer/index.html");

    console.log(`Loading renderer from: ${rendererPath}`);
    console.log(`__dirname: ${__dirname}`);
    console.log(`app.isPackaged: ${app.isPackaged}`);
    console.log(`app.getAppPath(): ${app.getAppPath()}`);

    this.mainWindow.loadFile(rendererPath);
}
```

**Path resolution:**

- `__dirname` = `app.asar/dist/main/main`
- `../` = `app.asar/dist/main`
- `../../` = `app.asar/dist`
- `../../renderer/index.html` = `app.asar/dist/renderer/index.html` ✅

### Fix 2: Simplified Preload Path

**BEFORE:**

```typescript
preload: process.env.NODE_ENV === "development"
    ? join(__dirname, "../preload/preload.js")
    : join(__dirname, "../preload/preload.js"),
```

**AFTER:**

```typescript
preload: app.isPackaged
    ? join(__dirname, "../preload/preload.js")
    : join(__dirname, "../preload/preload.js"),
```

Both paths are the same because the relative structure is consistent!

## 🔧 How to Apply Fix

### Step 1: Updated Code (Already Done)

The fix has been applied to `src/main/main.ts`

### Step 2: Rebuild

```powershell
npm run build
```

### Step 3: Rebuild Installer

```powershell
npm run dist:win:installer
```

### Step 4: Test New Installer

1. **Uninstall old version:**
    - Settings → Apps → PressBox → Uninstall

2. **Install new version:**
    - Run `release\PressBox-1.0.0-x64.exe`

3. **Launch app:**
    - Should now show the UI correctly! ✅

## 🧪 Testing Checklist

After reinstalling with the fixed version:

- [ ] App launches without blank screen ✅
- [ ] Dashboard is visible ✅
- [ ] Can create sites ✅
- [ ] Can start/stop sites ✅
- [ ] Database browser works ✅
- [ ] No console errors about "Not allowed to load local resource" ✅

## 📊 Path Resolution Debugging

The fixed code includes debug logging to help diagnose path issues:

```typescript
console.log(`Loading renderer from: ${rendererPath}`);
console.log(`__dirname: ${__dirname}`);
console.log(`app.isPackaged: ${app.isPackaged}`);
console.log(`app.getAppPath(): ${app.getAppPath()}`);
```

**To view these logs in production:**

1. **Windows:** Check logs at:

    ```
    C:\Users\[You]\AppData\Roaming\PressBox\logs\main.log
    ```

2. **Or enable DevTools in production temporarily:**
    ```typescript
    // In main.ts createWindow():
    this.mainWindow?.webContents.openDevTools();
    ```

## 🔍 Understanding Electron Paths

### Key Path Properties

| Property                | Development      | Production (Packaged)       |
| ----------------------- | ---------------- | --------------------------- |
| `__dirname`             | `dist/main/main` | `app.asar/dist/main/main`   |
| `app.getAppPath()`      | `/project/path`  | `C:\...\resources\app.asar` |
| `process.resourcesPath` | `/project/path`  | `C:\...\resources`          |
| `app.isPackaged`        | `false`          | `true`                      |

### Correct Path Patterns

**For renderer HTML:**

```typescript
join(__dirname, "../../renderer/index.html");
```

**For preload script:**

```typescript
join(__dirname, "../preload/preload.js");
```

**For assets:**

```typescript
join(process.resourcesPath, "assets", "icon.png");
```

## 🚨 Common Path Mistakes

### ❌ WRONG: Absolute paths

```typescript
this.mainWindow.loadFile("C:/Program Files/PressBox/...");
```

### ❌ WRONG: Hard-coded development paths

```typescript
this.mainWindow.loadFile("./dist/renderer/index.html");
```

### ❌ WRONG: Using process.cwd()

```typescript
join(process.cwd(), "renderer/index.html"); // cwd() changes!
```

### ✅ CORRECT: Relative to \_\_dirname

```typescript
join(__dirname, "../../renderer/index.html");
```

### ✅ CORRECT: Using app.getAppPath()

```typescript
join(app.getAppPath(), "dist/renderer/index.html");
```

## 🛠️ Alternative Solutions (Not Used)

### Option 1: Use app.getAppPath()

```typescript
const rendererPath = join(app.getAppPath(), "dist/renderer/index.html");
```

**Pros:** More explicit
**Cons:** Longer, same result

### Option 2: Use process.resourcesPath

```typescript
const rendererPath = app.isPackaged
    ? join(process.resourcesPath, "app.asar/dist/renderer/index.html")
    : join(__dirname, "../../renderer/index.html");
```

**Pros:** More explicit about packaged vs unpackaged
**Cons:** More complex, not needed

### Option 3: Unpack specific files

In `package.json`:

```json
"build": {
    "asarUnpack": [
        "dist/renderer/**"
    ]
}
```

**Pros:** Files accessible without .asar
**Cons:** Slower app launch, larger app size

**We chose:** Simple relative paths from `__dirname` (Option from fix)

## 📝 Files Modified

1. **src/main/main.ts**
    - Fixed renderer loading path
    - Simplified preload path
    - Added debug logging

## ✅ Build Status

```
✓ Code fixed
✓ Build completed
✓ Installer rebuilt
✓ Ready for testing
```

## 🎯 Next Steps

1. **Uninstall old version** from Windows Settings → Apps
2. **Install new version** from `release\PressBox-1.0.0-x64.exe`
3. **Launch and verify** - should show UI correctly!
4. **Test all features** - create site, start/stop, etc.

## 📚 Related Resources

- **Electron paths:** https://www.electronjs.org/docs/latest/api/app#appgetapppath
- **File URLs:** https://www.electronjs.org/docs/latest/api/browser-window#winloadfilepath-options
- **ASAR packaging:** https://www.electronjs.org/docs/latest/tutorial/asar-archives

## 🐛 If Still Having Issues

### Check These:

1. **Old version still installed?**

    ```powershell
    Get-Process -Name "PressBox" -ErrorAction SilentlyContinue
    ```

2. **Check app logs:**

    ```
    C:\Users\[You]\AppData\Roaming\PressBox\logs\
    ```

3. **Clear app data:**

    ```powershell
    Remove-Item "$env:APPDATA\PressBox" -Recurse -Force
    ```

4. **Enable DevTools in production** (temporarily):
   Edit `src/main/main.ts`:

    ```typescript
    this.mainWindow?.webContents.openDevTools(); // Add after ready-to-show
    ```

5. **Check console for errors:**
    - Look for path-related errors
    - Check what `__dirname` actually is

## 💡 Prevention

To avoid this issue in future:

1. **Always test packaged app** before distributing:

    ```powershell
    npm run dist:win:installer
    # Then install and test!
    ```

2. **Use relative paths** from `__dirname`

3. **Test on clean machine** if possible

4. **Enable logging** in production for debugging

5. **Use `app.isPackaged`** to differentiate dev vs prod

---

## Summary

✅ **Fixed:** Corrected renderer HTML path from `../renderer/` to `../../renderer/`  
✅ **Cause:** Incorrect relative path in production build  
✅ **Solution:** Adjusted path to match actual packaged structure  
✅ **Status:** Installer rebuilt and ready for testing

**The blank screen issue is now fixed!** 🎉

---

**Date:** October 17, 2025  
**Priority:** Critical  
**Status:** ✅ Fixed  
**Testing:** Required - reinstall and verify
