const killPort = require("kill-port");
const fs = require("fs");
const path = require("path");
const os = require("os");

/**
 * Simple Port Cleanup Utility for PressBox
 *
 * Handles port cleanup to prevent port conflicts
 */
class PortManager {
    constructor() {
        this.commonPorts = [3000, 3001, 3002, 3003, 5173]; // Common dev server ports
    }

    /**
     * Kill processes on common development ports
     */
    async cleanup() {
        console.log("🧹 Cleaning up development ports...");

        for (const port of this.commonPorts) {
            try {
                await killPort(port);
                console.log(`✅ Freed port ${port}`);
            } catch (error) {
                // Port might not be in use, which is fine
                if (!error.message.includes("No process running")) {
                    console.log(`ℹ️  Port ${port} was already free`);
                }
            }
        }

        console.log("✨ Port cleanup complete");
    }

    /**
     * Setup process cleanup handlers for graceful shutdown
     */
    setupGracefulShutdown() {
        const gracefulShutdown = async () => {
            console.log(
                "\n🛑 Shutting down PressBox development environment..."
            );
            await this.cleanup();
            process.exit(0);
        };

        // Handle various exit scenarios
        process.on("SIGINT", gracefulShutdown); // Ctrl+C
        process.on("SIGTERM", gracefulShutdown); // Termination signal

        // Handle uncaught exceptions
        process.on("uncaughtException", async (error) => {
            console.error("❌ Uncaught Exception:", error);
            await gracefulShutdown();
        });

        process.on("unhandledRejection", async (reason) => {
            console.error("❌ Unhandled Rejection:", reason);
            await gracefulShutdown();
        });
    }
}

module.exports = PortManager;
