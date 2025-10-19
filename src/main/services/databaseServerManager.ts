import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { FileLogger } from "./fileLogger";

const logger = new FileLogger("DatabaseServerManager");

export interface DatabaseServerStatus {
    type: "mysql" | "mariadb";
    version: string;
    isRunning: boolean;
    port: number;
    processId?: number;
    installPath?: string;
    dataPath?: string;
    configPath?: string;
}

export interface DatabaseServerConfig {
    type: "mysql" | "mariadb";
    version: string;
    port: number;
    installPath?: string;
    dataPath?: string;
    configPath?: string;
}

export class DatabaseServerManager {
    private runningServers: Map<string, ChildProcess> = new Map();
    private serverStatuses: Map<string, DatabaseServerStatus> = new Map();

    /**
     * Get common MySQL/MariaDB installation paths for Windows
     */
    private getCommonInstallPaths(): string[] {
        const programFiles = process.env.PROGRAMFILES || "C:\\Program Files";
        const programFilesX86 =
            process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
        const userProfile = process.env.USERPROFILE || "";

        return [
            path.join(programFiles, "MySQL"),
            path.join(programFilesX86, "MySQL"),
            path.join(programFiles, "MariaDB"),
            path.join(programFilesX86, "MariaDB"),
            path.join(userProfile, "AppData", "Local", "MySQL"),
            path.join(userProfile, "AppData", "Local", "MariaDB"),
            "C:\\xampp\\mysql",
            "C:\\wamp\\bin\\mysql",
            "C:\\wamp64\\bin\\mysql",
        ];
    }

    /**
     * Find installed MySQL/MariaDB versions
     */
    async findInstalledServers(): Promise<DatabaseServerConfig[]> {
        const servers: DatabaseServerConfig[] = [];
        const installPaths = this.getCommonInstallPaths();

        for (const basePath of installPaths) {
            if (!fs.existsSync(basePath)) continue;

            try {
                const entries = fs.readdirSync(basePath);

                for (const entry of entries) {
                    const fullPath = path.join(basePath, entry);

                    // Check if it's a version directory (e.g., MySQL Server 8.0)
                    if (fs.statSync(fullPath).isDirectory()) {
                        const binPath = path.join(fullPath, "bin");
                        const mysqldPath = path.join(binPath, "mysqld.exe");
                        const mariadbdPath = path.join(binPath, "mariadbd.exe");

                        let serverType: "mysql" | "mariadb" | null = null;
                        let executablePath: string | null = null;

                        if (fs.existsSync(mysqldPath)) {
                            serverType = "mysql";
                            executablePath = mysqldPath;
                        } else if (fs.existsSync(mariadbdPath)) {
                            serverType = "mariadb";
                            executablePath = mariadbdPath;
                        }

                        if (serverType && executablePath) {
                            // Extract version from directory name
                            const versionMatch =
                                entry.match(/(\d+\.\d+(?:\.\d+)?)/);
                            const version = versionMatch
                                ? versionMatch[1]
                                : entry;

                            servers.push({
                                type: serverType,
                                version: version,
                                port: serverType === "mysql" ? 3306 : 3307, // Default ports
                                installPath: fullPath,
                                dataPath: path.join(fullPath, "data"),
                                configPath: path.join(fullPath, "my.ini"),
                            });
                        }
                    }
                }
            } catch (error) {
                logger.warn(`Error scanning ${basePath}:`, error);
            }
        }

        return servers;
    }

