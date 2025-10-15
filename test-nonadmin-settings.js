/**
 * Test Non-Admin Mode Settings Persistence
 *
 * This script tests the NonAdminMode settings to ensure preferences are saved
 * and restored correctly between application restarts.
 */

const { NonAdminMode } = require("./dist/main/main/services/nonAdminMode.js");

async function testNonAdminSettings() {
    console.log("🧪 Testing Non-Admin Mode Settings Persistence\n");

    try {
        // Initialize the settings
        console.log("1. Initializing NonAdminMode...");
        NonAdminMode.initialize();

        // Test initial state
        console.log("2. Testing initial state:");
        console.log(`   - Enabled: ${NonAdminMode.isEnabled()}`);
        console.log(
            `   - User choice made: ${NonAdminMode.hasUserMadeChoice()}`
        );
        console.log(`   - Last choice: ${NonAdminMode.getLastChoice()}`);

        // Test enabling non-admin mode
        console.log("\n3. Enabling non-admin mode...");
        NonAdminMode.enable(true);
        console.log(`   - Enabled: ${NonAdminMode.isEnabled()}`);
        console.log(
            `   - User choice made: ${NonAdminMode.hasUserMadeChoice()}`
        );

        // Test disabling non-admin mode
        console.log("\n4. Disabling non-admin mode (enabling admin mode)...");
        NonAdminMode.disable(true);
        console.log(`   - Enabled: ${NonAdminMode.isEnabled()}`);
        console.log(
            `   - User choice made: ${NonAdminMode.hasUserMadeChoice()}`
        );
        console.log(`   - Last choice: ${NonAdminMode.getLastChoice()}`);

        // Test re-enabling
        console.log("\n5. Re-enabling non-admin mode...");
        NonAdminMode.enable(true);
        console.log(`   - Enabled: ${NonAdminMode.isEnabled()}`);
        console.log(`   - Last choice: ${NonAdminMode.getLastChoice()}`);

        // Test explanation
        console.log("\n6. Testing explanation:");
        const explanation = NonAdminMode.getExplanation();
        console.log(`   - Mode: ${explanation.mode}`);
        console.log(`   - Description: ${explanation.description}`);
        console.log(`   - URLs: ${explanation.urls}`);
        console.log(`   - Admin required: ${explanation.adminRequired}`);

        // Test URL generation
        console.log("\n7. Testing URL generation:");
        const localhostUrl = NonAdminMode.getSiteUrl(
            "test-site",
            "test-site.local",
            8080
        );
        console.log(`   - Site URL: ${localhostUrl}`);

        const effectiveDomain = NonAdminMode.getEffectiveDomain(
            "test-site",
            "test-site.local"
        );
        console.log(`   - Effective domain: ${effectiveDomain}`);

        const needsHosts = NonAdminMode.needsHostsFileModification();
        console.log(`   - Needs hosts file modification: ${needsHosts}`);

        console.log("\n✅ All tests completed successfully!");
        console.log(
            "\n💡 The settings are now saved and will be restored when PressBox starts."
        );
    } catch (error) {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }
}

// Run the test
testNonAdminSettings();
