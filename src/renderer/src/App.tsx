import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard.tsx';
import { Sites } from './pages/Sites.tsx';
import { Docker } from './pages/Docker.tsx';
import { Plugins } from './pages/Plugins.tsx';
import { Tools } from './pages/Tools.tsx';
import { Settings } from './pages/Settings.tsx';
import { NotificationProvider } from './components/NotificationSystem.tsx';
import { cn } from './utils/cn.ts';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChartBarIcon,
  GlobeAltIcon,
  CubeIcon,
  WrenchScrewdriverIcon,
  PuzzlePieceIcon,
  CogIcon,
  XMarkIcon,
  Bars3Icon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';

// Sidebar component
const Sidebar = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
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
    onClose();
  };

  return (
    <div className={cn(
      'fixed inset-y-0 left-0 z-10 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out',
      open ? 'translate-x-0' : '-translate-x-full'
    )}>
      <div className="flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">PressBox</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  'w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors',
                  location.pathname === item.path
                    ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <IconComponent className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
const Header = ({ onMenuClick, theme, onThemeChange }: { onMenuClick: () => void; theme: string; onThemeChange: (theme: any) => void }) => (
  <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
    <button onClick={onMenuClick} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
      <Bars3Icon className="w-5 h-5" />
    </button>
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

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
          {/* Sidebar */}
          <Sidebar 
            open={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
          />

          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0 md:ml-0">
            {/* Header */}
            <Header 
              onMenuClick={() => setSidebarOpen(!sidebarOpen)}
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
      </NotificationProvider>
    </div>
  );
}

export default App;