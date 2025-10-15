const { spawn } = require("child_process");
const http = require("http");

console.log("🔍 Testing complete PressBox WordPress startup...\n");

// Simulate PressBox startup exactly
const sitePath = "C:\\Users\\BJIT\\PressBox\\sites\\bjit";
const port = 8000;

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
    "extension=sqlite3",
    "-d",
    "extension=pdo_sqlite",
    "-d",
    "extension=mysqli",
    "-d",
    "extension=pdo_mysql",
];

console.log("🚀 Starting PHP server with exact PressBox arguments:");
console.log("php", phpArgs.join(" "));
console.log("\n⏳ Starting server...\n");

const phpProcess = spawn("php", phpArgs, {
    cwd: sitePath,
    stdio: ["ignore", "pipe", "pipe"],
});

let serverStarted = false;

phpProcess.stdout?.on("data", (data) => {
    const output = data.toString().trim();
    if (output) {
        console.log(`[PHP] ${output}`);
        if (output.includes("started")) {
            serverStarted = true;
        }
    }
});

phpProcess.stderr?.on("data", (data) => {
    const error = data.toString().trim();
    if (error && !error.includes("Development Server")) {
        console.error(`[PHP ERROR] ${error}`);
    }
});

// Wait for server to start
setTimeout(() => {
    if (!serverStarted) {
        console.log("❌ Server failed to start");
        phpProcess.kill();
        return;
    }

    console.log("\n✅ Server started! Testing WordPress...\n");

    // Test the WordPress site
    const options = {
        hostname: "localhost",
        port: port,
        path: "/",
        method: "GET",
        headers: { "User-Agent": "PressBox-Test" },
    };

    const req = http.request(options, (res) => {
        console.log(`📊 HTTP Status: ${res.statusCode}`);

        let body = "";
        res.on("data", (chunk) => {
            body += chunk.toString();
        });

        res.on("end", () => {
            if (body.includes("critical error")) {
                console.log("❌ Still getting critical error!");
                console.log("📄 Error details:");
                // Extract error message
                const errorMatch = body.match(/<p>(.*?)<\/p>/);
                if (errorMatch) {
                    console.log("   ", errorMatch[1]);
                }
            } else if (
                body.includes("WordPress") &&
                (body.includes("installation") || body.includes("Welcome"))
            ) {
                console.log(
                    "✅ SUCCESS! WordPress installation wizard loaded!"
                );
                console.log("🎉 SQLite integration is working perfectly!");
            } else if (body.includes("Welcome to WordPress")) {
                console.log("✅ SUCCESS! WordPress is running!");
            } else {
                console.log(
                    "⚠️  Unexpected response. Checking for key indicators..."
                );
                if (body.includes("SQLite")) {
                    console.log("   ✅ SQLite mentioned in response");
                }
                if (body.includes("database")) {
                    console.log("   ✅ Database mentioned in response");
                }
                console.log(
                    "   Response preview:",
                    body.substring(0, 200) + "..."
                );
            }

            phpProcess.kill();
        });
    });

    req.on("error", (error) => {
        console.error("❌ HTTP request failed:", error.message);
        phpProcess.kill();
    });

    req.setTimeout(10000, () => {
        console.log("❌ Request timeout");
        req.destroy();
        phpProcess.kill();
    });

    req.end();
}, 5000);

// Handle process exit
phpProcess.on("exit", (code, signal) => {
    console.log(`\nPHP process exited (code: ${code}, signal: ${signal})`);
});
