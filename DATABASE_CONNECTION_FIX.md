# Database Connection Error Fix

## Issue

After fixing the DNS issue, users were getting "Error establishing a database connection" when opening WordPress sites in the browser.

## Root Cause

The application was defaulting to MySQL database for new sites, but most users don't have MySQL installed and running on their system. The `setupMySQLDatabase` method tries to connect to `localhost:3306` but fails with `ECONNREFUSED` when MySQL isn't running.

## Solution

Changed the default database from MySQL to SQLite in the site creation form. SQLite works out-of-the-box without requiring separate database server installation.

## Code Change

### File: `src/renderer/src/components/CreateSiteModal.tsx`

**Location:** Form data initialization (Line 58)

**Before:**

```typescript
database: 'mysql' as 'mysql' | 'mariadb' | 'sqlite',
```

**After:**

```typescript
database: 'sqlite' as 'mysql' | 'mariadb' | 'sqlite',
```

## Why SQLite is Better for Local Development

### SQLite Advantages:

- ✅ **No installation required** - Works immediately
- ✅ **Zero configuration** - No server setup needed
- ✅ **File-based** - Database stored as single file in site directory
- ✅ **Cross-platform** - Works on Windows, macOS, Linux
- ✅ **Fast** - Excellent performance for development
- ✅ **Backup friendly** - Easy to copy/move entire sites

### MySQL Disadvantages for Local Dev:

- ❌ **Requires installation** - MySQL/MariaDB server needed
- ❌ **Server management** - Must be running in background
- ❌ **Configuration complexity** - Root passwords, user permissions
- ❌ **Resource intensive** - Uses more memory/CPU
- ❌ **Platform differences** - Installation varies by OS

## User Experience

### Before Fix

```
1. User creates new site
2. Site creation succeeds (wp-config.php created)
3. User clicks "Open Site"
4. Browser opens: http://localhost:8001/
5. WordPress shows: "Error establishing a database connection" ❌
6. User confused - site appears broken
```

### After Fix

```
1. User creates new site (defaults to SQLite)
2. Site creation succeeds
3. User clicks "Open Site"
4. Browser opens: http://localhost:8001/
5. WordPress installation page loads ✅
6. User can complete WordPress setup
```

## Technical Details

### Database Setup Process

**SQLite Path:**

1. `configureWordPress()` creates `wp-config.php` with SQLite configuration
2. No database server connection needed
3. WordPress automatically creates SQLite database file on first access

**MySQL Path (when explicitly chosen):**

1. `configureWordPress()` creates `wp-config.php` with MySQL configuration
2. `startSite()` calls `setupMySQLDatabase()`
3. Attempts to connect to `localhost:3306`
4. Creates database, user, and grants permissions
5. **Fails if MySQL server not running**

### Configuration Differences

**SQLite wp-config.php:**

```php
define( 'DB_ENGINE', 'sqlite' );
define( 'DB_DIR', dirname( __FILE__ ) . '/wp-content/database/' );
define( 'DB_FILE', '.ht.sqlite' );
// Other DB_* constants are ignored
```

**MySQL wp-config.php:**

```php
define( 'DB_NAME', 'wp_sitename' );
define( 'DB_USER', 'wordpress' );
define( 'DB_PASSWORD', 'wordpress' );
define( 'DB_HOST', 'localhost' );
// Requires running MySQL server
```

## When to Use MySQL

MySQL should still be available for users who:

- Need exact production environment matching
- Want to test MySQL-specific features
- Have MySQL already installed and running
- Need multiple sites sharing same database server

## Testing

### Test 1: Default Site Creation

1. **Open Create Site modal**
2. **Verify database dropdown shows "SQLite" as default**
3. **Create site without changing database**
4. **Start site and open in browser**
5. **Verify WordPress installation page loads** ✅

### Test 2: MySQL Still Available

1. **Open Create Site modal**
2. **Change database to "MySQL"**
3. **Create site** (will show MySQL setup instructions if server not running)
4. **Verify MySQL option still works when server is available**

### Test 3: Existing Sites

1. **Verify existing MySQL sites still work** (if MySQL server running)
2. **Verify existing SQLite sites continue working**

## Build Status

```bash
npm run build
# ✓ Build succeeded with no problems
```

## Migration Notes

**For existing users with MySQL sites:**

- No changes needed - existing sites continue working
- If MySQL server stops, those sites will show database errors
- Can recreate sites with SQLite if needed

**For new users:**

- Sites work immediately without database setup
- Can still choose MySQL if preferred

## Future Improvements

1. **Database Server Detection** - Auto-detect if MySQL/MariaDB is running
2. **Fallback Logic** - Auto-switch to SQLite if MySQL setup fails
3. **Database Migration** - Tools to convert between SQLite ↔ MySQL
4. **Docker Integration** - Use Docker containers for database servers

---

## Success Criteria

After this fix:

- ✅ New sites work out-of-the-box without MySQL installation
- ✅ WordPress loads successfully at localhost URLs
- ✅ No "Error establishing a database connection" for new users
- ✅ MySQL still available for users who need it
- ✅ Cross-platform compatibility maintained
- ✅ Development workflow simplified

---

**Status:** ✅ Fixed and deployed  
**Date:** October 18, 2025
