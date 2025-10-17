/**
 * Non-Admin Mode Configuration
 *
 * This allows PressBox to run without administrator privileges
 * by using localhost URLs instead of custom domains.
 * The user's preference is persistently stored using electron-store.
 */

import * as os from "os";
import Store from "electron-store";
import { WordPressManager } from "./wordpressManager";

interface NonAdminModeSettings {
    nonAdminMode: {
        enabled: boolean;
        userChoiceMade: boolean;
        lastChoice: "admin" | "non-admin";
    };
}

export class NonAdminMode {
    private static enabled: boolean = false;
    private static store: Store<NonAdminModeSettings>;
    private static initialized: boolean = false;

    /**
     * Initialize the non-admin mode with persistent settings
     */
    static initialize(): void {
        if (NonAdminMode.initialized) return;

        // Initialize electron-store with schema
        // Cast to any to handle projectName option for testing outside Electron
        NonAdminMode.store = new Store<NonAdminModeSettings>({
            name: "pressbox-settings",
            projectName: "PressBox",
            projectVersion: "1.0.0",
            defaults: {
                nonAdminMode: {
                    enabled: true, // Default to non-admin mode for better UX
                    userChoiceMade: false,
                    lastChoice: "non-admin",
                },
            },
        } as any);

        // Load the saved preference
        const settings = (NonAdminMode.store as any).get("nonAdminMode");
        NonAdminMode.enabled = settings.enabled;

        console.log("🔧 NonAdminMode initialized");
        console.log(`   - Store path: ${(NonAdminMode.store as any).path}`);
        console.log(`   - Raw settings:`, JSON.stringify(settings, null, 2));
        console.log(`   - Enabled: ${NonAdminMode.enabled}`);
        console.log(`   - User choice made: ${settings.userChoiceMade}`);
        console.log(`   - Last choice: ${settings.lastChoice}`);

        if (NonAdminMode.enabled) {
            console.log("🔓 Non-admin mode active");
            console.log(
                "   - Sites will use localhost URLs (e.g., http://localhost:8080)"
            );
            console.log("   - No hosts file modification required");
            console.log("   - No administrator privileges needed");
        } else {
            console.log(
                "🔒 Admin mode active (hosts file modification required)"
            );
        }

        NonAdminMode.initialized = true;
    }

    /**
     * Enable non-admin mode and save preference
     */
    static enable(
        wordPressManager?: WordPressManager,
        savePreference: boolean = true
    ): void {
        NonAdminMode.enabled = true;

        if (savePreference && NonAdminMode.store) {
            (NonAdminMode.store as any).set("nonAdminMode", {
                enabled: true,
                userChoiceMade: true,
                lastChoice: "non-admin",
            });
            console.log("💾 Non-admin mode preference saved");
        }

        console.log("🔓 Non-admin mode enabled");
        console.log(
            "   - Sites will use localhost URLs (e.g., http://localhost:8080)"
        );
        console.log("   - No hosts file modification required");
        console.log("   - No administrator privileges needed");

        // Update all site URLs to use localhost
        if (wordPressManager) {
            wordPressManager.updateSiteUrlsForAdminMode();
        }
    }

    /**
     * Disable non-admin mode and save preference
     */
    static disable(
        wordPressManager?: WordPressManager,
        savePreference: boolean = true
    ): void {
        NonAdminMode.enabled = false;

        if (savePreference && NonAdminMode.store) {
            (NonAdminMode.store as any).set("nonAdminMode", {
                enabled: false,
                userChoiceMade: true,
                lastChoice: "admin",
            });
            console.log("💾 Admin mode preference saved");
        }

        console.log("🔒 Admin mode enabled (hosts file modification required)");

        // Update all site URLs to use custom domains
        if (wordPressManager) {
            wordPressManager.updateSiteUrlsForAdminMode();
        }
    }

    /**
     * Check if non-admin mode is enabled
     */
    static isEnabled(): boolean {
        return NonAdminMode.enabled;
    }

