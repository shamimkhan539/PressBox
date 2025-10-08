import { join } from "path";
import { promises as fs } from "fs";
import { WordPressSite } from "../../shared/types";

export interface ComposeTemplateConfig {
    webServer: "nginx" | "apache";
    phpVersion: string;
    database: "mysql" | "mariadb";
    ssl: boolean;
    xdebug: boolean;
    mailpit: boolean;
}

export interface ComposeEnvironment {
    SITE_ID: string;
    SITE_DOMAIN: string;
    SITE_PATH: string;
    CONFIG_PATH: string;
    SSL_PATH: string;
    LOGS_PATH: string;
    DATA_PATH: string;
    HTTP_PORT: string;
    HTTPS_PORT: string;
    MYSQL_PORT: string;
    ADMINER_PORT: string;
    MAILPIT_PORT: string;
    MAILPIT_SMTP_PORT: string;
    PHP_VERSION: string;
    MYSQL_VERSION: string;
    DB_NAME: string;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_ROOT_PASSWORD: string;
    XDEBUG_MODE: string;
    PHP_MEMORY_LIMIT: string;
    PHP_MAX_EXECUTION_TIME: string;
    PRESSBOX_VERSION: string;
}

/**
 * Template Manager
 *
 * Handles Docker Compose template generation and configuration file management
 */
export class TemplateManager {
    private templatesPath: string;

    constructor() {
        this.templatesPath = join(__dirname, "..", "templates");
    }

