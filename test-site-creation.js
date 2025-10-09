/**
 * Test Script: WordPress Site Creation Demo
 *
 * This script demonstrates the complete workflow of creating
 * a WordPress site using PressBox's local environment
 */

const {
    LocalServerManager,
} = require("./dist/main/services/localServerManager");
const path = require("path");
const os = require("os");

async function demonstrateSiteCreation() {
    console.log("🚀 **PressBox Local WordPress Site Creation Demo**\n");

    try {
        // Initialize the Local Server Manager
        console.log("1️⃣ Initializing LocalServerManager...");
        const serverManager = LocalServerManager.getInstance();
        await serverManager.initialize();
        console.log("✅ LocalServerManager initialized successfully\n");

        // Check PHP availability
        console.log("2️⃣ Checking PHP availability...");
        const phpInfo = await serverManager.detectPHP();
        console.log(`✅ PHP detected: ${phpInfo.version} at ${phpInfo.path}\n`);

        // Create a test WordPress site configuration
        const testSiteConfig = {
            siteName: "my-test-wordpress-site",
            domain: "test-wp.local",
            port: 8080,
            phpVersion: phpInfo.version,
            wordpressVersion: "latest",
            sitePath: path.join(os.homedir(), "PressBox-Sites", "test-wp-site"),
            dbName: "test_wp_db",
        };

        console.log("3️⃣ Creating WordPress site with configuration:");
        console.log(JSON.stringify(testSiteConfig, null, 2));
        console.log("");

        // Create the WordPress site
        console.log("4️⃣ Creating WordPress site (this may take a moment)...");
        const siteCreated = await serverManager.createSite(testSiteConfig);

        if (siteCreated) {
            console.log("✅ WordPress site created successfully!");
            console.log(`📂 Site location: ${testSiteConfig.sitePath}`);
            console.log(
                `🌐 Local URL: http://${testSiteConfig.domain}:${testSiteConfig.port}`
            );
            console.log("");

            // Start the local server
            console.log("5️⃣ Starting local development server...");
            const serverStarted = await serverManager.startSite(
                testSiteConfig.siteName
            );

            if (serverStarted) {
                console.log("✅ Development server started!");
                console.log(
                    `🎉 Your WordPress site is now running at: http://${testSiteConfig.domain}:${testSiteConfig.port}`
                );
                console.log("");
                console.log("🔧 **Next Steps:**");
                console.log("- Open the URL in your browser");
                console.log("- Complete WordPress installation wizard");
                console.log("- Start developing your WordPress site!");
            } else {
                console.log("❌ Failed to start development server");
            }
        } else {
            console.log("❌ Failed to create WordPress site");
        }
    } catch (error) {
        console.error("❌ Demo failed:", error.message);
        console.error("Stack trace:", error.stack);
    }
}

// Run the demonstration
demonstrateSiteCreation();
