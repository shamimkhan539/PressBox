const { spawn } = require("child_process");
const path = require("path");

console.log("🔍 Testing PressBox PHP server startup...\n");

// Simulate exactly what PressBox does
const sitePath = "C:\\Users\\BJIT\\PressBox\\sites\\bjit";
const port = 8000;

// Use the exact same arguments as PressBox
const phpArgs = [
    "-S",
    `localhost:${port}`,
    "-t",
    sitePath,
    "-d",
    "display_errors=1",
    "-d",
    "log_errors=1",
    "-d",
    "extension=sqlite3", // Enable SQLite3 extension (required by SQLite Integration plugin)
    "-d",
    "extension=pdo_sqlite", // Enable PDO SQLite for WordPress
    "-d",
    "extension=mysqli",
    "-d",
    "extension=pdo_mysql",
];

console.log("🚀 Starting PHP server with args:");
console.log("php", phpArgs.join(" "));
console.log("\n⏳ Starting server...\n");

const phpProcess = spawn("php", phpArgs, {
    cwd: sitePath,
    stdio: ["ignore", "pipe", "pipe"],
});

let serverReady = false;

phpProcess.stdout?.on("data", (data) => {
    const output = data.toString().trim();
    if (output) {
        console.log(`[PHP] ${output}`);
        if (
            output.includes("Development Server") &&
            output.includes("started")
        ) {
            serverReady = true;
        }
    }
});

phpProcess.stderr?.on("data", (data) => {
    const error = data.toString().trim();
    if (error && !error.includes("Development Server")) {
        console.error(`[PHP ERROR] ${error}`);
    }
});

// Wait a bit for server to start, then test it
setTimeout(() => {
    if (serverReady) {
        console.log("\n✅ Server started successfully!");
        console.log("🔍 Testing WordPress...");

        // Test the site
        const http = require("http");

        const options = {
            hostname: "localhost",
            port: port,
            path: "/",
            method: "GET",
            headers: {
                "User-Agent": "PressBox-Test",
            },
        };

        const req = http.request(options, (res) => {
            console.log(`📊 Status Code: ${res.statusCode}`);

            let body = "";
            res.on("data", (chunk) => {
                body += chunk.toString();
            });

            res.on("end", () => {
                if (body.includes("critical error")) {
                    console.log("❌ Still getting critical error!");
                    console.log(
                        "💡 The SQLite3 extension might not be loading properly."
                    );
                } else if (
                    body.includes("WordPress") ||
                    body.includes("installation")
                ) {
                    console.log("✅ WordPress loaded successfully!");
                    console.log("🎉 SQLite integration is working!");
                } else {
                    console.log("⚠️  Unexpected response. Body preview:");
                    console.log(body.substring(0, 500) + "...");
                }

                // Stop the server
                phpProcess.kill();
                process.exit(0);
            });
        });

        req.on("error", (error) => {
            console.error("❌ Request failed:", error.message);
            phpProcess.kill();
            process.exit(1);
        });

        req.end();
    } else {
        console.log("❌ Server failed to start within timeout");
        phpProcess.kill();
        process.exit(1);
    }
}, 3000);

// Handle process events
phpProcess.on("error", (error) => {
    console.error(`❌ PHP server error:`, error);
});

phpProcess.on("exit", (code, signal) => {
    console.log(`PHP server exited (code: ${code}, signal: ${signal})`);
});
