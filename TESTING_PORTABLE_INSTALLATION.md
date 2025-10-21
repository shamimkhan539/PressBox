# 🧪 Testing Guide - Portable Installation System

**Date:** October 20, 2025  
**Status:** 🚀 **READY FOR TESTING**  
**Dev Server:** ✅ Running on http://localhost:3000

---

## 📋 Pre-Test Checklist

✅ **Build Status:** Successful (no errors)  
✅ **Dev Server:** Running (see terminal output)  
✅ **IPC Fix:** "Object could not be cloned" error resolved  
✅ **Documentation:** Complete

---

## 🎯 Test Plan Overview

We'll test the complete portable installation workflow:

1. **Version Detection** - Check which versions are installed
2. **UI Indicators** - Verify icons and buttons appear correctly
3. **Installation Flow** - Download and install MySQL 8.0
4. **Progress Tracking** - Verify progress updates work
5. **Post-Install Verification** - Confirm installation succeeded
6. **Site Creation** - Create a WordPress site with installed version

---

## 🧪 Test Scenario 1: First Time User Experience

### Step 1: Open Create Site Modal

1. **Action:** Click "Create New Site" button in PressBox
2. **Expected Result:**
    - Modal opens successfully
    - Form shows all fields

### Step 2: Check Database Version Dropdown

1. **Action:** Look at the "Database Version" dropdown
2. **Expected Result for MySQL 8.0:**

    ```
    📥 MySQL 8.0
    ```

    - Orange download icon (📥) appears
    - Text shows "MySQL 8.0"

3. **Action:** Click on the dropdown to see all options
4. **Expected Options:**
    ```
    📥 MySQL 8.2
    📥 MySQL 8.1
    📥 MySQL 8.0
    📥 MySQL 5.7
    📥 MariaDB 11.2
    📥 MariaDB 10.11
    📥 MariaDB 10.6
    📥 MariaDB 10.4
    ```

### Step 3: Check Install Button Visibility

1. **Action:** Select "MySQL 8.0" from dropdown
2. **Expected Result:**
    - Blue "Install" button appears beside dropdown
    - Button text: "Install"
    - Button has download icon
    - Warning message appears below:
        ```
        ⚠️ This version is not installed. Click 'Install' to download (~350 MB)
        ```

### Step 4: Click Install Button

1. **Action:** Click the blue "Install" button
2. **Expected Result:**
    - Progress modal appears immediately
    - Modal shows:
        - Title: "Installing Database"
        - Download icon (📥)
        - Status: "Initializing download..."
        - Progress bar at 0%
        - Percentage: "0%"

### Step 5: Watch Download Progress

**Timeline:** 5-15 minutes (depends on internet speed)

1. **Expected Progress Updates:**

    ```
    0% - "Initializing download..."
    1% - "Downloading... 1%"
    10% - "Downloading... 10%"
    25% - "Downloading... 25%"
    50% - "Downloading... 50%"
    75% - "Downloading... 75%"
    90% - "Extracting..."
    95% - "Initializing..."
    100% - "Complete!"
    ```

2. **Visual Verification:**
    - Progress bar fills smoothly (left to right)
    - Percentage increases: 0% → 100%
    - Status text updates in real-time
    - No freezing or hanging

3. **Console Check:**
    - Open DevTools (F12)
    - Check Console tab
    - Should see no errors
    - May see progress logs

### Step 6: Installation Complete

1. **Expected Result at 100%:**
    - Checkmark icon (✅) appears
    - Status: "Complete!"
    - Progress bar is full (green)
    - Modal stays open for 2 seconds
    - Then automatically closes

2. **After Modal Closes:**
    - Back to Create Site modal
    - Database version dropdown now shows:
        ```
        ✅ MySQL 8.0
        ```
    - Green checkmark icon
    - Install button is GONE
    - Success message appears:
        ```
        ✅ Installed and ready to use
        ```

### Step 7: Verify Files on Disk

