/**
 * File Logger for PressBox
 *
 * Comprehensive logging system that writes to files for debugging
 */

import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";

export class FileLogger {
    private logPath: string;
    private static instance: FileLogger;

    constructor(logFileName: string = "pressbox.log") {
        const logDir = path.join(os.homedir(), "PressBox", "logs");
        this.logPath = path.join(logDir, logFileName);
        this.ensureLogDirectory();
    }

    static getInstance(logFileName?: string): FileLogger {
        if (!FileLogger.instance) {
            FileLogger.instance = new FileLogger(logFileName);
        }
        return FileLogger.instance;
    }

    private async ensureLogDirectory(): Promise<void> {
        try {
            const logDir = path.dirname(this.logPath);
            await fs.mkdir(logDir, { recursive: true });
        } catch (error) {
            console.error("Failed to create log directory:", error);
        }
    }

    private formatMessage(level: string, message: string, data?: any): string {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level}]`;

        if (data) {
            return `${prefix} ${message} | Data: ${JSON.stringify(data, null, 2)}\n`;
        }
        return `${prefix} ${message}\n`;
    }

    async info(message: string, data?: any): Promise<void> {
        const logMessage = this.formatMessage("INFO", message, data);
        console.log(`ℹ️  ${message}`, data ? data : "");
        await this.writeLog(logMessage);
    }

    async error(message: string, error?: any): Promise<void> {
        const logMessage = this.formatMessage("ERROR", message, error);
        console.error(`❌ ${message}`, error ? error : "");
        await this.writeLog(logMessage);
    }

    async warn(message: string, data?: any): Promise<void> {
        const logMessage = this.formatMessage("WARN", message, data);
        console.warn(`⚠️  ${message}`, data ? data : "");
        await this.writeLog(logMessage);
    }

    async debug(message: string, data?: any): Promise<void> {
        const logMessage = this.formatMessage("DEBUG", message, data);
        console.log(`🐛 ${message}`, data ? data : "");
        await this.writeLog(logMessage);
    }

    async success(message: string, data?: any): Promise<void> {
        const logMessage = this.formatMessage("SUCCESS", message, data);
        console.log(`✅ ${message}`, data ? data : "");
        await this.writeLog(logMessage);
    }

    private async writeLog(message: string): Promise<void> {
        try {
            await fs.appendFile(this.logPath, message);
        } catch (error) {
            console.error("Failed to write to log file:", error);
        }
    }

    async clearLog(): Promise<void> {
        try {
            await fs.writeFile(this.logPath, "");
            console.log("📝 Log file cleared");
        } catch (error) {
            console.error("Failed to clear log file:", error);
        }
    }

    getLogPath(): string {
        return this.logPath;
    }

    async getLogContent(lines?: number): Promise<string> {
        try {
            const content = await fs.readFile(this.logPath, "utf8");
            if (lines) {
                const logLines = content.split("\n");
                return logLines.slice(-lines).join("\n");
            }
            return content;
        } catch (error) {
            return "Log file not found or empty";
        }
    }
}
