import { promises as fs } from "fs";
import { join, dirname } from "path";
import { platform, arch } from "os";
import { spawn } from "child_process";
import * as https from "https";
import { createWriteStream, createReadStream } from "fs";
import { pipeline } from "stream";
import { promisify } from "util";

const pipelineAsync = promisify(pipeline);

/**
 * Portable PHP Manager
 *
 * Downloads and manages portable PHP installations for systems
 * that don't have PHP installed natively
 */
export class PortablePHPManager {
    private static instance: PortablePHPManager;
    private portablePhpPath: string | null = null;
    private downloadUrls: Record<string, Record<string, string>> = {
        win32: {
            x64: "https://windows.php.net/downloads/releases/php-8.2.12-Win32-vs16-x64.zip",
            ia32: "https://windows.php.net/downloads/releases/php-8.2.12-Win32-vs16-x86.zip",
        },
        darwin: {
            x64: "https://formulae.brew.sh/api/formula/php.json", // Fallback to instructions
            arm64: "https://formulae.brew.sh/api/formula/php.json",
        },
        linux: {
            x64: "https://www.php.net/distributions/php-8.2.12.tar.gz",
            arm64: "https://www.php.net/distributions/php-8.2.12.tar.gz",
        },
    };

    private constructor() {}

    public static getInstance(): PortablePHPManager {
        if (!PortablePHPManager.instance) {
            PortablePHPManager.instance = new PortablePHPManager();
        }
        return PortablePHPManager.instance;
    }

    /**
     * Initialize the portable PHP manager
     */
    public async initialize(): Promise<void> {
        await this.detectPortablePHP();
    }

    /**
     * Check if portable PHP is available
     */
    public async isPortablePHPAvailable(): Promise<boolean> {
        if (!this.portablePhpPath) {
            await this.detectPortablePHP();
        }
        return this.portablePhpPath !== null;
    }

    /**
     * Get portable PHP path
     */
    public getPortablePHPPath(): string | null {
        return this.portablePhpPath;
    }

    /**
     * Download and install portable PHP
     */
    public async installPortablePHP(
        installPath: string,
        onProgress?: (progress: number) => void
    ): Promise<boolean> {
        try {
            const currentPlatform = platform();
            const currentArch = arch();

            if (currentPlatform === "win32") {
                return await this.installWindowsPHP(
                    installPath,
                    currentArch as "x64" | "ia32",
                    onProgress
                );
            } else {
                // For macOS and Linux, provide instructions instead of automatic installation
                console.log(
                    "Portable PHP installation not supported on this platform."
                );
                console.log(
                    "Please install PHP using your system package manager:"
                );
                console.log("macOS: brew install php");
                console.log(
                    "Ubuntu/Debian: sudo apt install php php-cli php-zip php-xml php-mbstring"
                );
                console.log(
                    "CentOS/RHEL: sudo yum install php php-cli php-zip php-xml php-mbstring"
                );
                return false;
            }
        } catch (error) {
            console.error("Error installing portable PHP:", error);
            return false;
        }
    }

    /**
     * Install portable PHP on Windows
     */
    private async installWindowsPHP(
        installPath: string,
        architecture: "x64" | "ia32",
        onProgress?: (progress: number) => void
    ): Promise<boolean> {
        try {
            const downloadUrl = this.downloadUrls.win32[architecture];
            if (!downloadUrl) {
                console.error(
                    `No download URL available for Windows ${architecture}`
                );
                return false;
            }

            // Create installation directory
            await fs.mkdir(installPath, { recursive: true });

            // Download PHP
            const zipPath = join(installPath, "php.zip");
            const success = await this.downloadFile(
                downloadUrl,
                zipPath,
                onProgress
            );

            if (!success) {
                return false;
            }

            // Extract PHP
            const extractPath = join(installPath, "php");
            await this.extractZip(zipPath, extractPath);

            // Set portable PHP path
            this.portablePhpPath = join(extractPath, "php.exe");

            // Create basic php.ini
            await this.createBasicPhpIni(extractPath);

            // Cleanup download
            await fs.unlink(zipPath);

            console.log(`Portable PHP installed at: ${this.portablePhpPath}`);
            return true;
        } catch (error) {
            console.error("Error installing Windows PHP:", error);
            return false;
        }
    }

    /**
     * Detect existing portable PHP installation
     */
    private async detectPortablePHP(): Promise<void> {
        try {
            // Check common portable PHP locations
            const possiblePaths = [
                join(process.cwd(), "php", "php.exe"),
                join(process.env.APPDATA || "", "PressBox", "php", "php.exe"),
                join(
                    process.env.LOCALAPPDATA || "",
                    "PressBox",
                    "php",
                    "php.exe"
                ),
            ];

            for (const phpPath of possiblePaths) {
                try {
                    await fs.access(phpPath);
                    this.portablePhpPath = phpPath;
                    console.log(`Found portable PHP at: ${phpPath}`);
                    return;
                } catch {
                    // Continue checking other paths
                }
            }
        } catch (error) {
            console.error("Error detecting portable PHP:", error);
        }
    }

