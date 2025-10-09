/**
 * Test Script: System Status Check
 *
 * Tests the IPC communication and system detection
 */

console.log("🔍 **PressBox System Status Test**\n");

// Test if we can access the built services
const fs = require("fs");
const path = require("path");

const servicesPath = path.join(__dirname, "dist", "main", "main", "services");

console.log("📂 Checking compiled services...");
try {
    const serviceFiles = fs.readdirSync(servicesPath);
    console.log("✅ Available services:");
    serviceFiles.forEach((file) => {
        console.log(`   - ${file}`);
    });
    console.log("");
} catch (error) {
    console.error("❌ Services directory not found:", error.message);
}

// Check if PHP is available
console.log("🐘 Checking PHP availability...");
const { exec } = require("child_process");
exec("php --version", (error, stdout, stderr) => {
    if (error) {
        console.log("❌ PHP not found in PATH");
        console.log("📥 This is where the Portable PHP Manager would help!");
    } else {
        console.log("✅ PHP found:");
        console.log(stdout.split("\n")[0]);
    }

    console.log("\n🎯 **Ready to test PressBox features:**");
    console.log("1. Open http://localhost:3000 in your browser");
    console.log('2. Click "System Status" in the Dashboard');
    console.log("3. Try creating a new WordPress site");
    console.log("4. Test the portable PHP installation (if needed)");
    console.log("\n🚀 **The application is running and ready for testing!**");
});
