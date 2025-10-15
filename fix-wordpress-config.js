const fs = require("fs").promises;
const path = require("path");
const os = require("os");

async function fixWordPressConfig() {
    const sitesPath = path.join(os.homedir(), "PressBox", "sites");
    const siteName = "bjit";
    const wpConfigPath = path.join(sitesPath, siteName, "wp-config.php");

    try {
        console.log("🔧 Fixing WordPress Configuration...\n");
        console.log(`📄 Config file: ${wpConfigPath}\n`);

        // Read current wp-config.php
        let wpConfig = await fs.readFile(wpConfigPath, "utf-8");

        // Update site URLs to use localhost
        wpConfig = wpConfig.replace(
            /define\(\s*'WP_HOME',\s*'[^']*'\s*\);/g,
            "define( 'WP_HOME', 'http://localhost:8000' );"
        );
        wpConfig = wpConfig.replace(
            /define\(\s*'WP_SITEURL',\s*'[^']*'\s*\);/g,
            "define( 'WP_SITEURL', 'http://localhost:8000' );"
        );

        // Update database configuration to use SQLite
        // Add USE_MYSQL constant to disable MySQL and use SQLite
        if (!wpConfig.includes("USE_MYSQL")) {
            const dbComment = "// ** SQLite Database settings ** //";
            wpConfig = wpConfig.replace(
                dbComment,
                `${dbComment}\ndefine( 'USE_MYSQL', false ); // Use SQLite instead of MySQL`
            );
        }

        // Write updated config
        await fs.writeFile(wpConfigPath, wpConfig);

        console.log("✅ WordPress configuration updated!\n");
        console.log("📋 Changes made:");
        console.log("   ✓ WP_HOME set to http://localhost:8000");
        console.log("   ✓ WP_SITEURL set to http://localhost:8000");
        console.log("   ✓ Database configured for SQLite\n");

        // Now create a db.php drop-in for SQLite support
        const dbPhpContent = `<?php
/**
 * SQLite Integration for WordPress
 * This drop-in replaces the MySQL database with SQLite
 */

// Use SQLite database file
define('DB_FILE', 'wp-content/database/.ht.sqlite');

// Override wpdb class to use SQLite
class wpdb_sqlite extends wpdb {
    public function __construct($dbuser, $dbpassword, $dbname, $dbhost) {
        // SQLite doesn't need user/password/host
        $this->dbh = null; // Will be set up by SQLite plugin
    }
}

// Note: For full SQLite support, you need the SQLite Integration plugin
// You can download it from: https://wordpress.org/plugins/sqlite-database-integration/
`;

        const dbPhpPath = path.join(
            sitesPath,
            siteName,
            "wp-content",
            "db.php"
        );
        await fs.writeFile(dbPhpPath, dbPhpContent);
        console.log("✅ Created db.php drop-in for SQLite support\n");

        // Create database directory
        const dbDir = path.join(sitesPath, siteName, "wp-content", "database");
        await fs.mkdir(dbDir, { recursive: true });
        console.log("✅ Created database directory\n");

        console.log("⚠️  IMPORTANT: WordPress still needs a database!");
        console.log("   For now, you have two options:\n");
        console.log("   Option 1: Install MySQL/MariaDB locally");
        console.log(
            "   - Download from: https://www.apachefriends.org/ (XAMPP)"
        );
        console.log("   - Or: https://dev.mysql.com/downloads/mysql/\n");
        console.log("   Option 2: Use SQLite (simpler, no server needed)");
        console.log("   - Download SQLite Integration plugin");
        console.log("   - Extract to wp-content/plugins/");
        console.log("   - Activate via WordPress admin\n");
        console.log("   For quick testing, I recommend Option 2 (SQLite)");
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

fixWordPressConfig();