    /**
     * Download file with progress tracking
     */
    private downloadFile(
        url: string,
        destination: string,
        onProgress?: (progress: number) => void
    ): Promise<boolean> {
        return new Promise((resolve) => {
            const file = createWriteStream(destination);

            https
                .get(url, (response) => {
                    if (response.statusCode !== 200) {
                        console.error(
                            `Download failed with status: ${response.statusCode}`
                        );
                        resolve(false);
                        return;
                    }

                    const totalSize = parseInt(
                        response.headers["content-length"] || "0",
                        10
                    );
                    let downloadedSize = 0;

                    response.on("data", (chunk) => {
                        downloadedSize += chunk.length;
                        if (onProgress && totalSize > 0) {
                            const progress = (downloadedSize / totalSize) * 100;
                            onProgress(Math.round(progress));
                        }
                    });

                    response.pipe(file);

                    file.on("finish", () => {
                        file.close();
                        resolve(true);
                    });

                    file.on("error", (error) => {
                        console.error("Error writing file:", error);
                        resolve(false);
                    });
                })
                .on("error", (error) => {
                    console.error("Download error:", error);
                    resolve(false);
                });
        });
    }

    /**
     * Extract ZIP file (Windows only)
     */
    private async extractZip(
        zipPath: string,
        extractPath: string
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            // Use PowerShell to extract ZIP on Windows
            const extractCommand = `Expand-Archive -Path "${zipPath}" -DestinationPath "${extractPath}" -Force`;

            const process = spawn(
                "powershell.exe",
                ["-Command", extractCommand],
                {
                    stdio: ["ignore", "pipe", "pipe"],
                }
            );

            let stderr = "";
            process.stderr?.on("data", (data) => {
                stderr += data.toString();
            });

            process.on("close", (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`ZIP extraction failed: ${stderr}`));
                }
            });

            process.on("error", (error) => {
                reject(error);
            });
        });
    }

    /**
     * Create basic php.ini configuration
     */
    private async createBasicPhpIni(phpPath: string): Promise<void> {
        const phpIniContent = `
; Basic PHP configuration for PressBox
extension_dir = "ext"
extension=curl
extension=fileinfo
extension=gd
extension=mbstring
extension=openssl
extension=pdo_mysql
extension=zip
extension=xml

; Security settings
expose_php = Off
allow_url_fopen = On
allow_url_include = Off

; Performance settings
memory_limit = 256M
max_execution_time = 300
max_input_time = 300
upload_max_filesize = 64M
post_max_size = 64M

; Error reporting (development)
error_reporting = E_ALL
display_errors = On
log_errors = On

; Session settings
session.save_path = "tmp"

; Timezone
date.timezone = UTC
`;

        const iniPath = join(phpPath, "php.ini");
        await fs.writeFile(iniPath, phpIniContent.trim());
        console.log(`Created php.ini at: ${iniPath}`);
    }

    /**
     * Test portable PHP installation
     */
    public async testPortablePHP(): Promise<{
        success: boolean;
        version?: string;
        error?: string;
    }> {
        if (!this.portablePhpPath) {
            return { success: false, error: "Portable PHP not available" };
        }

        return new Promise((resolve) => {
            const childProcess = spawn(this.portablePhpPath!, ["--version"], {
                stdio: ["ignore", "pipe", "pipe"],
            });

            let stdout = "";
            let stderr = "";

            childProcess.stdout?.on("data", (data: Buffer) => {
                stdout += data.toString();
            });

            childProcess.stderr?.on("data", (data: Buffer) => {
                stderr += data.toString();
            });

            childProcess.on("close", (code: number | null) => {
                if (code === 0) {
                    const versionMatch = stdout.match(/PHP (\d+\.\d+\.\d+)/);
                    const version = versionMatch ? versionMatch[1] : "Unknown";
                    resolve({ success: true, version });
                } else {
                    resolve({
                        success: false,
                        error: stderr || "Failed to execute PHP",
                    });
                }
            });

            childProcess.on("error", (error: Error) => {
                resolve({ success: false, error: error.message });
            });
        });
    }

    /**
     * Get installation instructions for the current platform
     */
    public getInstallationInstructions(): string[] {
        const currentPlatform = platform();
        const instructions = ["PHP is not installed on your system."];

        switch (currentPlatform) {
            case "win32":
                instructions.push(
                    "",
                    "Windows Installation Options:",
                    "1. Download from php.net/downloads",
                    "2. Use XAMPP: https://www.apachefriends.org/",
                    "3. Use Laragon: https://laragon.org/",
                    "4. Let PressBox download portable PHP automatically",
                    "",
                    "PressBox can download and configure PHP automatically for Windows."
                );
                break;

            case "darwin":
                instructions.push(
                    "",
                    "macOS Installation:",
                    "brew install php",
                    "",
                    "Or download from:",
                    "https://php-osx.liip.ch/",
                    "https://www.mamp.info/en/mamp/"
                );
                break;

            case "linux":
                instructions.push(
                    "",
                    "Linux Installation:",
                    "Ubuntu/Debian: sudo apt install php php-cli php-zip php-xml php-mbstring",
                    "CentOS/RHEL: sudo yum install php php-cli php-zip php-xml php-mbstring",
                    "Arch Linux: sudo pacman -S php",
                    "Fedora: sudo dnf install php php-cli php-zip php-xml php-mbstring"
                );
                break;

            default:
                instructions.push(
                    "",
                    "Please install PHP from: https://www.php.net/downloads"
                );
        }

        return instructions;
    }
}
