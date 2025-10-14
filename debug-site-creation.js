const { app } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const { spawn } = require("child_process");

class SiteCreationDebugger {
    constructor() {
        this.pressBoxPath = path.join(require("os").homedir(), "PressBox");
        this.sitesPath = path.join(this.pressBoxPath, "sites");
    }

    async debugSiteCreation() {
        console.log("🔍 Debugging Site Creation Process...\n");

        // 1. Check PressBox directories
        await this.checkDirectories();

        // 2. Check existing sites
        await this.checkExistingSites();

        // 3. Check running processes
        await this.checkRunningProcesses();

        // 4. Simulate creating a test site
        await this.simulateCreateSite();
    }

    async checkDirectories() {
        console.log("📁 Checking PressBox directories:");

        try {
            const pressBoxExists = await this.dirExists(this.pressBoxPath);
            console.log(
                `   PressBox directory (${this.pressBoxPath}): ${pressBoxExists ? "✅ EXISTS" : "❌ MISSING"}`
            );

            const sitesExists = await this.dirExists(this.sitesPath);
            console.log(
                `   Sites directory (${this.sitesPath}): ${sitesExists ? "✅ EXISTS" : "❌ MISSING"}`
            );

            if (sitesExists) {
                const sites = await fs.readdir(this.sitesPath);
                console.log(`   Sites found: ${sites.length}`);
                sites.forEach((site) => console.log(`     - ${site}`));
            }
        } catch (error) {
            console.error("   Error checking directories:", error.message);
        }
        console.log("");
    }

    async checkExistingSites() {
        console.log("🌐 Checking existing WordPress sites:");

        try {
            const sitesExist = await this.dirExists(this.sitesPath);
            if (!sitesExist) {
                console.log("   No sites directory found");
                return;
            }

            const sites = await fs.readdir(this.sitesPath);
            if (sites.length === 0) {
                console.log("   No sites found");
                return;
            }

            for (const siteName of sites) {
                const sitePath = path.join(this.sitesPath, siteName);
                const isDir = (await fs.stat(sitePath)).isDirectory();

                if (isDir) {
                    console.log(`   Site: ${siteName}`);

                    // Check for WordPress files
                    const wpPath = path.join(sitePath, "wordpress");
                    const wpExists = await this.dirExists(wpPath);
                    console.log(
                        `     WordPress files: ${wpExists ? "✅" : "❌"}`
                    );

                    if (wpExists) {
                        const wpConfigExists = await this.fileExists(
                            path.join(wpPath, "wp-config.php")
                        );
                        console.log(
                            `     wp-config.php: ${wpConfigExists ? "✅" : "❌"}`
                        );

                        const indexExists = await this.fileExists(
                            path.join(wpPath, "index.php")
                        );
                        console.log(
                            `     index.php: ${indexExists ? "✅" : "❌"}`
                        );
                    }

                    // Check for site config
                    const configExists = await this.fileExists(
                        path.join(sitePath, "site-config.json")
                    );
                    console.log(
                        `     Site config: ${configExists ? "✅" : "❌"}`
                    );

                    if (configExists) {
                        try {
                            const config = JSON.parse(
                                await fs.readFile(
                                    path.join(sitePath, "site-config.json"),
                                    "utf8"
                                )
                            );
                            console.log(
                                `     Port: ${config.port || "unknown"}`
                            );
                            console.log(
                                `     Domain: ${config.domain || "unknown"}`
                            );
                            console.log(
                                `     Status: ${config.status || "unknown"}`
                            );
                        } catch (e) {
                            console.log("     Config file corrupted");
                        }
                    }
                }
            }
        } catch (error) {
            console.error("   Error checking sites:", error.message);
        }
        console.log("");
    }

