const fs = require("fs").promises;
const path = require("path");
const os = require("os");

async function fixSitePaths() {
    const sitesPath = path.join(os.homedir(), "PressBox", "sites");

    try {
        console.log(`🔍 Checking sites in: ${sitesPath}`);
        const siteDirs = await fs.readdir(sitesPath);
        console.log(`📁 Found ${siteDirs.length} directories`);

        for (const siteDir of siteDirs) {
            const configPath = path.join(
                sitesPath,
                siteDir,
                "pressbox-config.json"
            );
            console.log(`\n🔍 Checking: ${siteDir}`);
            console.log(`   Config path: ${configPath}`);

            try {
                const configExists = await fs
                    .access(configPath)
                    .then(() => true)
                    .catch(() => false);
                if (!configExists) {
                    console.log(`   ⏭️ No config file found`);
                    continue;
                }

                const configData = await fs.readFile(configPath, "utf-8");
                const site = JSON.parse(configData);

                console.log(`   Site name: ${site.name}`);
                console.log(`   Site path: ${site.path}`);

                const expectedPath = path.join(sitesPath, siteDir);
                const currentPath = site.path;

                console.log(`   Expected path: ${expectedPath}`);

                if (currentPath !== expectedPath) {
                    console.log(`   🔧 Path mismatch - fixing...`);
                    site.path = expectedPath;
                    await fs.writeFile(
                        configPath,
                        JSON.stringify(site, null, 2)
                    );
                    console.log(`   ✅ Fixed!`);
                } else {
                    console.log(`   ✅ Path is correct`);
                }
            } catch (error) {
                console.error(
                    `   ❌ Error processing ${siteDir}:`,
                    error.message
                );
            }
        }
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

fixSitePaths();
