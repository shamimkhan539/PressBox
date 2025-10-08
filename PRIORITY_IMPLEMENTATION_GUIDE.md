# 🚀 PressBox Priority Implementation Guide

## 🎯 Immediate Implementation Priority (Next 2-4 weeks)

Based on the LocalWP features analysis, here are the critical features that will provide maximum impact for PressBox users.

---

## 🔥 **Priority 1: Multi-Server Environment Support**

### Current State

PressBox currently uses basic Docker containers. We need to implement full multi-server support with hot-swapping capabilities.

### Implementation Plan

#### 1.1 Docker Compose Templates

Create service-specific Docker Compose configurations:

```yaml
# templates/nginx-php8.1-mysql.yml
version: "3.8"
services:
    nginx:
        image: nginx:alpine
        ports:
            - "${PORT}:80"
            - "${SSL_PORT}:443"
        volumes:
            - ./nginx.conf:/etc/nginx/conf.d/default.conf
            - ./site:/var/www/html
            - ./ssl:/etc/nginx/ssl
        depends_on:
            - php

    php:
        image: pressbox/php:8.1-fpm
        volumes:
            - ./site:/var/www/html
            - ./php.ini:/usr/local/etc/php/php.ini
        environment:
            - XDEBUG_MODE=debug
            - XDEBUG_CONFIG=client_host=host.docker.internal

    mysql:
        image: mysql:8.0
        environment:
            MYSQL_ROOT_PASSWORD: root
            MYSQL_DATABASE: wordpress
            MYSQL_USER: wp_user
            MYSQL_PASSWORD: wp_password
        volumes:
            - mysql_data:/var/lib/mysql
            - ./mysql.cnf:/etc/mysql/conf.d/custom.cnf

volumes:
    mysql_data:
```

#### 1.2 Server Management Service

```typescript
// src/main/services/serverManager.ts
export class ServerManager {
    private composeTemplates: Map<string, string> = new Map();

    async swapWebServer(
        siteId: string,
        fromServer: "nginx" | "apache",
        toServer: "nginx" | "apache"
    ): Promise<void> {
        const site = await this.wordpressManager.getSite(siteId);
        if (!site) throw new Error("Site not found");

        // 1. Backup current configuration
        await this.backupServerConfig(site, fromServer);

        // 2. Stop current containers
        await this.dockerManager.stopSite(siteId);

        // 3. Generate new Docker Compose with target server
        const newCompose = await this.generateCompose(site, {
            webServer: toServer,
            phpVersion: site.phpVersion,
            database: site.database,
        });

        // 4. Update site configuration
        await this.updateSiteConfig(siteId, { webServer: toServer });

        // 5. Start with new server
        await this.dockerManager.startSite(siteId);

        // 6. Migrate server-specific configurations
        await this.migrateServerConfig(site, fromServer, toServer);
    }

    async changePHPVersion(siteId: string, newVersion: string): Promise<void> {
        const site = await this.wordpressManager.getSite(siteId);
        if (!site) throw new Error("Site not found");

        // Hot-swap PHP version without downtime
        await this.dockerManager.updateService(siteId, "php", {
            image: `pressbox/php:${newVersion}-fpm`,
        });

        await this.updateSiteConfig(siteId, { phpVersion: newVersion });
    }

    private async migrateServerConfig(
        site: WordPressSite,
        from: string,
        to: string
    ): Promise<void> {
        // Convert between nginx.conf and apache.conf
        const converter = new ServerConfigConverter();
        const oldConfig = await this.getServerConfig(site.id, from);
        const newConfig = await converter.convert(oldConfig, from, to);
        await this.saveServerConfig(site.id, to, newConfig);
    }
}
```

---

## 🔥 **Priority 2: Advanced Import/Export System**

### 2.1 Comprehensive Export Wizard

