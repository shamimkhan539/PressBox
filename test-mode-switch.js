const { NonAdminMode } = require("./dist/main/services/nonAdminMode.js");

// Test switching to admin mode
console.log("Current mode:", NonAdminMode.isEnabled() ? "non-admin" : "admin");

// Switch to admin mode
NonAdminMode.disable();

// Check if it switched
console.log(
    "After disable():",
    NonAdminMode.isEnabled() ? "non-admin" : "admin"
);