    /**
     * Check if a database server is running on a specific port
     */
    async checkServerStatus(
        type: "mysql" | "mariadb",
        port: number
    ): Promise<boolean> {
        try {
            const mysql = await import("mysql2/promise");
            const connection = await mysql.createConnection({
                host: "localhost",
                port: port,
                user: "root",
                password: "",
                connectTimeout: 2000, // 2 second timeout
            });
            await connection.end();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get status of all installed database servers
     */
    async getAllServerStatuses(): Promise<DatabaseServerStatus[]> {
        const installedServers = await this.findInstalledServers();
        const statuses: DatabaseServerStatus[] = [];

        for (const server of installedServers) {
            const isRunning = await this.checkServerStatus(
                server.type,
                server.port
            );

            statuses.push({
                type: server.type,
                version: server.version,
                isRunning: isRunning,
                port: server.port,
                installPath: server.installPath,
                dataPath: server.dataPath,
                configPath: server.configPath,
                processId: isRunning ? this.getProcessId(server) : undefined,
            });
        }

        // Update cached statuses
        for (const status of statuses) {
            const key = `${status.type}-${status.version}-${status.port}`;
            this.serverStatuses.set(key, status);
        }

        return statuses;
    }

    /**
     * Get process ID for a running server
     */
    private getProcessId(server: DatabaseServerConfig): number | undefined {
        try {
            const { execSync } = require("child_process");
            const output = execSync(`netstat -ano | findstr :${server.port}`, {
                encoding: "utf8",
            });
            const lines = output.split("\n");

            for (const line of lines) {
                if (
                    line.includes(`:${server.port}`) &&
                    line.includes("LISTENING")
                ) {
                    const parts = line.trim().split(/\s+/);
                    const pid = parseInt(parts[parts.length - 1]);
                    if (!isNaN(pid)) return pid;
                }
            }
        } catch (error) {
            // Process not found or command failed
        }
        return undefined;
    }

    /**
     * Start a database server
     */
    async startServer(
        server: DatabaseServerConfig
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const key = `${server.type}-${server.version}-${server.port}`;

            // Check if already running
            if (await this.checkServerStatus(server.type, server.port)) {
                return { success: true };
            }

            // Ensure data directory exists
            if (server.dataPath && !fs.existsSync(server.dataPath)) {
                fs.mkdirSync(server.dataPath, { recursive: true });
                logger.info(`Created data directory: ${server.dataPath}`);
            }

            // Start the server process
            const executable =
                server.type === "mysql" ? "mysqld.exe" : "mariadbd.exe";
            const exePath = path.join(server.installPath!, "bin", executable);

            if (!fs.existsSync(exePath)) {
                return {
                    success: false,
                    error: `Executable not found: ${exePath}`,
                };
            }

            const args = [
                "--port=" + server.port,
                "--datadir=" +
                    (server.dataPath || path.join(server.installPath!, "data")),
                "--basedir=" + server.installPath!,
            ];

            if (server.configPath && fs.existsSync(server.configPath)) {
                args.push("--defaults-file=" + server.configPath);
            }

            logger.info(
                `Starting ${server.type} ${server.version} on port ${server.port}`
            );
            logger.info(`Command: ${exePath} ${args.join(" ")}`);

            const process = spawn(exePath, args, {
                detached: true,
                stdio: ["ignore", "pipe", "pipe"],
                cwd: server.installPath,
            });

            // Store the process
            this.runningServers.set(key, process);

            // Wait for server to start (up to 30 seconds)
            let attempts = 0;
            while (attempts < 30) {
                await new Promise((resolve) => setTimeout(resolve, 1000));

                if (await this.checkServerStatus(server.type, server.port)) {
                    logger.info(
                        `${server.type} ${server.version} started successfully on port ${server.port}`
                    );
                    return { success: true };
                }

                attempts++;
            }

            // If we get here, server failed to start
            process.kill();
            this.runningServers.delete(key);

            return {
                success: false,
                error: "Server failed to start within 30 seconds",
            };
        } catch (error: any) {
            logger.error(`Failed to start ${server.type} server:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Stop a database server
     */
    async stopServer(
        server: DatabaseServerConfig
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const key = `${server.type}-${server.version}-${server.port}`;

            // Check if running
            if (!(await this.checkServerStatus(server.type, server.port))) {
                return { success: true }; // Already stopped
            }

            // Try graceful shutdown first
            try {
                const mysql = await import("mysql2/promise");
                const connection = await mysql.createConnection({
                    host: "localhost",
                    port: server.port,
                    user: "root",
                    password: "",
                    connectTimeout: 2000,
                });

                await connection.execute("SHUTDOWN");
                await connection.end();

                // Wait for shutdown
                let attempts = 0;
                while (attempts < 10) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    if (
                        !(await this.checkServerStatus(
                            server.type,
                            server.port
                        ))
                    ) {
                        break;
                    }
                    attempts++;
                }
            } catch (error) {
                logger.warn(`Graceful shutdown failed, forcing kill:`, error);
            }

            // Force kill if still running
            const process = this.runningServers.get(key);
            if (process) {
                process.kill("SIGTERM");
                this.runningServers.delete(key);
            }

            // Also try to kill by port
            const pid = this.getProcessId(server);
            if (pid) {
                try {
                    const { spawn } = require("child_process");
                    const killProcess = spawn(
                        "taskkill",
                        ["/PID", pid.toString(), "/T", "/F"],
                        {
                            stdio: "inherit",
                        }
                    );
                    killProcess.on("close", (code: number) => {
                        logger.info(
                            `Killed process ${pid} with exit code ${code}`
                        );
                    });
                } catch (error) {
                    // Process might already be dead
                }
            }

            logger.info(
                `${server.type} ${server.version} stopped on port ${server.port}`
            );
            return { success: true };
        } catch (error: any) {
            logger.error(`Failed to stop ${server.type} server:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Initialize database server (create data directory, config, etc.)
     */
    async initializeServer(
        server: DatabaseServerConfig
    ): Promise<{ success: boolean; error?: string }> {
        try {
            // Ensure data directory exists
            if (!server.dataPath) {
                server.dataPath = path.join(server.installPath!, "data");
            }

            if (!fs.existsSync(server.dataPath)) {
                fs.mkdirSync(server.dataPath, { recursive: true });
                logger.info(`Created data directory: ${server.dataPath}`);
            }

            // Create basic config file if it doesn't exist
            if (!server.configPath) {
                server.configPath = path.join(server.installPath!, "my.ini");
            }

            if (!fs.existsSync(server.configPath)) {
                const configContent = `[mysqld]
port=${server.port}
datadir=${server.dataPath}
basedir=${server.installPath}
bind-address=127.0.0.1
`;

                fs.writeFileSync(server.configPath, configContent);
                logger.info(`Created config file: ${server.configPath}`);
            }

            return { success: true };
        } catch (error: any) {
            logger.error(`Failed to initialize ${server.type} server:`, error);
            return { success: false, error: error.message };
        }
    }
}
