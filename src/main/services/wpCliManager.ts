import { spawn, ChildProcess } from "child_process";
import { promises as fs } from "fs";
import { join } from "path";
import { platform } from "os";

/**
 * WordPress CLI Manager
 *
 * Handles WP-CLI operations for local WordPress installations
 * Provides database management, plugin/theme operations, and more
 */
export class WPCLIManager {
    private static instance: WPCLIManager;
    private wpCliPath: string | null = null;
    private isInstalled: boolean = false;

    private constructor() {}

    public static getInstance(): WPCLIManager {
        if (!WPCLIManager.instance) {
            WPCLIManager.instance = new WPCLIManager();
        }
        return WPCLIManager.instance;
    }

    /**
     * Initialize WP-CLI manager and check installation
     */
    public async initialize(): Promise<void> {
        await this.detectWPCLI();
    }

    /**
     * Detect if WP-CLI is installed and get its path
     */
    private async detectWPCLI(): Promise<void> {
        try {
            const command = platform() === "win32" ? "where" : "which";
            const wpCliCommand = platform() === "win32" ? "wp.bat" : "wp";

            const result = await this.executeCommand(command, [wpCliCommand]);
            if (result.success && result.stdout.trim()) {
                this.wpCliPath = result.stdout.trim().split("\n")[0];
                this.isInstalled = true;
                console.log(`WP-CLI found at: ${this.wpCliPath}`);
            } else {
                this.isInstalled = false;
                console.log("WP-CLI not found on system PATH");
            }
        } catch (error) {
            console.error("Error detecting WP-CLI:", error);
            this.isInstalled = false;
        }
    }

    /**
     * Check if WP-CLI is available
     */
    public isWPCLIAvailable(): boolean {
        return this.isInstalled && this.wpCliPath !== null;
    }

    /**
     * Get WP-CLI installation instructions
     */
    public getInstallationInstructions(): string[] {
        const instructions = [
            "WP-CLI is not installed on your system.",
            "To install WP-CLI:",
            "",
        ];

        if (platform() === "win32") {
            instructions.push(
                "Windows:",
                "1. Download wp-cli.phar from https://wp-cli.org/",
                "2. Create a wp.bat file with: php wp-cli.phar %*",
                "3. Add the directory to your PATH",
                "",
                "Or use Composer:",
                "composer global require wp-cli/wp-cli"
            );
        } else if (platform() === "darwin") {
            instructions.push(
                "macOS:",
                "brew install wp-cli",
                "",
                "Or download directly:",
                "curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar",
                "chmod +x wp-cli.phar",
                "sudo mv wp-cli.phar /usr/local/bin/wp"
            );
        } else {
            instructions.push(
                "Linux:",
                "curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar",
                "chmod +x wp-cli.phar",
                "sudo mv wp-cli.phar /usr/local/bin/wp",
                "",
                "Or use package manager:",
                "Ubuntu/Debian: apt install wp-cli",
                "CentOS/RHEL: yum install wp-cli"
            );
        }

        return instructions;
    }

    /**
     * Execute WP-CLI command for a specific site
     */
    public async executeWPCommand(
        sitePath: string,
        command: string,
        args: string[] = []
    ): Promise<{ success: boolean; stdout: string; stderr: string }> {
        if (!this.isWPCLIAvailable()) {
            throw new Error("WP-CLI is not available on this system");
        }

        const wpCommand = platform() === "win32" ? "wp.bat" : "wp";
        const fullArgs = [command, ...args, `--path=${sitePath}`];

        return this.executeCommand(wpCommand, fullArgs);
    }

    /**
     * Install WordPress using WP-CLI
     */
    public async installWordPress(
        sitePath: string,
        config: {
            url: string;
            title: string;
            adminUser: string;
            adminPass: string;
            adminEmail: string;
        }
    ): Promise<boolean> {
        try {
            // Download WordPress core
            const downloadResult = await this.executeWPCommand(
                sitePath,
                "core",
                ["download", "--locale=en_US"]
            );

            if (!downloadResult.success) {
                console.error(
                    "Failed to download WordPress:",
                    downloadResult.stderr
                );
                return false;
            }

            // Create wp-config.php
            const configResult = await this.executeWPCommand(
                sitePath,
                "config",
                [
                    "create",
                    "--dbname=wordpress",
                    "--dbuser=root",
                    "--dbpass=",
                    "--dbhost=localhost",
                    "--skip-check",
                ]
            );

            if (!configResult.success) {
                console.error(
                    "Failed to create wp-config:",
                    configResult.stderr
                );
                return false;
            }

            // Install WordPress
            const installResult = await this.executeWPCommand(
                sitePath,
                "core",
                [
                    "install",
                    `--url=${config.url}`,
                    `--title=${config.title}`,
                    `--admin_user=${config.adminUser}`,
                    `--admin_password=${config.adminPass}`,
                    `--admin_email=${config.adminEmail}`,
                    "--skip-email",
                ]
            );

            if (!installResult.success) {
                console.error(
                    "Failed to install WordPress:",
                    installResult.stderr
                );
                return false;
            }

            return true;
        } catch (error) {
            console.error("Error installing WordPress with WP-CLI:", error);
            return false;
        }
    }

    /**
     * Get site info using WP-CLI
     */
    public async getSiteInfo(sitePath: string): Promise<any> {
        try {
            const result = await this.executeWPCommand(sitePath, "core", [
                "version",
                "--extra",
            ]);

            if (result.success) {
                return this.parseWPCLIOutput(result.stdout);
            }
        } catch (error) {
            console.error("Error getting site info:", error);
        }
        return null;
    }

    /**
     * Manage plugins using WP-CLI
     */
    public async managePlugin(
        sitePath: string,
        action: "install" | "activate" | "deactivate" | "delete",
        plugin: string
    ): Promise<boolean> {
        try {
            const result = await this.executeWPCommand(sitePath, "plugin", [
                action,
                plugin,
            ]);
            return result.success;
        } catch (error) {
            console.error(`Error ${action} plugin:`, error);
            return false;
        }
    }

    /**
     * Execute shell command and return result
     */
    private executeCommand(
        command: string,
        args: string[]
    ): Promise<{ success: boolean; stdout: string; stderr: string }> {
        return new Promise((resolve) => {
            let stdout = "";
            let stderr = "";

            const process = spawn(command, args, {
                stdio: ["ignore", "pipe", "pipe"],
                shell: true,
            });

            process.stdout?.on("data", (data) => {
                stdout += data.toString();
            });

            process.stderr?.on("data", (data) => {
                stderr += data.toString();
            });

            process.on("close", (code) => {
                resolve({
                    success: code === 0,
                    stdout,
                    stderr,
                });
            });

            process.on("error", (error) => {
                resolve({
                    success: false,
                    stdout,
                    stderr: error.message,
                });
            });
        });
    }

    /**
     * Parse WP-CLI output into structured data
     */
    private parseWPCLIOutput(output: string): any {
        const lines = output.trim().split("\n");
        const data: any = {};

        for (const line of lines) {
            const [key, ...valueParts] = line.split(":");
            if (key && valueParts.length > 0) {
                data[key.trim()] = valueParts.join(":").trim();
            }
        }

        return data;
    }
}
