const {
    databaseService,
} = require("./dist/main/main/services/databaseService");

async function testDatabaseService() {
    try {
        console.log("Testing SQLite Database Service...");

        // Test with direct file path
        const dbPath = "./test-db/test.db";
        console.log("Database path:", databaseService.getDatabasePath(dbPath));

        // Test getting tables
        const tables = databaseService.getTables(dbPath);
        console.log("Tables found:", tables.length);
        console.log(
            "Tables:",
            tables.map((t) => t.name)
        );

        // Test getting table schema
        if (tables.length > 0) {
            const schema = databaseService.getTableSchema(
                dbPath,
                tables[0].name
            );
            console.log(
                `Schema for ${tables[0].name}:`,
                schema.length,
                "columns"
            );
            console.log(
                "Columns:",
                schema.map((c) => `${c.name} (${c.type})`)
            );
        }

        // Test getting table data
        if (tables.length > 0) {
            const data = databaseService.getTableData(
                dbPath,
                tables[0].name,
                1,
                10
            );
            console.log(`Data from ${tables[0].name}:`, data.rowCount, "rows");
            console.log("Sample data:", data.rows.slice(0, 2));
        }

        // Test row count
        if (tables.length > 0) {
            const count = databaseService.getTableRowCount(
                dbPath,
                tables[0].name
            );
            console.log(`Total rows in ${tables[0].name}:`, count);
        }

        console.log("✅ SQLite Database Service test completed successfully!");
    } catch (error) {
        console.error("❌ Database service test failed:", error.message);
        console.error("Stack:", error.stack);
    }
}

testDatabaseService();
