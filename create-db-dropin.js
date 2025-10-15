const fs = require("fs");
const path = require("path");

const sitePath = "C:\\Users\\BJIT\\PressBox\\sites\\bjit";
const dbPhpPath = path.join(sitePath, "wp-content", "db.php");

console.log("🔧 Creating proper db.php drop-in...\n");

// Create a db.php that loads the SQLite plugin's actual db.php
const dbPhpContent = `<?php
/**
 * SQLite Database Integration Drop-in
 * 
 * This file loads the SQLite database integration from the plugin directory.
 * It acts as a bridge between WordPress and the SQLite plugin.
 */

// Path to the SQLite plugin's db.php
$sqlite_plugin_path = __DIR__ . '/plugins/sqlite-database-integration/wp-includes/sqlite/db.php';

// Check if the plugin's db.php exists
if ( file_exists( $sqlite_plugin_path ) ) {
    // Load the SQLite integration
    require_once $sqlite_plugin_path;
} else {
    // Fallback error message
    wp_die(
        '<h1>SQLite Database Integration Error</h1>' .
        '<p>The SQLite Integration plugin is not properly installed.</p>' .
        '<p>Expected location: <code>' . $sqlite_plugin_path . '</code></p>',
        'SQLite Plugin Not Found',
        array( 'response' => 500 )
    );
}
`;

// Write the drop-in
fs.writeFileSync(dbPhpPath, dbPhpContent);
console.log("✅ Created db.php drop-in");

// Verify the plugin's db.php exists
const pluginDbPhpPath = path.join(
    sitePath,
    "wp-content",
    "plugins",
    "sqlite-database-integration",
    "wp-includes",
    "sqlite",
    "db.php"
);
if (fs.existsSync(pluginDbPhpPath)) {
    console.log("✅ Plugin db.php exists at:", pluginDbPhpPath);
} else {
    console.log("❌ Plugin db.php NOT FOUND at:", pluginDbPhpPath);
}

// Verify constants.php exists
const constantsPath = path.join(
    sitePath,
    "wp-content",
    "plugins",
    "sqlite-database-integration",
    "constants.php"
);
if (fs.existsSync(constantsPath)) {
    console.log("✅ constants.php exists at:", constantsPath);
} else {
    console.log("❌ constants.php NOT FOUND at:", constantsPath);
}

console.log("\n🎉 Drop-in created successfully!");
console.log("\n📋 Now:");
console.log("   1. Stop the site in PressBox");
console.log("   2. Start it again");
console.log("   3. Open http://localhost:8000");
console.log("   4. WordPress should now load with SQLite!");
