/**
 * Shared Type Definitions
 *
 * These types are used across the main and renderer processes
 * to ensure type safety in IPC communication.
 */

// WordPress Site Configuration
export interface WordPressSite {
    id: string;
    name: string;
    domain: string;
    path: string;
    phpVersion: string;
    wordPressVersion: string;
    status: SiteStatus;
    ssl: boolean;
    multisite: boolean;
    created: Date;
    lastAccessed?: Date;
    port?: number;
    dbPort?: number;
    config: SiteConfig;
}

export enum SiteStatus {
    STOPPED = "stopped",
    STARTING = "starting",
    RUNNING = "running",
    STOPPING = "stopping",
    ERROR = "error",
}

export interface SiteConfig {
    phpVersion: string;
    wordPressVersion?: string;
    dbName: string;
    dbUser: string;
    dbPassword: string;
    dbRootPassword: string;
    adminUser: string;
    adminPassword: string;
    adminEmail: string;
    webServer: "nginx" | "apache";
    ssl: boolean;
    multisite: boolean;
    plugins?: string[];
    themes?: string[];
    customServices?: DockerService[];
}

export interface CreateSiteRequest {
    name: string;
    domain?: string;
    phpVersion: string;
    wordPressVersion?: string;
    path?: string;
    ssl?: boolean;
    multisite?: boolean;
    adminUser?: string;
    adminPassword?: string;
    adminEmail?: string;
}

// Docker Types
export interface DockerContainer {
    id: string;
    name: string;
    image: string;
    status: string;
    ports: PortMapping[];
    created: Date;
    labels: Record<string, string>;
}

export interface DockerImage {
    id: string;
    repository: string;
    tag: string;
    size: number;
    created: Date;
}

export interface DockerService {
    name: string;
    image: string;
    ports?: PortMapping[];
    environment?: Record<string, string>;
    volumes?: VolumeMapping[];
    depends_on?: string[];
}

export interface PortMapping {
    host: number;
    container: number;
    protocol?: "tcp" | "udp";
}

export interface VolumeMapping {
    host: string;
    container: string;
    mode?: "ro" | "rw";
}

// Plugin System Types
export interface Plugin {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    website?: string;
    repository?: string;
    enabled: boolean;
    path: string;
    manifest: PluginManifest;
    main?: any; // The loaded plugin module
}

export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    website?: string;
    repository?: string;
    main: string;
    dependencies?: Record<string, string>;
    permissions?: string[];
    contributes?: PluginContributions;
}

export interface PluginContributions {
    commands?: PluginCommand[];
    menus?: PluginMenu[];
    views?: PluginView[];
    settings?: PluginSetting[];
    themes?: PluginTheme[];
    hooks?: PluginHook[];
}

export interface PluginCommand {
    id: string;
    title: string;
    category?: string;
    when?: string;
}

export interface PluginMenu {
    id: string;
    label: string;
    submenu?: PluginMenu[];
    command?: string;
    when?: string;
}

export interface PluginView {
    id: string;
    name: string;
    when?: string;
    type: "sidebar" | "panel" | "modal";
}

export interface PluginSetting {
    id: string;
    title: string;
    description?: string;
    type: "string" | "number" | "boolean" | "array" | "object";
    default?: any;
    enum?: any[];
}

export interface PluginTheme {
    id: string;
    name: string;
    path: string;
}

export interface PluginHook {
    name: string;
    callback: string;
}

// Plugin API Interface
export interface PluginAPI {
    // Core API
    getVersion(): string;
    getPluginPath(pluginId: string): string;

    // Site Management
    getSites(): Promise<WordPressSite[]>;
    getSite(siteId: string): Promise<WordPressSite | null>;
    createSite(config: CreateSiteRequest): Promise<WordPressSite>;
    startSite(siteId: string): Promise<void>;
    stopSite(siteId: string): Promise<void>;

    // UI Extensions
    addCommand(command: PluginCommand, handler: () => void): void;
    addMenuItem(menu: PluginMenu): void;
    addView(view: PluginView, component: any): void;
    showNotification(
        message: string,
        type: "info" | "success" | "warning" | "error"
    ): void;

    // Settings
    getSetting(key: string): Promise<any>;
    setSetting(key: string, value: any): Promise<void>;

    // Events
    on(event: string, handler: (...args: any[]) => void): void;
    off(event: string, handler: (...args: any[]) => void): void;
    emit(event: string, ...args: any[]): void;

    // File System
    readFile(path: string): Promise<string>;
    writeFile(path: string, content: string): Promise<void>;
    exists(path: string): Promise<boolean>;
}

// Application Settings
export interface AppSettings {
    dockerPath?: string;
    defaultPHPVersion: string;
    defaultWordPressVersion: string;
    sitesPath: string;
    theme: "light" | "dark" | "system";
    autoStart: boolean;
    checkForUpdates: boolean;
    telemetry: boolean;
    pluginsEnabled: boolean;
    backup: BackupSettings;
}

export interface BackupSettings {
    enabled: boolean;
    interval: "daily" | "weekly" | "monthly";
    retention: number;
    path: string;
}

// Notification System
export interface Notification {
    id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    actions?: NotificationAction[];
    timestamp: Date;
    persistent?: boolean;
}

export interface NotificationAction {
    label: string;
    action: string;
    primary?: boolean;
}

// Events
export enum AppEvent {
    SITE_CREATED = "site:created",
    SITE_STARTED = "site:started",
    SITE_STOPPED = "site:stopped",
    SITE_DELETED = "site:deleted",
    PLUGIN_INSTALLED = "plugin:installed",
    PLUGIN_ENABLED = "plugin:enabled",
    PLUGIN_DISABLED = "plugin:disabled",
    DOCKER_STATUS_CHANGED = "docker:status-changed",
    SETTINGS_CHANGED = "settings:changed",
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Error Types
export class PressBoxError extends Error {
    constructor(
        message: string,
        public code: string,
        public details?: any
    ) {
        super(message);
        this.name = "PressBoxError";
    }
}

export class DockerError extends PressBoxError {
    constructor(message: string, details?: any) {
        super(message, "DOCKER_ERROR", details);
        this.name = "DockerError";
    }
}

export class SiteError extends PressBoxError {
    constructor(message: string, details?: any) {
        super(message, "SITE_ERROR", details);
        this.name = "SiteError";
    }
}

export class PluginError extends PressBoxError {
    constructor(message: string, details?: any) {
        super(message, "PLUGIN_ERROR", details);
        this.name = "PluginError";
    }
}
