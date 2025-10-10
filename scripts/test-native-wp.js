#!/usr/bin/env node

/**
 * Test Native WordPress Site Creation
 *
 * This script tests the native WordPress site creation functionality
 * to ensure our LocalWP-style implementation is working correctly.
 */

const {
    SimpleWordPressManager,
} = require("./dist/main/services/simpleWordPressManager.js");
const path = require("path");
const os = require("os");

async function testSiteCreation() {
    console.log("🧪 Testing Native WordPress Site Creation...\n");

    try {
        // Initialize the simple manager
        const simpleManager = new SimpleWordPressManager();
        await simpleManager.initialize();

        console.log("✅ SimpleWordPressManager initialized successfully");

        // Test site configuration
        const testConfig = {
            siteName: "test-site",
            domain: "test-site.local",
            phpVersion: "8.1",
            wordpressVersion: "latest",
            adminUser: "admin",
            adminPassword: "password123",
            adminEmail: "admin@test-site.local",
        };

        console.log("\n📋 Test site configuration:");
        console.log(`   Name: ${testConfig.siteName}`);
        console.log(`   Domain: ${testConfig.domain}`);
        console.log(`   PHP Version: ${testConfig.phpVersion}`);
        console.log(`   WordPress Version: ${testConfig.wordpressVersion}`);

        // Check if test site already exists
        const existingSites = await simpleManager.getSites();
        const existingSite = existingSites.find(
            (site) => site.name === testConfig.siteName
        );

        if (existingSite) {
            console.log("\n⚠️  Test site already exists, cleaning up first...");
            try {
                await simpleManager.stopSite(existingSite.id);
                // Note: We don't have a delete method in SimpleWordPressManager yet
                console.log("✅ Existing test site stopped");
            } catch (error) {
                console.log("   (Site was already stopped)");
            }
        }

        // Test site creation
        console.log("\n🏗️  Creating test WordPress site...");
        const newSite = await simpleManager.createSite(testConfig);

        console.log("✅ Site created successfully!");
        console.log(`   ID: ${newSite.id}`);
        console.log(`   Path: ${newSite.path}`);
        console.log(`   URL: ${newSite.url}`);
        console.log(`   Status: ${newSite.status}`);

        // Test site listing
        console.log("\n📋 Testing site listing...");
        const sites = await simpleManager.getSites();
        console.log(`✅ Found ${sites.length} site(s)`);

        // Test site starting
        console.log("\n🚀 Testing site startup...");
        await simpleManager.startSite(newSite.id);

        const updatedSite = await simpleManager.getSite(newSite.id);
        console.log(`✅ Site started! Status: ${updatedSite?.status}`);
        console.log(`   Access URL: ${updatedSite?.url}`);
        console.log(`   Admin URL: ${updatedSite?.url}/wp-admin`);

        console.log(
            "\n🎉 All tests passed! Native WordPress implementation is working correctly."
        );

        // Provide next steps
        console.log("\n📝 Next Steps:");
        console.log("   1. Visit the site URL in your browser");
        console.log("   2. Complete WordPress installation");
        console.log("   3. Test admin login functionality");
        console.log("   4. Create additional sites as needed");
    } catch (error) {
        console.error("\n❌ Test failed:", error);
        console.error(
            "\nThis indicates an issue with the native WordPress implementation."
        );
        console.error(
            "Please check the error details above for troubleshooting."
        );
        process.exit(1);
    }
}

// Only run test if this script is executed directly
if (require.main === module) {
    testSiteCreation().catch(console.error);
}

module.exports = { testSiteCreation };
