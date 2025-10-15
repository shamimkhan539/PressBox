/**
 * Browser Console Test Script
 *
 * Copy and paste this into the browser console when the Electron app is running
 * to test site creation directly from the UI.
 */

// Test function to create a site and see detailed logs
async function debugSiteCreation() {
    console.log("🧪 Starting UI-based site creation test...");

    try {
        // Check if electronAPI is available
        if (!window.electronAPI) {
            console.error("❌ electronAPI not available");
            return;
        }

        console.log("✅ electronAPI is available");
        console.log("📋 Available methods:", Object.keys(window.electronAPI));

        // Check if sites.create is available
        if (!window.electronAPI.sites || !window.electronAPI.sites.create) {
            console.error("❌ sites.create method not available");
            return;
        }

        console.log("✅ sites.create method is available");

        // Create test site configuration
        const testConfig = {
            name: "console-test",
            domain: "console-test.local",
            wordPressVersion: "latest",
            adminUser: "admin",
            adminPassword: "password123",
            adminEmail: "admin@console-test.local",
        };

        console.log("🏗️ Creating test site with config:", testConfig);

        // Call the site creation API
        const result = await window.electronAPI.sites.create(testConfig);

        console.log("✅ Site creation completed!");
        console.log("📊 Result:", result);

        // Try to list sites to verify creation
        console.log("📋 Listing all sites...");
        const sites = await window.electronAPI.sites.list();
        console.log("📋 Current sites:", sites);

        return result;
    } catch (error) {
        console.error("❌ Site creation failed:", error);
        console.error("📚 Error stack:", error.stack);
        throw error;
    }
}

// Test function to check system status
async function checkSystemStatus() {
    console.log("🔍 Checking system status...");

    try {
        if (!window.electronAPI) {
            console.error("❌ electronAPI not available");
            return;
        }

        // Check system info
        const version = await window.electronAPI.system.getVersion();
        console.log("📱 App version:", version);

        // Check PHP status
        const phpStatus = await window.electronAPI.system.checkPHP();
        console.log("🐘 PHP status:", phpStatus);

        // Check admin status
        const adminStatus = await window.electronAPI.system.checkAdmin();
        console.log("👤 Admin status:", adminStatus);

        // List current sites
        const sites = await window.electronAPI.sites.list();
        console.log("📋 Current sites:", sites);
    } catch (error) {
        console.error("❌ System status check failed:", error);
        throw error;
    }
}

// Auto-run basic checks
console.log("🚀 Loading debug functions...");
console.log("📝 Available functions:");
console.log("  - debugSiteCreation(): Test site creation");
console.log("  - checkSystemStatus(): Check system status");
console.log("");
console.log("💡 Run either function to test the system");

// Auto-check system status
setTimeout(() => {
    console.log("🔄 Auto-running system status check...");
    checkSystemStatus().catch((err) =>
        console.error("Auto-check failed:", err)
    );
}, 1000);
