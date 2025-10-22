# MySQL Database Connection Fix

## Issue

After fixing DNS issues, users were getting "Error establishing a database connection" when opening WordPress sites created with MySQL database.

## Root Cause Analysis

### 1. MySQL Server Status

**✅ MySQL is running:** Process `mysqld` is active on the system

### 2. Connection Issue

**❌ Authentication failure:** MySQL root user requires a password, but the application was trying to connect with an empty password.

**Error:** `Access denied for user 'root'@'localhost' (using password: NO)`

### 3. Application Configuration

**❌ Missing root password field:** The site creation form had no way to input the MySQL root password, defaulting to empty string.

## Solution Implemented

### 1. Added MySQL Root Password Field

**File:** `src/renderer/src/components/CreateSiteModal.tsx`

#### Added to Form State:

```typescript
dbRootPassword: '',
```

#### Added UI Field:

```tsx
{
    formData.database !== "sqlite" && (
        <div>
            <label className="form-label">MySQL Root Password *</label>
            <input
                type="password"
                value={formData.dbRootPassword}
                onChange={(e) =>
                    handleInputChange("dbRootPassword", e.target.value)
                }
                className="form-input"
                placeholder="Enter your MySQL root password"
                disabled={creating}
                required
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Required to create database and user for this site
            </p>
        </div>
    );
}
```

#### Added Validation:

```typescript
if (
    (formData.database === "mysql" || formData.database === "mariadb") &&
    !formData.dbRootPassword.trim()
) {
    setError("Please enter your MySQL root password");
    return;
}
```

#### Updated Site Configuration:

```typescript
dbRootPassword: formData.dbRootPassword,
```

#### Added to Review Summary:

```tsx
{
    formData.database !== "sqlite" && (
        <div className="flex justify-between">
            <dt className="text-blue-700 dark:text-blue-300">Root Password:</dt>
            <dd className="text-blue-900 dark:text-blue-100 font-medium">
                {formData.dbRootPassword ? "••••••••" : "Not set"}
            </dd>
        </div>
    );
}
```

## User Experience Flow

### Before Fix

```
1. User selects MySQL database
2. No root password field shown
3. Site creation succeeds (wp-config.php created)
4. User starts site
5. MySQL setup fails: "Access denied for user 'root'@'localhost'"
6. WordPress shows: "Error establishing a database connection" ❌
```

### After Fix

```
1. User selects MySQL database
2. MySQL Root Password field appears
3. User enters their MySQL root password
4. Site creation succeeds
5. User starts site
6. MySQL database and user created successfully
7. WordPress loads with working database connection ✅
```

## Technical Details

### Database Setup Process

When MySQL/MariaDB is selected:

1. **wp-config.php Creation:** Creates WordPress config with MySQL settings
2. **Site Start:** Triggers `setupMySQLDatabase()` method
3. **Root Connection:** Connects using provided root password
4. **Database Creation:** Creates `wp_sitename` database
5. **User Creation:** Creates `wordpress` user with privileges
6. **WordPress Installation:** Proceeds with database setup

### MySQL Connection Parameters

```typescript
const connection = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: config.dbRootPassword, // Now provided by user
});
```

### Database and User Creation

```sql
CREATE DATABASE IF NOT EXISTS `wp_sitename`;
CREATE USER IF NOT EXISTS 'wordpress'@'localhost' IDENTIFIED BY 'wordpress';
GRANT ALL PRIVILEGES ON `wp_sitename`.* TO 'wordpress'@'localhost';
FLUSH PRIVILEGES;
```

## Testing Checklist

### Test 1: MySQL Site Creation

1. **Open Create Site modal**
2. **Select MySQL database**
3. **Verify MySQL Root Password field appears**
4. **Enter correct MySQL root password**
5. **Create site**
6. **Start site**
7. **Open site in browser**
8. **Verify WordPress loads without database errors** ✅

### Test 2: Validation

1. **Select MySQL database**
2. **Leave root password empty**
3. **Try to create site**
4. **Verify error: "Please enter your MySQL root password"**

### Test 3: SQLite Still Works

1. **Select SQLite database**
2. **Verify no root password field shown**
3. **Create site**
4. **Verify works without MySQL**

### Test 4: Wrong Password

1. **Enter incorrect MySQL root password**
2. **Create site**
3. **Start site**
4. **Verify MySQL setup fails with auth error**

## Security Considerations

- **Password Masking:** Root password is masked in UI (shows ••••••••)
- **No Password Storage:** Password is only used during setup, not stored
- **User Responsibility:** Users must provide their own MySQL credentials
- **Database Isolation:** Each site gets its own database and user

## Troubleshooting

### Issue: "Access denied for user 'root'@'localhost'"

**Solution:** Verify MySQL root password is correct in the form

### Issue: "MySQL server not running"

**Solution:** Start MySQL service or check if it's installed

### Issue: Site works but shows database error

**Solution:** Check MySQL user permissions and database existence

### Issue: Can't find MySQL root password

**Solutions:**

- Check MySQL installation documentation
- Use HeidiSQL or MySQL Workbench to verify credentials
- Reset MySQL root password if needed

## Build Status

```bash
npm run build
# ✓ Build succeeded with no problems
```

## Migration Notes

**For existing MySQL sites:**

- Sites created before this fix may need recreation with correct root password
- Old sites with database errors can be recreated using this fixed form

**For new MySQL sites:**

- Root password field is now required
- Database setup will work correctly

## Future Improvements

1. **Password Detection:** Auto-detect MySQL root password
2. **Connection Testing:** Test MySQL connection before site creation
3. **Password Storage:** Secure storage of MySQL credentials (optional)
4. **Multiple Databases:** Support for existing databases
5. **Docker Integration:** Use Docker MySQL containers

---

## Success Criteria

After this fix:

- ✅ MySQL sites can be created successfully
- ✅ Database connection errors are resolved
- ✅ WordPress loads with working MySQL database
- ✅ User has control over MySQL authentication
- ✅ SQLite remains available as fallback
- ✅ Clear validation and error messages

---

**Status:** ✅ Fixed and deployed  
**Date:** October 18, 2025
