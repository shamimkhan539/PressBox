const { spawn } = require("child_process");

console.log("🔍 Testing PHP with PDO SQLite extension...\n");

// Test with the same arguments that PressBox uses
const phpProcess = spawn("php", [
    "-d",
    "extension=pdo_sqlite",
    "-d",
    "extension=mysqli",
    "-d",
    "extension=pdo_mysql",
    "-r",
    "print_r(PDO::getAvailableDrivers());",
]);

let output = "";
let errorOutput = "";

phpProcess.stdout.on("data", (data) => {
    output += data.toString();
});

phpProcess.stderr.on("data", (data) => {
    errorOutput += data.toString();
});

phpProcess.on("close", (code) => {
    console.log("📊 Available PDO Drivers:");
    console.log(output);

    if (errorOutput) {
        console.log("\n⚠️  Errors/Warnings:");
        console.log(errorOutput);
    }

    if (output.includes("sqlite")) {
        console.log("\n✅ SUCCESS! PDO SQLite driver is available!");
        console.log("   WordPress with SQLite will now work.");
    } else {
        console.log("\n❌ FAILED! PDO SQLite driver is NOT available.");
        console.log(
            "   Check if php_pdo_sqlite.dll exists in PHP ext directory."
        );
    }

    console.log("\n📋 Next steps:");
    console.log("   1. Restart PressBox (close and reopen the app)");
    console.log("   2. Stop the bjit site");
    console.log("   3. Start the bjit site");
    console.log("   4. Open http://localhost:8000");
    console.log("   5. You should see the WordPress installation wizard!");
});
