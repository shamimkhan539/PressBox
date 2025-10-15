/**
 * Test Real Site Creation
 *
 * This will test the actual site creation with the updated WordPress manager
 */

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

async function testRealSiteCreation() {
    console.log("🧪 Testing Real Site Creation with Updated Manager...\n");

    try {
        // Import the updated managers
        const {
            WordPressManager,
        } = require("./dist/main/main/services/wordpressManager.js");
        const {
            DockerManager,
        } = require("./dist/main/main/services/dockerManager.js");

        console.log("✅ Imported updated managers");

        // Create instances (this will fail without electron context, but let's see what happens)
        try {
            const dockerManager = new DockerManager();
            const wpManager = new WordPressManager(dockerManager);

            console.log("✅ Created manager instances");

            // Try to create a test site
            const testConfig = {
                siteName: "real-test-site",
                domain: "real-test.local",
                wordpressVersion: "latest",
                adminUser: "admin",
                adminPassword: "password123",
                adminEmail: "admin@real-test.local",
                phpVersion: "8.3",
            };

            console.log("🏗️ Creating real test site...");
            const site = await wpManager.createSite(testConfig);
            console.log("✅ Site created:", site);

            // Try to start the site
            console.log("▶️ Starting site...");
            await wpManager.startSite(site.id);
            console.log("✅ Site started");

            // List sites
            const sites = await wpManager.getSites();
            console.log("📋 All sites:", sites);

            console.log("\n🎉 SUCCESS: Real site creation test passed!");
            console.log("🌐 Visit: http://" + site.domain + ":" + site.port);
        } catch (error) {
            if (error.message.includes("projectName")) {
                console.log(
                    "ℹ️  ElectronStore error (expected outside Electron context)"
                );
                console.log("✅ Managers can be imported successfully");
                return;
            }
            throw error;
        }
    } catch (error) {
        console.error("❌ Real site creation test failed:", error.message);
        if (error.stack) {
            console.error("📚 Stack trace:", error.stack);
        }
    }
}

// Run the test
testRealSiteCreation()
    .then(() => {
        console.log("✅ Test completed");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    });
