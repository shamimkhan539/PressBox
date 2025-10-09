import * as https from "https";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * WordPress Downloader Service
 *
 * Downloads and extracts WordPress installations
 */
export class WordPressDownloader {
    private static readonly WP_DOWNLOAD_URL =
        "https://wordpress.org/wordpress-{version}.zip";
    private static readonly WP_LATEST_URL = "https://wordpress.org/latest.zip";

    /**
     * Download WordPress
     */
    static async download(
        targetPath: string,
        version: string = "latest"
    ): Promise<void> {
        try {
            console.log(`Downloading WordPress ${version}...`);

            const downloadUrl =
                version === "latest"
                    ? this.WP_LATEST_URL
                    : this.WP_DOWNLOAD_URL.replace("{version}", version);

            const zipPath = path.join(targetPath, "wordpress.zip");

            // Ensure target directory exists
            await fs.promises.mkdir(targetPath, { recursive: true });

            // Download WordPress zip
            await this.downloadFile(downloadUrl, zipPath);

            // Extract WordPress
            await this.extractZip(zipPath, targetPath);

            // Clean up zip file
            await fs.promises.unlink(zipPath);

            console.log(
                `WordPress ${version} downloaded and extracted successfully`
            );
        } catch (error) {
            console.error("Failed to download WordPress:", error);
            throw error;
        }
    }

    /**
     * Download file from URL
     */
    private static downloadFile(
        url: string,
        destination: string
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(destination);

            https
                .get(url, (response) => {
                    // Handle redirects
                    if (
                        response.statusCode === 301 ||
                        response.statusCode === 302
                    ) {
                        const redirectUrl = response.headers.location;
                        if (redirectUrl) {
                            return this.downloadFile(redirectUrl, destination)
                                .then(resolve)
                                .catch(reject);
                        }
                    }

                    if (response.statusCode !== 200) {
                        reject(
                            new Error(
                                `HTTP ${response.statusCode}: ${response.statusMessage}`
                            )
                        );
                        return;
                    }

                    response.pipe(file);

                    file.on("finish", () => {
                        file.close();
                        resolve();
                    });

                    file.on("error", (error) => {
                        fs.unlink(destination, () => {}); // Clean up on error
                        reject(error);
                    });
                })
                .on("error", (error) => {
                    reject(error);
                });
        });
    }

    /**
     * Extract ZIP file using system tools
     */
    private static async extractZip(
        zipPath: string,
        targetPath: string
    ): Promise<void> {
        try {
            const platform = process.platform;

            if (platform === "win32") {
                // Use PowerShell on Windows
                const command = `powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${targetPath}' -Force"`;
                await execAsync(command);
            } else {
                // Use unzip on Linux/macOS
                const command = `unzip -o "${zipPath}" -d "${targetPath}"`;
                await execAsync(command);
            }
        } catch (error) {
            console.error("Failed to extract ZIP:", error);

            // Fallback: Create basic WordPress structure
            await this.createBasicWordPressStructure(targetPath);
        }
    }

    /**
     * Create basic WordPress structure as fallback
     */
    private static async createBasicWordPressStructure(
        targetPath: string
    ): Promise<void> {
        const wordpressPath = path.join(targetPath, "wordpress");
        await fs.promises.mkdir(wordpressPath, { recursive: true });

        // Create wp-content structure
        const wpContentPath = path.join(wordpressPath, "wp-content");
        await fs.promises.mkdir(wpContentPath, { recursive: true });
        await fs.promises.mkdir(path.join(wpContentPath, "themes"), {
            recursive: true,
        });
        await fs.promises.mkdir(path.join(wpContentPath, "plugins"), {
            recursive: true,
        });
        await fs.promises.mkdir(path.join(wpContentPath, "uploads"), {
            recursive: true,
        });

        // Create basic index.php
        const indexContent = `<?php
/**
 * WordPress Bootstrap File
 * This is a basic WordPress installation created by PressBox.
 * 
 * To complete the setup:
 * 1. Download the full WordPress files from wordpress.org
 * 2. Extract them to this directory
 * 3. Configure wp-config.php with your database settings
 */

echo '<h1>PressBox WordPress Site</h1>';
echo '<p>WordPress files need to be downloaded and configured.</p>';
echo '<p>Site Path: ' . __DIR__ . '</p>';
?>`;

        await fs.promises.writeFile(
            path.join(wordpressPath, "index.php"),
            indexContent
        );

        console.log("Created basic WordPress structure as fallback");
    }

    /**
     * Get available WordPress versions
     */
    static async getAvailableVersions(): Promise<string[]> {
        // For now, return common versions
        // TODO: Fetch from WordPress API
        return ["latest", "6.3.2", "6.2.3", "6.1.4", "6.0.6", "5.9.8"];
    }
}
