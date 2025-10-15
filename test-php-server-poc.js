/**
 * Basic PHP Server POC Test
 *
 * This will test if we can actually start a PHP server and serve content
 */

const { spawn, exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");

class BasicPHPServerPOC {
    constructor() {
        this.testDir = path.join(__dirname, "test-php-poc");
        this.phpProcess = null;
        this.port = 8080;
    }

    async setupTestEnvironment() {
        console.log("🔧 Setting up test environment...");

        // Create test directory
        if (fs.existsSync(this.testDir)) {
            fs.rmSync(this.testDir, { recursive: true, force: true });
        }
        fs.mkdirSync(this.testDir, { recursive: true });

        // Create a simple PHP file
        const phpContent = `<?php
echo "<h1>PHP Server POC Working!</h1>";
echo "<p>Current time: " . date('Y-m-d H:i:s') . "</p>";
echo "<p>PHP Version: " . phpversion() . "</p>";
echo "<p>Server: " . $_SERVER['SERVER_SOFTWARE'] . "</p>";
echo "<p>Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "</p>";
phpinfo();
?>`;

        fs.writeFileSync(path.join(this.testDir, "index.php"), phpContent);

        console.log("✅ Test environment created at:", this.testDir);
        return true;
    }

    async checkPHPAvailability() {
        console.log("🐘 Checking PHP availability...");

        return new Promise((resolve) => {
            exec("php --version", (error, stdout, stderr) => {
                if (error) {
                    console.log("❌ PHP not found:", error.message);
                    resolve(false);
                } else {
                    console.log("✅ PHP found:");
                    console.log(stdout);
                    resolve(true);
                }
            });
        });
    }

    async startPHPServer() {
        console.log("🚀 Starting PHP built-in server...");

        return new Promise((resolve, reject) => {
            // Start PHP built-in server
            this.phpProcess = spawn(
                "php",
                ["-S", `localhost:${this.port}`, "-t", this.testDir],
                {
                    stdio: ["pipe", "pipe", "pipe"],
                }
            );

            this.phpProcess.stdout.on("data", (data) => {
                console.log("📊 PHP Server Output:", data.toString());
            });

            this.phpProcess.stderr.on("data", (data) => {
                const output = data.toString();
                console.log("📊 PHP Server Log:", output);

                // PHP server is ready when we see this message
                if (
                    output.includes("Development Server") ||
                    output.includes("started")
                ) {
                    console.log("✅ PHP Server started successfully");
                    resolve(true);
                }
            });

            this.phpProcess.on("error", (error) => {
                console.error("❌ PHP Server error:", error);
                reject(error);
            });

            this.phpProcess.on("exit", (code) => {
                console.log(`📊 PHP Server exited with code: ${code}`);
            });

            // Give server time to start
            setTimeout(() => {
                console.log("⏰ PHP Server should be ready now");
                resolve(true);
            }, 2000);
        });
    }

    async testServerResponse() {
        console.log("🧪 Testing server response...");

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
                    console.log("✅ Server Response Status:", res.statusCode);
                    console.log("📊 Response Length:", data.length, "bytes");
                    console.log("📋 Response Headers:", res.headers);

                    if (
                        res.statusCode === 200 &&
                        data.includes("PHP Server POC Working!")
                    ) {
                        console.log("🎉 PHP Server is working correctly!");
                        console.log("🌐 Visit: http://localhost:" + this.port);
                        resolve(true);
                    } else {
                        console.log("❌ Server response not as expected");
                        console.log(
                            "📄 Response:",
                            data.substring(0, 200) + "..."
                        );
                        resolve(false);
                    }
                });
            });

            req.on("error", (error) => {
                console.error("❌ Request error:", error.message);
                resolve(false);
            });

            req.setTimeout(5000, () => {
                console.error("❌ Request timeout");
                req.destroy();
                resolve(false);
            });

            req.end();
        });
    }

    async stopServer() {
        console.log("🛑 Stopping PHP server...");

        if (this.phpProcess) {
            this.phpProcess.kill("SIGTERM");
            this.phpProcess = null;
            console.log("✅ PHP server stopped");
        }
    }

    async cleanup() {
        console.log("🧹 Cleaning up test environment...");

        await this.stopServer();

        if (fs.existsSync(this.testDir)) {
            fs.rmSync(this.testDir, { recursive: true, force: true });
            console.log("✅ Test environment cleaned up");
        }
    }

    async runFullTest() {
        console.log("🚀 Starting Basic PHP Server POC Test...\n");

        try {
            // Step 1: Check PHP
            const phpAvailable = await this.checkPHPAvailability();
            if (!phpAvailable) {
                throw new Error("PHP is not available");
            }

            // Step 2: Setup test environment
            await this.setupTestEnvironment();

            // Step 3: Start PHP server
            await this.startPHPServer();

            // Step 4: Test server response
            const serverWorking = await this.testServerResponse();

            if (serverWorking) {
                console.log("\n🎉 SUCCESS: Basic PHP Server POC is working!");
                console.log("🌐 You can visit: http://localhost:" + this.port);
                console.log(
                    "⏰ Server will run for 30 seconds for manual testing..."
                );

                // Keep server running for manual testing
                setTimeout(async () => {
                    await this.cleanup();
                    console.log("✅ POC test completed");
                    process.exit(0);
                }, 30000);
            } else {
                throw new Error("Server test failed");
            }
        } catch (error) {
            console.error("❌ POC Test Failed:", error.message);
            await this.cleanup();
            process.exit(1);
        }
    }
}

// Run the test
const poc = new BasicPHPServerPOC();
poc.runFullTest();

// Handle cleanup on exit
process.on("SIGINT", async () => {
    console.log("\n🛑 Received SIGINT, cleaning up...");
    await poc.cleanup();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    console.log("\n🛑 Received SIGTERM, cleaning up...");
    await poc.cleanup();
    process.exit(0);
});