    async checkRunningProcesses() {
        console.log("⚡ Checking running PHP processes:");

        try {
            // Check for PHP processes on Windows
            const phpProcesses = await this.execCommand(
                'tasklist /fi "imagename eq php.exe" /fo csv'
            );

            if (phpProcesses.includes("php.exe")) {
                console.log("   ✅ PHP processes found:");
                console.log(phpProcesses);
            } else {
                console.log("   ❌ No PHP processes running");
            }

            // Check specific ports
            console.log("   Checking ports 8080-8085:");
            for (let port = 8080; port <= 8085; port++) {
                try {
                    const portCheck = await this.execCommand(
                        `netstat -an | findstr :${port}`
                    );
                    if (portCheck.trim()) {
                        console.log(`     Port ${port}: ✅ IN USE`);
                        console.log(`       ${portCheck.trim()}`);
                    } else {
                        console.log(`     Port ${port}: ❌ FREE`);
                    }
                } catch (e) {
                    console.log(`     Port ${port}: ❌ FREE`);
                }
            }
        } catch (error) {
            console.error("   Error checking processes:", error.message);
        }
        console.log("");
    }

    async simulateCreateSite() {
        console.log("🧪 Simulating PHP server startup:");

        // Try to start a simple PHP server
        try {
            const testDir = path.join(this.sitesPath, "test-php-server");
            await fs.mkdir(testDir, { recursive: true });

            // Create a simple index.php
            const indexPhp = `<?php
echo "PHP Server is working!\\n";
echo "Time: " . date('Y-m-d H:i:s') . "\\n";
echo "Port: " . $_SERVER['SERVER_PORT'] . "\\n";
phpinfo();
?>`;

            await fs.writeFile(path.join(testDir, "index.php"), indexPhp);

            console.log("   Created test PHP file");
            console.log("   Attempting to start PHP server on port 8888...");

            const phpProcess = spawn(
                "php",
                ["-S", "localhost:8888", "-t", testDir],
                {
                    stdio: ["ignore", "pipe", "pipe"],
                }
            );

            let serverStarted = false;

            phpProcess.stdout.on("data", (data) => {
                console.log(`   PHP stdout: ${data.toString().trim()}`);
                if (data.toString().includes("Development Server")) {
                    serverStarted = true;
                }
            });

            phpProcess.stderr.on("data", (data) => {
                console.log(`   PHP stderr: ${data.toString().trim()}`);
            });

            phpProcess.on("error", (error) => {
                console.error(`   ❌ PHP process error: ${error.message}`);
            });

            // Wait a moment then test
            setTimeout(async () => {
                try {
                    const http = require("http");
                    const testReq = http.get("http://localhost:8888", (res) => {
                        console.log(
                            `   ✅ Test server responded with status: ${res.statusCode}`
                        );

                        let data = "";
                        res.on("data", (chunk) => (data += chunk));
                        res.on("end", () => {
                            console.log(
                                `   Response preview: ${data.substring(0, 100)}...`
                            );
                            phpProcess.kill();
                        });
                    });

                    testReq.on("error", (error) => {
                        console.log(
                            `   ❌ Test connection failed: ${error.message}`
                        );
                        phpProcess.kill();
                    });

                    testReq.setTimeout(3000, () => {
                        console.log("   ⏰ Test connection timeout");
                        testReq.destroy();
                        phpProcess.kill();
                    });
                } catch (error) {
                    console.error(`   ❌ Test request error: ${error.message}`);
                    phpProcess.kill();
                }
            }, 2000);
        } catch (error) {
            console.error("   Error in simulation:", error.message);
        }
    }

    async dirExists(dirPath) {
        try {
            const stat = await fs.stat(dirPath);
            return stat.isDirectory();
        } catch {
            return false;
        }
    }

    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    async execCommand(command) {
        return new Promise((resolve, reject) => {
            require("child_process").exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout || stderr);
                }
            });
        });
    }
}

// Run the debugger
const siteDebugger = new SiteCreationDebugger();
siteDebugger
    .debugSiteCreation()
    .then(() => {
        console.log("✅ Debug complete!");
    })
    .catch((error) => {
        console.error("❌ Debug failed:", error);
    });
