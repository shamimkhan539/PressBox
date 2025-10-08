import * as path from "path";
import * as fs from "fs/promises";
import {
    SiteBlueprint,
    BlueprintCategory,
    CreateSiteRequest,
    WordPressSite,
} from "../../shared/types";
import { DockerManager } from "./dockerManager";
import { WordPressManager } from "./wordpressManager";

/**
 * Blueprint Manager Service
 *
 * Manages site blueprints - pre-configured templates for creating WordPress sites
 * with specific configurations, plugins, themes, and content.
 */
export class BlueprintManager {
    private blueprints: Map<string, SiteBlueprint> = new Map();
    private blueprintPath: string;
    private officialBlueprintsPath: string;
    private customBlueprintsPath: string;

    constructor(
        private dockerManager: DockerManager,
        private wordpressManager: WordPressManager
    ) {
        // Get user data directory for blueprints
        const { app } = require("electron");
        const userDataPath = app.getPath("userData");

        this.blueprintPath = path.join(userDataPath, "blueprints");
        this.officialBlueprintsPath = path.join(
            __dirname,
            "..",
            "blueprints",
            "official"
        );
        this.customBlueprintsPath = path.join(this.blueprintPath, "custom");

        this.initializeBlueprintDirectories();
        this.loadBlueprints();
    }

    /**
     * Initialize blueprint directories
     */
    private async initializeBlueprintDirectories(): Promise<void> {
        try {
            await fs.mkdir(this.blueprintPath, { recursive: true });
            await fs.mkdir(this.customBlueprintsPath, { recursive: true });
        } catch (error) {
            console.error("Failed to initialize blueprint directories:", error);
        }
    }

    /**
     * Load all blueprints from official and custom directories
     */
    public async loadBlueprints(): Promise<void> {
        try {
            // Load official blueprints
            await this.loadOfficialBlueprints();

            // Load custom blueprints
            await this.loadCustomBlueprints();

            console.log(`Loaded ${this.blueprints.size} blueprints`);
        } catch (error) {
            console.error("Failed to load blueprints:", error);
        }
    }

    /**
     * Load official blueprints
     */
    private async loadOfficialBlueprints(): Promise<void> {
        // Create official blueprints programmatically
        const officialBlueprints = this.createOfficialBlueprints();

        for (const blueprint of officialBlueprints) {
            this.blueprints.set(blueprint.id, blueprint);
        }
    }

    /**
     * Load custom blueprints from file system
     */
    private async loadCustomBlueprints(): Promise<void> {
        try {
            const files = await fs.readdir(this.customBlueprintsPath);

            for (const file of files) {
                if (path.extname(file) === ".json") {
                    try {
                        const filePath = path.join(
                            this.customBlueprintsPath,
                            file
                        );
                        const data = await fs.readFile(filePath, "utf-8");
                        const blueprint: SiteBlueprint = JSON.parse(data);

                        // Validate blueprint
                        if (this.validateBlueprint(blueprint)) {
                            blueprint.isCustom = true;
                            this.blueprints.set(blueprint.id, blueprint);
                        }
                    } catch (error) {
                        console.error(
                            `Failed to load custom blueprint ${file}:`,
                            error
                        );
                    }
                }
            }
        } catch (error) {
            console.error("Failed to load custom blueprints:", error);
        }
    }

    /**
     * Get all blueprints
     */
    public getAllBlueprints(): SiteBlueprint[] {
        return Array.from(this.blueprints.values()).sort((a, b) => {
            // Sort by official first, then by category, then by name
            if (a.isOfficial !== b.isOfficial) {
                return a.isOfficial ? -1 : 1;
            }
            if (a.category !== b.category) {
                return a.category.localeCompare(b.category);
            }
            return a.name.localeCompare(b.name);
        });
    }