    /**
     * Generate Docker Compose configuration for a site
     */
    async generateCompose(
        siteId: string,
        config: ComposeTemplateConfig
    ): Promise<string> {
        const templateName = this.getTemplateName(config);
        const templatePath = join(
            this.templatesPath,
            "docker-compose",
            `${templateName}.yml`
        );

        try {
            let template = await fs.readFile(templatePath, "utf-8");

            // Generate environment variables
            const env = await this.generateEnvironment(siteId, config);

            // Replace template variables
            template = this.replaceTemplateVariables(template, env);

            return template;
        } catch (error) {
            throw new Error(
                `Failed to generate Docker Compose template: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Generate server configuration from template
     */
    async generateServerConfig(
        siteId: string,
        serverType: "nginx" | "apache",
        config: ComposeTemplateConfig
    ): Promise<string> {
        const templatePath = join(
            this.templatesPath,
            "configs",
            serverType,
            "default.conf"
        );

        try {
            let template = await fs.readFile(templatePath, "utf-8");

            // Generate environment variables
            const env = await this.generateEnvironment(siteId, config);

            // Replace template variables
            template = this.replaceTemplateVariables(template, env);

            return template;
        } catch (error) {
            throw new Error(
                `Failed to generate ${serverType} configuration: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Generate PHP configuration from template
     */
    async generatePHPConfig(
        siteId: string,
        phpVersion: string,
        config: ComposeTemplateConfig
    ): Promise<string> {
        const templatePath = join(
            this.templatesPath,
            "configs",
            "php",
            `php${phpVersion}.ini`
        );

        try {
            let template = await fs.readFile(templatePath, "utf-8");

            // Generate environment variables
            const env = await this.generateEnvironment(siteId, config);

            // Replace template variables and add Xdebug if enabled
            template = this.replaceTemplateVariables(template, env);

            if (config.xdebug) {
                template += this.getXdebugConfig();
            }

            return template;
        } catch (error) {
            // Fallback to generic PHP config
            console.warn(
                `No specific PHP ${phpVersion} template found, using generic template`
            );
            return await this.generateGenericPHPConfig(siteId, config);
        }
    }

    /**
     * Generate MySQL configuration from template
     */
    async generateMySQLConfig(
        siteId: string,
        config: ComposeTemplateConfig
    ): Promise<string> {
        const templatePath = join(
            this.templatesPath,
            "configs",
            "mysql",
            "custom.cnf"
        );

        try {
            let template = await fs.readFile(templatePath, "utf-8");

            // Generate environment variables
            const env = await this.generateEnvironment(siteId, config);

            // Replace template variables
            template = this.replaceTemplateVariables(template, env);

            return template;
        } catch (error) {
            throw new Error(
                `Failed to generate MySQL configuration: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Get available templates
     */
    async getAvailableTemplates(): Promise<string[]> {
        try {
            const templateDir = join(this.templatesPath, "docker-compose");
            const files = await fs.readdir(templateDir);
            return files
                .filter((file) => file.endsWith(".yml"))
                .map((file) => file.replace(".yml", ""));
        } catch (error) {
            console.error("Failed to list templates:", error);
            return [];
        }
    }

    /**
     * Validate template exists
     */
    async validateTemplate(templateName: string): Promise<boolean> {
        const templatePath = join(
            this.templatesPath,
            "docker-compose",
            `${templateName}.yml`
        );
        try {
            await fs.access(templatePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get template name based on configuration
     */
    private getTemplateName(config: ComposeTemplateConfig): string {
        return `${config.webServer}-${config.database}`;
    }

    /**
     * Generate environment variables for template substitution
     */
    private async generateEnvironment(
        siteId: string,
        config: ComposeTemplateConfig
    ): Promise<ComposeEnvironment> {
        // Get site configuration (this would typically come from WordPress manager)
        const siteName = siteId.replace(/[^a-zA-Z0-9]/g, "");
        const domain = `${siteName}.local`;

        // Generate ports (this would typically be managed by port manager)
        const basePort = 8000 + (parseInt(siteId.slice(-3), 16) % 1000);

        return {
            SITE_ID: siteId,
            SITE_DOMAIN: domain,
            SITE_PATH: join(
                process.env.HOME || process.env.USERPROFILE || ".",
                "PressBox",
                "sites",
                siteId
            ),
            CONFIG_PATH: join(
                process.env.HOME || process.env.USERPROFILE || ".",
                "PressBox",
                "configs",
                siteId
            ),
            SSL_PATH: join(
                process.env.HOME || process.env.USERPROFILE || ".",
                "PressBox",
                "ssl",
                siteId
            ),
            LOGS_PATH: join(
                process.env.HOME || process.env.USERPROFILE || ".",
                "PressBox",
                "logs",
                siteId
            ),
            DATA_PATH: join(
                process.env.HOME || process.env.USERPROFILE || ".",
                "PressBox",
                "data",
                siteId
            ),
            HTTP_PORT: basePort.toString(),
            HTTPS_PORT: (basePort + 1).toString(),
            MYSQL_PORT: (basePort + 2).toString(),
            ADMINER_PORT: (basePort + 3).toString(),
            MAILPIT_PORT: (basePort + 4).toString(),
            MAILPIT_SMTP_PORT: (basePort + 5).toString(),
            PHP_VERSION: config.phpVersion,
            MYSQL_VERSION: config.database === "mysql" ? "8.0" : "10.6",
            DB_NAME: "wordpress",
            DB_USER: "wp_user",
            DB_PASSWORD: "wp_password",
            DB_ROOT_PASSWORD: "root_password",
            XDEBUG_MODE: config.xdebug ? "debug" : "off",
            PHP_MEMORY_LIMIT: "512M",
            PHP_MAX_EXECUTION_TIME: "300",
            PRESSBOX_VERSION: "1.0.0",
        };
    }

    /**
     * Replace template variables with actual values
     */
    private replaceTemplateVariables(
        template: string,
        env: ComposeEnvironment
    ): string {
        let result = template;

        // Replace all ${VAR} placeholders
        Object.entries(env).forEach(([key, value]) => {
            const regex = new RegExp(`\\$\\{${key}\\}`, "g");
            result = result.replace(regex, value);
        });

        return result;
    }

    /**
     * Generate generic PHP configuration
     */
    private async generateGenericPHPConfig(
        siteId: string,
        config: ComposeTemplateConfig
    ): Promise<string> {
        const baseConfig = `
; PHP Configuration for WordPress Development
; Generic configuration for PHP ${config.phpVersion}

[PHP]
engine = On
short_open_tag = Off
precision = 14
output_buffering = 4096
zlib.output_compression = Off
implicit_flush = Off
serialize_precision = -1
disable_functions =
disable_classes =
zend.enable_gc = On

expose_php = Off
max_execution_time = 300
max_input_time = 300
memory_limit = 512M

error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT
display_errors = On
display_startup_errors = On
log_errors = On
log_errors_max_len = 1024
ignore_repeated_errors = Off
ignore_repeated_source = Off
report_memleaks = On

error_log = /var/log/php/error.log

variables_order = "GPCS"
request_order = "GP"
register_argc_argv = Off
auto_globals_jit = On
post_max_size = 256M
auto_prepend_file =
auto_append_file =
default_mimetype = "text/html"
default_charset = "UTF-8"

file_uploads = On
upload_max_filesize = 256M
max_file_uploads = 20

allow_url_fopen = On
allow_url_include = Off
default_socket_timeout = 60

date.timezone = UTC

[opcache]
opcache.enable = 1
opcache.enable_cli = 1
opcache.memory_consumption = 128
opcache.interned_strings_buffer = 8
opcache.max_accelerated_files = 4000
opcache.revalidate_freq = 2
opcache.fast_shutdown = 1
opcache.validate_timestamps = 1

[mail function]
SMTP = localhost
smtp_port = 1025
mail.add_x_header = Off
        `.trim();

        return baseConfig;
    }

    /**
     * Get Xdebug configuration
     */
    private getXdebugConfig(): string {
        return `

; Xdebug Configuration
[xdebug]
zend_extension=xdebug
xdebug.mode=debug
xdebug.start_with_request=yes
xdebug.client_host=host.docker.internal
xdebug.client_port=9003
xdebug.log=/var/log/php/xdebug.log
xdebug.idekey=VSCODE
`;
    }

    /**
     * Generate environment file content
     */
    async generateEnvFile(
        siteId: string,
        config: ComposeTemplateConfig
    ): Promise<string> {
        const env = await this.generateEnvironment(siteId, config);

        return Object.entries(env)
            .map(([key, value]) => `${key}=${value}`)
            .join("\n");
    }

    /**
     * Save generated files to disk
     */
    async saveGeneratedFiles(
        siteId: string,
        config: ComposeTemplateConfig
    ): Promise<void> {
        const sitePath = join(
            process.env.HOME || process.env.USERPROFILE || ".",
            "PressBox",
            "sites",
            siteId
        );

        const configPath = join(
            process.env.HOME || process.env.USERPROFILE || ".",
            "PressBox",
            "configs",
            siteId
        );

        // Ensure directories exist
        await fs.mkdir(sitePath, { recursive: true });
        await fs.mkdir(configPath, { recursive: true });
        await fs.mkdir(join(configPath, config.webServer), { recursive: true });
        await fs.mkdir(join(configPath, "php"), { recursive: true });
        await fs.mkdir(join(configPath, "mysql"), { recursive: true });

        try {
            // Generate and save Docker Compose file
            const compose = await this.generateCompose(siteId, config);
            await fs.writeFile(join(sitePath, "docker-compose.yml"), compose);

            // Generate and save environment file
            const envFile = await this.generateEnvFile(siteId, config);
            await fs.writeFile(join(sitePath, ".env"), envFile);

            // Generate and save server configuration
            const serverConfig = await this.generateServerConfig(
                siteId,
                config.webServer,
                config
            );
            await fs.writeFile(
                join(configPath, config.webServer, "site.conf"),
                serverConfig
            );

            // Generate and save PHP configuration
            const phpConfig = await this.generatePHPConfig(
                siteId,
                config.phpVersion,
                config
            );
            await fs.writeFile(join(configPath, "php", "php.ini"), phpConfig);

            // Generate and save MySQL configuration
            const mysqlConfig = await this.generateMySQLConfig(siteId, config);
            await fs.writeFile(
                join(configPath, "mysql", "custom.cnf"),
                mysqlConfig
            );

            console.log(`Generated configuration files for site ${siteId}`);
        } catch (error) {
            throw new Error(
                `Failed to save generated files: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }
}
