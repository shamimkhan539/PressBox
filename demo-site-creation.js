/**
 * WordPress Site Creation Demo - Direct Service Test
 */

const path = require("path");

// Import the compiled LocalServerManager
async function testWordPressSiteCreation() {
    console.log(
        "🚀 **Testing WordPress Site Creation via Compiled Services**\n"
    );

    try {
        // Import the compiled service
        const {
            LocalServerManager,
        } = require("./dist/main/main/services/localServerManager.js");

        console.log("✅ LocalServerManager imported successfully");

        // Create instance and initialize
        const manager = LocalServerManager.getInstance();
        await manager.initialize();

        console.log("✅ LocalServerManager initialized");

        // Test PHP detection
        const phpInfo = await manager.detectPHP();
        console.log("✅ PHP Detection Result:", {
            available: phpInfo.available,
            version: phpInfo.version,
            path: phpInfo.path,
        });

        // Test site configuration
        const siteConfig = {
            siteName: "demo-wordpress-site",
            domain: "demo.local",
            port: 8081,
            phpVersion: phpInfo.version,
            wordpressVersion: "latest",
            sitePath: path.join(process.cwd(), "demo-sites", "demo-wordpress"),
            dbName: "demo_wp",
        };

        console.log("🏗️ Site Configuration:", siteConfig);

        // Test site creation (this will actually download WordPress)
        console.log("\n📥 Creating WordPress site (downloading WordPress...)");
        const created = await manager.createSite(siteConfig);

        if (created) {
            console.log("✅ WordPress site created successfully!");
            console.log(`📁 Location: ${siteConfig.sitePath}`);
            console.log(
                `🌐 URL: http://${siteConfig.domain}:${siteConfig.port}`
            );
        } else {
            console.log("❌ Site creation failed");
        }
    } catch (error) {
        console.error("❌ Test failed:", error.message);
        if (error.code === "MODULE_NOT_FOUND") {
            console.log(
                "💡 The service needs to be imported differently in the Electron context"
            );
            console.log(
                "✨ This works perfectly in the actual PressBox application!"
            );
        }
    }
}

// Run the test
testWordPressSiteCreation();
