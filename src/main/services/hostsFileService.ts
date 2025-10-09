import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";

interface HostEntry {
    ip: string;
    hostname: string;
    comment: string;
    enabled: boolean;
    isWordPress: boolean;
    siteId?: string;
}

/**
 * Windows Hosts File Manager Service
 *
 * Manages Windows hosts file entries for local WordPress development
 */
export class HostsFileService {
    private static readonly HOSTS_PATH = path.join(
        os.platform() === "win32"
            ? "C:\\Windows\\System32\\drivers\\etc\\hosts"
            : "/etc/hosts"
    );

    private static readonly BACKUP_PATH = path.join(
        os.homedir(),
        ".pressbox",
        "hosts-backup"
    );
    private static readonly PRESSBOX_MARKER_START =
        "# PressBox WordPress Sites - START";
    private static readonly PRESSBOX_MARKER_END =
        "# PressBox WordPress Sites - END";

    /**
     * Read and parse the hosts file
     */
    static async readHostsFile(): Promise<HostEntry[]> {
        try {
            const content = await fs.readFile(this.HOSTS_PATH, "utf8");
            return this.parseHostsContent(content);
        } catch (error) {
            console.error("Failed to read hosts file:", error);
            throw new Error(
                "Unable to read hosts file. Make sure PressBox is running as administrator."
            );
        }
    }

    /**
     * Parse hosts file content into entries
     */
    private static parseHostsContent(content: string): HostEntry[] {
        const entries: HostEntry[] = [];
        const lines = content.split("\n");
        let inPressBoxSection = false;

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Check for PressBox section markers
            if (trimmedLine === this.PRESSBOX_MARKER_START) {
                inPressBoxSection = true;
                continue;
            }

            if (trimmedLine === this.PRESSBOX_MARKER_END) {
                inPressBoxSection = false;
                continue;
            }

            // Skip empty lines and pure comments
            if (!trimmedLine || trimmedLine.startsWith("#")) {
                continue;
            }

            // Parse entry
            const entry = this.parseHostLine(trimmedLine, inPressBoxSection);
            if (entry) {
                entries.push(entry);
            }
        }

