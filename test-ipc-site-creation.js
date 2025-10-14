// Test the IPC site creation directly
const { ipcRenderer } = require("electron");

console.log("🧪 Testing Direct IPC Site Creation...\n");

async function testIPC() {
    try {
        console.log("📡 Testing IPC connection...");

        // Test if we can list sites first
        console.log("📋 Testing sites:list...");
        const sites = await ipcRenderer.invoke("sites:list");
        console.log("✅ Sites list result:", sites);

        // Test site creation
        console.log("🏗️ Testing sites:create...");
        const testConfig = {
            siteName: "ipc-test-site",
            domain: "ipc-test.local",
            wordPressVersion: "latest",
            adminUsername: "admin",
            adminPassword: "password",
            adminEmail: "admin@test.local",
            databaseName: "ipc_test_db",
        };

        const newSite = await ipcRenderer.invoke("sites:create", testConfig);
        console.log("✅ Site creation result:", newSite);

        // Test starting the site
        console.log("▶️ Testing sites:start...");
        await ipcRenderer.invoke("sites:start", newSite.id);
        console.log("✅ Site start successful");

        // List sites again
        console.log("📋 Listing sites after creation...");
        const updatedSites = await ipcRenderer.invoke("sites:list");
        console.log("✅ Updated sites list:", updatedSites);
    } catch (error) {
        console.error("❌ IPC Test failed:", error);
        console.error("Stack:", error.stack);
    }
}

// This won't work outside of Electron renderer, but it shows the approach
if (typeof window !== "undefined" && window.electronAPI) {
    console.log("🌐 Testing via electronAPI...");

    window.electronAPI.sites
        .list()
        .then((sites) => {
            console.log("✅ electronAPI sites list:", sites);

            return window.electronAPI.sites.create({
                siteName: "api-test-site",
                domain: "api-test.local",
                wordPressVersion: "latest",
                adminUsername: "admin",
                adminPassword: "password",
                adminEmail: "admin@test.local",
                databaseName: "api_test_db",
            });
        })
        .then((site) => {
            console.log("✅ electronAPI site created:", site);
            return window.electronAPI.sites.start(site.id);
        })
        .then(() => {
            console.log("✅ electronAPI site started");
        })
        .catch((error) => {
            console.error("❌ electronAPI test failed:", error);
        });
} else {
    console.log("❌ This test needs to run in Electron renderer context");
    console.log(
        "💡 Copy this code into the browser console in the PressBox app"
    );
}

console.log("\n📝 TO TEST SITE CREATION:");
console.log("1. Open PressBox app");
console.log("2. Open Developer Tools (F12)");
console.log("3. Paste this code in the console:");
console.log(`
window.electronAPI.sites.create({
    siteName: 'console-test-site',
    domain: 'console-test.local',
    wordPressVersion: 'latest',
    adminUsername: 'admin',
    adminPassword: 'password',
    adminEmail: 'admin@test.local',
    databaseName: 'console_test_db'
}).then(site => {
    console.log('✅ Site created:', site);
    return window.electronAPI.sites.start(site.id);
}).then(() => {
    console.log('✅ Site started');
}).catch(error => {
    console.error('❌ Error:', error);
});
`);
