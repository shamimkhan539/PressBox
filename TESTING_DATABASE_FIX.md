# Quick Testing Guide - Database Connection Fix

## 🧪 Manual Testing Instructions

### Prerequisites

✅ Application is running (`npm run dev`)  
✅ Build completed without errors

---

## Test 1: Create Site with MySQL (Happy Path)

**Steps:**

1. Open PressBox application
2. Click "Create New Site"
3. Fill in site details:
    - Site Name: `test-mysql-site`
    - Database: Select "MySQL"
4. Click "Create Site"

**Expected Results:**

- ✅ Console shows "🔍 Checking database server status..."
- ✅ If MySQL stopped, shows "🚀 Starting MySQL..."
- ✅ Shows "🔌 Connecting to MySQL server..."
- ✅ Shows "✅ Connected to MySQL server"
- ✅ Shows "✅ MySQL database setup complete"
- ✅ Site created successfully
- ✅ Site card shows green "Running" badge

**Check in Console:**

```
🚀 Starting WordPress site: test-mysql-site
📊 Setting up MYSQL database...
   🔍 Checking database server status...
   ✅ mysql 8.0.30 is running
   🔌 Connecting to MySQL server...
   ✅ Connected to MySQL server
   📊 Creating database: test_mysql_site
   ✅ Database created: test_mysql_site
   👤 Setting up database user: wordpress
   ✅ Database user configured
   ✅ Database verified and accessible
✅ MySQL database setup complete
```

---

## Test 2: Create Site with SQLite Fallback

**Steps:**

1. **Stop MySQL** (if running):
    - Go to Tools → Database Management
    - Click "Stop" on MySQL server
2. Click "Create New Site"
3. Fill in site details:
    - Site Name: `test-fallback-site`
    - Database: Select "MySQL" (intentionally)
4. Click "Create Site"

**Expected Results:**

- ⚠️ Console shows MySQL connection attempts
- ⚠️ Shows "⚠️ MySQL setup failed"
- ✅ Shows "🔄 Falling back to SQLite database..."
- ✅ Shows "🔄 Configuring SQLite database..."
- ✅ Shows "✅ SQLite fallback configured successfully"
- ✅ Site created successfully with SQLite
- ✅ Site card shows blue "File-based" badge

**Check in Console:**

```
📊 Setting up MYSQL database...
   🔍 Checking database server status...
   ⚠️ mysql server is not running
   🚀 Starting mysql 8.0.30...
   ❌ Failed to start mysql: <error>
⚠️ MySQL setup failed: <error>
🔄 Falling back to SQLite database...
   🔄 Configuring SQLite database...
   ✅ Created SQLite wp-config.php
   ✅ Created database directory
   📦 Installing SQLite integration...
   ✅ SQLite integration installed
   ✅ SQLite fallback configured successfully
✅ Successfully fell back to SQLite
```

---

## Test 3: Create Site with SQLite Direct

**Steps:**

1. Click "Create New Site"
2. Fill in site details:
    - Site Name: `test-sqlite-site`
    - Database: Select "SQLite"
3. Click "Create Site"

**Expected Results:**

- ✅ No MySQL setup attempted
- ✅ Site created immediately
- ✅ Site card shows blue "File-based" badge

---

## Test 4: Database Status Visibility

**Steps:**

1. Navigate to Sites page
2. Check all site cards

**Expected Results:**

- ✅ Each site shows database badge
- ✅ MySQL sites show green "Running" or red "Stopped"
- ✅ SQLite sites show blue "File-based"
- ✅ Warning banner appears if MySQL stopped

**Banner Example:**

```
⚠️ Some database servers are not running.
   Go to Database Management to start them.
```

---

## Test 5: Input Field Accessibility

**Steps:**

1. Click "Create New Site"
2. Try clicking in "Site Name" input field
3. Try typing

**Expected Results:**

- ✅ Cursor appears immediately when clicking
- ✅ Can type in all input fields
- ✅ No pointer-events blocking

---

## Test 6: Database Management UI

**Steps:**

1. Go to Tools → Database Management
2. Check server status display

**Expected Results:**

