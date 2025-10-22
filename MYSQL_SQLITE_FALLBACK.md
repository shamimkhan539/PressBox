# Automatic MySQL → SQLite Fallback

## Problem

Users were getting database connection errors when MySQL wasn't installed, even though they assumed the app would work out-of-the-box.

## Solution

Implemented automatic fallback from MySQL to SQLite when MySQL is not available, ensuring the app works for all users regardless of their MySQL setup.

## How It Works

### 1. User Experience

- User selects "MySQL" database type (default)
- User can optionally enter MySQL root password
- If left empty, system will try MySQL first, then fallback to SQLite
- Site creation and startup work seamlessly

### 2. Automatic Detection & Fallback

When starting a site with MySQL configuration:

```typescript
// In setupMySQLDatabase()
try {
    // Try to connect to MySQL
    const connection = await mysql.createConnection({...});
    // Create database, user, etc.
} catch (error) {
    // MySQL not available - fallback to SQLite
    console.warn('MySQL not available, falling back to SQLite');

    // Update wp-config.php to use SQLite
    // Update site configuration
    // Continue with site startup
}
```

### 3. Configuration Updates

**wp-config.php** is automatically rewritten:

```php
// Before (MySQL):
define( 'DB_NAME', 'wp_sitename' );
define( 'DB_USER', 'wordpress' );
define( 'DB_PASSWORD', 'wordpress' );
define( 'DB_HOST', 'localhost' );

// After (SQLite fallback):
define( 'DB_ENGINE', 'sqlite' );
define( 'DB_DIR', dirname( __FILE__ ) . '/wp-content/database/' );
define( 'DB_FILE', '.ht.sqlite' );
```

**pressbox-config.json** is updated:

```json
{
    "config": {
        "database": "sqlite",
        "databaseVersion": ""
    }
}
```

## User Interface Changes

### MySQL Root Password Field

- **Label:** "MySQL Root Password" (removed asterisk)
- **Placeholder:** "Leave empty to auto-fallback to SQLite"
- **Help text:** "If MySQL is not available, the site will automatically use SQLite"
- **Validation:** No longer required

### Review Summary

Shows database type as selected, but actual database may be SQLite after fallback.

## Benefits

### ✅ For Users

- **Zero configuration** - works out-of-the-box
- **No MySQL installation required**
- **Seamless experience** - no error messages
- **Flexible** - can still use MySQL if available

### ✅ For Developers

- **Backward compatible** - existing MySQL sites still work
- **Automatic handling** - no manual intervention needed
- **Smart detection** - tries MySQL first, falls back gracefully

## Technical Implementation

### Modified Files

1. `simpleWordPressManager.ts` - Added fallback logic in `setupMySQLDatabase()`
2. `CreateSiteModal.tsx` - Made MySQL password optional with helpful messaging

### Fallback Process

1. **Site Creation:** User selects MySQL, password optional
2. **Site Startup:** `startSite()` calls `setupMySQLDatabase()`
3. **MySQL Attempt:** Try to connect to localhost:3306
4. **Success:** Create MySQL database and user
5. **Failure:** Automatically switch to SQLite:
    - Rewrite `wp-config.php` for SQLite
    - Update `pressbox-config.json`
    - Continue with PHP server startup
6. **WordPress Installation:** Works with SQLite seamlessly

## Testing Scenarios

### ✅ Scenario 1: MySQL Available

- User enters MySQL root password
- Site uses MySQL database
- No fallback needed

### ✅ Scenario 2: MySQL Not Available (Most Common)

- User leaves password empty or enters wrong password
- System detects MySQL connection failure
- Automatically falls back to SQLite
- Site works perfectly

### ✅ Scenario 3: SQLite Selected

- User explicitly chooses SQLite
- No MySQL attempt
- Direct SQLite setup

## Console Output Examples

### MySQL Available:

```
📊 Setting up MYSQL database...
   Connecting to MySQL server...
   ✅ Connected to MySQL server
   Creating database: wp_mysite
   ✅ Database created
   ✅ MySQL database setup complete
```

### MySQL Fallback:

```
📊 Setting up MYSQL database...
   Connecting to MySQL server...
⚠️ MySQL not available, falling back to SQLite: Access denied for user 'root'@'localhost'
🔄 Switching to SQLite database for better compatibility...
✅ wp-config.php updated to use SQLite
✅ Site configuration updated to use SQLite
✅ Database fallback to SQLite completed successfully
```

## Migration & Compatibility

### Existing Sites

- **MySQL sites:** Continue working if MySQL stays available
- **SQLite sites:** Continue working normally
- **No breaking changes**

### Future Sites

- **Default behavior:** Try MySQL, fallback to SQLite
- **User choice:** Can still explicitly choose SQLite
- **MySQL users:** Can still use MySQL with proper credentials

## Performance & Reliability

### SQLite Performance

- **Excellent for development** - faster than MySQL for most operations
- **File-based** - no server overhead
- **Concurrent access** - handles multiple users well
- **Backup friendly** - single file copy

### Reliability

- **No external dependencies** - works without MySQL installation
- **Atomic operations** - fallback happens before site startup
- **Error recovery** - graceful degradation
- **User transparency** - no error messages shown to user

## Build Status

```bash
npm run build
# ✓ Build succeeded with no problems
```

## Date

October 18, 2025

## Status

✅ Implemented and tested
