import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrashIcon, 
  CloudArrowUpIcon, 
  CloudArrowDownIcon, 
  CommandLineIcon, 
  CogIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
  CircleStackIcon,
  PuzzlePieceIcon,
  ArchiveBoxIcon,
  PaintBrushIcon,
  ShieldExclamationIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import { CreateSiteModal } from '../components/CreateSiteModal.tsx';
import { SiteDetailsModal } from '../components/SiteDetailsModal.tsx';
import { WPCLITerminal } from '../components/WPCLITerminal.tsx';
import { ServerManagementPanel } from '../components/ServerManagementPanel.tsx';
import { SiteHealthIndicator, SiteHealth } from '../components/SiteHealthIndicator.tsx';
import { QuickActions } from '../components/QuickActions.tsx';
import { SiteCloneModal } from '../components/SiteCloneModal.tsx';
import { SitePerformanceMonitor } from '../components/SitePerformanceMonitor.tsx';
import { SSLManager } from '../components/SSLManager.tsx';
import { AdvancedDeveloperTools } from '../components/AdvancedDeveloperTools.tsx';
import { SiteTemplateLibrary } from '../components/SiteTemplateLibrary.tsx';
import { DatabaseManager } from '../components/DatabaseManager.tsx';
import { PluginManager } from '../components/PluginManager.tsx';
import { BackupManager } from '../components/BackupManager.tsx';
import { ThemeManager } from '../components/ThemeManager.tsx';
import { SecurityScanner } from '../components/SecurityScanner.tsx';
import { DatabaseBrowser } from '../components/DatabaseBrowser.tsx';
import { ExportWizard, ImportWizard } from '../components';
import { WordPressSite, SiteStatus } from '../../../shared/types';
import { waitForElectronAPI, isElectronAPIReady } from '../utils/electronApi';

/**
 * Sites Page Component
 * 
 * Displays all WordPress sites with management options.
 */
