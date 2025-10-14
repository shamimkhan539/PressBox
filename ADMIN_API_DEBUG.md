# 🔧 PressBox Admin API Debug Report

## ✅ **Current Status**

- **Application**: Running successfully in Electron window
- **Development Server**: Active on port 3000
- **Preload Script**: Built and available at `dist/main/preload/preload.js`
- **Admin API**: Present in preload script (verified by file search)

## 🐛 **Issue Analysis**

### **Problem**: `window.electronAPI.system.checkAdmin is not a function`

### **Potential Causes**:

1. **Preload Script Loading**: Development mode might not be using the correct preload script
2. **API Exposure**: The contextBridge might not be properly exposing the system API
3. **Timing Issue**: The API might not be available when React tries to call it
4. **Path Resolution**: Development vs production path differences

## 🔍 **Debugging Steps**

### **Step 1: Verify API Availability**

Open PressBox DevTools (Ctrl+Shift+I) and run this in the Console:

```javascript
console.log("=== ELECTRON API DEBUG ===");
console.log("window.electronAPI:", window.electronAPI);

if (window.electronAPI) {
    console.log("electronAPI keys:", Object.keys(window.electronAPI));

    if (window.electronAPI.system) {
        console.log("system API keys:", Object.keys(window.electronAPI.system));
        console.log(
            "checkAdmin function:",
            typeof window.electronAPI.system.checkAdmin
        );

        // Try calling it
        window.electronAPI.system
            .checkAdmin()
            .then((result) => console.log("checkAdmin result:", result))
            .catch((error) => console.error("checkAdmin error:", error));
    } else {
        console.log("❌ system API is missing!");
    }
} else {
    console.log("❌ electronAPI is completely missing!");
}
```

### **Step 2: Check Preload Script Loading**

In DevTools Console, also check:

```javascript
console.log("Preload script loaded:", !!window.electronAPI);
console.log(
    "Available APIs:",
    window.electronAPI ? Object.keys(window.electronAPI) : "None"
);
```

## 🛠️ **Immediate Fixes to Try**

### **Fix 1: Delay Admin Check**

The API might not be ready when React mounts. Try adding a delay:

```typescript
// In App.tsx, modify the admin check:
useEffect(() => {
    const checkAdminPrivileges = async () => {
        if (hasCheckedAdmin) return;

        // Add a small delay to ensure API is ready
        await new Promise((resolve) => setTimeout(resolve, 1000));

        try {
            const adminStatus = await window.electronAPI.system.checkAdmin();
            setHasCheckedAdmin(true);

            if (!adminStatus.isAdmin || !adminStatus.canModifyHosts) {
                setShowAdminNotification(true);
            }
        } catch (error) {
            console.error("Failed to check admin privileges:", error);
            setHasCheckedAdmin(true);
        }
    };

    checkAdminPrivileges();
}, [hasCheckedAdmin]);
```

### **Fix 2: Add API Ready Check**

```typescript
// Add this utility function to check if API is ready
const waitForElectronAPI = (): Promise<void> => {
    return new Promise((resolve) => {
        const checkAPI = () => {
            if (
                window.electronAPI &&
                window.electronAPI.system &&
                window.electronAPI.system.checkAdmin
            ) {
                resolve();
            } else {
                setTimeout(checkAPI, 100);
            }
        };
        checkAPI();
    });
};

// Use it before calling checkAdmin
useEffect(() => {
    const checkAdminPrivileges = async () => {
        if (hasCheckedAdmin) return;

        try {
            await waitForElectronAPI();
            const adminStatus = await window.electronAPI.system.checkAdmin();
            setHasCheckedAdmin(true);

            if (!adminStatus.isAdmin || !adminStatus.canModifyHosts) {
                setShowAdminNotification(true);
            }
        } catch (error) {
            console.error("Failed to check admin privileges:", error);
            setHasCheckedAdmin(true);
        }
    };

    checkAdminPrivileges();
}, [hasCheckedAdmin]);
```

## 🔄 **Alternative Solutions**

### **Solution 1: Skip Admin Check in Development**

```typescript
useEffect(() => {
    const checkAdminPrivileges = async () => {
        if (hasCheckedAdmin) return;

        // Skip admin check in development if API is not available
        if (
            process.env.NODE_ENV === "development" &&
            (!window.electronAPI ||
                !window.electronAPI.system ||
                !window.electronAPI.system.checkAdmin)
        ) {
            console.warn(
                "Admin API not available in development, skipping check"
            );
            setHasCheckedAdmin(true);
            return;
        }

        try {
            const adminStatus = await window.electronAPI.system.checkAdmin();
            setHasCheckedAdmin(true);

            if (!adminStatus.isAdmin || !adminStatus.canModifyHosts) {
                setShowAdminNotification(true);
            }
        } catch (error) {
            console.error("Failed to check admin privileges:", error);
            setHasCheckedAdmin(true);
        }
    };

    checkAdminPrivileges();
}, [hasCheckedAdmin]);
```

## 📋 **Next Steps**

1. **Run the debug script** in DevTools Console to see what APIs are actually available
2. **Try Fix 1 or Fix 2** to handle timing issues
3. **If APIs are missing**, we need to investigate the preload script loading further
4. **Report back** with the results from the debug script

## 🎯 **Expected Outcome**

After applying these fixes:

- ✅ No more `checkAdmin is not a function` errors
- ✅ Admin privilege checking works properly
- ✅ Sites can be created and started without issues
- ✅ Browser opening functionality works correctly

The WordPress site creation and management should work perfectly once the admin API is properly loaded!