```typescript
// src/renderer/components/ExportWizard.tsx
interface ExportWizardProps {
    siteId: string;
    onComplete: (exportPath: string) => void;
}

export const ExportWizard: React.FC<ExportWizardProps> = ({ siteId, onComplete }) => {
    const [exportOptions, setExportOptions] = useState<ExportOptions>({
        includeFiles: true,
        includeDatabases: true,
        includeConfigs: true,
        includeLogFiles: false,
        includePressBoxSettings: true,
        excludePatterns: [
            '*.git*',
            '*.psd',
            '*.ai',
            'node_modules',
            '.DS_Store',
            'Thumbs.db',
            '*.tmp',
            '*.cache'
        ],
        compressionLevel: 'best'
    });

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const result = await window.electronAPI.exportSite(siteId, exportOptions);
            onComplete(result.exportPath);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="export-wizard">
            <div className="export-options">
                <h3>What to Export</h3>

                <div className="option-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={exportOptions.includeFiles}
                            onChange={(e) => setExportOptions(prev => ({
                                ...prev,
                                includeFiles: e.target.checked
                            }))}
                        />
                        Site Files (themes, plugins, uploads)
                    </label>
                </div>

                <div className="option-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={exportOptions.includeDatabases}
                            onChange={(e) => setExportOptions(prev => ({
                                ...prev,
                                includeDatabases: e.target.checked
                            }))}
                        />
                        WordPress Database
                    </label>
                </div>

                <div className="exclusion-patterns">
                    <h4>Exclude Files</h4>
                    <div className="pattern-list">
                        {exportOptions.excludePatterns.map((pattern, index) => (
                            <div key={index} className="pattern-item">
                                <span>{pattern}</span>
                                <button onClick={() => removeExcludePattern(index)}>×</button>
                            </div>
                        ))}
                    </div>
                    <input
                        placeholder="Add exclude pattern..."
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                addExcludePattern(e.currentTarget.value);
                                e.currentTarget.value = '';
                            }
                        }}
                    />
                </div>
            </div>

            <div className="export-actions">
                <button onClick={handleExport} disabled={isExporting}>
                    {isExporting ? 'Exporting...' : 'Export Site'}
                </button>
            </div>
        </div>
    );
};
```

### 2.2 Export Service Implementation

```typescript
// src/main/services/exportManager.ts
export class ExportManager {
    async exportSite(
        siteId: string,
        options: ExportOptions
    ): Promise<ExportResult> {
        const site = await this.wordpressManager.getSite(siteId);
        if (!site) throw new Error("Site not found");

        const exportId = uuidv4();
        const exportPath = join(
            this.getExportsPath(),
            `${site.name}-${Date.now()}.pbx`
        );

        try {
            // Create temporary directory for export preparation
            const tempDir = join(os.tmpdir(), `pressbox-export-${exportId}`);
            await fs.mkdir(tempDir, { recursive: true });

            const manifest: ExportManifest = {
                version: "1.0",
                site: site,
                exportOptions: options,
                createdAt: new Date(),
                components: [],
            };

            // Export site files
            if (options.includeFiles) {
                await this.exportSiteFiles(
                    site,
                    tempDir,
                    options.excludePatterns
                );
                manifest.components.push("files");
            }

            // Export database
            if (options.includeDatabases) {
                await this.exportDatabase(site, tempDir);
                manifest.components.push("database");
            }

            // Export configurations
            if (options.includeConfigs) {
                await this.exportConfigurations(site, tempDir);
                manifest.components.push("configs");
            }

            // Export PressBox settings
            if (options.includePressBoxSettings) {
                await this.exportPressBoxSettings(site, tempDir);
                manifest.components.push("pressbox-settings");
            }

            // Create manifest file
            await fs.writeFile(
                join(tempDir, "manifest.json"),
                JSON.stringify(manifest, null, 2)
            );

            // Create compressed archive
            await this.createArchive(
                tempDir,
                exportPath,
                options.compressionLevel
            );

            // Calculate checksums
            const checksums = await this.calculateChecksums(exportPath);

            // Cleanup temp directory
            await fs.rmdir(tempDir, { recursive: true });

            return {
                exportPath,
                size: (await fs.stat(exportPath)).size,
                manifest,
                checksums,
            };
        } catch (error) {
            throw new PressBoxError("Export failed", "EXPORT_ERROR", {
                error,
                siteId,
                options,
            });
        }
    }

    private async exportSiteFiles(
        site: WordPressSite,
        tempDir: string,
        excludePatterns: string[]
    ): Promise<void> {
        const siteFilesDir = join(tempDir, "files");
        await fs.mkdir(siteFilesDir, { recursive: true });

        // Copy WordPress files while respecting exclude patterns
        const globIgnore = excludePatterns.map((pattern) => `**/${pattern}`);

        await this.copyWithExclusions(site.path, siteFilesDir, globIgnore);
    }

    private async exportDatabase(
        site: WordPressSite,
        tempDir: string
    ): Promise<void> {
        const dbDir = join(tempDir, "database");
        await fs.mkdir(dbDir, { recursive: true });

        // Create database dump using Docker exec
        const dumpPath = join(dbDir, "wordpress.sql");
        await this.dockerManager.execInContainer(
            `${site.id}_mysql`,
            ["mysqldump", "-u", "root", "-proot", "wordpress"],
            { outputFile: dumpPath }
        );
    }

    private async exportConfigurations(
        site: WordPressSite,
        tempDir: string
    ): Promise<void> {
        const configDir = join(tempDir, "configs");
        await fs.mkdir(configDir, { recursive: true });

        // Export all service configurations
        const configs = [
            { service: "nginx", file: "nginx.conf" },
            { service: "apache", file: "apache.conf" },
            { service: "php", file: "php.ini" },
            { service: "mysql", file: "mysql.cnf" },
        ];

        for (const config of configs) {
            try {
                const configContent = await this.getServiceConfig(
                    site.id,
                    config.service
                );
                await fs.writeFile(join(configDir, config.file), configContent);
            } catch (error) {
                console.warn(
                    `Could not export ${config.service} config:`,
                    error
                );
            }
        }
    }
}
```