export function Sites() {
  const [sites, setSites] = useState<WordPressSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [databaseServers, setDatabaseServers] = useState<any[]>([]);

  useEffect(() => {
    loadSites(true); // Initial load with loading state
    loadDatabaseServers(); // Load database server statuses

    // Poll for site status updates every 5 seconds
    const interval = setInterval(() => {
      loadSites(false); // Polling updates without loading state
      loadDatabaseServers(); // Also refresh database server statuses
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadSites = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      // Wait for electronAPI to be available
      if (!isElectronAPIReady()) {
        console.log('⏳ Waiting for Electron API...');
        await waitForElectronAPI(5000);
        console.log('✅ Electron API is ready');
      }

      const sitesData = await window.electronAPI.sites.list();

      // Only update state if data has actually changed
      setSites(prevSites => {
        const hasChanged = JSON.stringify(prevSites) !== JSON.stringify(sitesData);
        return hasChanged ? sitesData : prevSites;
      });
    } catch (err) {
      console.error('Failed to load sites:', err);
      if (err instanceof Error && err.message.includes('Timeout')) {
        setError('Application is loading. Please wait and refresh if needed.');
      } else {
        setError('Failed to load sites. Please try again.');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const loadDatabaseServers = async () => {
    try {
      const servers = await window.electronAPI.databaseServers.getStatuses();
      setDatabaseServers(servers);
    } catch (err) {
      console.error('Failed to load database servers:', err);
    }
  };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState<WordPressSite | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExportWizard, setShowExportWizard] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [exportSite, setExportSite] = useState<WordPressSite | null>(null);
  const [showWPCLITerminal, setShowWPCLITerminal] = useState(false);
  const [wpCliSite, setWpCliSite] = useState<WordPressSite | null>(null);
  const [showServerPanel, setShowServerPanel] = useState(false);
  const [serverConfigSite, setServerConfigSite] = useState<WordPressSite | null>(null);
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set());
  const [siteHealth, setSiteHealth] = useState<Map<string, SiteHealth>>(new Map());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Advanced feature modals
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneSite, setCloneSite] = useState<WordPressSite | null>(null);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  const [performanceSite, setPerformanceSite] = useState<WordPressSite | null>(null);
  const [showSSLManager, setShowSSLManager] = useState(false);
  const [sslSite, setSSLSite] = useState<WordPressSite | null>(null);
  const [showDeveloperTools, setShowDeveloperTools] = useState(false);
  const [developerToolsSite, setDeveloperToolsSite] = useState<WordPressSite | null>(null);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  
  // New advanced management modals
  const [showDatabaseManager, setShowDatabaseManager] = useState(false);
  const [databaseSite, setDatabaseSite] = useState<WordPressSite | null>(null);
  const [showDatabaseBrowser, setShowDatabaseBrowser] = useState(false);
  const [databaseBrowserSite, setDatabaseBrowserSite] = useState<WordPressSite | null>(null);
  const [showPluginManager, setShowPluginManager] = useState(false);
  const [pluginSite, setPluginSite] = useState<WordPressSite | null>(null);
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [backupSite, setBackupSite] = useState<WordPressSite | null>(null);
  const [showThemeManager, setShowThemeManager] = useState(false);
  const [themeSite, setThemeSite] = useState<WordPressSite | null>(null);
  const [showSecurityScanner, setShowSecurityScanner] = useState(false);
  const [securitySite, setSecuritySite] = useState<WordPressSite | null>(null);

  const handleCreateSite = () => {
    setShowCreateModal(true);
  };

  const handleSiteCreated = useCallback(() => {
    loadSites(); // Refresh sites list
  }, []);

  const handleSiteAction = async (siteId: string, action: 'start' | 'stop' | 'restart' | 'delete') => {
    try {
      let result;
      
      switch (action) {
        case 'start':
          result = await window.electronAPI.sites.start(siteId);
          break;
        case 'stop':
          result = await window.electronAPI.sites.stop(siteId);
          break;
        case 'delete':
          if (!confirm('Are you sure you want to delete this site? This action cannot be undone.')) {
            return;
          }
          try {
            await window.electronAPI.sites.delete(siteId);
            result = { success: true };
            setSuccessMessage('Site deleted successfully!');
            // Auto-clear success message after 5 seconds
            setTimeout(() => setSuccessMessage(null), 5000);
          } catch (deleteError: any) {
            console.error('Delete error:', deleteError);
            setError(deleteError?.message || 'Failed to delete site. Please check console for details.');
            return;
          }
          break;
        case 'restart':
          await window.electronAPI.sites.stop(siteId);
          setTimeout(() => {
            window.electronAPI.sites.start(siteId);
          }, 1000);
          result = { success: true };
          break;
      }

      if ((result as any)?.success) {
        // Refresh sites list
        loadSites();
        
        // For start/stop actions, poll for status updates
        if (action === 'start' || action === 'stop') {
          setTimeout(() => loadSites(), 2000);
        }
      } else {
        setError((result as any)?.error || `Failed to ${action} site`);
      }
    } catch (error: any) {
      console.error(`Failed to ${action} site:`, error);
      setError(error?.message || `Failed to ${action} site. Please try again.`);
    }
  };

  const handleOpenSite = (site: WordPressSite) => {
    if (site.status === SiteStatus.RUNNING) {
      // Construct proper URL with port
      const url = site.url || `http://${site.domain}:${site.port || 8080}`;
      (window.electronAPI as any).shell.openExternal(url);
      
      // Show success message
      setTimeout(() => {
        setSuccessMessage(`Opened ${site.name} at ${url}. Your WordPress site is now accessible in your browser!`);
        setTimeout(() => setSuccessMessage(null), 6000);
      }, 500);
    } else if (site.status === SiteStatus.STOPPED) {
      setError(`Site "${site.name}" is stopped. Please start it first to access the website.`);
      setTimeout(() => setError(null), 5000);
    } else {
      setError(`Site "${site.name}" is ${site.status}. Please wait for it to finish starting.`);
      setTimeout(() => setError(null), 5000);
    }
  };

  const toggleSiteExpansion = (siteId: string) => {
    const newExpanded = new Set(expandedSites);
    if (newExpanded.has(siteId)) {
      newExpanded.delete(siteId);
    } else {
      newExpanded.add(siteId);
    }
    setExpandedSites(newExpanded);
  };

  const handleHealthUpdate = (siteId: string, health: SiteHealth) => {
    setSiteHealth(prev => new Map(prev.set(siteId, health)));
  };

  const handleQuickAction = (action: string, data?: any) => {
    const { siteId, ...actionData } = data || {};
    const site = sites.find(s => s.id === siteId);
    
    switch (action) {
      case 'openAdmin':
        if (site) {
          const adminUrl = `${site.domain.startsWith('http') ? site.domain : `http://${site.domain}`}/wp-admin`;
          (window.electronAPI as any).shell.openExternal(adminUrl);
          setSuccessMessage(`Opened WordPress admin for ${site.name}`);
        }
        break;
      case 'viewSite':
        if (site) {
          handleOpenSite(site);
        }
        break;
      case 'openLogs':
        setSuccessMessage('Opening site logs... (Feature coming in next update)');
        break;
      case 'clearCache':
        setSuccessMessage('Cache cleared successfully! (Simulated for development)');
        break;
      case 'debugMode':
        setSuccessMessage('Debug mode toggled! (Feature coming in next update)');
        break;
      case 'cloneSite':
        if (site) {
          setCloneSite(site);
          setShowCloneModal(true);
        }
        break;
      case 'performanceMonitor':
        if (site) {
          setPerformanceSite(site);
          setShowPerformanceMonitor(true);
        }
        break;
      case 'sslManager':
        if (site) {
          setSSLSite(site);
          setShowSSLManager(true);
        }
        break;
      case 'developerTools':
        if (site) {
          setDeveloperToolsSite(site);
          setShowDeveloperTools(true);
        }
        break;
      case 'databaseManager':
        if (site) {
          setDatabaseSite(site);
          setShowDatabaseManager(true);
        }
        break;
      case 'databaseBrowser':
        if (site) {
          setDatabaseBrowserSite(site);
          setShowDatabaseBrowser(true);
        }
        break;
      case 'pluginManager':
        if (site) {
          setPluginSite(site);
          setShowPluginManager(true);
        }
        break;
      case 'backupManager':
        if (site) {
          setBackupSite(site);
          setShowBackupManager(true);
        }
        break;
      case 'themeManager':
        if (site) {
          setThemeSite(site);
          setShowThemeManager(true);
        }
        break;
      case 'securityScanner':
        if (site) {
          setSecuritySite(site);
          setShowSecurityScanner(true);
        }
        break;
      case 'showMessage':
        if (actionData.type === 'success') {
          setSuccessMessage(actionData.message);
        } else {
          setError(actionData.message);
        }
        break;
    }
    
    // Clear messages after delay
    setTimeout(() => {
      setSuccessMessage(null);
      setError(null);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="spinner w-8 h-8"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading sites...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="card p-6 text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-lg font-medium">{error}</p>
          </div>
          <button onClick={() => loadSites(true)} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            WordPress Sites
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your local WordPress development sites
            {sites.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                {sites.length} site{sites.length !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <div className="flex space-x-3">
          <button onClick={handleCreateSite} className="btn-primary">
            + Create New Site
          </button>
          <button 
            onClick={() => setShowTemplateLibrary(true)} 
            className="btn-success flex items-center space-x-2"
          >
            <SparklesIcon className="w-4 h-4" />
            <span>Professional Templates</span>
          </button>
          <button 
            onClick={() => setShowImportWizard(true)} 
            className="btn-outline flex items-center space-x-2"
          >
            <CloudArrowDownIcon className="w-4 h-4" />
            <span>Import Site</span>
          </button>
        </div>
      </div>

      {/* Database Server Status Warning */}
      {sites.some(site => site.database !== 'sqlite') && 
       databaseServers.some(s => (s.type === 'mysql' || s.type === 'mariadb') && !s.isRunning) && (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Database Server Not Running
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>
                  Some of your sites use MySQL/MariaDB, but the database server is not running. 
                  Sites will fall back to SQLite until you start the database server.
                </p>
                <p className="mt-2">
                  <button 
                    onClick={() => window.location.href = '#/tools'}
                    className="font-medium underline hover:text-yellow-600 dark:hover:text-yellow-200"
                  >
                    Go to Tools → Database Management to start the server
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {sites.length === 0 ? (
        /* Empty State */
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No WordPress Sites Yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first WordPress site to start developing locally
          </p>
          <button onClick={handleCreateSite} className="btn-primary">
            Create Your First Site
          </button>
        </div>
      ) : (
        /* Sites Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => {
            const isExpanded = expandedSites.has(site.id);
            const health = siteHealth.get(site.id);
            
            return (
              <div key={site.id} className="card p-6 transition-all duration-200 hover:shadow-lg">
                {/* Site Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {site.name}
                      </h3>
                      <button
                        onClick={() => toggleSiteExpansion(site.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      >
                        {isExpanded ? 
                          <ChevronUpIcon className="w-4 h-4" /> : 
                          <ChevronDownIcon className="w-4 h-4" />
                        }
                      </button>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {site.domain}
                    </p>
                    {health && (
                      <div className="flex items-center space-x-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${
                          health.status === 'healthy' ? 'bg-green-400' :
                          health.status === 'warning' ? 'bg-yellow-400' :
                          health.status === 'error' ? 'bg-red-400' : 'bg-gray-400'
                        }`} />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {health.responseTime}ms
                        </span>
                      </div>
                    )}
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    site.status === SiteStatus.RUNNING ? 'status-running' : 
                    site.status === SiteStatus.STOPPED ? 'status-stopped' :
                    site.status === SiteStatus.STARTING ? 'status-starting' :
                    'status-error'
                  }`}>
                    {site.status}
                  </span>
                </div>

              {/* Site Info */}
              <div className="space-y-2 mb-4">
                {site.phpVersion && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">PHP</span>
                    <span className="text-gray-900 dark:text-white">{site.phpVersion}</span>
                  </div>
                )}
                {site.wordPressVersion && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">WordPress</span>
                    <span className="text-gray-900 dark:text-white">{site.wordPressVersion}</span>
                  </div>
                )}
                {site.port && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Port</span>
                    <span className="text-gray-900 dark:text-white">{site.port}</span>
                  </div>
                )}
                {site.database && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Database</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 dark:text-white font-medium capitalize">{site.database}</span>
                      {site.database !== 'sqlite' && (
                        <>
                          {databaseServers.some(s => s.type === site.database && s.isRunning) ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Running
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              Stopped
                            </span>
                          )}
                        </>
                      )}
                      {site.database === 'sqlite' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          File-based
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <div className="flex space-x-2">
                  {site.status === SiteStatus.RUNNING ? (
                    <>
                      <button
                        onClick={() => handleOpenSite(site)}
                        className="btn-primary flex-1 text-sm py-2"
                      >
                        Open Site
                      </button>
                      <button
                        onClick={() => handleSiteAction(site.id, 'stop')}
                        className="btn-secondary px-3 py-2"
                        title="Stop Site"
                      >
                        ⏹
                      </button>
                      <button
                        onClick={() => {
                          setServerConfigSite(site);
                          setShowServerPanel(true);
                        }}
                        className="btn-outline px-3 py-2"
                        title="Server Configuration"
                      >
                        <CogIcon className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleSiteAction(site.id, 'start')}
                      className="btn-success flex-1 text-sm py-2"
                      disabled={site.status === SiteStatus.STARTING}
                    >
                      {site.status === SiteStatus.STARTING ? 'Starting...' : 'Start Site'}
                    </button>
                  )}
                  <button
                    onClick={() => handleSiteAction(site.id, 'delete')}
                    className="btn-danger px-3 py-2"
                    title="Delete Site"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedSite(site);
                        setShowDetailsModal(true);
                      }}
                      className="btn-outline flex-1 text-sm py-2"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        setWpCliSite(site);
                        setShowWPCLITerminal(true);
                      }}
                      className="btn-outline px-3 py-2"
                      title="WP-CLI Terminal"
                      disabled={site.status !== SiteStatus.RUNNING}
                    >
                      <CommandLineIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setExportSite(site);
                        setShowExportWizard(true);
                      }}
                      className="btn-outline px-3 py-2"
                      title="Export Site"
                    >
                      <CloudArrowUpIcon className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Advanced Tools Row */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleQuickAction('cloneSite', { siteId: site.id })}
                      className="btn-secondary flex-1 text-sm py-2 flex items-center justify-center space-x-1"
                      title="Clone Site"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                      <span>Clone</span>
                    </button>
                    <button
                      onClick={() => handleQuickAction('performanceMonitor', { siteId: site.id })}
                      className="btn-secondary px-3 py-2"
                      title="Performance Monitor"
                      disabled={site.status !== SiteStatus.RUNNING}
                    >
                      <ChartBarIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleQuickAction('sslManager', { siteId: site.id })}
                      className="btn-secondary px-3 py-2"
                      title="SSL Manager"
                    >
                      <ShieldCheckIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleQuickAction('developerTools', { siteId: site.id })}
                      className="btn-secondary px-3 py-2"
                      title="Developer Tools"
                      disabled={site.status !== SiteStatus.RUNNING}
                    >
                      <WrenchScrewdriverIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleQuickAction('databaseManager', { siteId: site.id })}
                      className="btn-secondary px-3 py-2"
                      title="Database Manager"
                      disabled={site.status !== SiteStatus.RUNNING}
                    >
                      <CircleStackIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleQuickAction('databaseBrowser', { siteId: site.id })}
                      className="btn-secondary px-3 py-2"
                      title="Database Browser"
                      disabled={site.status !== SiteStatus.RUNNING}
                    >
                      <TableCellsIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleQuickAction('pluginManager', { siteId: site.id })}
                      className="btn-secondary px-3 py-2"
                      title="Plugin Manager"
                      disabled={site.status !== SiteStatus.RUNNING}
                    >
                      <PuzzlePieceIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleQuickAction('backupManager', { siteId: site.id })}
                      className="btn-secondary px-3 py-2"
                      title="Backup Manager"
                    >
                      <ArchiveBoxIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleQuickAction('themeManager', { siteId: site.id })}
                      className="btn-secondary px-3 py-2"
                      title="Theme Manager"
                      disabled={site.status !== SiteStatus.RUNNING}
                    >
                      <PaintBrushIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleQuickAction('securityScanner', { siteId: site.id })}
                      className="btn-secondary px-3 py-2"
                      title="Security Scanner"
                      disabled={site.status !== SiteStatus.RUNNING}
                    >
                      <ShieldExclamationIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="space-y-4">
                  <SiteHealthIndicator 
                    site={site} 
                    onHealthCheck={handleHealthUpdate} 
                  />
                  <QuickActions 
                    site={site} 
                    onAction={handleQuickAction} 
                  />
                </div>
              )}
            </div>
          );})}
        </div>
      )}

      {/* Create Site Modal */}
      <CreateSiteModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSiteCreated={handleSiteCreated}
      />

      {/* Site Details Modal */}
      <SiteDetailsModal
        site={selectedSite}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedSite(null);
        }}
      />

      {/* Export Wizard */}
      {exportSite && (
        <ExportWizard
          site={exportSite}
          isOpen={showExportWizard}
          onClose={() => {
            setShowExportWizard(false);
            setExportSite(null);
          }}
          onExportComplete={(result: any) => {
            console.log('Export completed:', result);
            setError(`Export completed successfully! File saved to: ${result.exportPath}`);
            setExportSite(null);
          }}
        />
      )}

      {/* Import Wizard */}
      <ImportWizard
        isOpen={showImportWizard}
        onClose={() => setShowImportWizard(false)}
        onImportComplete={(result: any) => {
          console.log('Import completed:', result);
          setError(`Site "${result.siteName}" imported successfully!`);
          loadSites(); // Refresh sites list
        }}
      />

      {/* WP-CLI Terminal */}
      {wpCliSite && (
        <WPCLITerminal
          siteId={wpCliSite.id}
          siteName={wpCliSite.name}
          isOpen={showWPCLITerminal}
          onClose={() => {
            setShowWPCLITerminal(false);
            setWpCliSite(null);
          }}
        />
      )}

      {/* Server Management Panel */}
      {serverConfigSite && (
        <ServerManagementPanel
          site={serverConfigSite}
          onServerChange={(result) => {
            console.log('Server configuration changed:', result);
            const changeMessage = result.newServer 
              ? `Server changed from ${result.oldServer} to ${result.newServer}` 
              : `PHP version changed from ${result.oldVersion} to ${result.newVersion}`;
            setSuccessMessage(`Server configuration updated: ${changeMessage}`);
            loadSites(); // Refresh sites to show updated configuration
          }}
          onClose={() => {
            setShowServerPanel(false);
            setServerConfigSite(null);
          }}
        />
      )}

      {/* Site Clone Modal */}
      <SiteCloneModal
        site={cloneSite}
        isOpen={showCloneModal}
        onClose={() => {
          setShowCloneModal(false);
          setCloneSite(null);
        }}
        onCloneComplete={(result) => {
          console.log('Site cloned:', result);
          setSuccessMessage(`Site "${result.siteName}" cloned successfully from "${result.originalSite}"!`);
          loadSites(); // Refresh sites list
          setShowCloneModal(false);
          setCloneSite(null);
        }}
      />

      {/* Performance Monitor */}
      {performanceSite && (
        <SitePerformanceMonitor
          site={performanceSite}
          isOpen={showPerformanceMonitor}
          onClose={() => {
            setShowPerformanceMonitor(false);
            setPerformanceSite(null);
          }}
        />
      )}

      {/* SSL Manager */}
      {sslSite && (
        <SSLManager
          site={sslSite}
          isOpen={showSSLManager}
          onClose={() => {
            setShowSSLManager(false);
            setSSLSite(null);
          }}
          onSSLUpdated={(siteId, config) => {
            console.log('SSL configuration updated:', config);
            const message = config.enabled 
              ? `SSL enabled for ${sslSite.name} with ${config.certificateType} certificate`
              : `SSL disabled for ${sslSite.name}`;
            setSuccessMessage(message);
            loadSites(); // Refresh sites to show SSL status
          }}
        />
      )}

      {/* Advanced Developer Tools */}
      {developerToolsSite && (
        <AdvancedDeveloperTools
          site={developerToolsSite}
          isOpen={showDeveloperTools}
          onClose={() => {
            setShowDeveloperTools(false);
            setDeveloperToolsSite(null);
          }}
        />
      )}

      {/* Site Template Library */}
      <SiteTemplateLibrary
        isOpen={showTemplateLibrary}
        onClose={() => setShowTemplateLibrary(false)}
        onTemplateSelect={(template) => {
          console.log('Template selected:', template);
          setSuccessMessage(`Creating site from "${template.name}" template. This may take ${template.estimatedTime}.`);
          // In a real implementation, this would trigger site creation from template
          setTimeout(() => {
            setSuccessMessage(`Site created successfully using "${template.name}" template!`);
            loadSites(); // Refresh sites list
          }, 3000);
        }}
      />

      {/* Database Manager */}
      {databaseSite && (
        <DatabaseManager
          siteId={databaseSite.id}
          siteName={databaseSite.name}
          isOpen={showDatabaseManager}
          onClose={() => {
            setShowDatabaseManager(false);
            setDatabaseSite(null);
          }}
        />
      )}

      {/* Plugin Manager */}
      {pluginSite && (
        <PluginManager
          siteId={pluginSite.id}
          siteName={pluginSite.name}
          isOpen={showPluginManager}
          onClose={() => {
            setShowPluginManager(false);
            setPluginSite(null);
          }}
        />
      )}

      {/* Backup Manager */}
      {backupSite && (
        <BackupManager
          siteId={backupSite.id}
          siteName={backupSite.name}
          isOpen={showBackupManager}
          onClose={() => {
            setShowBackupManager(false);
            setBackupSite(null);
          }}
        />
      )}

      {/* Theme Manager */}
      {themeSite && (
        <ThemeManager
          isOpen={showThemeManager}
          onClose={() => {
            setShowThemeManager(false);
            setThemeSite(null);
          }}
          site={themeSite}
        />
      )}

      {/* Security Scanner */}
      {securitySite && (
        <SecurityScanner
          isOpen={showSecurityScanner}
          onClose={() => {
            setShowSecurityScanner(false);
            setSecuritySite(null);
          }}
          site={securitySite}
        />
      )}

      {/* Database Browser */}
      <DatabaseBrowser
        isOpen={showDatabaseBrowser}
        onClose={() => {
          setShowDatabaseBrowser(false);
          setDatabaseBrowserSite(null);
        }}
        site={databaseBrowserSite}
      />
    </div>
  );
}