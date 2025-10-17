const {
    SimpleWordPressManager,
} = require("./dist/main/services/simpleWordPressManager.js");

async function checkSites() {
    const manager = new SimpleWordPressManager();
    await manager.loadSites();

    console.log("Loaded sites:");
    for (const [id, site] of manager.sites) {
        console.log(`  ${site.name}: ${site.url} (admin: ${site.adminUrl})`);
    }
}

checkSites().catch(console.error);
