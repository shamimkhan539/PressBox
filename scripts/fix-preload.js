#!/usr/bin/env node

/**
 * Fix Preload Script Build Issue
 *
 * There's an issue with the TypeScript compilation that truncates the preload script.
 * This script manually compiles the preload script correctly.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔧 Fixing preload script compilation...");

try {
    // Ensure dist directories exist
    const distPreloadDir = path.join(
        __dirname,
        "..",
        "dist",
        "main",
        "preload"
    );
    if (!fs.existsSync(distPreloadDir)) {
        fs.mkdirSync(distPreloadDir, { recursive: true });
    }

    // Compile preload script directly
    const tscCmd = [
        "npx tsc",
        "src/preload/preload.ts",
        "--outDir dist/main",
        "--target ES2020",
        "--module CommonJS",
        "--moduleResolution node",
        "--esModuleInterop",
        "--allowSyntheticDefaultImports",
        "--skipLibCheck",
        "--declaration false",
        "--strict false",
    ].join(" ");

    console.log("📝 Compiling preload script...");
    execSync(tscCmd, { stdio: "inherit", cwd: path.join(__dirname, "..") });

    // Verify the compilation was successful
    const preloadPath = path.join(
        __dirname,
        "..",
        "dist",
        "main",
        "preload",
        "preload.js"
    );
    if (fs.existsSync(preloadPath)) {
        const content = fs.readFileSync(preloadPath, "utf8");
        if (content.includes("system:") && content.includes("checkAdmin")) {
            console.log("✅ Preload script fixed successfully!");
            console.log(`📁 File size: ${content.length} bytes`);
        } else {
            console.error("❌ Preload script still missing system API");
            process.exit(1);
        }
    } else {
        console.error("❌ Preload script not found after compilation");
        process.exit(1);
    }
} catch (error) {
    console.error("❌ Failed to fix preload script:", error);
    process.exit(1);
}
