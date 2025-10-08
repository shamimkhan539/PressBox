#!/usr/bin/env node

/**
 * PressBox Development Server Startup Script
 *
 * This script manages port allocation and starts the development servers
 * with proper cleanup handling.
 */

const { spawn } = require("child_process");
const PortManager = require("./port-manager.js");

class DevServerManager {
    constructor() {
        this.portManager = new PortManager();
        this.processes = [];
        this.setupCleanup();
    }

    async start() {
        console.log("🚀 Starting PressBox Development Environment...");

        try {
            // Setup port management and cleanup
            this.portManager.setupCleanup();

            // Get available port for Vite
            const availablePort = await this.portManager.getAvailablePort();

            // Update Vite config with the available port
            process.env.VITE_PORT = availablePort.toString();

            // Start Vite dev server with the allocated port
            const viteProcess = spawn(
                "npx",
                ["vite", "--port", availablePort.toString(), "--host"],
                {
                    stdio: "pipe",
                    shell: true,
                    cwd: process.cwd(),
                }
            );

            // Start Electron
            const electronProcess = spawn(
                "npx",
                [
                    "cross-env",
                    "NODE_ENV=development",
                    "electron-forge",
                    "start",
                ],
                {
                    stdio: "pipe",
                    shell: true,
                    cwd: process.cwd(),
                }
            );

            // Store processes for cleanup
            this.processes = [viteProcess, electronProcess];

            // Handle Vite output
            viteProcess.stdout.on("data", (data) => {
                const output = data.toString();
                process.stdout.write(`[VITE] ${output}`);
            });

            viteProcess.stderr.on("data", (data) => {
                const output = data.toString();
                if (!output.includes("deprecated")) {
                    // Filter out deprecation warnings
                    process.stderr.write(`[VITE] ${output}`);
                }
            });

            // Handle Electron output
            electronProcess.stdout.on("data", (data) => {
                const output = data.toString();
                process.stdout.write(`[ELECTRON] ${output}`);
            });

            electronProcess.stderr.on("data", (data) => {
                const output = data.toString();
                if (!output.includes("deprecated")) {
                    // Filter out deprecation warnings
                    process.stderr.write(`[ELECTRON] ${output}`);
                }
            });

            // Handle process exits
            viteProcess.on("close", (code) => {
                if (code !== 0) {
                    console.error(`❌ Vite process exited with code ${code}`);
                }
                this.cleanup();
            });

            electronProcess.on("close", (code) => {
                if (code !== 0) {
                    console.error(
                        `❌ Electron process exited with code ${code}`
                    );
                }
                this.cleanup();
            });
        } catch (error) {
            console.error("❌ Failed to start development environment:", error);
            this.cleanup();
            process.exit(1);
        }
    }

    cleanup() {
        console.log("🧹 Cleaning up development environment...");

        // Kill all spawned processes
        this.processes.forEach((proc, index) => {
            if (proc && !proc.killed) {
                console.log(`🛑 Terminating process ${index + 1}...`);
                proc.kill("SIGTERM");

                // Force kill after 5 seconds if not terminated
                setTimeout(() => {
                    if (!proc.killed) {
                        proc.kill("SIGKILL");
                    }
                }, 5000);
            }
        });

        // Clean up port manager
        this.portManager.cleanup();
    }

    setupCleanup() {
        const cleanup = () => {
            this.cleanup();
            process.exit(0);
        };

        // Handle various exit scenarios
        process.on("SIGINT", cleanup); // Ctrl+C
        process.on("SIGTERM", cleanup); // Termination signal
        process.on("exit", cleanup); // Normal exit
        process.on("uncaughtException", (error) => {
            console.error("❌ Uncaught Exception:", error);
            cleanup();
        });
        process.on("unhandledRejection", (reason) => {
            console.error("❌ Unhandled Rejection:", reason);
            cleanup();
        });
    }
}

// Start the development environment
const devManager = new DevServerManager();
devManager.start().catch((error) => {
    console.error("❌ Failed to start:", error);
    process.exit(1);
});