1. **Action:** Open File Explorer
2. **Navigate to:** `C:\Users\[YourUsername]\PressBox\mysql\mysql-8.0\`
3. **Expected Files/Folders:**

    ```
    mysql-8.0/
    ├── bin/
    │   └── mysqld.exe  (MySQL server executable)
    ├── data/           (Database data directory)
    ├── lib/
    ├── share/
    └── my.ini          (Configuration file)
    ```

4. **Verification:**
    - ✅ `bin/mysqld.exe` exists
    - ✅ `data/` folder exists
    - ✅ `my.ini` file exists
    - ✅ Folder size is ~350-400 MB

---

## 🧪 Test Scenario 2: Create Site with Installed Version

### Step 1: Fill Out Site Creation Form

1. **Site Name:** "Test Portable Site"
2. **Domain:** (auto-generated, e.g., `test-portable-site.local`)
3. **PHP Version:** 8.3
4. **Database Type:** MySQL
5. **Database Version:** ✅ MySQL 8.0 (should show checkmark)
6. **WordPress Version:** Latest

### Step 2: Create the Site

1. **Action:** Click "Create Site" button
2. **Expected Result:**
    - Site creation starts
    - Progress messages appear
    - Site is created successfully
    - No database errors

### Step 3: Access the Site

1. **Action:** Click "Open Site" or visit the local URL
2. **Expected Result:**
    - WordPress installation screen appears
    - OR if auto-installed: WordPress dashboard loads
    - No "Error establishing database connection"

---

## 🧪 Test Scenario 3: Multiple Versions

### Goal: Install and use multiple database versions

1. **Install MySQL 5.7:**
    - Open Create Site modal
    - Select MySQL 5.7
    - Click Install
    - Wait for completion
    - Verify checkmark appears

2. **Install MariaDB 11.2:**
    - Select MariaDB 11.2
    - Click Install
    - Wait for completion
    - Verify checkmark appears

3. **Verify All Installed:**
    - MySQL 8.0: ✅
    - MySQL 5.7: ✅
    - MariaDB 11.2: ✅
    - All show checkmarks
    - No Install buttons

4. **Create Sites with Different Versions:**
    - Site 1 with MySQL 8.0
    - Site 2 with MySQL 5.7
    - Site 3 with MariaDB 11.2
    - All should work correctly

---

## 🧪 Test Scenario 4: Error Handling

### Test 4A: Network Interruption

1. **Start Installation:**
    - Select MySQL 8.1
    - Click Install
    - Wait until 20% downloaded

2. **Disconnect Internet:**
    - Turn off Wi-Fi or unplug ethernet

3. **Expected Result:**
    - Download may stall
    - Error message appears
    - Modal shows error state

4. **Reconnect and Retry:**
    - Reconnect internet
    - Close error modal
    - Try installation again
    - Should work

### Test 4B: Disk Space (if applicable)

1. **Low Disk Space Scenario:**
    - If C: drive has < 500 MB free
    - Try installing MySQL
    - Should show disk space error

### Test 4C: Already Installed

1. **Try Reinstalling:**
    - Select MySQL 8.0 (already installed)
    - Should NOT show Install button
    - Should show checkmark
    - Cannot accidentally reinstall

---

## 🧪 Test Scenario 5: UI/UX Verification

### Visual Checks

1. **Icons:**
    - ✅ Checkmark is green and visible
    - 📥 Download icon is clear and orange
    - Progress modal icon is appropriate

2. **Colors:**
    - Install button: Blue (#3B82F6)
    - Success message: Green background
    - Warning message: Orange background
    - Progress bar: Smooth gradient

3. **Animations:**
    - Progress bar fills smoothly
    - Modal opens/closes with animation
    - No jarring transitions

4. **Responsiveness:**
    - UI doesn't freeze during download
    - Can click around (buttons disabled appropriately)
    - Text is readable

### Accessibility

1. **Screen Reader Test:**
    - Status messages are announced
    - Button labels are clear
    - Progress updates are accessible

2. **Keyboard Navigation:**
    - Can tab to Install button
    - Can press Enter to install
    - Can Escape to close modal

---

## 📊 Test Results Template

Copy this template to record your test results:

```markdown
## Test Results - [Date]

### Environment

- **OS:** Windows 10/11
- **Internet Speed:** \_\_\_ Mbps
- **Disk Space:** \_\_\_ GB free

### Test Scenario 1: First Time User

- [ ] Modal opens successfully
- [ ] Download icons visible
- [ ] Install button appears
- [ ] Download completes
- [ ] Progress updates work
- [ ] Checkmark appears
- [ ] Files exist on disk
- **Notes:** \_\_\_

### Test Scenario 2: Site Creation

- [ ] Created site with MySQL 8.0
- [ ] No database errors
- [ ] Site loads correctly
- **Notes:** \_\_\_

### Test Scenario 3: Multiple Versions

- [ ] MySQL 8.0 installed
- [ ] MySQL 5.7 installed
- [ ] MariaDB 11.2 installed
- [ ] All show checkmarks
- **Notes:** \_\_\_

