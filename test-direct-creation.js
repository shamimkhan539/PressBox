// Direct test of the site creation process
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

// Test site creation directly
async function testSiteCreation() {
    console.log("🧪 Testing Direct Site Creation...\n");

    try {
        // Import the SimpleWordPressManager
        const {
            WordPressManager,
        } = require("./dist/main/main/services/wordpressManager.js");
        const {
            DockerManager,
        } = require("./dist/main/main/services/dockerManager.js");

        console.log("✅ Imported WordPressManager successfully");

        // Create instances
        const dockerManager = new DockerManager();
        const wpManager = new WordPressManager(dockerManager);

        console.log("✅ Created WordPressManager instance");

        // Wait for initialization
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Try to create a test site
        console.log("🏗️ Creating test site...");
        const testConfig = {
            siteName: "debug-test-site",
            domain: "debug-test.local",
            wordPressVersion: "latest",
            adminUsername: "admin",
            adminPassword: "password",
            adminEmail: "admin@test.local",
            databaseName: "debug_test_db",
        };

        const site = await wpManager.createSite(testConfig);
        console.log("✅ Test site created:", site);

        // Try to start the site
        console.log("▶️ Starting test site...");
        await wpManager.startSite(site.id);
        console.log("✅ Test site started successfully");

        // Check running sites
        const sites = await wpManager.getSites();
        console.log("📊 All sites:", sites);
    } catch (error) {
        console.error("❌ Error during direct test:", error);
        console.error("Stack:", error.stack);
    }
}

testSiteCreation();