    /**
     * Get blueprints by category
     */
    public getBlueprintsByCategory(
        category: BlueprintCategory
    ): SiteBlueprint[] {
        return Array.from(this.blueprints.values())
            .filter((bp) => bp.category === category)
            .sort((a, b) => {
                if (a.isOfficial !== b.isOfficial) {
                    return a.isOfficial ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            });
    }

    /**
     * Get blueprint by ID
     */
    public getBlueprint(id: string): SiteBlueprint | undefined {
        return this.blueprints.get(id);
    }

    /**
     * Create site from blueprint
     */
    public async createSiteFromBlueprint(
        blueprintId: string,
        siteConfig: Omit<CreateSiteRequest, "blueprintId">
    ): Promise<WordPressSite> {
        const blueprint = this.blueprints.get(blueprintId);
        if (!blueprint) {
            throw new Error(`Blueprint with ID ${blueprintId} not found`);
        }

        try {
            // Merge site config with blueprint config
            const mergedConfig: CreateSiteRequest = {
                ...siteConfig,
                blueprintId,
                phpVersion:
                    siteConfig.phpVersion || blueprint.config.phpVersion,
                wordPressVersion:
                    siteConfig.wordPressVersion ||
                    blueprint.config.wordPressVersion,
                ssl: siteConfig.ssl ?? blueprint.config.ssl,
                multisite: siteConfig.multisite ?? blueprint.config.multisite,
            };

            // Create the base WordPress site
            const site = await this.wordpressManager.createSite(mergedConfig);

            // Apply blueprint configuration
            await this.applyBlueprintToSite(blueprint, site);

            return site;
        } catch (error) {
            console.error(
                `Failed to create site from blueprint ${blueprintId}:`,
                error
            );
            throw error;
        }
    }

    /**
     * Apply blueprint configuration to an existing site
     */
    private async applyBlueprintToSite(
        blueprint: SiteBlueprint,
        site: WordPressSite
    ): Promise<void> {
        try {
            // Execute setup steps in order
            const steps = blueprint.setup.steps.sort(
                (a, b) => a.order - b.order
            );

            for (const step of steps) {
                try {
                    await this.executeSetupStep(step, blueprint, site);
                } catch (error) {
                    if (!step.optional) {
                        throw error;
                    }
                    console.warn(
                        `Optional setup step ${step.id} failed:`,
                        error
                    );
                }
            }
        } catch (error) {
            console.error(
                `Failed to apply blueprint to site ${site.id}:`,
                error
            );
            throw error;
        }
    }

    /**
     * Execute a blueprint setup step
     */
    private async executeSetupStep(
        step: any,
        blueprint: SiteBlueprint,
        site: WordPressSite
    ): Promise<void> {
        console.log(`Executing blueprint step: ${step.name}`);

        switch (step.type) {
            case "wordpress":
                await this.executeWordPressStep(step, blueprint, site);
                break;
            case "plugin":
                await this.executePluginStep(step, blueprint, site);
                break;
            case "theme":
                await this.executeThemeStep(step, blueprint, site);
                break;
            case "content":
                await this.executeContentStep(step, blueprint, site);
                break;
            case "file":
                await this.executeFileStep(step, blueprint, site);
                break;
            case "command":
                await this.executeCommandStep(step, blueprint, site);
                break;
            default:
                console.warn(`Unknown step type: ${step.type}`);
        }
    }

    /**
     * Execute WordPress configuration step
     */
    private async executeWordPressStep(
        step: any,
        blueprint: SiteBlueprint,
        site: WordPressSite
    ): Promise<void> {
        // Apply WordPress settings
        if (blueprint.config.siteSettings) {
            // This would use WP-CLI to configure WordPress settings
            console.log(`Applying WordPress settings for site ${site.name}`);
        }
    }

    /**
     * Execute plugin installation step
     */
    private async executePluginStep(
        step: any,
        blueprint: SiteBlueprint,
        site: WordPressSite
    ): Promise<void> {
        const plugins = blueprint.includes.plugins || [];

        for (const plugin of plugins) {
            console.log(`Installing plugin: ${plugin.name}`);

            // This would use WP-CLI to install and configure plugins
            // Example: wp plugin install {plugin.slug} --activate
        }
    }

    /**
     * Execute theme installation step
     */
    private async executeThemeStep(
        step: any,
        blueprint: SiteBlueprint,
        site: WordPressSite
    ): Promise<void> {
        const themes = blueprint.includes.themes || [];

        for (const theme of themes) {
            console.log(`Installing theme: ${theme.name}`);

            // This would use WP-CLI to install and configure themes
            // Example: wp theme install {theme.slug} --activate
        }
    }

    /**
     * Execute content import step
     */
    private async executeContentStep(
        step: any,
        blueprint: SiteBlueprint,
        site: WordPressSite
    ): Promise<void> {
        const content = blueprint.includes.content || [];

        for (const contentItem of content) {
            console.log(`Importing content: ${contentItem.type}`);

            // This would use WP-CLI to import content
            // Example: wp import content.xml
        }
    }

    /**
     * Execute file copy step
     */
    private async executeFileStep(
        step: any,
        blueprint: SiteBlueprint,
        site: WordPressSite
    ): Promise<void> {
        const files = blueprint.includes.files || [];

        for (const file of files) {
            console.log(`Copying file: ${file.source} -> ${file.destination}`);

            // This would copy files to the WordPress installation
            const sourcePath = path.resolve(file.source);
            const destPath = path.join(site.path, file.destination);

            try {
                await fs.copyFile(sourcePath, destPath);
            } catch (error) {
                console.error(`Failed to copy file ${file.source}:`, error);
                throw error;
            }
        }
    }

    /**
     * Execute custom command step
     */
    private async executeCommandStep(
        step: any,
        blueprint: SiteBlueprint,
        site: WordPressSite
    ): Promise<void> {
        console.log(`Executing command: ${step.action}`);

        // This would execute custom commands (WP-CLI, shell commands, etc.)
        // Implementation depends on the specific command type
    }

    /**
     * Save custom blueprint
     */
    public async saveCustomBlueprint(blueprint: SiteBlueprint): Promise<void> {
        try {
            // Ensure it's marked as custom
            blueprint.isCustom = true;
            blueprint.isOfficial = false;
            blueprint.updated = new Date();

            // Validate blueprint
            if (!this.validateBlueprint(blueprint)) {
                throw new Error("Invalid blueprint configuration");
            }

            // Save to file system
            const filePath = path.join(
                this.customBlueprintsPath,
                `${blueprint.id}.json`
            );
            await fs.writeFile(filePath, JSON.stringify(blueprint, null, 2));

            // Add to memory
            this.blueprints.set(blueprint.id, blueprint);

            console.log(`Saved custom blueprint: ${blueprint.name}`);
        } catch (error) {
            console.error("Failed to save custom blueprint:", error);
            throw error;
        }
    }

    /**
     * Delete custom blueprint
     */
    public async deleteCustomBlueprint(blueprintId: string): Promise<void> {
        const blueprint = this.blueprints.get(blueprintId);

        if (!blueprint) {
            throw new Error(`Blueprint with ID ${blueprintId} not found`);
        }

        if (!blueprint.isCustom) {
            throw new Error("Cannot delete official blueprints");
        }

        try {
            // Remove from file system
            const filePath = path.join(
                this.customBlueprintsPath,
                `${blueprintId}.json`
            );
            await fs.unlink(filePath);

            // Remove from memory
            this.blueprints.delete(blueprintId);

            console.log(`Deleted custom blueprint: ${blueprint.name}`);
        } catch (error) {
            console.error("Failed to delete custom blueprint:", error);
            throw error;
        }
    }

    /**
     * Validate blueprint structure
     */
    private validateBlueprint(blueprint: SiteBlueprint): boolean {
        try {
            // Basic validation
            if (!blueprint.id || !blueprint.name || !blueprint.config) {
                return false;
            }

            // Validate required config fields
            if (!blueprint.config.phpVersion || !blueprint.config.webServer) {
                return false;
            }

            return true;
        } catch (error) {
            console.error("Blueprint validation error:", error);
            return false;
        }
    }

    /**
     * Create official blueprints
     */
    private createOfficialBlueprints(): SiteBlueprint[] {
        const now = new Date();

        return [
            // Simple Blog Blueprint
            {
                id: "official-simple-blog",
                name: "Simple Blog",
                description:
                    "A clean, minimalist blog perfect for personal writing and content sharing.",
                category: BlueprintCategory.BLOG,
                version: "1.0.0",
                author: "PressBox Team",
                tags: ["blog", "writing", "personal", "minimal"],
                isOfficial: true,
                isCustom: false,
                created: now,
                updated: now,
                config: {
                    phpVersion: "8.2",
                    webServer: "nginx",
                    database: "mysql",
                    ssl: false,
                    multisite: false,
                    siteSettings: {
                        blogname: "My Blog",
                        blogdescription: "Just another WordPress site",
                        permalink_structure:
                            "/%year%/%monthnum%/%day%/%postname%/",
                    },
                    defaultUser: {
                        username: "admin",
                        email: "admin@example.com",
                        displayName: "Administrator",
                        role: "administrator",
                    },
                },
                includes: {
                    themes: [
                        {
                            slug: "twentytwentyfour",
                            name: "Twenty Twenty-Four",
                            source: "wordpress.org",
                            activate: true,
                        },
                    ],
                    plugins: [
                        {
                            slug: "akismet",
                            name: "Akismet Anti-Spam",
                            source: "wordpress.org",
                            activate: true,
                        },
                    ],
                },
                setup: {
                    steps: [
                        {
                            id: "install-theme",
                            name: "Install Theme",
                            description: "Install and activate blog theme",
                            type: "theme",
                            action: "install",
                            optional: false,
                            order: 1,
                        },
                        {
                            id: "install-plugins",
                            name: "Install Plugins",
                            description: "Install essential blog plugins",
                            type: "plugin",
                            action: "install",
                            optional: false,
                            order: 2,
                        },
                        {
                            id: "configure-wordpress",
                            name: "Configure WordPress",
                            description: "Apply WordPress settings",
                            type: "wordpress",
                            action: "configure",
                            optional: false,
                            order: 3,
                        },
                    ],
                },
            },

            // Business Website Blueprint
            {
                id: "official-business-website",
                name: "Business Website",
                description:
                    "Professional business website with contact forms and service pages.",
                category: BlueprintCategory.BUSINESS,
                version: "1.0.0",
                author: "PressBox Team",
                tags: ["business", "professional", "corporate", "services"],
                isOfficial: true,
                isCustom: false,
                created: now,
                updated: now,
                config: {
                    phpVersion: "8.2",
                    webServer: "nginx",
                    database: "mysql",
                    ssl: true,
                    multisite: false,
                    siteSettings: {
                        blogname: "Business Name",
                        blogdescription: "Professional Business Services",
                        permalink_structure: "/%postname%/",
                    },
                },
                includes: {
                    themes: [
                        {
                            slug: "twentytwentyfour",
                            name: "Twenty Twenty-Four",
                            source: "wordpress.org",
                            activate: true,
                        },
                    ],
                    plugins: [
                        {
                            slug: "contact-form-7",
                            name: "Contact Form 7",
                            source: "wordpress.org",
                            activate: true,
                        },
                        {
                            slug: "yoast",
                            name: "Yoast SEO",
                            source: "wordpress.org",
                            activate: true,
                        },
                    ],
                },
                setup: {
                    steps: [
                        {
                            id: "install-theme",
                            name: "Install Business Theme",
                            description: "Install professional business theme",
                            type: "theme",
                            action: "install",
                            optional: false,
                            order: 1,
                        },
                        {
                            id: "install-plugins",
                            name: "Install Business Plugins",
                            description:
                                "Install contact forms and SEO plugins",
                            type: "plugin",
                            action: "install",
                            optional: false,
                            order: 2,
                        },
                    ],
                },
            },

            // E-commerce Blueprint
            {
                id: "official-ecommerce-store",
                name: "E-commerce Store",
                description:
                    "Complete online store with WooCommerce and payment processing.",
                category: BlueprintCategory.ECOMMERCE,
                version: "1.0.0",
                author: "PressBox Team",
                tags: ["ecommerce", "store", "woocommerce", "shop", "payments"],
                isOfficial: true,
                isCustom: false,
                created: now,
                updated: now,
                config: {
                    phpVersion: "8.2",
                    webServer: "nginx",
                    database: "mysql",
                    ssl: true,
                    multisite: false,
                    siteSettings: {
                        blogname: "My Store",
                        blogdescription: "Your Online Shop",
                        permalink_structure: "/%postname%/",
                    },
                },
                includes: {
                    themes: [
                        {
                            slug: "storefront",
                            name: "Storefront",
                            source: "wordpress.org",
                            activate: true,
                        },
                    ],
                    plugins: [
                        {
                            slug: "woocommerce",
                            name: "WooCommerce",
                            source: "wordpress.org",
                            activate: true,
                        },
                        {
                            slug: "woocommerce-gateway-stripe",
                            name: "WooCommerce Stripe Gateway",
                            source: "wordpress.org",
                            activate: true,
                        },
                    ],
                },
                setup: {
                    steps: [
                        {
                            id: "install-woocommerce-theme",
                            name: "Install E-commerce Theme",
                            description: "Install WooCommerce-compatible theme",
                            type: "theme",
                            action: "install",
                            optional: false,
                            order: 1,
                        },
                        {
                            id: "install-woocommerce",
                            name: "Install WooCommerce",
                            description: "Install and configure WooCommerce",
                            type: "plugin",
                            action: "install",
                            optional: false,
                            order: 2,
                        },
                    ],
                    postSetup: {
                        instructions: [
                            "Complete the WooCommerce setup wizard",
                            "Configure your payment methods",
                            "Add your first products",
                            "Set up shipping options",
                        ],
                    },
                },
            },

            // Portfolio Blueprint
            {
                id: "official-portfolio",
                name: "Creative Portfolio",
                description:
                    "Showcase your work with a beautiful, image-focused portfolio site.",
                category: BlueprintCategory.PORTFOLIO,
                version: "1.0.0",
                author: "PressBox Team",
                tags: [
                    "portfolio",
                    "creative",
                    "gallery",
                    "showcase",
                    "artist",
                ],
                isOfficial: true,
                isCustom: false,
                created: now,
                updated: now,
                config: {
                    phpVersion: "8.2",
                    webServer: "nginx",
                    database: "mysql",
                    ssl: false,
                    multisite: false,
                    siteSettings: {
                        blogname: "Creative Portfolio",
                        blogdescription: "Showcasing Creative Work",
                        permalink_structure: "/%postname%/",
                    },
                },
                includes: {
                    themes: [
                        {
                            slug: "twentytwentyfour",
                            name: "Twenty Twenty-Four",
                            source: "wordpress.org",
                            activate: true,
                        },
                    ],
                    plugins: [
                        {
                            slug: "jetpack",
                            name: "Jetpack",
                            source: "wordpress.org",
                            activate: true,
                        },
                    ],
                },
                setup: {
                    steps: [
                        {
                            id: "install-portfolio-theme",
                            name: "Install Portfolio Theme",
                            description:
                                "Install image-focused portfolio theme",
                            type: "theme",
                            action: "install",
                            optional: false,
                            order: 1,
                        },
                        {
                            id: "install-gallery-plugins",
                            name: "Install Gallery Plugins",
                            description:
                                "Install plugins for galleries and portfolios",
                            type: "plugin",
                            action: "install",
                            optional: false,
                            order: 2,
                        },
                    ],
                },
            },
        ];
    }
}
