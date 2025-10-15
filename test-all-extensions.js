const { spawn } = require("child_process");

console.log("🔍 Testing PHP with ALL required extensions...\n");

// Test with the exact same arguments that PressBox uses
const phpProcess = spawn("php", [
    "-d",
    "extension=sqlite3",
    "-d",
    "extension=pdo_sqlite",
    "-d",
    "extension=mysqli",
    "-d",
    "extension=pdo_mysql",
    "-r",
    `
        echo "✅ PHP Version: " . PHP_VERSION . "\\n\\n";
        
        echo "📦 Loaded Extensions:\\n";
        echo "   - SQLite3: " . (extension_loaded('sqlite3') ? '✅ YES' : '❌ NO') . "\\n";
        echo "   - PDO: " . (extension_loaded('pdo') ? '✅ YES' : '❌ NO') . "\\n";
        echo "   - PDO SQLite: " . (extension_loaded('pdo_sqlite') ? '✅ YES' : '❌ NO') . "\\n";
        echo "   - MySQLi: " . (extension_loaded('mysqli') ? '✅ YES' : '❌ NO') . "\\n";
        echo "   - PDO MySQL: " . (extension_loaded('pdo_mysql') ? '✅ YES' : '❌ NO') . "\\n\\n";
        
        echo "🗃️  PDO Drivers Available:\\n";
        print_r(PDO::getAvailableDrivers());
        echo "\\n";
        
        echo "🔍 SQLite3 Class: " . (class_exists('SQLite3') ? '✅ Available' : '❌ Not Found') . "\\n\\n";
        
        // Test SQLite3 functionality
        try {
            $db = new SQLite3(':memory:');
            echo "✅ SQLite3 test database created successfully!\\n";
            $db->close();
        } catch (Exception $e) {
            echo "❌ SQLite3 test failed: " . $e->getMessage() . "\\n";
        }
    `,
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
    console.log(output);

    if (errorOutput) {
        console.log("\n⚠️  Errors/Warnings:");
        console.log(errorOutput);
    }

    const allExtensionsOk =
        output.includes("SQLite3: ✅ YES") &&
        output.includes("PDO SQLite: ✅ YES") &&
        output.includes("SQLite3 Class: ✅ Available") &&
        output.includes("SQLite3 test database created successfully");

    if (allExtensionsOk) {
        console.log("\n🎉 SUCCESS! All required extensions are loaded!");
        console.log("\n📋 Next steps:");
        console.log("   1. Close PressBox completely");
        console.log("   2. Restart PressBox (npm run dev)");
        console.log("   3. Stop the bjit site");
        console.log("   4. Start the bjit site");
        console.log("   5. Open http://localhost:8000");
        console.log("   6. WordPress installation wizard should appear! 🚀");
    } else {
        console.log("\n❌ Some extensions are missing!");
        console.log("   Please check the output above.");
    }
});