    /**
     * Check if user has made a choice before
     */
    static hasUserMadeChoice(): boolean {
        if (!NonAdminMode.store) return false;
        return (NonAdminMode.store as any).get(
            "nonAdminMode.userChoiceMade",
            false
        );
    }

    /**
     * Get the user's last choice
     */
    static getLastChoice(): "admin" | "non-admin" {
        if (!NonAdminMode.store) return "non-admin";
        return (NonAdminMode.store as any).get(
            "nonAdminMode.lastChoice",
            "non-admin"
        );
    }

    /**
     * Reset user preferences (for testing or settings reset)
     */
    static resetPreferences(): void {
        if (NonAdminMode.store) {
            (NonAdminMode.store as any).set("nonAdminMode", {
                enabled: true,
                userChoiceMade: false,
                lastChoice: "non-admin",
            });
            console.log("🔄 Non-admin mode preferences reset");
        }
    }

    /**
     * Determine if admin operations should be blocked
     * This is a more permissive check that defaults to blocking admin operations
     * unless the user has explicitly disabled non-admin mode
     */
    static shouldBlockAdminOperations(): boolean {
        if (!NonAdminMode.initialized) {
            // If not initialized yet, default to blocking admin operations
            return true;
        }
        return NonAdminMode.enabled;
    }

    /**
     * Check if the application should request admin privileges
     * Only requests admin if user has explicitly chosen admin mode
     */
    static shouldRequestAdminPrivileges(): boolean {
        if (!NonAdminMode.initialized) {
            // Default to not requesting admin privileges until user explicitly chooses
            return false;
        }

        if (!NonAdminMode.hasUserMadeChoice()) {
            // User hasn't made a choice, default to non-admin mode
            return false;
        }

        // Only request admin if user explicitly chose admin mode
        return (
            !NonAdminMode.enabled && NonAdminMode.getLastChoice() === "admin"
        );
    }

    /**
     * Get the appropriate URL for a site based on admin mode
     */
    static getSiteUrl(siteName: string, domain: string, port: number): string {
        if (NonAdminMode.enabled) {
            // Use localhost URL in non-admin mode
            return `http://localhost:${port}`;
        } else {
            // Use custom domain in admin mode
            return `http://${domain}:${port}`;
        }
    }

    /**
     * Get the effective domain for a site
     */
    static getEffectiveDomain(
        siteName: string,
        requestedDomain: string
    ): string {
        if (NonAdminMode.enabled) {
            return "localhost";
        } else {
            return requestedDomain;
        }
    }

    /**
     * Check if hosts file modification is needed
     */
    static needsHostsFileModification(): boolean {
        return !NonAdminMode.enabled;
    }

    /**
     * Check if we should prompt the user for admin mode preference
     * This should only happen once after installation
     */
    static shouldPromptUser(): boolean {
        if (!NonAdminMode.store) {
            console.log("⚠️ NonAdminMode store not initialized");
            return false;
        }

        const settings = (NonAdminMode.store as any).get("nonAdminMode", {
            enabled: true,
            userChoiceMade: false,
            lastChoice: "non-admin",
        });

        console.log("🔧 NonAdminMode settings from store:", settings);
        console.log("🔧 userChoiceMade:", settings.userChoiceMade);

        // Prompt if user hasn't made a choice yet
        const shouldPrompt = !settings.userChoiceMade;
        console.log("🔧 shouldPromptUser result:", shouldPrompt);

        return shouldPrompt;
    }

    /**
     * Get user-friendly explanation of current mode
     */
    static getExplanation(): {
        mode: string;
        description: string;
        urls: string;
        adminRequired: boolean;
    } {
        if (NonAdminMode.enabled) {
            return {
                mode: "Non-Admin Mode",
                description:
                    "Sites use localhost URLs, no system modifications required",
                urls: "http://localhost:PORT (e.g., http://localhost:8080)",
                adminRequired: false,
            };
        } else {
            return {
                mode: "Admin Mode",
                description: "Sites use custom domains with hosts file entries",
                urls: "http://SITENAME.local (e.g., http://mysite.local)",
                adminRequired: true,
            };
        }
    }
}
