/**
 * Enable MySQL Extensions in PHP
 *
 * This script enables the mysqli and pdo_mysql extensions in php.ini
 * Run as administrator: Right-click PowerShell -> Run as Administrator
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

async function enableMySQLExtensions() {
    try {
        console.log("🔧 Enabling MySQL Extensions in PHP...\n");

        // Get php.ini location
        const phpIniOutput = execSync("php --ini", { encoding: "utf-8" });
        const phpIniMatch = phpIniOutput.match(
            /Loaded Configuration File:\s+(.+)/
        );

        if (!phpIniMatch) {
            console.error("❌ Could not find php.ini file");
            console.log("\n📝 Manual Steps:");
            console.log("1. Run: php --ini");
            console.log("2. Open the php.ini file shown");
            console.log("3. Find and uncomment these lines:");
            console.log("   ;extension=mysqli  →  extension=mysqli");
            console.log("   ;extension=pdo_mysql  →  extension=pdo_mysql");
            console.log("4. Save and restart PressBox");
            return;
        }

        const phpIniPath = phpIniMatch[1].trim();
        console.log(`📄 PHP.ini location: ${phpIniPath}\n`);

        // Check if file exists
        if (!fs.existsSync(phpIniPath)) {
            console.error(`❌ PHP.ini file not found at: ${phpIniPath}`);
            return;
        }

        // Read php.ini
        let phpIniContent = fs.readFileSync(phpIniPath, "utf-8");
        let modified = false;

        // Enable mysqli
        if (phpIniContent.includes(";extension=mysqli")) {
            console.log("✅ Enabling mysqli extension...");
            phpIniContent = phpIniContent.replace(
                /;extension=mysqli\s*$/gm,
                "extension=mysqli"
            );
            modified = true;
        } else if (phpIniContent.includes("extension=mysqli")) {
            console.log("✓ mysqli extension already enabled");
        } else {
            console.log("⚠️  mysqli extension line not found, adding it...");
            phpIniContent += "\nextension=mysqli\n";
            modified = true;
        }

        // Enable pdo_mysql
        if (phpIniContent.includes(";extension=pdo_mysql")) {
            console.log("✅ Enabling pdo_mysql extension...");
            phpIniContent = phpIniContent.replace(
                /;extension=pdo_mysql\s*$/gm,
                "extension=pdo_mysql"
            );
            modified = true;
        } else if (phpIniContent.includes("extension=pdo_mysql")) {
            console.log("✓ pdo_mysql extension already enabled");
        } else {
            console.log("⚠️  pdo_mysql extension line not found, adding it...");
            phpIniContent += "\nextension=pdo_mysql\n";
            modified = true;
        }

        if (modified) {
            // Create backup
            const backupPath = phpIniPath + ".backup-" + Date.now();
            console.log(`\n💾 Creating backup: ${backupPath}`);
            fs.copyFileSync(phpIniPath, backupPath);

            // Write modified php.ini
            console.log("📝 Writing changes to php.ini...");
            try {
                fs.writeFileSync(phpIniPath, phpIniContent, "utf-8");
                console.log("✅ PHP.ini updated successfully!\n");
            } catch (error) {
                console.error("❌ Error writing php.ini:", error.message);
                console.log(
                    "\n⚠️  Permission denied! Please run this script as Administrator:"
                );
                console.log("   1. Right-click on PowerShell");
                console.log('   2. Select "Run as Administrator"');
                console.log("   3. Run: node enable-mysql-extensions.js");
                return;
            }
        } else {
            console.log("\n✓ All extensions are already enabled!\n");
        }

        // Verify extensions are loaded
        console.log("🔍 Verifying extensions...");
        const phpModules = execSync("php -m", { encoding: "utf-8" });

        const hasMySQL =
            phpModules.includes("mysqli") || phpModules.includes("pdo_mysql");

        if (hasMySQL) {
            console.log("✅ MySQL extensions are loaded!\n");
            console.log("📋 Loaded extensions:");
            if (phpModules.includes("mysqli")) console.log("   ✓ mysqli");
            if (phpModules.includes("mysqlnd")) console.log("   ✓ mysqlnd");
            if (phpModules.includes("pdo_mysql")) console.log("   ✓ pdo_mysql");
            console.log("\n🎉 Success! You can now use WordPress with MySQL.");
            console.log(
                "   Please restart PressBox for changes to take effect."
            );
        } else {
            console.log("⚠️  Extensions not yet loaded. You may need to:");
            console.log("   1. Restart your terminal");
            console.log("   2. Restart PressBox");
            console.log(
                "   3. Check if extension DLL files exist in PHP ext directory"
            );
        }
    } catch (error) {
        console.error("❌ Error:", error.message);
        console.log("\n📘 Manual Setup Guide:");
        console.log("See PHP_MYSQL_SETUP_GUIDE.md for detailed instructions");
    }
}

// Run the script
console.log("═══════════════════════════════════════════════");
console.log("  Enable MySQL Extensions for WordPress");
console.log("═══════════════════════════════════════════════\n");

enableMySQLExtensions().then(() => {
    console.log("\n═══════════════════════════════════════════════\n");
});
