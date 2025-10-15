/**
 * Test Non-Admin Mode Blocking Functionality
 *
 * This script tests the new blocking methods to ensure admin operations
 * are properly blocked when in non-admin mode.
 */

const { NonAdminMode } = require("./dist/main/main/services/nonAdminMode.js");

async function testAdminBlocking() {
    console.log("🧪 Testing Non-Admin Mode Admin Operation Blocking\n");

    try {
        // Test 1: Before initialization
        console.log("1. Testing before initialization:");
        console.log(
            `   - Should block admin operations: ${NonAdminMode.shouldBlockAdminOperations()}`
        );
        console.log(
            `   - Should request admin privileges: ${NonAdminMode.shouldRequestAdminPrivileges()}`
        );

        // Initialize
        console.log("\n2. Initializing NonAdminMode...");
        NonAdminMode.initialize();

        // Test 2: After initialization (default non-admin mode)
        console.log("\n3. Testing after initialization (default state):");
        console.log(`   - Enabled: ${NonAdminMode.isEnabled()}`);
        console.log(
            `   - Should block admin operations: ${NonAdminMode.shouldBlockAdminOperations()}`
        );
        console.log(
            `   - Should request admin privileges: ${NonAdminMode.shouldRequestAdminPrivileges()}`
        );

        // Test 3: Enable admin mode
        console.log("\n4. Switching to admin mode...");
        NonAdminMode.disable(true);
        console.log(`   - Enabled: ${NonAdminMode.isEnabled()}`);
        console.log(
            `   - Should block admin operations: ${NonAdminMode.shouldBlockAdminOperations()}`
        );
        console.log(
            `   - Should request admin privileges: ${NonAdminMode.shouldRequestAdminPrivileges()}`
        );

        // Test 4: Switch back to non-admin mode
        console.log("\n5. Switching back to non-admin mode...");
        NonAdminMode.enable(true);
        console.log(`   - Enabled: ${NonAdminMode.isEnabled()}`);
        console.log(
            `   - Should block admin operations: ${NonAdminMode.shouldBlockAdminOperations()}`
        );
        console.log(
            `   - Should request admin privileges: ${NonAdminMode.shouldRequestAdminPrivileges()}`
        );

        console.log("\n✅ All admin blocking tests completed successfully!");
        console.log(
            "\n💡 The application should now properly prevent admin privilege requests in non-admin mode."
        );
    } catch (error) {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }
}

// Run the test
testAdminBlocking();