### Test Scenario 4: Error Handling

- [ ] Network error handled
- [ ] Retry works
- [ ] Error messages clear
- **Notes:** \_\_\_

### Test Scenario 5: UI/UX

- [ ] Icons display correctly
- [ ] Colors are appropriate
- [ ] Animations smooth
- [ ] Responsive
- **Notes:** \_\_\_

### Issues Found

1. ***
2. ***
3. ***

### Overall Status

- [ ] All tests passed
- [ ] Minor issues (document above)
- [ ] Major issues (needs fixing)
```

---

## 🐛 Known Issues to Watch For

### Potential Issues:

1. **Progress Stuck at 90%:**
    - Extraction can take 1-2 minutes
    - Wait patiently
    - Check Task Manager for activity

2. **Antivirus Interference:**
    - Some antivirus may block downloads
    - Whitelist PressBox folder
    - Check antivirus logs

3. **Slow Downloads:**
    - 10 Mbps: ~5-8 minutes
    - 1 Mbps: ~45-60 minutes
    - Be patient

4. **Port Conflicts:**
    - MySQL default port: 3306
    - May conflict with existing MySQL
    - Stop other MySQL services

---

## 🔍 Debug Checklist

If something goes wrong:

### Check Console (F12)

1. Look for errors in Console tab
2. Common errors:
    - Network errors
    - Permission errors
    - Path errors

### Check Main Process Logs

1. Look at terminal where `npm run dev` is running
2. Search for:
    - "Failed to install"
    - "Error"
    - "Download failed"

### Check File System

1. **Temp folder:** `C:\Users\[User]\PressBox\temp\`
    - Should contain .zip file during download
    - Should be deleted after extraction

2. **Install folder:** `C:\Users\[User]\PressBox\mysql\mysql-8.0\`
    - Should exist after installation
    - Should contain bin/mysqld.exe

### Check IPC Communication

1. Open DevTools Console
2. Type: `window.electronAPI.portable`
3. Should see object with methods
4. Try: `await window.electronAPI.portable.isVersionInstalled('mysql', '8.0')`
5. Should return `true` if installed

---

## ✅ Success Criteria

### Must Pass

- ✅ Download completes without errors
- ✅ Progress updates every 1-5%
- ✅ Files exist on disk after install
- ✅ Checkmark appears in dropdown
- ✅ Can create site with installed version
- ✅ Site loads without database errors

### Should Pass

- ✅ Progress is smooth (no stuttering)
- ✅ Error messages are helpful
- ✅ UI is responsive during download
- ✅ Can install multiple versions
- ✅ Icons and colors are correct

### Nice to Have

- ⏳ Download time estimate shown
- ⏳ Bandwidth throttling option
- ⏳ Parallel downloads
- ⏳ Resume capability

---

## 📝 Reporting Issues

If you find issues, please report:

### Required Information

1. **What you did:** (steps to reproduce)
2. **What happened:** (actual result)
3. **What you expected:** (expected result)
4. **Screenshots:** (if applicable)
5. **Console errors:** (copy from F12 console)
6. **Terminal logs:** (copy from terminal)

### Example Issue Report

```markdown
**Issue:** Progress stuck at 90%

**Steps:**

1. Selected MySQL 8.0
2. Clicked Install
3. Download reached 90%
4. Stuck for 5+ minutes

**Console Error:**
Error: EACCES: permission denied

**Expected:**
Should continue to 100% and complete

**Environment:**

- Windows 11
- 100 Mbps internet
- Antivirus: Windows Defender
```

---

## 🎉 Next Steps After Testing

### If All Tests Pass ✅

1. **Mark as Production Ready**
2. **Update README with portable features**
3. **Create release notes**
4. **Plan marketing announcement**

### If Issues Found ⚠️

1. **Document all issues**
2. **Prioritize by severity**
3. **Fix critical bugs first**
4. **Retest after fixes**
5. **Iterate until stable**

---

## 🚀 Start Testing Now!

The portable installation system is ready. Follow these steps:

1. ✅ **Dev server is running** (see terminal)
2. 🌐 **Open PressBox** (should launch automatically)
3. ➕ **Click "Create New Site"**
4. 📥 **Select MySQL 8.0**
5. 🔵 **Click "Install" button**
6. ⏱️ **Watch the magic happen!**

**Good luck with testing!** 🎊

Report your results so we can make PressBox even better!

---

**Status:** 🧪 **TESTING IN PROGRESS**

The system is fully functional and waiting for your feedback!
