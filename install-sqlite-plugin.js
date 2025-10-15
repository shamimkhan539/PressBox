const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");
const AdmZip = require("adm-zip");

async function installSQLitePlugin() {
    const sitesPath = path.join(os.homedir(), "PressBox", "sites");
    const siteName = "bjit";
    const pluginsDir = path.join(sitesPath, siteName, "wp-content", "plugins");
    const sqlitePluginUrl =
        "https://downloads.wordpress.org/plugin/sqlite-database-integration.2.1.14.zip";
    const zipPath = path.join(os.tmpdir(), "sqlite-integration.zip");

    console.log("📦 Installing SQLite Integration Plugin for WordPress...\n");

    try {
        // Download the plugin
        console.log("⬇️  Downloading plugin...");
        await downloadFile(sqlitePluginUrl, zipPath);
        console.log("✅ Plugin downloaded\n");

        // Extract the plugin
        console.log("📂 Extracting plugin...");
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(pluginsDir, true);
        console.log("✅ Plugin extracted to:", pluginsDir, "\n");

        // Clean up
        fs.unlinkSync(zipPath);

        console.log("🎉 SQLite Integration plugin installed successfully!\n");
        console.log("📋 Next steps:");
        console.log("   1. Restart your site in PressBox");
        console.log("   2. Open http://localhost:8000");
        console.log("   3. Follow the WordPress installation wizard");
        console.log("   4. WordPress will automatically use SQLite!\n");
    } catch (error) {
        console.error("❌ Error:", error.message);
        console.log("\n📝 Manual installation:");
        console.log(
            "   1. Download from: https://wordpress.org/plugins/sqlite-database-integration/"
        );
        console.log(`   2. Extract to: ${pluginsDir}`);
    }
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https
            .get(url, (response) => {
                if (
                    response.statusCode === 302 ||
                    response.statusCode === 301
                ) {
                    // Follow redirect
                    return https
                        .get(response.headers.location, (redirectResponse) => {
                            redirectResponse.pipe(file);
                            file.on("finish", () => {
                                file.close();
                                resolve();
                            });
                        })
                        .on("error", reject);
                }
                response.pipe(file);
                file.on("finish", () => {
                    file.close();
                    resolve();
                });
            })
            .on("error", (err) => {
                fs.unlink(dest, () => {});
                reject(err);
            });
    });
}

installSQLitePlugin();
