const fs = require("fs");
const path = require("path");

const sitesPath = path.join(require("os").homedir(), "PressBox", "sites");
const siteName = "bjit";
const configPath = path.join(sitesPath, siteName, "pressbox-config.json");

console.log(`Checking site config at: ${configPath}`);

try {
    if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, "utf-8");
        const config = JSON.parse(configData);
        console.log("Site configuration:");
        console.log(JSON.stringify(config, null, 2));
        console.log(`Site path in config: ${config.path}`);
    } else {
        console.log("No config file found");
    }
} catch (error) {
    console.error("Error reading config:", error.message);
}
