/**
 * Test site creation from the running Electron app
 *
 * This script tests the site creation functionality by calling the IPC APIs directly
 */

const { ipcRenderer } = require("electron");

async function testSiteCreation() {
    console.log("🧪 Testing site creation through IPC...\n");

    try {
        // Test configuration
        const siteConfig = {
            name: "test-site-" + Date.now(),
            domain: "test-site.local",
            wordPressVersion: "latest",
            adminUser: "admin",
            adminPassword: "password123",
            adminEmail: "admin@test.local",
        };

        console.log("📋 Site configuration:", siteConfig);
        console.log("\n🚀 Creating site...");

        // Call the site creation API through IPC
        const result = await ipcRenderer.invoke("sites:create", siteConfig);

        console.log("✅ Site created successfully!");
        console.log("📊 Result:", result);

        // List all sites to verify
        console.log("\n📋 Listing all sites...");
        const sites = await ipcRenderer.invoke("sites:list");
        console.log("📊 Total sites:", sites.length);

        sites.forEach((site, index) => {
            console.log(
                `   ${index + 1}. ${site.name} - ${site.url} (${site.status})`
            );
        });

        // Try to start the site
        if (result && result.id) {
            console.log("\n▶️  Starting site...");
            await ipcRenderer.invoke("sites:start", result.id);
            console.log("✅ Site started!");

            // Check site status after starting
            const updatedSites = await ipcRenderer.invoke("sites:list");
            const startedSite = updatedSites.find((s) => s.id === result.id);
            if (startedSite) {
                console.log("📊 Site status:", startedSite.status);
                console.log("🌐 Site URL:", startedSite.url);
                console.log(
                    "🔧 Admin URL:",
                    startedSite.adminUrl || startedSite.url + "/wp-admin"
                );
            }
        }

        return result;
    } catch (error) {
        console.error("❌ Site creation test failed:", error);
        throw error;
    }
}

// Export for use in browser console
if (typeof window !== "undefined") {
    window.testSiteCreation = testSiteCreation;
    console.log("🔧 testSiteCreation() function available in console");
}

module.exports = { testSiteCreation };
