const {
    WordPressManager,
} = require("./dist/main/main/services/wordpressManager");
const { DockerManager } = require("./dist/main/main/services/dockerManager");
const {
    EnvironmentManager,
} = require("./dist/main/main/services/environmentManager");

async function startSite() {
    try {
        console.log("Starting bjit site...");

        // Initialize managers
        const dockerManager = DockerManager.getInstance();
        const environmentManager = new EnvironmentManager(dockerManager, null);
        const wordpressManager = new WordPressManager(
            environmentManager,
            dockerManager,
            null,
            null,
            null,
            null
        );

        // Start the site
        await wordpressManager.startSite("bjit");

        console.log("Site started successfully!");
    } catch (error) {
        console.error("Failed to start site:", error);
    }
}

startSite();
