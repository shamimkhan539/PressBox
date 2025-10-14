// Direct test to see what's happening during site creation
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs").promises;

console.log("🔍 Debugging Site Creation Process...\n");

async function testActualSiteCreation() {
    const pressBoxPath = path.join(require("os").homedir(), "PressBox");

    console.log("📊 Current Status:");
    console.log(`   PressBox Path: ${pressBoxPath}`);

    try {
        // Check if PressBox directory exists
        const exists = await fs
            .access(pressBoxPath)
            .then(() => true)
            .catch(() => false);
        console.log(
            `   PressBox Directory: ${exists ? "✅ EXISTS" : "❌ MISSING"}`
        );

        if (exists) {
            const sitesPath = path.join(pressBoxPath, "sites");
            const sitesExist = await fs
                .access(sitesPath)
                .then(() => true)
                .catch(() => false);
            console.log(
                `   Sites Directory: ${sitesExist ? "✅ EXISTS" : "❌ MISSING"}`
            );

            if (sitesExist) {
                const sites = await fs.readdir(sitesPath);
                console.log(`   Existing Sites: ${sites.length}`);
                sites.forEach((site) => console.log(`     - ${site}`));
            }
        }
    } catch (error) {
        console.error("   Error checking directories:", error.message);
    }

    console.log("\n🔍 Testing PHP Server Manually...");

    try {
        // Create a test WordPress site manually to see if PHP servers can run
        const testSitePath = path.join(
            pressBoxPath,
            "sites",
            "manual-test-site"
        );
        await fs.mkdir(testSitePath, { recursive: true });

        // Create a simple index.php
        const indexPhp = `<?php
echo "<h1>Manual Test Site</h1>";
echo "<p>PHP Version: " . phpversion() . "</p>";
echo "<p>Time: " . date('Y-m-d H:i:s') . "</p>";
echo "<p>Server Port: " . $_SERVER['SERVER_PORT'] . "</p>";
?>`;

        await fs.writeFile(path.join(testSitePath, "index.php"), indexPhp);
        console.log("   ✅ Created test site files");

        // Try to start a PHP server manually
        console.log("   🚀 Starting PHP server on port 8888...");

        const { spawn } = require("child_process");
        const phpProcess = spawn(
            "php",
            ["-S", "localhost:8888", "-t", testSitePath],
            {
                stdio: ["ignore", "pipe", "pipe"],
            }
        );

        let serverStarted = false;
        let serverError = null;

        phpProcess.stdout.on("data", (data) => {
            const output = data.toString();
            console.log(`   PHP Output: ${output.trim()}`);
            if (output.includes("Development Server")) {
                serverStarted = true;
            }
        });

        phpProcess.stderr.on("data", (data) => {
            const error = data.toString();
            console.log(`   PHP Error: ${error.trim()}`);
            if (error.includes("Address already in use")) {
                serverError = "Port already in use";
            }
        });

        phpProcess.on("error", (error) => {
            console.error(`   ❌ Failed to start PHP: ${error.message}`);
            serverError = error.message;
        });

        // Wait for server to start
        await new Promise((resolve) => {
            setTimeout(() => {
                if (serverStarted && !serverError) {
                    console.log("   ✅ PHP server started successfully");

                    // Test the server
                    const http = require("http");
                    const testReq = http.get("http://localhost:8888", (res) => {
                        console.log(
                            `   ✅ Server responded with status: ${res.statusCode}`
                        );

                        let data = "";
                        res.on("data", (chunk) => (data += chunk));
                        res.on("end", () => {
                            console.log(
                                `   📄 Response: ${data.substring(0, 200)}...`
                            );
                            phpProcess.kill();
                            resolve();
                        });
                    });

                    testReq.on("error", (error) => {
                        console.log(
                            `   ❌ Server test failed: ${error.message}`
                        );
                        phpProcess.kill();
                        resolve();
                    });

                    testReq.setTimeout(3000, () => {
                        console.log("   ⏰ Server test timeout");
                        testReq.destroy();
                        phpProcess.kill();
                        resolve();
                    });
                } else {
                    if (serverError) {
                        console.log(
                            `   ❌ Server failed to start: ${serverError}`
                        );
                    } else {
                        console.log("   ⏰ Server startup timeout");
                    }
                    phpProcess.kill();
                    resolve();
                }
            }, 3000);
        });
    } catch (error) {
        console.error("   ❌ Manual test failed:", error.message);
    }

    console.log("\n🔍 Checking Current PHP Processes...");
    try {
        const result = execSync('tasklist /fi "imagename eq php.exe" /fo csv', {
            encoding: "utf8",
        });
        if (result.includes("php.exe")) {
            console.log("   ✅ PHP processes found:");
            const lines = result
                .split("\n")
                .filter((line) => line.includes("php.exe"));
            lines.forEach((line) => {
                const parts = line.split(",");
                if (parts.length >= 2) {
                    console.log(`     PID: ${parts[1].replace(/"/g, "")}`);
                }
            });
        } else {
            console.log("   ❌ No PHP processes running");
        }
    } catch (error) {
        console.log("   ❌ Error checking PHP processes:", error.message);
    }

    console.log("\n🔍 Checking Ports 8080-8085...");
    for (let port = 8080; port <= 8085; port++) {
        try {
            const result = execSync(`netstat -an | findstr :${port}`, {
                encoding: "utf8",
            });
            if (result.trim()) {
                console.log(`   Port ${port}: ✅ IN USE - ${result.trim()}`);
            } else {
                console.log(`   Port ${port}: ❌ FREE`);
            }
        } catch (e) {
            console.log(`   Port ${port}: ❌ FREE`);
        }
    }

    console.log("\n✅ Debug complete!");
}

testActualSiteCreation().catch(console.error);
