export function Sites() {
  return <div>Sites Page - Coming Soon</div>;
}

export function Docker() {
  return <div>Docker Management - Coming Soon</div>;
}

export function Plugins() {
  return <div>Plugin Manager - Coming Soon</div>;
}

export function Settings() {
  return <div>Settings - Coming Soon</div>;
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return null; // Placeholder
}

export function Header({ 
  onMenuClick, 
  theme, 
  onThemeChange 
}: { 
  onMenuClick: () => void; 
  theme: string; 
  onThemeChange: (theme: any) => void;
}) {
  return null; // Placeholder
}

export function NotificationProvider({ children }: { children: any }) {
  return children;
}

export function SiteProvider({ children }: { children: any }) {
  return children;
}

export { ServerManagementPanel } from './ServerManagementPanel';
export { ExportWizard } from './ExportWizard';
export { ImportWizard } from './ImportWizard';
export { SiteBlueprintSelector } from './SiteBlueprintSelector';
export { SiteHealthIndicator } from './SiteHealthIndicator';
export { QuickActions } from './QuickActions';
export { SiteCloneModal } from './SiteCloneModal';
export { SitePerformanceMonitor } from './SitePerformanceMonitor';
export { SSLManager } from './SSLManager';
export { AdvancedDeveloperTools } from './AdvancedDeveloperTools';
export { DatabaseManager } from './DatabaseManager';
export { PluginManager } from './PluginManager';
export { BackupManager } from './BackupManager';
export { ThemeManager } from './ThemeManager';
export { SecurityScanner } from './SecurityScanner';
export { WPCLITerminal } from './WPCLITerminal';
export { SiteTemplateSelector } from './SiteTemplateSelector';
export { DatabaseBrowser } from './DatabaseBrowser';
export { HostsManager } from './HostsManager';