- ✅ Shows all detected MySQL/MariaDB servers
- ✅ Shows server status (Running/Stopped)
- ✅ Can start/stop servers
- ✅ Status updates in real-time

---

## Test 7: Auto-Start MySQL

**Steps:**

1. **Ensure MySQL is stopped**:
    - Tools → Database Management → Stop MySQL
2. Create new site with MySQL database
3. Watch console output

**Expected Results:**

- ✅ Detects MySQL is stopped
- ✅ Shows "🚀 Starting mysql..."
- ✅ Waits 3 seconds for initialization
- ✅ Successfully connects to MySQL
- ✅ Site created with MySQL

**Console Output:**

```
   🔍 Checking database server status...
   ⚠️ mysql server is not running
   🚀 Starting mysql 8.0.30...
   ✅ Database server started successfully
   🔌 Connecting to MySQL server...
   ✅ Connected to MySQL server
```

---

## Test 8: Connection Retry Logic

**Steps:**

1. Temporarily block MySQL connection (firewall/network)
2. Create site with MySQL
3. Watch retry attempts

**Expected Results:**

- ✅ Shows first connection attempt
- ⏳ Waits 2 seconds
- ✅ Shows second connection attempt
- ⏳ Waits 2 seconds
- ✅ Shows third connection attempt
- ❌ After 3 failures, falls back to SQLite

**Console Output:**

```
   🔌 Connecting to MySQL server...
   ⚠️ Connection failed, retrying... (2 attempts left)
   ⚠️ Connection failed, retrying... (1 attempts left)
   ❌ Failed to connect to MySQL after multiple attempts
⚠️ MySQL setup failed: <error>
🔄 Falling back to SQLite database...
```

---

## Verification Checklist

After running tests, verify:

- [ ] Sites can be created with MySQL (when available)
- [ ] Sites automatically fall back to SQLite (when MySQL unavailable)
- [ ] MySQL auto-starts when stopped
- [ ] Connection retries work (3 attempts)
- [ ] Database badges show correct status
- [ ] Warning banner appears when needed
- [ ] Input fields are clickable
- [ ] Database type is tracked correctly
- [ ] No TypeScript errors in console
- [ ] No runtime errors in console

---

## Expected File Structure After Tests

```
PressBox/
  sites/
    test-mysql-site/
      wp-config.php         # MySQL configuration
      pressbox-config.json  # database: "mysql"

    test-fallback-site/
      wp-config.php         # SQLite configuration
      pressbox-config.json  # database: "sqlite"
      wp-content/
        database/
          wordpress.db      # SQLite database file
        db.php              # SQLite drop-in

    test-sqlite-site/
      wp-config.php         # SQLite configuration
      pressbox-config.json  # database: "sqlite"
      wp-content/
        database/
          wordpress.db
        db.php
```

---

## Common Issues & Solutions

### Issue: MySQL fails to start automatically

**Check:**

- MySQL is installed correctly
- MySQL service exists in Windows Services
- User has permissions to start services

**Workaround:**

- Manually start MySQL from Database Management
- Or use SQLite instead

---

### Issue: Fallback to SQLite doesn't work

**Check:**

- Console for error messages
- wp-config.php was created
- wp-content/database/ directory exists
- db.php drop-in was installed

**Debug:**

- Check console logs for "🔄 Falling back to SQLite"
- Verify pressbox-config.json shows `"database": "sqlite"`

---

### Issue: Site card shows wrong database status

**Check:**

- Database server is actually running (check Task Manager)
- Status polling is working (check Network tab)
- Site configuration has correct database type

**Solution:**

- Refresh the Sites page
- Check pressbox-config.json for correct database value

---

## Performance Expectations

- **MySQL Auto-Start:** ~3-5 seconds
- **MySQL Connection:** <1 second (with retry: max 6 seconds)
- **SQLite Fallback:** ~1 second
- **Site Creation (MySQL):** ~10-15 seconds
- **Site Creation (SQLite):** ~8-12 seconds

---

## Success Criteria

✅ **All tests pass**  
✅ **No console errors**  
✅ **Sites work correctly**  
✅ **UI shows correct status**  
✅ **Fallback works automatically**  
✅ **User experience is smooth**

---

**Happy Testing!** 🧪✨
