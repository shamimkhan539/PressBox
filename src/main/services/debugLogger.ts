// Enhanced logging for SimpleWordPressManager debugging
import {
    promises as fs,
    existsSync,
    mkdirSync,
    appendFileSync,
    writeFileSync,
} from "fs";
import * as path from "path";
import * as os from "os";

export class DebugLogger {
    private logFile: string;

    constructor() {
        this.logFile = path.join(os.homedir(), "PressBox", "debug.log");
        this.ensureLogDir();
    }

    ensureLogDir() {
        const logDir = path.dirname(this.logFile);
        if (!existsSync(logDir)) {
            mkdirSync(logDir, { recursive: true });
        }
    }

    log(message: string, data: any = null) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        const fullMessage = data
            ? `${logMessage}\n  Data: ${JSON.stringify(data, null, 2)}\n`
            : `${logMessage}\n`;

        console.log(message, data || "");

        try {
            appendFileSync(this.logFile, fullMessage);
        } catch (error) {
            console.error("Failed to write to log file:", error);
        }
    }

    error(message: string, error: any = null) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ❌ ${message}`;
        const fullMessage = error
            ? `${logMessage}\n  Error: ${error.stack || error.message || error}\n`
            : `${logMessage}\n`;

        console.error(message, error || "");

        try {
            appendFileSync(this.logFile, fullMessage);
        } catch (err) {
            console.error("Failed to write error to log file:", err);
        }
    }

    clearLog() {
        try {
            writeFileSync(this.logFile, "=== PressBox Debug Log Started ===\n");
        } catch (error) {
            console.error("Failed to clear log file:", error);
        }
    }
}
