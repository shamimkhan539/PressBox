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