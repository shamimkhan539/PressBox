/**
 * Test Script: WordPress Site Creation with Site Name Fix
 *
 * This script tests the WordPress site creation with the fixed site_title parameter
 */

const {
    SimpleWordPressManager,
} = require("./dist/main/main/services/simpleWordPressManager.js");

async function testSiteCreation() {
    console.log("🚀 Testing WordPress site creation with site name fix...");

    const manager = new SimpleWordPressManager();
    await manager.initialize();

    try {
        const result = await manager.createSite({
            siteName: "test15",
            adminUser: "admin",
            adminPassword: "password123",
            adminEmail: "admin@test15.local",
            phpVersion: "8.1",
            databaseName: "wp_test15",
        });

        console.log("✅ Site creation result:", result);
        console.log("🎯 Site URL:", result.url);
        console.log("📝 Site name should now be: test15");
    } catch (error) {
        console.error("❌ Site creation failed:", error);
    }

    process.exit(0);
}

testSiteCreation();
