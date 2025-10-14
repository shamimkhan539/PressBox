import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard.tsx';
import { Sites } from './pages/Sites.tsx';
import { Docker } from './pages/Docker.tsx';
import { Plugins } from './pages/Plugins.tsx';
import { Tools } from './pages/Tools.tsx';
import { Settings } from './pages/Settings.tsx';
import { NotificationProvider } from './components/NotificationSystem.tsx';
import { AdminNotification } from './components/AdminNotification.tsx';
import { cn } from './utils/cn.ts';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChartBarIcon,
  GlobeAltIcon,
  CubeIcon,
  WrenchScrewdriverIcon,
  PuzzlePieceIcon,
  CogIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';

// Fixed Sidebar component with icons only and tooltips
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: ChartBarIcon },
    { path: '/sites', label: 'Sites', icon: GlobeAltIcon },
    { path: '/docker', label: 'Docker', icon: CubeIcon },
    { path: '/tools', label: 'Tools', icon: WrenchScrewdriverIcon },
    { path: '/plugins', label: 'Plugins', icon: PuzzlePieceIcon },
    { path: '/settings', label: 'Settings', icon: CogIcon }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="fixed inset-y-0 left-0 z-10 w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex flex-col h-full">
        {/* Sidebar Header - Logo only */}
        <div className="flex items-center justify-center p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-2">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <div key={item.path} className="relative group">
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    'w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  )}
                  title={item.label}
                >
                  <IconComponent className={cn(
                    'w-6 h-6 transition-colors',
                    isActive && 'text-white'
                  )} />
                </button>
                
                {/* Tooltip */}
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                  {item.label}
                  <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
const Header = ({ theme, onThemeChange }: { theme: string; onThemeChange: (theme: any) => void }) => (
  <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">PressBox</h1>
    <button onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
      {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
    </button>
  </div>
);

// Placeholder components - none needed now
const SiteProvider = ({ children }: { children: any }) => children;

/**
 * Main Application Component
 * 
 * The root component that sets up routing, context providers,
 * and the overall application layout.
 */
function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showAdminNotification, setShowAdminNotification] = useState(false);
  const [hasCheckedAdmin, setHasCheckedAdmin] = useState(false);

  // Initialize theme from settings
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        const savedTheme = await window.electronAPI.settings.get('theme');
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          setTheme(savedTheme);
        } else {
          // Detect system theme
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setTheme(prefersDark ? 'dark' : 'light');
        }
      } catch (error) {
        console.error('Failed to load theme setting:', error);
      }
    };

    initializeTheme();
  }, []);

  // Check admin privileges on startup
  useEffect(() => {
    const waitForElectronAPI = (): Promise<void> => {
      return new Promise((resolve) => {
        const checkAPI = () => {
          if (window.electronAPI && 
              window.electronAPI.system && 
              typeof window.electronAPI.system.checkAdmin === 'function') {
            resolve();
          } else {
            setTimeout(checkAPI, 100);
          }
        };
        checkAPI();
      });
    };

    const checkAdminPrivileges = async () => {
      if (hasCheckedAdmin) return;

      try {
        // Wait for Electron API to be ready
        await waitForElectronAPI();
        
        const adminStatus = await window.electronAPI.system.checkAdmin();
        setHasCheckedAdmin(true);
        
        // Show notification if admin privileges are not available
        if (!adminStatus.isAdmin || !adminStatus.canModifyHosts) {
          setShowAdminNotification(true);
        }
      } catch (error) {
        console.error('Failed to check admin privileges:', error);
        setHasCheckedAdmin(true);
      }
    };

    checkAdminPrivileges();
  }, [hasCheckedAdmin]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className={cn(
      'h-screen flex bg-gray-50 dark:bg-gray-900',
      'transition-colors duration-200'
    )}>
      <NotificationProvider>
        <SiteProvider>
          {/* Fixed Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0 ml-16">
            {/* Header */}
            <Header 
              theme={theme}
              onThemeChange={setTheme}
            />

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/sites" element={<Sites />} />
                <Route path="/docker" element={<Docker />} />
                <Route path="/plugins" element={<Plugins />} />
                <Route path="/tools" element={<Tools />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </SiteProvider>

        {/* Admin Privilege Notification */}
        <AdminNotification
          isVisible={showAdminNotification}
          onClose={() => setShowAdminNotification(false)}
        />
      </NotificationProvider>
    </div>
  );
}

export default App;