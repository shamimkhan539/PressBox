#!/usr/bin/env node

/**
 * Port Cleanup Script for PressBox
 *
 * This script cleans up development ports to prevent conflicts
 */

const PortManager = require("./port-manager.js");

async function cleanupPorts() {
    const portManager = new PortManager();
    await portManager.cleanup();
}

// Run cleanup
cleanupPorts().catch((error) => {
    console.error("❌ Failed to cleanup ports:", error);
    process.exit(1);
});
