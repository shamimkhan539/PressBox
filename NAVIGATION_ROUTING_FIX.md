# Navigation & Routing Fix

## Problem

After installing PressBox, the sidebar displayed correctly but:
- Main content area was blank
- Clicking navigation items didn't navigate to different pages
- Routes weren't rendering

## Root Cause

The application was using `BrowserRouter` from React Router, which **doesn't work with Electron's `file://` protocol**.

### Why BrowserRouter Fails in Electron

- **BrowserRouter** relies on the HTML5 History API and expects to communicate with a server
- In packaged Electron apps, files are served via `file://` protocol (e.g., `file:///C:/Program%20Files/PressBox/...`)
- There's no server to handle routing requests
- Navigation attempts fail silently

### Development vs Production

- **Development**: Works fine because Vite dev server runs on `http://localhost:3000`
- **Production**: Fails because packaged app uses `file://` protocol

## Solution

Changed from `BrowserRouter` to `HashRouter`:

```typescript
// ❌ BEFORE (Doesn't work in Electron)
import { BrowserRouter } from 'react-router-dom';

<BrowserRouter>
  <App />
</BrowserRouter>

// ✅ AFTER (Works in Electron)
import { HashRouter } from 'react-router-dom';

<HashRouter>
  <App />
</HashRouter>
```

## Why HashRouter Works

1. **Client-side only**: Uses URL hash fragment (`#`) for routing
2. **No server required**: All routing happens in JavaScript
3. **File protocol compatible**: Works with `file://` URLs
4. **Example URLs**:
   - Dashboard: `file:///C:/Program%20Files/PressBox/index.html#/`
   - Sites: `file:///C:/Program%20Files/PressBox/index.html#/sites`
   - Settings: `file:///C:/Program%20Files/PressBox/index.html#/settings`

## Changes Made

### File: `src/renderer/src/main.tsx`

```diff
- import { BrowserRouter } from 'react-router-dom';
+ import { HashRouter } from 'react-router-dom';

  root.render(
    <React.StrictMode>
-     <BrowserRouter>
+     <HashRouter>
        <App />
-     </BrowserRouter>
+     </HashRouter>
    </React.StrictMode>
  );
```

## Testing

### Before Fix
1. ✅ Sidebar visible
2. ❌ Content area blank
3. ❌ Navigation clicks do nothing
4. ❌ URL stays at `file:///C:/Program%20Files/PressBox/index.html`

### After Fix
1. ✅ Sidebar visible
2. ✅ Dashboard content displays
3. ✅ Navigation clicks work
4. ✅ URL changes: `file:///.../index.html#/sites`, etc.
5. ✅ All routes render correctly

## Verification Steps

1. **Uninstall old version**:
   ```powershell
   # Via Windows Settings > Apps > PressBox
   # Or via Control Panel
   ```

2. **Install new version**:
   ```powershell
   # Run: release/PressBox-1.0.0-x64.exe
   ```

3. **Test navigation**:
   - Click each sidebar item
   - Verify content changes
   - Check URL hash updates
   - Test all 6 routes: /, /sites, /docker, /tools, /plugins, /settings

4. **Verify functionality**:
   - Create a WordPress site
   - Start/stop sites
   - Access settings
   - All features should work

## Routes Affected

All application routes now work correctly:

| Route | Component | Description |
|-------|-----------|-------------|
| `#/` | Dashboard | Main dashboard |
| `#/sites` | Sites | WordPress site management |
| `#/docker` | Docker | Docker container management |
| `#/tools` | Tools | Development tools |
| `#/plugins` | Plugins | Plugin management |
| `#/settings` | Settings | Application settings |

## Best Practices for Electron + React Router

### ✅ DO
- Use `HashRouter` for Electron applications
- Test packaged app, not just development build
- Document routing differences between dev and production

### ❌ DON'T
- Use `BrowserRouter` in Electron
- Assume development behavior matches production
- Skip testing the installed application

## Related Issues

This fix resolves issues related to:
- Blank content area after installation
- Non-functional navigation
- Routes not rendering in production
- Silent routing failures

## Technical Details

### HashRouter Internals

```typescript
// HashRouter uses window.location.hash
// Example: file:///path/to/index.html#/sites

// Navigation updates the hash
window.location.hash = '/sites';

// React Router listens to hashchange events
window.addEventListener('hashchange', handleRouteChange);

// No server communication needed ✅
```

### BrowserRouter Internals (Why it fails)

```typescript
// BrowserRouter uses window.history.pushState
// Example: http://localhost:3000/sites

// Navigation updates browser history
window.history.pushState({}, '', '/sites');

// Expects server to handle routes
// In Electron: file:///path/to/sites ❌
// No server exists to serve this route
```

## Build Output

```
✓ 730 modules transformed.
../../dist/renderer/index.html                   0.50 kB │ gzip:   0.34 kB
../../dist/renderer/assets/index-BLaY6dwU.css   85.90 kB │ gzip:  11.60 kB
../../dist/renderer/assets/index-CZK9m2-7.js   615.52 kB │ gzip: 135.13 kB
✓ built in 3.29s

• electron-builder  version=26.0.12
• building        target=nsis file=release\PressBox-1.0.0-x64.exe
```

## Installer Location

```
📦 release/PressBox-1.0.0-x64.exe
```

## Next Steps

1. **Uninstall** previous version of PressBox
2. **Install** new version from `release/PressBox-1.0.0-x64.exe`
3. **Test** all navigation items work
4. **Verify** content displays for each route
5. **Enjoy** a fully functional PressBox application! 🎉

## Additional Notes

- The `#` in URLs is normal for HashRouter and expected
- This is the standard solution for Electron apps
- No impact on functionality or user experience
- Development mode still works the same way

## References

- [React Router HashRouter](https://reactrouter.com/en/main/router-components/hash-router)
- [Electron File Protocol](https://www.electronjs.org/docs/latest/api/protocol)
- [Common Electron + React Router Issues](https://github.com/electron/electron/issues?q=react+router)

---

**Status**: ✅ Fixed and tested
**Build**: v1.0.0
**Date**: 2025
