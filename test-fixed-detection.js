const fs = require("fs");
const path = require("path");

console.log("\n🔍 Testing FIXED Database Server Detection\n");

const programFiles = process.env.PROGRAMFILES || "C:\\Program Files";
const programFilesX86 =
    process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";

let servers = [];

// Scan Program Files for direct installations like "MariaDB 10.4"
console.log(`📁 Scanning ${programFiles} for MySQL/MariaDB installations...`);
const entries = fs.readdirSync(programFiles);

for (const entry of entries) {
    if (
        entry.toLowerCase().startsWith("mysql") ||
        entry.toLowerCase().startsWith("mariadb")
    ) {
        const fullPath = path.join(programFiles, entry);

        if (fs.statSync(fullPath).isDirectory()) {
            const binPath = path.join(fullPath, "bin");
            const mysqldPath = path.join(binPath, "mysqld.exe");
            const mariadbdPath = path.join(binPath, "mariadbd.exe");

            console.log(`\n   📂 Found: ${entry}`);
            console.log(
                `      Checking bin folder: ${fs.existsSync(binPath) ? "✅" : "❌"}`
            );
            console.log(
                `      mysqld.exe: ${fs.existsSync(mysqldPath) ? "✅ FOUND" : "❌"}`
            );
            console.log(
                `      mariadbd.exe: ${fs.existsSync(mariadbdPath) ? "✅ FOUND" : "❌"}`
            );

            if (fs.existsSync(mysqldPath) || fs.existsSync(mariadbdPath)) {
                const type = fs.existsSync(mariadbdPath) ? "mariadb" : "mysql";
                const versionMatch = entry.match(/(\d+\.\d+(?:\.\d+)?)/);
                const version = versionMatch ? versionMatch[1] : entry;

                servers.push({
                    type,
                    version,
                    path: fullPath,
                });

                console.log(`      🎯 DETECTED: ${type} ${version}`);
            }
        }
    }
}

console.log(`\n📊 Total servers detected: ${servers.length}`);
servers.forEach((s, i) => {
    console.log(`   ${i + 1}. ${s.type} ${s.version} at ${s.path}`);
});

console.log("\n");
