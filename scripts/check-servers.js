#!/usr/bin/env node

/**
 * Server Status Checker
 *
 * This script checks what servers are actually running and on which ports
 */

const { exec } = require("child_process");
const net = require("net");
const fs = require("fs");
const path = require("path");
const os = require("os");

async function checkPortInUse(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(port, () => {
            server.close(() => resolve(false)); // Port is free
        });
        server.on("error", () => resolve(true)); // Port is in use
    });
}

async function getProcessOnPort(port) {
    return new Promise((resolve) => {
        const isWindows = process.platform === "win32";
        const command = isWindows
            ? `netstat -ano | findstr :${port}`
            : `lsof -i :${port}`;

        exec(command, (error, stdout) => {
            if (error) {
                resolve("Unknown");
                return;
            }

            if (isWindows) {
                const lines = stdout
                    .split("\n")
                    .filter((line) => line.includes(`:${port}`));
                if (lines.length > 0) {
                    const parts = lines[0].trim().split(/\s+/);
                    const pid = parts[parts.length - 1];
                    resolve(`PID: ${pid}`);
                } else {
                    resolve("Not found");
                }
            } else {
                resolve(stdout.trim() || "Not found");
            }
        });
    });
}

async function checkPHPInstallation() {
    return new Promise((resolve) => {
        exec("php --version", (error, stdout) => {
            if (error) {
                resolve({ installed: false, error: error.message });
            } else {
                const version = stdout.split("\n")[0];
                resolve({ installed: true, version });
            }
        });
    });
}

async function checkMySQLInstallation() {
    return new Promise((resolve) => {
        exec("mysql --version", (error, stdout) => {
            if (error) {
                resolve({ installed: false, error: error.message });
            } else {
                const version = stdout.trim();
                resolve({ installed: true, version });
            }
        });
    });
}

async function checkPressBoxSites() {
    const pressBoxPath = path.join(os.homedir(), "PressBox", "sites");

    if (!fs.existsSync(pressBoxPath)) {
        return { exists: false, sites: [] };
    }

    const sites = [];
    const siteDirs = fs.readdirSync(pressBoxPath);

    for (const siteDir of siteDirs) {
        const sitePath = path.join(pressBoxPath, siteDir);
        const configPath = path.join(sitePath, "pressbox.json");

        if (fs.existsSync(configPath)) {
            try {
                const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
                sites.push({
                    name: siteDir,
                    config: config,
                    path: sitePath,
                    hasWordPress: fs.existsSync(
                        path.join(sitePath, "wordpress", "wp-config.php")
                    ),
                });
            } catch (error) {
                sites.push({
                    name: siteDir,
                    error: "Invalid config file",
                    path: sitePath,
                });
            }
        }
    }

    return { exists: true, sites };
}

async function main() {
    console.log("🔍 PressBox Server Status Check\n");

    // Check PHP installation
    console.log("📝 PHP Installation:");
    const phpStatus = await checkPHPInstallation();
    if (phpStatus.installed) {
        console.log(`   ✅ PHP is installed: ${phpStatus.version}`);
    } else {
        console.log(`   ❌ PHP not found: ${phpStatus.error}`);
        console.log("   💡 Install PHP to run WordPress sites locally");
    }

    // Check MySQL installation
    console.log("\n🗄️  MySQL Installation:");
    const mysqlStatus = await checkMySQLInstallation();
    if (mysqlStatus.installed) {
        console.log(`   ✅ MySQL is installed: ${mysqlStatus.version}`);
    } else {
        console.log(`   ❌ MySQL not found: ${mysqlStatus.error}`);
        console.log("   💡 PressBox can use SQLite instead of MySQL");
    }

    // Check common ports for running servers
    console.log("\n🌐 Port Status Check:");
    const commonPorts = [3306, 8080, 8081, 8082, 8083, 8084, 8085, 3000, 3001];

    for (const port of commonPorts) {
        const inUse = await checkPortInUse(port);
        if (inUse) {
            const process = await getProcessOnPort(port);
            if (port === 3306) {
                console.log(
                    `   🗄️  Port ${port} (MySQL): ✅ IN USE - ${process}`
                );
            } else if (port >= 8080 && port <= 8085) {
                console.log(`   🐘 Port ${port} (PHP): ✅ IN USE - ${process}`);
            } else {
                console.log(`   📡 Port ${port}: ✅ IN USE - ${process}`);
            }
        } else {
            if (port === 3306) {
                console.log(`   🗄️  Port ${port} (MySQL): ❌ FREE`);
            } else if (port >= 8080 && port <= 8085) {
                console.log(`   🐘 Port ${port} (PHP): ❌ FREE`);
            } else {
                console.log(`   📡 Port ${port}: ❌ FREE`);
            }
        }
    }

    // Check PressBox sites
    console.log("\n📁 PressBox Sites:");
    const siteStatus = await checkPressBoxSites();

    if (!siteStatus.exists) {
        console.log("   ℹ️  No PressBox sites directory found");
        console.log("   💡 Create a site through the PressBox UI first");
    } else if (siteStatus.sites.length === 0) {
        console.log("   ℹ️  No sites found in PressBox directory");
        console.log("   💡 Create a site through the PressBox UI");
    } else {
        console.log(`   📋 Found ${siteStatus.sites.length} site(s):`);

        for (const site of siteStatus.sites) {
            if (site.error) {
                console.log(`     ❌ ${site.name}: ${site.error}`);
            } else {
                console.log(`     🌐 ${site.name}:`);
                console.log(
                    `        Domain: ${site.config.domain || "Not set"}`
                );
                console.log(
                    `        Port: ${site.config.port || "Not allocated"}`
                );
                console.log(
                    `        Status: ${site.config.status || "Unknown"}`
                );
                console.log(
                    `        WordPress: ${site.hasWordPress ? "✅ Installed" : "❌ Missing"}`
                );
                console.log(`        Path: ${site.path}`);

                // Check if the port is actually in use
                if (site.config.port) {
                    const portInUse = await checkPortInUse(site.config.port);
                    console.log(
                        `        Server: ${portInUse ? "✅ Running" : "❌ Not running"}`
                    );
                }
            }
        }
    }

    // Summary and recommendations
    console.log("\n📋 Summary:");

    if (!phpStatus.installed) {
        console.log("   🚨 CRITICAL: PHP is not installed");
        console.log("      Download PHP from: https://www.php.net/downloads");
        console.log("      Or install via package manager");
    }

    const anyPhpPortInUse = await Promise.all(
        [8080, 8081, 8082, 8083, 8084, 8085].map(checkPortInUse)
    );
    const hasRunningPhp = anyPhpPortInUse.some((inUse) => inUse);

    if (!hasRunningPhp) {
        console.log("   ⚠️  No PHP servers detected on common ports");
        console.log("      This means WordPress sites are not running");
    }

    const mysqlRunning = await checkPortInUse(3306);
    if (!mysqlRunning && mysqlStatus.installed) {
        console.log("   ⚠️  MySQL is installed but not running");
        console.log("      Start MySQL service or PressBox will use SQLite");
    }

    console.log("\n🛠️  Next Steps:");
    console.log("   1. Ensure PHP is installed and in PATH");
    console.log("   2. Create a WordPress site via PressBox UI");
    console.log("   3. Check if the site actually starts a PHP server");
    console.log("   4. Verify the site is accessible at the assigned URL");
}

main().catch(console.error);
