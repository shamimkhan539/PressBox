/**
 * Clean up broken site directories
 *
 * This script removes site directories that don't have proper pressbox-config.json files
 */

const path = require("path");
const fs = require("fs").promises;

async function cleanupBrokenSites() {
    console.log("🧹 Cleaning up broken site directories...\n");

    const sitesPath = path.join(
        process.env.USERPROFILE || process.env.HOME || ".",
        "PressBox",
        "sites"
    );

    try {
        console.log(`📁 Checking sites directory: ${sitesPath}`);

        const siteDirectories = await fs.readdir(sitesPath);
        console.log(
            `🔍 Found ${siteDirectories.length} directories to check\n`
        );

        const cleaned = [];
        const kept = [];

        for (const siteDir of siteDirectories) {
            const configPath = path.join(
                sitesPath,
                siteDir,
                "pressbox-config.json"
            );
            const sitePath = path.join(sitesPath, siteDir);

            try {
                // Check if it's actually a directory
                const stat = await fs.stat(sitePath);
                if (!stat.isDirectory()) {
                    console.log(`⏭️ Skipping ${siteDir} (not a directory)`);
                    continue;
                }

                // Check if config exists
                const configExists = await fs
                    .access(configPath)
                    .then(() => true)
                    .catch(() => false);

                if (!configExists) {
                    console.log(
                        `❌ ${siteDir}: No pressbox-config.json found - removing`
                    );
                    await fs.rm(sitePath, { recursive: true, force: true });
                    cleaned.push(siteDir);
                } else {
                    // Try to parse the config
                    try {
                        const configData = await fs.readFile(
                            configPath,
                            "utf-8"
                        );
                        const site = JSON.parse(configData);
                        if (!site.id || !site.name) {
                            console.log(
                                `❌ ${siteDir}: Invalid config (missing id or name) - removing`
                            );
                            await fs.rm(sitePath, {
                                recursive: true,
                                force: true,
                            });
                            cleaned.push(siteDir);
                        } else {
                            console.log(
                                `✅ ${siteDir}: Valid site config - keeping`
                            );
                            kept.push(siteDir);
                        }
                    } catch (parseError) {
                        console.log(
                            `❌ ${siteDir}: Corrupted config file - removing`
                        );
                        await fs.rm(sitePath, { recursive: true, force: true });
                        cleaned.push(siteDir);
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Error checking ${siteDir}:`, error.message);
            }
        }

        console.log(`\n🎉 Cleanup complete!`);
        console.log(`   • Removed: ${cleaned.length} broken sites`);
        console.log(`   • Kept: ${kept.length} valid sites`);

        if (cleaned.length > 0) {
            console.log(`\n🗑️ Removed directories:`);
            cleaned.forEach((dir) => console.log(`   - ${dir}`));
        }

        if (kept.length > 0) {
            console.log(`\n✅ Kept directories:`);
            kept.forEach((dir) => console.log(`   - ${dir}`));
        }
    } catch (error) {
        if (error.code === "ENOENT") {
            console.log(
                "📁 Sites directory does not exist yet - nothing to clean up"
            );
        } else {
            console.error("❌ Failed to cleanup:", error);
        }
    }
}

cleanupBrokenSites();
