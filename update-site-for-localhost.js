const fs = require("fs").promises;
const path = require("path");
const os = require("os");

async function updateSiteForLocalhost() {
    const sitesPath = path.join(os.homedir(), "PressBox", "sites");
    const siteName = "bjit";
    const configPath = path.join(sitesPath, siteName, "pressbox-config.json");

    try {
        console.log(`📝 Reading site config: ${configPath}`);
        const configData = await fs.readFile(configPath, "utf-8");
        const site = JSON.parse(configData);

        console.log(`\n📋 Current configuration:`);
        console.log(`   Domain: ${site.domain}`);
        console.log(`   URL: ${site.url}`);
        console.log(`   Port: ${site.port}`);

        // Update to localhost
        site.domain = "localhost";
        site.url = `http://localhost:${site.port}`;
        site.adminUrl = `http://localhost:${site.port}/wp-admin`;
        site.status = "stopped";

        console.log(`\n✨ New configuration:`);
        console.log(`   Domain: ${site.domain}`);
        console.log(`   URL: ${site.url}`);
        console.log(`   Port: ${site.port}`);

        await fs.writeFile(configPath, JSON.stringify(site, null, 2));
        console.log(`\n✅ Site configuration updated successfully!`);
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

updateSiteForLocalhost();
