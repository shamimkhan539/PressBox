// Test the actual SimpleWordPressManager initialization
const path = require("path");
const { spawn } = require("child_process");

// Mock Electron store since we're running outside Electron
class MockStore {
    constructor() {
        this.data = {};
    }

    get(key, defaultValue) {
        return this.data[key] || defaultValue;
    }

    set(key, value) {
        this.data[key] = value;
    }

    delete(key) {
        delete this.data[key];
    }
}

// Set up global mocks
global.electronStore = new MockStore();

async function testSimpleWordPressManager() {
    console.log("🧪 Testing SimpleWordPressManager...\n");

    try {
        // Import the SimpleWordPressManager
        const {
            SimpleWordPressManager,
        } = require("./src/main/services/simpleWordPressManager.ts");

        console.log("✅ SimpleWordPressManager imported successfully");

        // Create instance
        const manager = new SimpleWordPressManager();
        console.log("✅ SimpleWordPressManager instance created");

        // Try to initialize
        console.log("🚀 Initializing SimpleWordPressManager...");
        await manager.initialize();
        console.log("✅ SimpleWordPressManager initialized successfully");

        // Try to create a test site
        console.log("🏗️ Creating test site...");
        const testConfig = {
            siteName: "debug-test-site",
            domain: "debug-test.local",
            wordpressVersion: "latest",
            adminUsername: "admin",
            adminPassword: "password",
            adminEmail: "admin@test.local",
            databaseName: "debug_test_db",
        };

        const site = await manager.createSite(testConfig);
        console.log("✅ Test site created:", site);

        // Try to start the site
        console.log("▶️ Starting test site...");
        await manager.startSite(site.id);
        console.log("✅ Test site started successfully");

        // Check if the site is actually running
        setTimeout(async () => {
            const http = require("http");
            const testUrl = `http://${site.domain}:${site.port}`;
            console.log(`🔍 Testing site at: ${testUrl}`);

            const request = http.get(testUrl, (response) => {
                console.log(
                    `✅ Site is running! Status: ${response.statusCode}`
                );
                process.exit(0);
            });

            request.on("error", (error) => {
                console.error(`❌ Site not accessible: ${error.message}`);
                process.exit(1);
            });

            request.setTimeout(5000, () => {
                console.error("⏰ Timeout - site not responding");
                request.destroy();
                process.exit(1);
            });
        }, 3000);
    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error("Stack:", error.stack);
        process.exit(1);
    }
}

testSimpleWordPressManager();
