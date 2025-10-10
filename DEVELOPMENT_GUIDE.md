# PressBox Development Guide

## 🔧 **Adding New Features**

### **1. Adding New Site Templates**

```typescript
// src/main/services/templateManager.ts
export class TemplateManager {
    async createFromTemplate(templateName: string, siteConfig: SiteConfig) {
        // Download template-specific WordPress setup
        // Apply template configurations
        // Install required plugins/themes
    }
}
```

### **2. Adding SSL Support**

```typescript
// src/main/services/sslManager.ts
export class SSLManager {
    async generateSelfSignedCert(domain: string) {
        // Generate SSL certificate for local development
        // Update site configuration for HTTPS
    }
}
```

### **3. Adding Database Tools**

```typescript
// src/main/services/databaseTools.ts
export class DatabaseTools {
    async exportDatabase(siteId: string): Promise<string> {
        // Export site database to SQL file
    }

    async importDatabase(siteId: string, sqlFile: string): Promise<void> {
        // Import SQL file to site database
    }
}
```

### **4. Adding Plugin Management**

```typescript
// src/main/services/pluginManager.ts
export class WordPressPluginManager {
    async installPlugin(siteId: string, pluginSlug: string) {
        // Download and install WordPress plugin
    }

    async activatePlugin(siteId: string, pluginName: string) {
        // Activate plugin via WordPress API
    }
}
```

## 🎨 **UI Component Examples**

### **Site Template Selector**

```tsx
// src/renderer/src/components/TemplateSelector.tsx
export const TemplateSelector: React.FC = () => {
    const templates = [
        {
            id: "blog",
            name: "Blog Site",
            description: "WordPress blog with Twenty Twenty-Three theme",
        },
        {
            id: "ecommerce",
            name: "E-commerce",
            description: "WooCommerce store setup",
        },
        {
            id: "portfolio",
            name: "Portfolio",
            description: "Creative portfolio theme",
        },
    ];

    return (
        <div className="grid grid-cols-3 gap-4">
            {templates.map((template) => (
                <TemplateCard key={template.id} template={template} />
            ))}
        </div>
    );
};
```

### **Database Tools Panel**

```tsx
// src/renderer/src/components/DatabasePanel.tsx
export const DatabasePanel: React.FC<{ siteId: string }> = ({ siteId }) => {
    const handleExport = async () => {
        const exportPath = await window.electronAPI.database.export(siteId);
        // Show success notification
    };

    return (
        <div className="p-4 border rounded">
            <h3>Database Tools</h3>
            <button onClick={handleExport}>Export Database</button>
            <button onClick={handleImport}>Import Database</button>
        </div>
    );
};
```

## 🚀 **Performance Optimizations**

### **1. Site Caching**

```typescript
// Cache site status to avoid repeated checks
class SiteStatusCache {
    private cache = new Map<
        string,
        { status: SiteStatus; timestamp: number }
    >();

    get(siteId: string): SiteStatus | null {
        const cached = this.cache.get(siteId);
        if (cached && Date.now() - cached.timestamp < 5000) {
            return cached.status;
        }
        return null;
    }
}
```

### **2. Background WordPress Downloads**

```typescript
// Download WordPress in background while user fills form
class BackgroundDownloader {
    async predownloadWordPress(version: string) {
        // Start download in background
        // Show progress in UI
    }
}
```

## 🔒 **Security Enhancements**

### **1. Site Isolation**

```typescript
// Ensure each site runs in its own process space
class SiteIsolationManager {
    async createIsolatedEnvironment(siteId: string) {
        // Create separate user account for site (Linux/macOS)
        // Set file permissions appropriately
    }
}
```

### **2. Secure File Handling**

```typescript
// Validate file paths to prevent directory traversal
function validateSitePath(siteName: string): boolean {
    return /^[a-zA-Z0-9_-]+$/.test(siteName);
}
```

## 📦 **Packaging & Distribution**

### **1. Code Signing**

```javascript
// electron-forge.config.js
module.exports = {
    makers: [
        {
            name: "@electron-forge/maker-squirrel",
            config: {
                certificateFile: "path/to/certificate.p12",
                certificatePassword: process.env.CERTIFICATE_PASSWORD,
            },
        },
    ],
};
```

### **2. Auto Updates**

```typescript
// src/main/updater.ts
import { autoUpdater } from "electron-updater";

export class AppUpdater {
    constructor() {
        autoUpdater.checkForUpdatesAndNotify();
        autoUpdater.on("update-available", this.onUpdateAvailable);
    }

    private onUpdateAvailable() {
        // Show update notification to user
    }
}
```

## 🧪 **Testing**

### **1. Unit Tests**

```typescript
// tests/services/wordpressManager.test.ts
describe("WordPressManager", () => {
    test("should create WordPress site", async () => {
        const manager = new WordPressManager();
        const site = await manager.createSite({
            name: "test-site",
            domain: "test.local",
        });

        expect(site.name).toBe("test-site");
        expect(site.status).toBe("stopped");
    });
});
```

### **2. Integration Tests**

```typescript
// tests/integration/site-creation.test.ts
test("full site creation workflow", async () => {
    // Test complete workflow from UI to running site
    const siteConfig = createTestSiteConfig();
    const site = await createSiteViaAPI(siteConfig);
    await startSiteViaAPI(site.id);

    const response = await fetch(`http://localhost:${site.port}`);
    expect(response.status).toBe(200);
});
```

## 📊 **Monitoring & Analytics**

### **1. Site Performance Monitoring**

```typescript
class SiteMonitor {
    async getPerformanceMetrics(siteId: string) {
        return {
            responseTime: await this.measureResponseTime(siteId),
            memoryUsage: await this.getMemoryUsage(siteId),
            diskUsage: await this.getDiskUsage(siteId),
        };
    }
}
```

### **2. Usage Analytics**

```typescript
// Track feature usage (with user consent)
class AnalyticsService {
    trackSiteCreation(templateType: string) {
        // Anonymous usage tracking
    }

    trackFeatureUsage(feature: string) {
        // Feature adoption metrics
    }
}
```

This guide provides a foundation for extending PressBox with additional features while maintaining the clean architecture and user experience.
