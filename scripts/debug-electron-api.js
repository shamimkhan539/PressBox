#!/usr/bin/env node

/**
 * Debug Electron API Availability
 *
 * This script will help us understand what's available in the renderer process
 */

// Add debug script to renderer that will log the electronAPI object
const debugScript = `
console.log('=== ELECTRON API DEBUG ===');
console.log('window.electronAPI:', window.electronAPI);

if (window.electronAPI) {
    console.log('electronAPI keys:', Object.keys(window.electronAPI));
    
    if (window.electronAPI.system) {
        console.log('system API keys:', Object.keys(window.electronAPI.system));
        console.log('checkAdmin function:', typeof window.electronAPI.system.checkAdmin);
    } else {
        console.log('❌ system API is missing!');
    }
    
    if (window.electronAPI.sites) {
        console.log('sites API keys:', Object.keys(window.electronAPI.sites));
    } else {
        console.log('❌ sites API is missing!');
    }
} else {
    console.log('❌ electronAPI is completely missing!');
}
console.log('=== END DEBUG ===');
`;

console.log("🔍 Electron API Debug Script");
console.log("Add this to your browser dev console when PressBox is running:\n");
console.log(debugScript);
console.log(
    "\nThis will help us see what APIs are actually available in the renderer process."
);
console.log("\nTo access dev console:");
console.log("1. Open PressBox application");
console.log("2. Press Ctrl+Shift+I (or Cmd+Option+I on Mac)");
console.log("3. Go to Console tab");
console.log("4. Paste and run the debug script");
console.log("5. Check the output to see what APIs are available");

console.log("\n🔧 Alternative: Force rebuild preload script");
console.log("Run: npm run fix:preload && npm run dev");