---

## 🔥 **Priority 3: Site Blueprints System**

### 3.1 Blueprint Manager

```typescript
// src/main/services/blueprintManager.ts
export class BlueprintManager {
    private blueprintsPath: string;
    private blueprints: Map<string, SiteBlueprint> = new Map();

    constructor() {
        this.blueprintsPath = join(
            process.env.HOME || process.env.USERPROFILE || ".",
            "PressBox",
            "blueprints"
        );
        this.initialize();
    }

    async createBlueprint(
        siteId: string,
        options: BlueprintCreateOptions
    ): Promise<SiteBlueprint> {
        const site = await this.wordpressManager.getSite(siteId);
        if (!site) throw new Error("Site not found");

        const blueprintId = uuidv4();
        const blueprint: SiteBlueprint = {
            id: blueprintId,
            name: options.name || `${site.name} Blueprint`,
            description:
                options.description || `Blueprint created from ${site.name}`,
            version: "1.0.0",
            author: "PressBox User",
            tags: options.tags || ["wordpress", "development"],
            thumbnail: await this.generateThumbnail(siteId),

            // Configuration
            phpVersion: site.phpVersion,
            webServer: site.webServer,
            plugins: await this.extractPluginsList(
                siteId,
                options.includePlugins
            ),
            theme: await this.extractThemeInfo(siteId, options.includeThemes),

            // Content flags
            hasContent: options.includePosts || options.includePages,
            hasUsers: options.includeUsers,
            hasUploads: options.includeUploads,

            // Metadata
            createdAt: new Date(),
            updatedAt: new Date(),
            fileSize: 0, // Will be calculated after creation
        };

        // Export site as blueprint
        const blueprintPath = join(this.blueprintsPath, blueprintId);
        await fs.mkdir(blueprintPath, { recursive: true });

        // Create blueprint archive
        const exportOptions: ExportOptions = {
            includeFiles: true,
            includeDatabases:
                options.includePosts ||
                options.includePages ||
                options.includeUsers,
            includeConfigs: true,
            includePressBoxSettings: true,
            includeLogFiles: false,
            excludePatterns: this.getBlueprintExclusions(options),
        };

        const exportResult = await this.exportManager.exportSite(
            siteId,
            exportOptions
        );

        // Move export to blueprints directory
        const blueprintArchive = join(blueprintPath, "blueprint.pbx");
        await fs.rename(exportResult.exportPath, blueprintArchive);

        // Update file size
        blueprint.fileSize = (await fs.stat(blueprintArchive)).size;

        // Save blueprint metadata
        await fs.writeFile(
            join(blueprintPath, "blueprint.json"),
            JSON.stringify(blueprint, null, 2)
        );

        this.blueprints.set(blueprintId, blueprint);
        return blueprint;
    }

    async createSiteFromBlueprint(
        blueprintId: string,
        siteConfig: CreateSiteFromBlueprintRequest
    ): Promise<WordPressSite> {
        const blueprint = this.blueprints.get(blueprintId);
        if (!blueprint) throw new Error("Blueprint not found");

        // Create new site with blueprint configuration
        const newSiteConfig: CreateSiteRequest = {
            name: siteConfig.siteName,
            domain:
                siteConfig.domain ||
                `${siteConfig.siteName.toLowerCase().replace(/\s+/g, "-")}.local`,
            phpVersion: blueprint.phpVersion,
            webServer: blueprint.webServer,
            ssl: true,
            adminUser: siteConfig.adminUser || "admin",
            adminPassword: siteConfig.adminPassword || "admin",
            adminEmail: siteConfig.adminEmail || "admin@local.dev",
        };

        // Create base site
        const site = await this.wordpressManager.createSite(newSiteConfig);

        try {
            // Import blueprint content
            const blueprintArchive = join(
                this.blueprintsPath,
                blueprintId,
                "blueprint.pbx"
            );
            await this.importManager.importSite(blueprintArchive, {
                targetSiteId: site.id,
                overwriteExisting: true,
                preserveSiteSettings: false,
            });

            // Update site URL and database if needed
            if (siteConfig.domain !== blueprint.domain) {
                await this.updateSiteURL(site.id, siteConfig.domain);
            }

            // Create admin user if blueprint doesn't have users
            if (!blueprint.hasUsers) {
                await this.createAdminUser(site.id, newSiteConfig);
            }

            return site;
        } catch (error) {
            // Cleanup failed site creation
            await this.wordpressManager.deleteSite(site.id);
            throw new PressBoxError(
                "Failed to create site from blueprint",
                "BLUEPRINT_IMPORT_ERROR",
                { error, blueprintId, siteConfig }
            );
        }
    }

    private getBlueprintExclusions(options: BlueprintCreateOptions): string[] {
        const exclusions = [
            ".git*",
            "node_modules",
            ".DS_Store",
            "Thumbs.db",
            "*.log",
            "*.tmp",
        ];

        if (!options.includeUploads) {
            exclusions.push("wp-content/uploads/*");
        }

        return exclusions;
    }
}
```

