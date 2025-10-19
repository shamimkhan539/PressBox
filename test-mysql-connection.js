// Test script to verify MySQL connection testing functionality
const mysql = require("mysql2/promise");

async function testMySQLConnection(port = 3306) {
    console.log(`Testing MySQL connection on port ${port}...`);

    try {
        const connection = await mysql.createConnection({
            host: "localhost",
            port: port,
            user: "root",
            password: "",
            connectTimeout: 2000, // 2 second timeout
        });

        console.log(`✅ Successfully connected to MySQL on port ${port}`);
        await connection.end();
        return true;
    } catch (error) {
        console.log(
            `❌ Failed to connect to MySQL on port ${port}:`,
            error.message
        );
        return false;
    }
}

async function runTests() {
    console.log("Testing database connection functionality...\n");

    // Test common MySQL ports
    const ports = [3306, 3307, 3308];
    let anySuccess = false;

    for (const port of ports) {
        const success = await testMySQLConnection(port);
        if (success) anySuccess = true;
        console.log(""); // Empty line for readability
    }

    console.log("Test Summary:");
    console.log(
        anySuccess
            ? "✅ At least one MySQL connection succeeded"
            : "❌ No MySQL connections succeeded"
    );
    console.log(
        "This is expected behavior - MySQL may not be installed/running"
    );
}

// Run the tests
runTests().catch(console.error);