        return entries;
    }

    /**
     * Parse a single hosts file line
     */
    private static parseHostLine(
        line: string,
        isPressBoxManaged: boolean
    ): HostEntry | null {
        // Handle disabled entries (commented out)
        const isDisabled = line.startsWith("#");
        const actualLine = isDisabled ? line.substring(1).trim() : line;

        // Split by whitespace and comments
        const commentIndex = actualLine.indexOf("#");
        const hostPart =
            commentIndex >= 0
                ? actualLine.substring(0, commentIndex)
                : actualLine;
        const comment =
            commentIndex >= 0
                ? actualLine.substring(commentIndex + 1).trim()
                : "";

        const parts = hostPart.trim().split(/\s+/);
        if (parts.length < 2) {
            return null;
        }

        const [ip, hostname] = parts;

        // Check if it's a WordPress site based on comment or hostname pattern
        const isWordPress =
            isPressBoxManaged ||
            comment.toLowerCase().includes("pressbox") ||
            comment.toLowerCase().includes("wordpress") ||
            hostname.endsWith(".local") ||
            hostname.endsWith(".dev") ||
            hostname.endsWith(".test");

        // Extract site ID from comment if present
        const siteIdMatch = comment.match(/PressBox.*?Site ID:\s*(\w+)/i);
        const siteId = siteIdMatch ? siteIdMatch[1] : undefined;

        return {
            ip,
            hostname,
            comment:
                comment ||
                (isPressBoxManaged ? "Managed by PressBox" : "Custom entry"),
            enabled: !isDisabled,
            isWordPress,
            siteId,
        };
    }

    /**
     * Add or update a hosts file entry
     */
    static async addHostEntry(
        entry: Omit<HostEntry, "enabled"> & { enabled?: boolean }
    ): Promise<void> {
        try {
            await this.ensureBackup();

            const entries = await this.readHostsFile();
            const existingIndex = entries.findIndex(
                (e) => e.hostname === entry.hostname
            );

            const newEntry: HostEntry = {
                ...entry,
                enabled: entry.enabled ?? true,
            };

            if (existingIndex >= 0) {
                entries[existingIndex] = newEntry;
            } else {
                entries.push(newEntry);
            }

            await this.writeHostsFile(entries);
        } catch (error) {
            console.error("Failed to add hosts entry:", error);
            throw new Error(
                "Failed to add hosts entry. Ensure PressBox is running as administrator."
            );
        }
    }

    /**
     * Remove a hosts file entry
     */
    static async removeHostEntry(hostname: string): Promise<void> {
        try {
            await this.ensureBackup();

            const entries = await this.readHostsFile();
            const filteredEntries = entries.filter(
                (entry) => entry.hostname !== hostname
            );

            if (filteredEntries.length === entries.length) {
                throw new Error(`Host entry '${hostname}' not found`);
            }

            await this.writeHostsFile(filteredEntries);
        } catch (error) {
            console.error("Failed to remove hosts entry:", error);
            throw new Error(
                "Failed to remove hosts entry. Ensure PressBox is running as administrator."
            );
        }
    }

    /**
     * Enable or disable a hosts file entry
     */
    static async toggleHostEntry(
        hostname: string,
        enabled: boolean
    ): Promise<void> {
        try {
            await this.ensureBackup();

            const entries = await this.readHostsFile();
            const entryIndex = entries.findIndex(
                (entry) => entry.hostname === hostname
            );

            if (entryIndex === -1) {
                throw new Error(`Host entry '${hostname}' not found`);
            }

            entries[entryIndex].enabled = enabled;
            await this.writeHostsFile(entries);
        } catch (error) {
            console.error("Failed to toggle hosts entry:", error);
            throw new Error(
                "Failed to update hosts entry. Ensure PressBox is running as administrator."
            );
        }
    }

    /**
     * Add WordPress site entry
     */
    static async addWordPressSiteEntry(
        siteId: string,
        hostname: string,
        ip: string = "127.0.0.1"
    ): Promise<void> {
        const entry: Omit<HostEntry, "enabled"> = {
            ip,
            hostname,
            comment: `PressBox WordPress Site - Site ID: ${siteId}`,
            isWordPress: true,
            siteId,
        };

        await this.addHostEntry(entry);
    }

    /**
     * Remove WordPress site entry
     */
    static async removeWordPressSiteEntry(siteId: string): Promise<void> {
        try {
            const entries = await this.readHostsFile();
            const siteEntries = entries.filter(
                (entry) => entry.siteId === siteId
            );

            for (const entry of siteEntries) {
                await this.removeHostEntry(entry.hostname);
            }
        } catch (error) {
            console.error("Failed to remove WordPress site entries:", error);
            throw new Error(
                "Failed to remove WordPress site entries from hosts file."
            );
        }
    }

    /**
     * Write hosts file with entries
     */
    private static async writeHostsFile(entries: HostEntry[]): Promise<void> {
        try {
            // Read current hosts file to preserve non-managed entries
            let existingContent = "";
            try {
                existingContent = await fs.readFile(this.HOSTS_PATH, "utf8");
            } catch (error) {
                // If file doesn't exist, start fresh
                console.log("Hosts file not found, creating new one");
            }

            // Remove existing PressBox section
            const lines = existingContent.split("\n");
            const filteredLines: string[] = [];
            let inPressBoxSection = false;

            for (const line of lines) {
                const trimmedLine = line.trim();

                if (trimmedLine === this.PRESSBOX_MARKER_START) {
                    inPressBoxSection = true;
                    continue;
                }

                if (trimmedLine === this.PRESSBOX_MARKER_END) {
                    inPressBoxSection = false;
                    continue;
                }

                if (!inPressBoxSection) {
                    filteredLines.push(line);
                }
            }

            // Build new content
            const managedEntries = entries.filter((entry) => entry.isWordPress);
            const customEntries = entries.filter((entry) => !entry.isWordPress);

            let newContent = filteredLines.join("\n").trim();

            // Add custom entries (update existing or add new)
            for (const entry of customEntries) {
                const entryLine = this.formatHostEntry(entry);
                // Check if this entry already exists in the non-managed section
                const hostname = entry.hostname;
                const existingLineIndex = filteredLines.findIndex(
                    (line) =>
                        line.includes(hostname) && !line.trim().startsWith("#")
                );

                if (existingLineIndex >= 0) {
                    // Update existing entry
                    filteredLines[existingLineIndex] = entryLine;
                } else {
                    // Add new entry
                    filteredLines.push(entryLine);
                }
            }

            // Rebuild base content
            newContent = filteredLines.join("\n").trim();

            // Add PressBox managed section
            if (managedEntries.length > 0) {
                newContent += "\n\n" + this.PRESSBOX_MARKER_START + "\n";
                newContent +=
                    "# Automatically managed by PressBox - DO NOT EDIT MANUALLY\n";

                for (const entry of managedEntries) {
                    newContent += this.formatHostEntry(entry) + "\n";
                }

                newContent += this.PRESSBOX_MARKER_END + "\n";
            }

            // Ensure file ends with newline
            if (!newContent.endsWith("\n")) {
                newContent += "\n";
            }

            await fs.writeFile(this.HOSTS_PATH, newContent, "utf8");
        } catch (error) {
            console.error("Failed to write hosts file:", error);
            throw new Error(
                "Failed to write hosts file. Ensure PressBox is running as administrator."
            );
        }
    }

    /**
     * Format a host entry for the hosts file
     */
    private static formatHostEntry(entry: HostEntry): string {
        const prefix = entry.enabled ? "" : "# ";
        const comment = entry.comment ? ` # ${entry.comment}` : "";
        return `${prefix}${entry.ip}\t${entry.hostname}${comment}`;
    }

    /**
     * Create backup of hosts file
     */
    static async ensureBackup(): Promise<void> {
        try {
            // Ensure backup directory exists
            const backupDir = path.dirname(this.BACKUP_PATH);
            await fs.mkdir(backupDir, { recursive: true });

            // Create timestamped backup
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const backupFile = `${this.BACKUP_PATH}-${timestamp}`;

            const hostsContent = await fs.readFile(this.HOSTS_PATH, "utf8");
            await fs.writeFile(backupFile, hostsContent, "utf8");

            // Keep only last 10 backups
            await this.cleanupOldBackups();
        } catch (error) {
            console.error("Failed to create hosts backup:", error);
            // Don't throw here, backup is not critical
        }
    }

    /**
     * Clean up old backup files
     */
    private static async cleanupOldBackups(): Promise<void> {
        try {
            const backupDir = path.dirname(this.BACKUP_PATH);
            const backupPrefix = path.basename(this.BACKUP_PATH);

            const files = await fs.readdir(backupDir);
            const backupFiles = files
                .filter((file) => file.startsWith(backupPrefix))
                .map((file) => ({
                    name: file,
                    path: path.join(backupDir, file),
                    stat: null as any,
                }));

            // Get file stats
            for (const file of backupFiles) {
                try {
                    file.stat = await fs.stat(file.path);
                } catch (error) {
                    // Ignore files we can't stat
                }
            }

            // Sort by modification time (newest first)
            backupFiles
                .filter((file) => file.stat)
                .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime())
                .slice(10) // Keep only first 10, delete the rest
                .forEach(async (file) => {
                    try {
                        await fs.unlink(file.path);
                    } catch (error) {
                        console.error(
                            "Failed to delete old backup:",
                            file.path,
                            error
                        );
                    }
                });
        } catch (error) {
            console.error("Failed to cleanup old backups:", error);
        }
    }

    /**
     * Restore from latest backup
     */
    static async restoreFromBackup(): Promise<void> {
        try {
            const backupDir = path.dirname(this.BACKUP_PATH);
            const backupPrefix = path.basename(this.BACKUP_PATH);

            const files = await fs.readdir(backupDir);
            const backupFiles = files.filter((file) =>
                file.startsWith(backupPrefix)
            );

            if (backupFiles.length === 0) {
                throw new Error("No backup files found");
            }

            // Find latest backup
            let latestBackup = "";
            let latestTime = 0;

            for (const file of backupFiles) {
                const filePath = path.join(backupDir, file);
                try {
                    const stat = await fs.stat(filePath);
                    if (stat.mtime.getTime() > latestTime) {
                        latestTime = stat.mtime.getTime();
                        latestBackup = filePath;
                    }
                } catch (error) {
                    // Skip files we can't stat
                }
            }

            if (!latestBackup) {
                throw new Error("No valid backup files found");
            }

            // Restore from backup
            const backupContent = await fs.readFile(latestBackup, "utf8");
            await fs.writeFile(this.HOSTS_PATH, backupContent, "utf8");
        } catch (error) {
            console.error("Failed to restore from backup:", error);
            throw new Error("Failed to restore hosts file from backup.");
        }
    }

    /**
     * Check if running with administrator privileges
     */
    static async checkAdminPrivileges(): Promise<boolean> {
        try {
            // Try to read the hosts file
            await fs.access(this.HOSTS_PATH, fs.constants.R_OK);

            // Try to write a test (backup first)
            const testContent = await fs.readFile(this.HOSTS_PATH, "utf8");
            await fs.writeFile(this.HOSTS_PATH, testContent, "utf8");

            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get hosts file statistics
     */
    static async getHostsStats(): Promise<{
        totalEntries: number;
        wordpressEntries: number;
        enabledEntries: number;
        hasBackup: boolean;
        lastModified: Date;
    }> {
        try {
            const entries = await this.readHostsFile();
            const stat = await fs.stat(this.HOSTS_PATH);

            // Check for backups
            const backupDir = path.dirname(this.BACKUP_PATH);
            let hasBackup = false;
            try {
                const files = await fs.readdir(backupDir);
                hasBackup = files.some((file) =>
                    file.startsWith(path.basename(this.BACKUP_PATH))
                );
            } catch (error) {
                hasBackup = false;
            }

            return {
                totalEntries: entries.length,
                wordpressEntries: entries.filter((e) => e.isWordPress).length,
                enabledEntries: entries.filter((e) => e.enabled).length,
                hasBackup,
                lastModified: stat.mtime,
            };
        } catch (error) {
            throw new Error("Failed to get hosts file statistics.");
        }
    }
}
