# Accessing SQLite Database

PressBox uses SQLite databases for WordPress sites. Here's how to access and manage them:

## Database Location

Each WordPress site has its own SQLite database file located at:

```
C:\Users\[USERNAME]\PressBox\sites\[SITE_NAME]\database\wp_[SITE_NAME].db
```

For example:

```
C:\Users\BJIT\PressBox\sites\demo-wordpress-site\database\wp_demo_wp.db
```

## Connecting to SQLite Database

### Method 1: Using SQLite Browser (GUI)

1. Download and install [DB Browser for SQLite](https://sqlitebrowser.org/)
2. Open the `.db` file directly in the application
3. Browse tables, run queries, and modify data

### Method 2: Using Command Line

```bash
# Navigate to the database directory
cd "C:\Users\[USERNAME]\PressBox\sites\[SITE_NAME]\database"

# Connect using sqlite3 command line tool
sqlite3 wp_[SITE_NAME].db
```

### Method 3: Using Node.js Script

Create a script to query the database:

```javascript
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(
    process.env.HOME || process.env.USERPROFILE,
    "PressBox",
    "sites",
    "your-site-name",
    "database",
    "wp_your_site_name.db"
);

const db = new sqlite3.Database(dbPath);

db.all("SELECT * FROM wp_users", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log(rows);
    }
    db.close();
});
```

## Common WordPress Tables

- `wp_users` - User accounts
- `wp_usermeta` - User metadata
- `wp_posts` - Posts and pages
- `wp_postmeta` - Post metadata
- `wp_comments` - Comments
- `wp_options` - Site options and settings
- `wp_terms` - Categories and tags
- `wp_term_relationships` - Post-term relationships

## Useful Queries

### Check Admin User

```sql
SELECT * FROM wp_users WHERE user_login = 'admin';
```

### List All Posts

```sql
SELECT ID, post_title, post_status, post_date FROM wp_posts WHERE post_type = 'post';
```

### Get Site Options

```sql
SELECT option_name, option_value FROM wp_options WHERE option_name LIKE '%site%';
```

### Update Admin Password (Emergency)

```sql
UPDATE wp_users SET user_pass = MD5('newpassword') WHERE user_login = 'admin';
```

## Database Backup

To backup a database:

```bash
# Copy the .db file
copy wp_sitename.db wp_sitename_backup.db
```

## Troubleshooting

### Database Locked Error

If you get "database is locked" errors:

1. Make sure no PHP processes are running for that site
2. Close any SQLite browser connections
3. Wait a moment and try again

### Corrupted Database

If the database is corrupted:

1. Stop the site
2. Restore from backup if available
3. Or recreate the site

## Security Note

SQLite databases contain sensitive information including:

- User passwords (hashed)
- Site configuration
- User data

Keep database files secure and don't share them publicly.
