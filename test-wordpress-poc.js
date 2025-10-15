/**
 * WordPress Download and Installation POC
 *
 * This will download WordPress and set up a real WordPress installation
 */

const { spawn, exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const { createWriteStream } = require("fs");
const { pipeline } = require("stream");
const { promisify } = require("util");
const AdmZip = require("adm-zip");

class WordPressPOC {
    constructor() {
        this.baseDir = path.join(__dirname, "wordpress-poc");
        this.siteName = "test-wp-site";
        this.siteDir = path.join(this.baseDir, this.siteName);
        this.phpProcess = null;
        this.port = 8081;
        this.wpUrl = "https://wordpress.org/latest.zip";
    }

    async setupDirectories() {
        console.log("📁 Setting up directories...");

        // Clean and create base directory
        if (fs.existsSync(this.baseDir)) {
            fs.rmSync(this.baseDir, { recursive: true, force: true });
        }
        fs.mkdirSync(this.baseDir, { recursive: true });
        fs.mkdirSync(this.siteDir, { recursive: true });

        console.log("✅ Directories created:");
        console.log("   Base:", this.baseDir);
        console.log("   Site:", this.siteDir);
    }

    async downloadWordPress() {
        console.log("⬇️  Downloading WordPress...");

        const zipPath = path.join(this.baseDir, "wordpress-latest.zip");

        return new Promise((resolve, reject) => {
            const file = createWriteStream(zipPath);

            https
                .get(this.wpUrl, (response) => {
                    if (response.statusCode !== 200) {
                        reject(
                            new Error(`Download failed: ${response.statusCode}`)
                        );
                        return;
                    }

                    const totalSize = parseInt(
                        response.headers["content-length"],
                        10
                    );
                    let downloadedSize = 0;

                    response.on("data", (chunk) => {
                        downloadedSize += chunk.length;
                        const percent = (
                            (downloadedSize / totalSize) *
                            100
                        ).toFixed(1);
                        process.stdout.write(
                            `\r📊 Downloading: ${percent}% (${downloadedSize}/${totalSize} bytes)`
                        );
                    });

                    pipeline(response, file, (error) => {
                        if (error) {
                            reject(error);
                        } else {
                            console.log(
                                "\n✅ WordPress downloaded successfully"
                            );
                            resolve(zipPath);
                        }
                    });
                })
                .on("error", reject);
        });
    }

    async extractWordPress(zipPath) {
        console.log("📦 Extracting WordPress...");

        try {
            const zip = new AdmZip(zipPath);
            const extractPath = this.baseDir;

            zip.extractAllTo(extractPath, true);

            // WordPress extracts to a 'wordpress' folder, move contents to our site directory
            const wpExtractDir = path.join(extractPath, "wordpress");

            if (fs.existsSync(wpExtractDir)) {
                // Move all files from wordpress folder to site directory
                const files = fs.readdirSync(wpExtractDir);
                for (const file of files) {
                    const srcPath = path.join(wpExtractDir, file);
                    const destPath = path.join(this.siteDir, file);
                    fs.renameSync(srcPath, destPath);
                }

                // Remove empty wordpress folder
                fs.rmSync(wpExtractDir, { recursive: true });
                console.log("✅ WordPress extracted to:", this.siteDir);
            } else {
                throw new Error(
                    "WordPress extraction failed - wordpress folder not found"
                );
            }

            // Clean up zip file
            fs.unlinkSync(zipPath);
        } catch (error) {
            throw new Error(`Extraction failed: ${error.message}`);
        }
    }

    async createWordPressConfig() {
        console.log("⚙️  Creating WordPress configuration...");

        const configPath = path.join(this.siteDir, "wp-config.php");
        const sampleConfigPath = path.join(
            this.siteDir,
            "wp-config-sample.php"
        );

        if (!fs.existsSync(sampleConfigPath)) {
            throw new Error("wp-config-sample.php not found");
        }

        // Read sample config
        let configContent = fs.readFileSync(sampleConfigPath, "utf8");

        // Replace database settings for SQLite (we'll use SQLite for simplicity)
        configContent = configContent.replace(
            /define\( 'DB_NAME', '.*?' \);/,
            "define( 'DB_NAME', 'wordpress_db' );"
        );
        configContent = configContent.replace(
            /define\( 'DB_USER', '.*?' \);/,
            "define( 'DB_USER', 'root' );"
        );
        configContent = configContent.replace(
            /define\( 'DB_PASSWORD', '.*?' \);/,
            "define( 'DB_PASSWORD', '' );"
        );
        configContent = configContent.replace(
            /define\( 'DB_HOST', '.*?' \);/,
            "define( 'DB_HOST', 'localhost' );"
        );

        // Add SQLite support (we'll install a plugin for this)
        configContent = configContent.replace(
            "/* That's all, stop editing! Happy publishing. */",
            `// Enable SQLite database
define('DB_DIR', dirname(__FILE__) . '/wp-content/database/');
define('DB_FILE', 'wpdatabase.db');

/* That's all, stop editing! Happy publishing. */`
        );

        // Add some security keys (basic ones for POC)
        const keys = [
            "AUTH_KEY",
            "SECURE_AUTH_KEY",
            "LOGGED_IN_KEY",
            "NONCE_KEY",
            "AUTH_SALT",
            "SECURE_AUTH_SALT",
            "LOGGED_IN_SALT",
            "NONCE_SALT",
        ];

        keys.forEach((key) => {
            const randomString =
                Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);
            configContent = configContent.replace(
                new RegExp(`define\\( '${key}', '.*?' \\);`),
                `define( '${key}', '${randomString}' );`
            );
        });

        fs.writeFileSync(configPath, configContent);
        console.log("✅ WordPress configuration created");
    }

    async setupSQLiteSupport() {
        console.log("🗄️  Setting up SQLite support...");

        // Create database directory
        const dbDir = path.join(this.siteDir, "wp-content", "database");
        fs.mkdirSync(dbDir, { recursive: true });

        // For now, we'll use MySQL-compatible SQLite setup
        // In a real implementation, we'd download the SQLite Integration plugin
        console.log("✅ SQLite directory created");
    }

    async startWordPressSite() {
        console.log("🚀 Starting WordPress site...");

        return new Promise((resolve, reject) => {
            this.phpProcess = spawn(
                "php",
                ["-S", `localhost:${this.port}`, "-t", this.siteDir],
                {
                    stdio: ["pipe", "pipe", "pipe"],
                }
            );

            this.phpProcess.stdout.on("data", (data) => {
                console.log("📊 WordPress Server:", data.toString());
            });

            this.phpProcess.stderr.on("data", (data) => {
                const output = data.toString();
                console.log("📊 WordPress Log:", output);

                if (
                    output.includes("Development Server") ||
                    output.includes("started")
                ) {
                    console.log(
                        "✅ WordPress server started on port",
                        this.port
                    );
                    resolve(true);
                }
            });

            this.phpProcess.on("error", (error) => {
                console.error("❌ WordPress server error:", error);
                reject(error);
            });

            setTimeout(() => {
                console.log("⏰ WordPress server should be ready");
                resolve(true);
            }, 3000);
        });
    }

    async testWordPressSite() {
        console.log("🧪 Testing WordPress installation...");

        return new Promise((resolve) => {
            const options = {
                hostname: "localhost",
                port: this.port,
                path: "/",
                method: "GET",
            };

            const req = http.request(options, (res) => {
                let data = "";

                res.on("data", (chunk) => {
                    data += chunk;
                });

                res.on("end", () => {
                    console.log(
                        "✅ WordPress Response Status:",
                        res.statusCode
                    );
                    console.log("📊 Response Length:", data.length, "bytes");

                    if (res.statusCode === 200 || res.statusCode === 302) {
                        if (
                            data.includes("WordPress") ||
                            data.includes("wp-") ||
                            data.includes("install")
                        ) {
                            console.log("🎉 WordPress is running!");
                            console.log(
                                "🌐 Visit: http://localhost:" + this.port
                            );
                            console.log(
                                "📋 You should see WordPress installation page"
                            );
                            resolve(true);
                        } else {
                            console.log(
                                "⚠️  Server running but WordPress not detected"
                            );
                            console.log(
                                "📄 Response preview:",
                                data.substring(0, 300) + "..."
                            );
                            resolve(false);
                        }
                    } else {
                        console.log("❌ WordPress not responding correctly");
                        resolve(false);
                    }
                });
            });

            req.on("error", (error) => {
                console.error("❌ Request error:", error.message);
                resolve(false);
            });

            req.setTimeout(10000, () => {
                console.error("❌ Request timeout");
                req.destroy();
                resolve(false);
            });

            req.end();
        });
    }

    async stopServer() {
        console.log("🛑 Stopping WordPress server...");

        if (this.phpProcess) {
            this.phpProcess.kill("SIGTERM");
            this.phpProcess = null;
            console.log("✅ WordPress server stopped");
        }
    }

    async cleanup() {
        console.log("🧹 Cleaning up WordPress POC...");

        await this.stopServer();

        if (fs.existsSync(this.baseDir)) {
            fs.rmSync(this.baseDir, { recursive: true, force: true });
            console.log("✅ WordPress POC cleaned up");
        }
    }

    async runFullWordPressPOC() {
        console.log("🚀 Starting WordPress Installation POC...\n");

        try {
            // Step 1: Setup directories
            await this.setupDirectories();

            // Step 2: Download WordPress
            const zipPath = await this.downloadWordPress();

            // Step 3: Extract WordPress
            await this.extractWordPress(zipPath);

            // Step 4: Create WordPress config
            await this.createWordPressConfig();

            // Step 5: Setup SQLite support
            await this.setupSQLiteSupport();

            // Step 6: Start WordPress server
            await this.startWordPressSite();

            // Step 7: Test WordPress installation
            const wpWorking = await this.testWordPressSite();

            if (wpWorking) {
                console.log("\n🎉 SUCCESS: WordPress POC is working!");
                console.log("🌐 Visit: http://localhost:" + this.port);
                console.log(
                    "📋 You should see the WordPress installation page"
                );
                console.log("⏰ Server will run for 60 seconds for testing...");

                setTimeout(async () => {
                    await this.cleanup();
                    console.log("✅ WordPress POC completed");
                    process.exit(0);
                }, 60000);
            } else {
                throw new Error("WordPress test failed");
            }
        } catch (error) {
            console.error("❌ WordPress POC Failed:", error.message);
            await this.cleanup();
            process.exit(1);
        }
    }
}

// Check if adm-zip is available
try {
    require("adm-zip");
} catch (error) {
    console.error("❌ adm-zip package not found. Installing...");
    exec("npm install adm-zip", (error) => {
        if (error) {
            console.error("❌ Failed to install adm-zip:", error.message);
            console.log("📋 Please run: npm install adm-zip");
            process.exit(1);
        } else {
            console.log("✅ adm-zip installed, restarting...");
            // Restart the script
            require("child_process").spawn(process.execPath, [__filename], {
                stdio: "inherit",
            });
            process.exit(0);
        }
    });
    return;
}

// Run the WordPress POC
const wpPOC = new WordPressPOC();
wpPOC.runFullWordPressPOC();

// Handle cleanup on exit
process.on("SIGINT", async () => {
    console.log("\n🛑 Received SIGINT, cleaning up...");
    await wpPOC.cleanup();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    console.log("\n🛑 Received SIGTERM, cleaning up...");
    await wpPOC.cleanup();
    process.exit(0);
});
