# CRITICAL: Database Connection Fix Required

## Current Status

❌ **simpleWordPressManager.ts is CORRUPTED** - File has syntax errors preventing compilation
❌ **Database connections failing** - MySQL not being verified before use
❌ **No proper SQLite fallback** - Sites fail instead of falling back gracefully

## Immediate Action Required

### Step 1: Restore Clean File

```powershell
# The file is corrupted. Restore from git:
git checkout HEAD -- src/main/services/simpleWordPressManager.ts

# OR restore from backup if exists:
copy src\main\services\simpleWordPressManager.ts.backup src\main\services\simpleWordPressManager.ts
```

### Step 2: Key Issues to Fix

#### Issue 1: setupMySQLDatabase() doesn't verify server is running

**Current Problem**: Tries to connect without checking MySQL status

**Fix Required**: Add server verification BEFORE attempting connection

#### Issue 2: startSite() doesn't handle MySQL failures

**Current Problem**: Throws error instead of falling back to SQLite

**Fix Required**: Wrap MySQL setup in try-catch and fallback to SQLite on failure

#### Issue 3: No wp-config.php update on fallback

**Current Problem**: Config file stays with MySQL even when SQLite is used

**Fix Required**: Update wp-config.php to SQLite configuration when fallback occurs

## Quick Test Without Full Implementation

### Test MySQL Server Status First:

1. Open Tools → Database Management
2. Check if MySQL/MariaDB shows as "Running"
3. If stopped, click "Start Server"
4. Wait 3-5 seconds for server to fully start
5. Then try creating/starting your site

### Manual SQLite Switch:

If MySQL keeps failing, manually switch site to SQLite:

1. Navigate to: `C:\Users\[YourUser]\PressBox\sites\[sitename]\`
2. Edit `pressbox-config.json`
3. Change `"database": "mysql"` to `"database": "sqlite"`
4. Edit `wp-config.php` and replace MySQL section with:

```php
<?php
define( 'DB_ENGINE', 'sqlite' );
define( 'DB_DIR', dirname( __FILE__ ) . '/wp-content/database/' );
define( 'DB_FILE', '.ht.sqlite' );
define( 'DB_NAME', 'wordpress' );
define( 'DB_USER', '' );
define( 'DB_PASSWORD', '' );
define( 'DB_HOST', '' );
// ... rest of wp-config.php
```

5. Create folder: `wp-content\database\`
6. Restart the site

## Root Cause

The simpleWordPressManager.ts file became corrupted during edits. Multiple attempts to fix created duplicate code blocks and syntax errors.

## Recommended Solution

1. Restore clean version of simpleWordPressManager.ts from git
2. Apply fixes methodically in small, tested increments
3. Build and test after each change
4. Don't make multiple large edits simultaneously

## What The Fixes Should Accomplish

✅ Check if MySQL/MariaDB is running before connecting
✅ Auto-start MySQL if it's stopped
✅ Retry connection with exponential backoff
✅ Gracefully fallback to SQLite if MySQL fails
✅ Update wp-config.php to match actual database used
✅ Update site object database property correctly
✅ Save updated configuration to pressbox-config.json

## Files That Need Changes

1. `src/main/services/simpleWordPressManager.ts` - Main fixes
2. `src/main/services/databaseServerManager.ts` - Already has server management
3. No other files need changes

## Test Plan After Fix

1. ✅ Stop MySQL server
2. ✅ Create new site with MySQL selected
3. ✅ Should auto-start MySQL server
4. ✅ Site should work with MySQL
5. ✅ If MySQL fails, should fall back to SQLite
6. ✅ Site card should show correct database type
7. ✅ No "Error establishing a database connection"

## Current Workaround

Until file is fixed:

1. Always ensure MySQL is running before creating/starting sites
2. Check Tools → Database Management
3. Start MySQL server manually
4. Then create sites

OR:

1. Create all sites with SQLite selected
2. SQLite is always available and doesn't need server

## Priority

🔴 **CRITICAL** - Application won't build until simpleWordPressManager.ts is fixed

## Next Steps

1. User should restore clean file
2. We can then apply targeted fixes one at a time
3. Test each fix before moving to next
4. Build incrementally to avoid corruption
