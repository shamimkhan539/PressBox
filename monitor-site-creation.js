// Test script to create a WordPress site and monitor the process
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs").promises;

async function testSiteCreation() {
    console.log("🧪 Testing WordPress Site Creation...\n");

    // First, let's check what happens in the actual PressBox directory
    const pressBoxPath = path.join(require("os").homedir(), "PressBox");
    console.log(`📁 PressBox directory: ${pressBoxPath}`);

    try {
        const exists = await fs
            .access(pressBoxPath)
            .then(() => true)
            .catch(() => false);
        console.log(`   Directory exists: ${exists ? "✅ YES" : "❌ NO"}`);

        if (exists) {
            const sitesPath = path.join(pressBoxPath, "sites");
            const sitesExist = await fs
                .access(sitesPath)
                .then(() => true)
                .catch(() => false);
            console.log(
                `   Sites directory exists: ${sitesExist ? "✅ YES" : "❌ NO"}`
            );

            if (sitesExist) {
                const sites = await fs.readdir(sitesPath);
                console.log(`   Existing sites: ${sites.length}`);
                sites.forEach((site) => console.log(`     - ${site}`));
            }
        }
    } catch (error) {
        console.error("   Error checking directories:", error.message);
    }

    console.log("\n🔍 Monitoring for changes...");
    console.log("   Go to the PressBox app and try to create a site");
    console.log("   I will check every 5 seconds for changes\n");

    let checkCount = 0;
    const maxChecks = 24; // 2 minutes

    const originalState = await getCurrentState();

    const interval = setInterval(async () => {
        checkCount++;
        console.log(
            `📊 Check ${checkCount}/${maxChecks} - ${new Date().toLocaleTimeString()}`
        );

        const currentState = await getCurrentState();
        const changes = compareStates(originalState, currentState);

        if (changes.length > 0) {
            console.log("🎉 CHANGES DETECTED:");
            changes.forEach((change) => console.log(`   ${change}`));

            // Check for running PHP processes
            await checkPHPProcesses();

            // Check for active ports
            await checkActivePorts();
        } else {
            console.log("   No changes detected");
        }

        if (checkCount >= maxChecks) {
            console.log("\n⏰ Monitoring timeout reached");
            clearInterval(interval);
        }
    }, 5000);
}

async function getCurrentState() {
    const state = {
        pressBoxExists: false,
        sitesExists: false,
        siteCount: 0,
        sites: [],
    };

    const pressBoxPath = path.join(require("os").homedir(), "PressBox");

    try {
        await fs.access(pressBoxPath);
        state.pressBoxExists = true;

        const sitesPath = path.join(pressBoxPath, "sites");
        try {
            await fs.access(sitesPath);
            state.sitesExists = true;

            const sites = await fs.readdir(sitesPath);
            state.siteCount = sites.length;
            state.sites = sites;
        } catch (e) {
            // Sites directory doesn't exist
        }
    } catch (e) {
        // PressBox directory doesn't exist
    }

    return state;
}

function compareStates(original, current) {
    const changes = [];

    if (original.pressBoxExists !== current.pressBoxExists) {
        changes.push(
            `PressBox directory: ${original.pressBoxExists ? "REMOVED" : "CREATED"}`
        );
    }

    if (original.sitesExists !== current.sitesExists) {
        changes.push(
            `Sites directory: ${original.sitesExists ? "REMOVED" : "CREATED"}`
        );
    }

    if (original.siteCount !== current.siteCount) {
        changes.push(
            `Site count: ${original.siteCount} → ${current.siteCount}`
        );
    }

    // Check for new sites
    const newSites = current.sites.filter(
        (site) => !original.sites.includes(site)
    );
    if (newSites.length > 0) {
        changes.push(`New sites: ${newSites.join(", ")}`);
    }

    return changes;
}

async function checkPHPProcesses() {
    try {
        const result = execSync('tasklist /fi "imagename eq php.exe" /fo csv', {
            encoding: "utf8",
        });
        if (result.includes("php.exe")) {
            console.log("   🐘 PHP processes running:");
            const lines = result
                .split("\n")
                .filter((line) => line.includes("php.exe"));
            lines.forEach((line) => {
                const parts = line.split(",");
                if (parts.length >= 2) {
                    console.log(`     PID: ${parts[1].replace(/"/g, "")}`);
                }
            });
        } else {
            console.log("   ❌ No PHP processes found");
        }
    } catch (error) {
        console.log("   ❌ Error checking PHP processes");
    }
}

async function checkActivePorts() {
    try {
        console.log("   🔌 Checking ports 8080-8085:");
        for (let port = 8080; port <= 8085; port++) {
            try {
                const result = execSync(`netstat -an | findstr :${port}`, {
                    encoding: "utf8",
                });
                if (result.trim()) {
                    console.log(`     Port ${port}: ✅ ACTIVE`);
                } else {
                    console.log(`     Port ${port}: ❌ FREE`);
                }
            } catch (e) {
                console.log(`     Port ${port}: ❌ FREE`);
            }
        }
    } catch (error) {
        console.log("   ❌ Error checking ports");
    }
}

testSiteCreation().catch(console.error);
