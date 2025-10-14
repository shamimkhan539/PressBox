// Test PHP server startup in detail
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs").promises;
const http = require("http");

async function testPHPServerStartup() {
    console.log("🧪 Testing PHP Server Startup in Detail...\n");

    const pressBoxPath = path.join(require("os").homedir(), "PressBox");
    const testSitePath = path.join(pressBoxPath, "sites", "detailed-test-site");

    try {
        // Create test site directory
        await fs.mkdir(testSitePath, { recursive: true });
        console.log(`✅ Created test directory: ${testSitePath}`);

        // Create a comprehensive index.php
        const indexPhp = `<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

echo "<h1>PHP Server Test</h1>";
echo "<p><strong>PHP Version:</strong> " . phpversion() . "</p>";
echo "<p><strong>Server Time:</strong> " . date('Y-m-d H:i:s') . "</p>";
echo "<p><strong>Server Port:</strong> " . ($_SERVER['SERVER_PORT'] ?? 'Unknown') . "</p>";
echo "<p><strong>Document Root:</strong> " . ($_SERVER['DOCUMENT_ROOT'] ?? 'Unknown') . "</p>";
echo "<p><strong>Script Name:</strong> " . ($_SERVER['SCRIPT_NAME'] ?? 'Unknown') . "</p>";
echo "<p><strong>Working Directory:</strong> " . getcwd() . "</p>";

// Test file operations
echo "<h2>File System Test</h2>";
$files = scandir('.');
echo "<p><strong>Files in current directory:</strong></p><ul>";
foreach($files as $file) {
    if($file != '.' && $file != '..') {
        echo "<li>$file</li>";
    }
}
echo "</ul>";

phpinfo();
?>`;

        await fs.writeFile(path.join(testSitePath, "index.php"), indexPhp);
        console.log("✅ Created comprehensive index.php");

        // Test different PHP server configurations
        const testConfigs = [
            {
                name: "Basic Server",
                args: ["-S", "localhost:8888", "-t", testSitePath],
                cwd: testSitePath,
            },
            {
                name: "Server with Error Display",
                args: [
                    "-S",
                    "localhost:8889",
                    "-t",
                    testSitePath,
                    "-d",
                    "display_errors=1",
                    "-d",
                    "log_errors=1",
                ],
                cwd: testSitePath,
            },
            {
                name: "Server Different CWD",
                args: ["-S", "localhost:8890", "-t", "."],
                cwd: testSitePath,
            },
        ];

        for (const config of testConfigs) {
            console.log(`\n🚀 Testing ${config.name}...`);
            console.log(`   Command: php ${config.args.join(" ")}`);
            console.log(`   Working Directory: ${config.cwd}`);

            await testPHPConfig(config);
        }
    } catch (error) {
        console.error("❌ Setup error:", error.message);
    }
}

function testPHPConfig(config) {
    return new Promise((resolve) => {
        const phpProcess = spawn("php", config.args, {
            cwd: config.cwd,
            stdio: ["ignore", "pipe", "pipe"],
        });

        let serverOutput = "";
        let serverError = "";
        let serverStarted = false;

        console.log(`   Process PID: ${phpProcess.pid}`);

        phpProcess.stdout.on("data", (data) => {
            const output = data.toString();
            serverOutput += output;
            console.log(`   📤 STDOUT: ${output.trim()}`);
        });

        phpProcess.stderr.on("data", (data) => {
            const error = data.toString();
            serverError += error;
            console.log(`   📥 STDERR: ${error.trim()}`);

            if (
                error.includes("Development Server") &&
                error.includes("started")
            ) {
                serverStarted = true;
                console.log("   ✅ Server started signal detected");
            }
        });

        phpProcess.on("error", (error) => {
            console.log(`   ❌ Process error: ${error.message}`);
        });

        phpProcess.on("exit", (code, signal) => {
            console.log(
                `   🔚 Process exited - Code: ${code}, Signal: ${signal}`
            );
            resolve();
        });

        // Test the server after a delay
        setTimeout(async () => {
            if (serverStarted) {
                console.log("   🔍 Testing server connection...");

                const port = config.args
                    .find((arg) => arg.includes(":"))
                    .split(":")[1];
                const testUrl = `http://localhost:${port}`;

                try {
                    const testReq = http.get(testUrl, (res) => {
                        console.log(
                            `   ✅ Connection successful - Status: ${res.statusCode}`
                        );

                        let responseData = "";
                        res.on("data", (chunk) => (responseData += chunk));
                        res.on("end", () => {
                            console.log(
                                `   📄 Response length: ${responseData.length} bytes`
                            );
                            console.log(
                                `   📄 Response preview: ${responseData.substring(0, 100)}...`
                            );
                            phpProcess.kill("SIGTERM");
                        });
                    });

                    testReq.on("error", (error) => {
                        console.log(
                            `   ❌ Connection failed: ${error.message}`
                        );
                        phpProcess.kill("SIGTERM");
                    });

                    testReq.setTimeout(2000, () => {
                        console.log("   ⏰ Connection timeout");
                        testReq.destroy();
                        phpProcess.kill("SIGTERM");
                    });
                } catch (error) {
                    console.log(`   ❌ Request error: ${error.message}`);
                    phpProcess.kill("SIGTERM");
                }
            } else {
                console.log("   ❌ Server did not start properly");
                phpProcess.kill("SIGTERM");
            }
        }, 2000);

        // Force cleanup after 5 seconds
        setTimeout(() => {
            if (!phpProcess.killed) {
                console.log("   ⏰ Force killing process");
                phpProcess.kill("SIGKILL");
                resolve();
            }
        }, 5000);
    });
}

testPHPServerStartup()
    .then(() => {
        console.log("\n✅ All tests completed!");
    })
    .catch(console.error);
