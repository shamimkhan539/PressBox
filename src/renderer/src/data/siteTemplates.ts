/**
 * Site Template Definitions for PressBox
 *
 * Predefined configurations for different types of WordPress sites
 */

export interface SiteTemplate {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: "basic" | "ecommerce" | "blog" | "development" | "business";
    tags: string[];
    config: {
        phpVersion: string;
        wordpressVersion: string;
        plugins: string[];
        themes: string[];
        databaseType: "mysql" | "mariadb";
        features: string[];
    };
    dockerCompose?: any;
    postSetupTasks?: string[];
}

export const siteTemplates: SiteTemplate[] = [
    {
        id: "basic-wordpress",
        name: "Basic WordPress",
        description: "Clean WordPress installation with no plugins or themes",
        icon: "📝",
        category: "basic",
        tags: ["starter", "clean", "minimal"],
        config: {
            phpVersion: "8.2",
            wordpressVersion: "latest",
            plugins: [],
            themes: ["twentytwentyfour"],
            databaseType: "mysql",
            features: ["basic-setup"],
        },
        postSetupTasks: [
            "Set permalink structure to /%postname%/",
            "Create sample content",
            "Configure basic settings",
        ],
    },
    {
        id: "woocommerce-store",
        name: "WooCommerce Store",
        description:
            "Complete e-commerce setup with WooCommerce and essential plugins",
        icon: "🛒",
        category: "ecommerce",
        tags: ["ecommerce", "shop", "store", "woocommerce"],
        config: {
            phpVersion: "8.2",
            wordpressVersion: "latest",
            plugins: [
                "woocommerce",
                "woocommerce-payments",
                "jetpack",
                "mailchimp-for-woocommerce",
                "yoast-seo",
            ],
            themes: ["storefront"],
            databaseType: "mysql",
            features: ["ssl", "caching", "security"],
        },
        postSetupTasks: [
            "Run WooCommerce setup wizard",
            "Configure payment methods",
            "Setup shipping options",
            "Import sample products",
        ],
    },
    {
        id: "blog-magazine",
        name: "Blog & Magazine",
        description: "Content-focused site with SEO and publishing tools",
        icon: "📰",
        category: "blog",
        tags: ["blog", "content", "magazine", "publishing"],
        config: {
            phpVersion: "8.1",
            wordpressVersion: "latest",
            plugins: [
                "yoast-seo",
                "wp-rocket",
                "akismet",
                "jetpack",
                "editorial-calendar",
                "social-warfare",
            ],
            themes: ["astra", "generatepress"],
            databaseType: "mysql",
            features: ["seo", "social-sharing", "analytics"],
        },
        postSetupTasks: [
            "Configure Yoast SEO settings",
            "Setup social sharing",
            "Create editorial workflow",
            "Import sample posts",
        ],
    },
    {
        id: "plugin-development",
        name: "Plugin Development",
        description: "Development environment for WordPress plugin creation",
        icon: "🔌",
        category: "development",
        tags: ["development", "plugin", "coding", "debug"],
        config: {
            phpVersion: "8.2",
            wordpressVersion: "latest",
            plugins: [
                "query-monitor",
                "debug-bar",
                "wp-crontrol",
                "user-switching",
                "wp-cli",
            ],
            themes: ["twentytwentyfour"],
            databaseType: "mysql",
            features: ["debug-mode", "wp-cli", "xdebug", "logs"],
        },
        postSetupTasks: [
            "Enable WP_DEBUG constants",
            "Setup Xdebug configuration",
            "Create plugin starter template",
            "Configure development tools",
        ],
    },
    {
        id: "theme-development",
        name: "Theme Development",
        description: "Environment optimized for WordPress theme development",
        icon: "🎨",
        category: "development",
        tags: ["development", "theme", "design", "frontend"],
        config: {
            phpVersion: "8.2",
            wordpressVersion: "latest",
            plugins: [
                "theme-check",
                "developer",
                "query-monitor",
                "show-current-template",
                "custom-post-type-ui",
            ],
            themes: [],
            databaseType: "mysql",
            features: ["live-reload", "sass", "browsersync", "debug-mode"],
        },
        postSetupTasks: [
            "Setup theme development tools",
            "Configure live reload",
            "Import theme unit test data",
            "Setup Sass compilation",
        ],
    },
    {
        id: "business-website",
        name: "Business Website",
        description: "Professional business site with essential features",
        icon: "🏢",
        category: "business",
        tags: ["business", "corporate", "professional", "contact"],
        config: {
            phpVersion: "8.1",
            wordpressVersion: "latest",
            plugins: [
                "elementor",
                "contact-form-7",
                "yoast-seo",
                "wp-rocket",
                "updraftplus",
                "wordfence",
            ],
            themes: ["hello-elementor", "astra"],
            databaseType: "mysql",
            features: ["page-builder", "contact-forms", "security", "backup"],
        },
        postSetupTasks: [
            "Setup contact forms",
            "Configure security settings",
            "Create business pages",
            "Setup backup schedule",
        ],
    },
    {
        id: "multisite-network",
        name: "Multisite Network",
        description: "WordPress multisite network for managing multiple sites",
        icon: "🌐",
        category: "business",
        tags: ["multisite", "network", "multiple-sites", "enterprise"],
        config: {
            phpVersion: "8.2",
            wordpressVersion: "latest",
            plugins: [
                "wp-multi-network",
                "multisite-enhancements",
                "network-shared-media",
                "multisite-clone-duplicator",
            ],
            themes: ["twentytwentyfour"],
            databaseType: "mysql",
            features: ["multisite", "network-admin", "shared-plugins"],
        },
        postSetupTasks: [
            "Configure multisite settings",
            "Setup network administration",
            "Create initial subsites",
            "Configure shared resources",
        ],
    },
    {
        id: "headless-wp",
        name: "Headless WordPress",
        description: "WordPress as a headless CMS with REST API focus",
        icon: "🔄",
        category: "development",
        tags: ["headless", "api", "rest", "decoupled", "modern"],
        config: {
            phpVersion: "8.2",
            wordpressVersion: "latest",
            plugins: [
                "wp-rest-api",
                "jwt-authentication-for-wp-rest-api",
                "wp-graphql",
                "advanced-custom-fields",
                "custom-post-type-ui",
            ],
            themes: [],
            databaseType: "mysql",
            features: ["rest-api", "graphql", "cors", "jwt-auth"],
        },
        postSetupTasks: [
            "Configure REST API settings",
            "Setup JWT authentication",
            "Create custom post types",
            "Configure CORS headers",
        ],
    },
];

export const getTemplatesByCategory = (category?: string) => {
    if (!category) return siteTemplates;
    return siteTemplates.filter((template) => template.category === category);
};

export const getTemplateById = (id: string) => {
    return siteTemplates.find((template) => template.id === id);
};

export const searchTemplates = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return siteTemplates.filter(
        (template) =>
            template.name.toLowerCase().includes(lowercaseQuery) ||
            template.description.toLowerCase().includes(lowercaseQuery) ||
            template.tags.some((tag) => tag.includes(lowercaseQuery))
    );
};
