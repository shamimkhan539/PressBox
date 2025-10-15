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
import { AdminModeSelector } from './components/AdminModeSelector.tsx';
import { cn } from './utils/cn.ts';
import { useNavigate, useLocation } from 'react-router-dom';
import { waitForElectronAPI, isElectronAPIReady } from './utils/electronApi';
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
  const [showAdminModeSelector, setShowAdminModeSelector] = useState(false);
  const [hasCheckedAdmin, setHasCheckedAdmin] = useState(false);

  // Initialize theme from settings
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        // Wait for electronAPI to be available
        if (!isElectronAPIReady()) {
          console.log('⏳ Waiting for Electron API for theme...');
          try {
            await waitForElectronAPI(3000);
            console.log('✅ Electron API ready for theme');
          } catch (error) {
            console.warn('⚠️  Timeout waiting for API, using system theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setTheme(prefersDark ? 'dark' : 'light');
            return;
          }
        }
        
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
        // Fallback to system theme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }
    };

    initializeTheme();
  }, []);

  // Check admin privileges on startup
  useEffect(() => {
    const checkAdminPrivileges = async () => {
      if (hasCheckedAdmin) return;

      try {
        // Wait for Electron API to be ready
        console.log('⏳ Waiting for Electron API for admin check...');
        const electronAPI = await waitForElectronAPI(5000);
        console.log('✅ Electron API ready for admin check');
        
        // Check if user should be prompted for mode selection
        const shouldPrompt = await electronAPI.nonAdminMode.shouldPromptUser();
        console.log('🔧 Should prompt user for mode:', shouldPrompt);
        
        if (shouldPrompt) {
          console.log('🎯 Showing admin mode selector for first-time user');
          setShowAdminModeSelector(true);
          setHasCheckedAdmin(true);
          return;
        }
        
        // Check non-admin mode status
        const nonAdminStatus = await electronAPI.nonAdminMode.getStatus();
        console.log('🔧 Non-admin mode status:', nonAdminStatus);
        console.log('🔧 Non-admin enabled:', nonAdminStatus.enabled);
        console.log('🔧 User choice made:', nonAdminStatus.hasUserMadeChoice);
        console.log('🔧 Last choice:', nonAdminStatus.lastChoice);
        
        // Only check admin privileges if not in non-admin mode
        if (!nonAdminStatus.enabled) {
          console.log('🔒 Admin mode active - checking admin privileges...');
          const adminStatus = await electronAPI.system.checkAdmin();
          
          if (!adminStatus.isAdmin || !adminStatus.canModifyHosts) {
            console.log('⚠️ Admin privileges not available in admin mode');
            console.log('🔄 Automatically switching to non-admin mode for better UX');
            
            // Automatically switch to non-admin mode if admin privileges are not available
            await electronAPI.nonAdminMode.enable();
            
            console.log('✅ Switched to non-admin mode');
            console.log('💡 User can change back to admin mode in settings if they get admin privileges');
            
            // Show a notification about the mode switch
            // We'll use a simple alert for now since we can't use the hook here
            setTimeout(() => {
              alert('PressBox detected that administrator privileges are not available and has switched to non-admin mode. You can change this in Settings.');
            }, 1000);
          } else {
            console.log('✅ Admin privileges available');
          }
        } else {
          // In non-admin mode, don't show admin notification
          console.log('🔓 Running in non-admin mode - no admin checks needed');
        }
        
        setHasCheckedAdmin(true);
      } catch (error) {
        console.error('Failed to check admin privileges:', error);
        setHasCheckedAdmin(true);
      }
    };

    checkAdminPrivileges();
  }, [hasCheckedAdmin]);

  // Handle admin mode selection
  const handleModeSelected = async (mode: 'admin' | 'non-admin') => {
    try {
      console.log(`🎯 User selected ${mode} mode`);
      
      if (mode === 'non-admin') {
        await window.electronAPI.nonAdminMode.enable();
        console.log('✅ Non-admin mode enabled');
      } else {
        await window.electronAPI.nonAdminMode.disable();
        console.log('✅ Admin mode enabled');
        
        // Check admin privileges for admin mode
        const adminStatus = await window.electronAPI.system.checkAdmin();
        if (!adminStatus.isAdmin || !adminStatus.canModifyHosts) {
          console.log('⚠️ Admin privileges not available - showing notification');
          setShowAdminNotification(true);
        } else {
          console.log('✅ Admin privileges available');
        }
      }
      
      setShowAdminModeSelector(false);
    } catch (error) {
      console.error('Failed to set admin mode:', error);
    }
  };

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

        {/* Admin Mode Selector */}
        <AdminModeSelector
          isVisible={showAdminModeSelector}
          onModeSelected={handleModeSelected}
          onClose={() => setShowAdminModeSelector(false)}
        />
      </NotificationProvider>
    </div>
  );
}

export default App;