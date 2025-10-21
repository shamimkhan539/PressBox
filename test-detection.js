const fs = require("fs");
const path = require("path");

console.log(
    "\n🔍 Testing Database Server Detection (Simulating PressBox Logic)\n"
);

const programFiles = process.env.PROGRAMFILES || "C:\\Program Files";
const programFilesX86 =
    process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";

const paths = [
    path.join(programFiles, "MySQL"),
    path.join(programFilesX86, "MySQL"),
    path.join(programFiles, "MariaDB"),
    path.join(programFilesX86, "MariaDB"),
];

console.log("Scanning paths:");

let found = 0;

for (const basePath of paths) {
    console.log(`\n📁 Checking: ${basePath}`);

    if (!fs.existsSync(basePath)) {
        console.log(`   ❌ Path does not exist`);
        continue;
    }

    console.log(`   ✅ Path exists!`);

    const entries = fs.readdirSync(basePath);
    console.log(`   📂 Found ${entries.length} entries`);

    for (const entry of entries) {
        const fullPath = path.join(basePath, entry);

        if (fs.statSync(fullPath).isDirectory()) {
            console.log(`\n   📁 Checking directory: ${entry}`);

            const binPath = path.join(fullPath, "bin");
            const mysqldPath = path.join(binPath, "mysqld.exe");
            const mariadbdPath = path.join(binPath, "mariadbd.exe");

            console.log(
                `      Checking for mysqld.exe: ${fs.existsSync(mysqldPath) ? "✅" : "❌"}`
            );
            console.log(
                `      Checking for mariadbd.exe: ${fs.existsSync(mariadbdPath) ? "✅" : "❌"}`
            );

            if (fs.existsSync(mysqldPath) || fs.existsSync(mariadbdPath)) {
                found++;
                const type = fs.existsSync(mariadbdPath) ? "mariadb" : "mysql";
                const version =
                    entry.match(/(\d+\.\d+(?:\.\d+)?)/)?.[1] || entry;

                console.log(`      🎯 FOUND: ${type} ${version}`);
                console.log(`      📍 Path: ${fullPath}`);
            }
        }
    }
}

console.log(`\n📊 Total servers found: ${found}\n`);