### 3.2 Blueprint Creation UI

```typescript
// src/renderer/components/BlueprintWizard.tsx
export const BlueprintWizard: React.FC<{ siteId: string }> = ({ siteId }) => {
    const [step, setStep] = useState(1);
    const [blueprintConfig, setBlueprintConfig] = useState<BlueprintCreateOptions>({
        name: '',
        description: '',
        tags: [],
        includePosts: false,
        includePages: false,
        includeUsers: false,
        includeUploads: false,
        includePlugins: true,
        includeThemes: true,
        includeCustomizations: true
    });

    const steps = [
        { id: 1, title: 'Basic Info', component: <BasicInfoStep /> },
        { id: 2, title: 'Content', component: <ContentSelectionStep /> },
        { id: 3, title: 'Plugins & Themes', component: <PluginsThemesStep /> },
        { id: 4, title: 'Review', component: <ReviewStep /> }
    ];

    return (
        <div className="blueprint-wizard">
            <div className="wizard-header">
                <h2>Create Site Blueprint</h2>
                <div className="step-indicator">
                    {steps.map(s => (
                        <div
                            key={s.id}
                            className={`step ${step >= s.id ? 'active' : ''}`}
                        >
                            {s.title}
                        </div>
                    ))}
                </div>
            </div>

            <div className="wizard-content">
                {steps.find(s => s.id === step)?.component}
            </div>

            <div className="wizard-actions">
                {step > 1 && (
                    <button onClick={() => setStep(step - 1)}>
                        Previous
                    </button>
                )}
                {step < steps.length ? (
                    <button onClick={() => setStep(step + 1)}>
                        Next
                    </button>
                ) : (
                    <button onClick={handleCreateBlueprint}>
                        Create Blueprint
                    </button>
                )}
            </div>
        </div>
    );
};
```

---

## 🎯 **Implementation Schedule (Next 4 weeks)**

### Week 1: Multi-Server Foundation

- [ ] Docker Compose templates for NGINX/Apache
- [ ] Server swapping functionality
- [ ] PHP version switching
- [ ] Basic configuration management

### Week 2: Export/Import System

- [ ] Export wizard UI
- [ ] Comprehensive export functionality
- [ ] Import system with conflict resolution
- [ ] Archive compression and validation

### Week 3: Blueprint System

- [ ] Blueprint creation workflow
- [ ] Blueprint storage and management
- [ ] Site creation from blueprints
- [ ] Blueprint sharing (local filesystem)

### Week 4: Integration & Testing

- [ ] End-to-end testing of all features
- [ ] Performance optimization
- [ ] UI/UX improvements
- [ ] Documentation updates

---

## 🚀 **Success Metrics**

1. **Server Swapping**: < 30 seconds to switch between NGINX/Apache
2. **Export Speed**: Complete site export in < 2 minutes
3. **Blueprint Creation**: Create and deploy from blueprint in < 1 minute
4. **Reliability**: 99% success rate for all operations
5. **User Experience**: Intuitive workflows with clear progress indicators

This implementation plan focuses on the most impactful LocalWP features that will immediately enhance PressBox's capabilities while maintaining the existing architecture and user experience.
