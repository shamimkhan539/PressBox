// Test script to verify MySQL connection with retry logic (matching simpleWordPressManager.ts)
const mysql = require("mysql2/promise");
const { execSync } = require("child_process");

async function checkMySQLProcess(port = 3306) {
    console.log(`🔍 Checking if MySQL is running on port ${port}...`);
    try {
        const output = execSync(`netstat -ano | findstr :${port}`, {
            encoding: "utf-8",
        });
        const lines = output.trim().split("\n");
        const pids = new Set();

        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            const pid = parseInt(parts[parts.length - 1]);
            if (!isNaN(pid) && pid > 0) {
                pids.add(pid);
            }
        }

        if (pids.size > 0) {
            console.log(
                `✅ MySQL process found on port ${port} (PIDs: ${Array.from(pids).join(", ")})`
            );
            return true;
        } else {
            console.log(`❌ No MySQL process found on port ${port}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ No MySQL process found on port ${port}`);
        return false;
    }
}

async function testMySQLConnectionWithRetry(port = 3306, maxRetries = 5) {
    console.log(
        `\n🧪 Testing MySQL connection on port ${port} with retry logic...`
    );

    let retries = maxRetries;
    let lastError;

    while (retries > 0) {
        try {
            console.log(
                `   🔄 Connection attempt ${maxRetries - retries + 1}/${maxRetries}...`
            );

            const connection = await mysql.createConnection({
                host: "localhost",
                port: port,
                user: "root",
                password: "",
                connectTimeout: 5000,
            });

            console.log(`   ✅ MySQL connection successful!`);

            // Try to show databases
            const [databases] = await connection.query("SHOW DATABASES");
            console.log(`   📊 Available databases: ${databases.length}`);
            databases.forEach((db) => {
                console.log(`      - ${db.Database}`);
            });

            await connection.end();
            return true;
        } catch (error) {
            lastError = error;
            retries--;

            if (retries > 0) {
                console.log(
                    `   ⚠️ Connection failed: ${error.code || error.message}`
                );
                console.log(
                    `   🔄 Retrying in 2 seconds... (${retries} attempts left)`
                );
                await new Promise((resolve) => setTimeout(resolve, 2000));
            } else {
                console.log(`   ❌ MySQL connection failed after all retries`);
                console.log(
                    `   ❌ Error: ${lastError.code || lastError.message}`
                );
                return false;
            }
        }
    }

    return false;
}

async function runTests() {
    console.log("=".repeat(60));
    console.log("MySQL Connection Test - Matching PressBox Logic");
    console.log("=".repeat(60));

    const port = 3306;

    // Step 1: Check if MySQL process is running
    console.log("\n📋 Step 1: Check MySQL Process");
    const processRunning = await checkMySQLProcess(port);

    if (!processRunning) {
        console.log("\n⚠️  MySQL is not running on port 3306");
        console.log(
            "   Please start PressBox and create a site with MySQL to start the server"
        );
        return;
    }

    // Step 2: Test connection with retry logic (simulating PressBox behavior)
    console.log("\n📋 Step 2: Test Connection with Retry Logic");
    const success = await testMySQLConnectionWithRetry(port, 5);

    // Step 3: Summary
    console.log("\n" + "=".repeat(60));
    console.log("Test Summary:");
    console.log("=".repeat(60));

    if (success) {
        console.log("✅ MySQL connection successful!");
        console.log("   - Process is running on port 3306");
        console.log("   - Connection test passed");
        console.log("   - Databases are accessible");
        console.log(
            "\n✅ PressBox should be able to connect to MySQL successfully!"
        );
    } else {
        console.log("❌ MySQL connection failed!");
        console.log("   - Process is running but not accepting connections");
        console.log("   - This might indicate MySQL is still initializing");
        console.log(
            "\n⚠️  Wait a few more seconds and try again, or check MySQL logs"
        );
    }
}

// Run the tests
console.log("Starting MySQL connection tests...\n");
runTests().catch((error) => {
    console.error("\n❌ Test script error:", error);
    process.exit(1);
});
