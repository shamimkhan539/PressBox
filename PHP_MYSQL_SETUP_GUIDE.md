# PHP MySQL Extension Setup Guide

## Issue

WordPress requires the MySQL/MySQLi PHP extension to connect to databases. If you see the error:

```
Your PHP installation appears to be missing the MySQL extension which is required by WordPress.
```

This means the MySQL extensions are not enabled in your PHP installation.

## Solution

### Option 1: Enable MySQL Extensions (Recommended)

1. **Locate your php.ini file:**

    ```bash
    php --ini
    ```

    This will show you the path (e.g., `C:\Program Files\php\php.ini`)

2. **Edit php.ini:**
    - Open the file with administrator privileges
    - Find these lines (they may be commented out with `;`):
        ```ini
        ;extension=mysqli
        ;extension=pdo_mysql
        ```
3. **Uncomment the extensions:**
   Remove the semicolon (`;`) at the beginning:

    ```ini
    extension=mysqli
    extension=pdo_mysql
    ```

4. **Save the file and restart PressBox**

5. **Verify the extensions are loaded:**
    ```bash
    php -m | findstr mysqli
    ```

### Option 2: Use SQLite Instead (Alternative)

If you can't modify php.ini, you can use WordPress with SQLite:

1. Download the SQLite Integration plugin
2. Place it in your WordPress plugins directory
3. Configure WordPress to use SQLite instead of MySQL

## Verification

After enabling the extensions, run:

```bash
php -m
```

You should see:

- mysqli
- mysqlnd
- pdo_mysql

## Troubleshooting

### Extensions still not loading?

1. **Check PHP extension directory:**

    ```bash
    php -i | findstr extension_dir
    ```

2. **Verify DLL files exist:**
   Look for `php_mysqli.dll` and `php_pdo_mysql.dll` in the extension directory

3. **Check PHP version compatibility:**
   Make sure the extension DLLs match your PHP version (8.3.4)

### Permission Issues?

If you can't edit `php.ini`, you can:

- Run PressBox as administrator (not recommended)
- Install a local PHP version in your user directory
- Use Docker mode (requires Docker Desktop)

## Need Help?

If you continue to have issues:

1. Check the PressBox logs
2. Visit the WordPress support forums
3. Consider using Docker mode for automatic environment setup
