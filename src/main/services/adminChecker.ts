import * as os from "os";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import * as path from "path";

/**
 * Admin Privilege Checker Service
 *
 * Checks and validates administrator/root privileges required for
 * system file modifications (hosts file, etc.)
 */
export class AdminChecker {
    /**
     * Check if the application is running with administrator privileges
     */
    static async checkAdminPrivileges(): Promise<{
        isAdmin: boolean;
        canModifyHosts: boolean;
        platform: string;
        error?: string;
    }> {
        const platform = os.platform();

        try {
            if (platform === "win32") {
                return await this.checkWindowsAdmin();
            } else if (platform === "darwin" || platform === "linux") {
                return await this.checkUnixAdmin();
            } else {
                return {
                    isAdmin: false,
                    canModifyHosts: false,
                    platform,
                    error: `Unsupported platform: ${platform}`,
                };
            }
        } catch (error) {
            return {
                isAdmin: false,
                canModifyHosts: false,
                platform,
                error: `Failed to check admin privileges: ${error}`,
            };
        }
    }

    /**
     * Check Windows administrator privileges
     */
    private static async checkWindowsAdmin(): Promise<{
        isAdmin: boolean;
        canModifyHosts: boolean;
        platform: string;
        error?: string;
    }> {
        return new Promise((resolve) => {
            // Try to run 'net session' command which requires admin privileges
            const child = spawn("net", ["session"], {
                stdio: "pipe",
                shell: true,
            });

            child.on("exit", async (code) => {
                const isAdmin = code === 0;
                let canModifyHosts = false;
                let error: string | undefined;

                if (isAdmin) {
                    // Test if we can actually modify the hosts file
                    try {
                        canModifyHosts = await this.testHostsFileAccess();
                    } catch (err) {
                        error = `Admin privileges detected but cannot modify hosts file: ${err}`;
                        canModifyHosts = false;
                    }
                } else {
                    error =
                        "PressBox requires administrator privileges to modify the hosts file for local domain registration.";
                }

                resolve({
                    isAdmin,
                    canModifyHosts,
                    platform: "win32",
                    error,
                });
            });

            child.on("error", () => {
                resolve({
                    isAdmin: false,
                    canModifyHosts: false,
                    platform: "win32",
                    error: "Failed to check Windows administrator status",
                });
            });
        });
    }

    /**
     * Check Unix/Linux/macOS root/sudo privileges
     */
    private static async checkUnixAdmin(): Promise<{
        isAdmin: boolean;
        canModifyHosts: boolean;
        platform: string;
        error?: string;
    }> {
        const platform = os.platform();
        const isRoot = !!(process.getuid && process.getuid() === 0);
        let canModifyHosts = false;
        let error: string | undefined;

        if (isRoot) {
            try {
                canModifyHosts = await this.testHostsFileAccess();
            } catch (err) {
                error = `Root privileges detected but cannot modify hosts file: ${err}`;
            }
        } else {
            error =
                "PressBox requires root/sudo privileges to modify the hosts file for local domain registration.";
        }

        return {
            isAdmin: isRoot,
            canModifyHosts,
            platform,
            error,
        };
    }

    /**
     * Test if we can actually read/write the hosts file
     */
    private static async testHostsFileAccess(): Promise<boolean> {
        const hostsPath =
            os.platform() === "win32"
                ? "C:\\Windows\\System32\\drivers\\etc\\hosts"
                : "/etc/hosts";

        try {
            // Try to read the hosts file
            await fs.access(hostsPath, fs.constants.R_OK);

            // Try to check write access (without actually modifying)
            await fs.access(hostsPath, fs.constants.W_OK);

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get instructions for elevating privileges
     */
    static getElevationInstructions(): {
        windows: string[];
        macos: string[];
        linux: string[];
    } {
        return {
            windows: [
                "1. Close PressBox completely",
                "2. Right-click on the PressBox shortcut or executable",
                "3. Select 'Run as administrator'",
                "4. Click 'Yes' when prompted by Windows User Account Control",
                "5. PressBox will now have the necessary permissions to modify system files",
            ],
            macos: [
                "1. Close PressBox completely",
                "2. Open Terminal application",
                "3. Run: sudo /Applications/PressBox.app/Contents/MacOS/PressBox",
                "4. Enter your administrator password when prompted",
                "5. PressBox will now have the necessary permissions to modify system files",
            ],
            linux: [
                "1. Close PressBox completely",
                "2. Open terminal",
                "3. Run: sudo pressbox (or the path to your PressBox executable)",
                "4. Enter your sudo password when prompted",
                "5. PressBox will now have the necessary permissions to modify system files",
            ],
        };
    }

    /**
     * Request elevation (Windows only)
     */
    static async requestElevation(): Promise<boolean> {
        if (os.platform() !== "win32") {
            return false;
        }

        return new Promise((resolve) => {
            try {
                const { spawn } = require("child_process");
                const path = require("path");

                // Get the current executable path
                const exePath = process.execPath;

                // Spawn a new process with elevated privileges
                const child = spawn(
                    "powershell",
                    ["Start-Process", `"${exePath}"`, "-Verb", "runAs"],
                    {
                        stdio: "ignore",
                        detached: true,
                    }
                );

                child.on("exit", (code: number | null) => {
                    resolve(code === 0);
                });

                child.on("error", () => {
                    resolve(false);
                });

                // Exit the current process to allow the elevated one to take over
                setTimeout(() => {
                    process.exit(0);
                }, 1000);
            } catch {
                resolve(false);
            }
        });
    }
}
