const http = require("http");

console.log("🔍 Testing WordPress site at http://localhost:8000...\n");

const options = {
    hostname: "localhost",
    port: 8000,
    path: "/",
    method: "GET",
    headers: {
        "User-Agent": "PressBox-Tester",
    },
};

const req = http.request(options, (res) => {
    console.log(`📊 Status Code: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);
    console.log("\n📄 Response Body:\n");

    let body = "";

    res.on("data", (chunk) => {
        body += chunk.toString();
    });

    res.on("end", () => {
        console.log(body);

        if (body.includes("critical error")) {
            console.log("\n❌ Critical error detected!");
            console.log("💡 Checking debug.log for details...");
        }
    });
});

req.on("error", (error) => {
    console.error("❌ Request failed:", error.message);
});

req.end();

// Also try to read the debug log
setTimeout(() => {
    const fs = require("fs");
    const path = require("path");
    const debugLogPath = path.join(
        "C:",
        "Users",
        "BJIT",
        "PressBox",
        "sites",
        "bjit",
        "wp-content",
        "debug.log"
    );

    try {
        if (fs.existsSync(debugLogPath)) {
            console.log("\n\n📝 WordPress Debug Log (last 50 lines):");
            console.log("=".repeat(80));
            const log = fs.readFileSync(debugLogPath, "utf8");
            const lines = log.split("\n");
            const lastLines = lines.slice(-50).join("\n");
            console.log(lastLines);
        } else {
            console.log("\n⚠️  Debug log not found at:", debugLogPath);
        }
    } catch (error) {
        console.error("⚠️  Could not read debug log:", error.message);
    }
}, 2000);
