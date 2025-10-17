import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateSiteModal } from '../components/CreateSiteModal.tsx';
import { ImportSiteModal } from '../components/ImportSiteModal.tsx';
import { SiteTemplateLibrary } from '../components/SiteTemplateLibrary.tsx';
import { EnvironmentStatus } from '../components/EnvironmentStatus.tsx';
import { 
  ChartBarIcon, 
  ServerIcon, 
  GlobeAltIcon, 
  ShieldCheckIcon,
  ClockIcon,
  CpuChipIcon,
  CircleStackIcon,
  RocketLaunchIcon,
  SparklesIcon,
  Cog6ToothIcon,
  PuzzlePieceIcon,
  ArchiveBoxIcon,
  PaintBrushIcon,
  ShieldExclamationIcon,
  PlayIcon,
  StopIcon,
  EyeIcon,
  Cog8ToothIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';

interface WordPressSite {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
  domain: string;
  path: string;
  url?: string;
}

interface DashboardStats {
  totalSites: number;
  runningSites: number;
  dockerStatus: string;
}

/**
 * Dashboard Page Component
 * 
 * The main dashboard showing overview of sites, Docker status,
 * and quick actions for WordPress development.
 */
export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalSites: 0,
    runningSites: 0,
    dockerStatus: 'Checking...'
  });
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<WordPressSite[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showEnvironmentStatus, setShowEnvironmentStatus] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Check if electronAPI is available
      if (!window.electronAPI || !window.electronAPI.sites) {
        console.error('electronAPI not available');
        return;
      }
      
      // Load sites from real API
      const sitesList = await window.electronAPI.sites.list();
      setSites(sitesList);

      // Calculate stats from real data
      const runningSites = sitesList.filter(site => site.status === 'running').length;
      const dashboardStats = {
        totalSites: sitesList.length,
        runningSites,
        dockerStatus: 'Running' // TODO: Get real Docker status
      };
      setStats(dashboardStats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateSite = () => {
    setShowCreateModal(true);
  };

  const handleSiteCreated = useCallback(() => {
    // Refresh dashboard data after creating a site
    loadDashboardData();
  }, []);

  const handleSiteImported = () => {
    loadDashboardData(); // Refresh data after importing site
  };

  const handleViewAllSites = () => {
    navigate('/sites');
  };

  const handleBrowsePlugins = () => {
    navigate('/plugins');
  };

  const handleStartSite = async (siteId: string) => {
    try {
      // Update site status to starting
      setSites(prevSites => 
        prevSites.map(site => 
          site.id === siteId ? { ...site, status: 'starting' } : site
        )
      );

      // Call actual API to start site
      await window.electronAPI.sites.start(siteId);

      // Reload dashboard data to get updated status
      await loadDashboardData();

      console.log(`Successfully started site: ${siteId}`);
    } catch (error) {
      console.error('Failed to start site:', error);
      // Revert status on error
      setSites(prevSites => 
        prevSites.map(site => 
          site.id === siteId ? { ...site, status: 'error' } : site
        )
      );
    }
  };

  const handleStopSite = async (siteId: string) => {
    try {
      // Update site status to stopping
      setSites(prevSites => 
        prevSites.map(site => 
          site.id === siteId ? { ...site, status: 'stopping' } : site
        )
      );

      // Call actual API to stop site
      await window.electronAPI.sites.stop(siteId);

      // Reload dashboard data to get updated status
      await loadDashboardData();

      console.log(`Successfully stopped site: ${siteId}`);
    } catch (error) {
      console.error('Failed to stop site:', error);
      // Revert status on error  
      setSites(prevSites => 
        prevSites.map(site => 
          site.id === siteId ? { ...site, status: 'error' } : site
        )
      );
    }
  };

  const handleViewSite = async (site: WordPressSite) => {
    if (site.status === 'running') {
      try {
        // Try to open site URL (custom domain first, then localhost)
        const siteUrl = site.domain ? `http://${site.domain}` : site.url;
        
        if (siteUrl) {
          await window.electronAPI.sites.openInBrowser(site.id);
        } else {
          console.warn('No URL available for site:', site.name);
        }
      } catch (error) {
        console.error('Failed to open site:', error);
        // Fallback to direct URL opening if available
        if (site.url) {
          (window.electronAPI as any)?.shell?.openExternal(site.url);
        }
      }
    }
  };

  const handleOpenDatabaseBrowser = async (site: WordPressSite) => {
    try {
      console.log('Opening database browser for site:', site.name);
      await window.electronAPI.database.openBrowser(site.name);
    } catch (error) {
      console.error('Failed to open database browser:', error);
      alert(`Failed to open database browser: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="mt-1 text-sm md:text-base text-gray-600 dark:text-gray-400">
              Manage your WordPress development environment
            </p>
          </div>
          <button
            onClick={handleCreateSite}
            className="btn-primary text-sm md:text-base px-3 md:px-4 py-2"
          >
            + New Site
          </button>
        </div>
      </div>

      {/* Professional Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">WordPress Sites</p>
              {loading ? (
                <div className="spinner w-6 h-6 mt-2"></div>
              ) : (
                <p className="text-3xl font-bold">{stats.totalSites}</p>
              )}
            </div>
            <GlobeAltIcon className="w-12 h-12 text-blue-200" />
          </div>
          <div className="mt-2 text-blue-100 text-sm">
            {loading ? 'Loading...' : `${stats.runningSites} currently running`}
          </div>
        </div>
      </div>

      {/* Advanced Management Tools */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Cog6ToothIcon className="w-5 h-5 mr-2" />
          Advanced Management Tools
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <button
            onClick={() => navigate('/sites')}
            className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-6 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="relative z-10">
              <CircleStackIcon className="w-8 h-8 mb-3" />
              <h3 className="font-semibold text-lg mb-2">Database Manager</h3>
              <p className="text-sm text-blue-100 opacity-90">
                Manage WordPress databases, run SQL queries, and create backups
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>

          <button
            onClick={() => navigate('/sites')}
            className="group relative overflow-hidden bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-6 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="relative z-10">
              <PuzzlePieceIcon className="w-8 h-8 mb-3" />
              <h3 className="font-semibold text-lg mb-2">Plugin Manager</h3>
              <p className="text-sm text-purple-100 opacity-90">
                Install, update, and manage WordPress plugins with ease
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>

          <button
            onClick={() => navigate('/sites')}
            className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-6 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="relative z-10">
              <ArchiveBoxIcon className="w-8 h-8 mb-3" />
              <h3 className="font-semibold text-lg mb-2">Backup Manager</h3>
              <p className="text-sm text-green-100 opacity-90">
                Automated backups, scheduling, and restore capabilities
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>

          <button
            onClick={() => navigate('/sites')}
            className="group relative overflow-hidden bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white p-6 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="relative z-10">
              <PaintBrushIcon className="w-8 h-8 mb-3" />
              <h3 className="font-semibold text-lg mb-2">Theme Manager</h3>
              <p className="text-sm text-pink-100 opacity-90">
                Install, customize, and manage WordPress themes with live preview
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>

          <button
            onClick={() => navigate('/sites')}
            className="group relative overflow-hidden bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-6 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="relative z-10">
              <ShieldExclamationIcon className="w-8 h-8 mb-3" />
              <h3 className="font-semibold text-lg mb-2">Security Scanner</h3>
              <p className="text-sm text-red-100 opacity-90">
                Comprehensive security auditing and vulnerability detection
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>

          <button
            onClick={() => setShowEnvironmentStatus(true)}
            className="group relative overflow-hidden bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white p-6 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="relative z-10">
              <ComputerDesktopIcon className="w-8 h-8 mb-3" />
              <h3 className="font-semibold text-lg mb-2">System Status</h3>
              <p className="text-sm text-teal-100 opacity-90">
                Check Docker, PHP, and system requirements for development
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </div>
      </div>

      {/* WordPress Sites Section */}
      <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <GlobeAltIcon className="w-5 h-5 mr-2" />
              WordPress Sites ({sites.length})
            </h2>
            <button 
              onClick={handleCreateSite}
              className="btn-primary text-sm px-3 py-1.5"
            >
              + New Site
            </button>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : sites.length === 0 ? (
            <div className="text-center py-12">
              <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No sites yet</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating your first WordPress site
              </p>
              <div className="mt-6">
                <button 
                  onClick={handleCreateSite}
                  className="btn-primary"
                >
                  Create Your First Site
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sites.map((site) => (
                <div 
                  key={site.id} 
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                          {site.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {site.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {site.domain || site.url || 'localhost'}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            site.status === 'running' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                            site.status === 'stopped' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
                            site.status === 'starting' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            site.status === 'stopping' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {site.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {site.status === 'running' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewSite(site);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="View Site"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDatabaseBrowser(site);
                            }}
                            className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                            title="Database Browser"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                            </svg>
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/sites');
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                        title="Manage Site"
                      >
                        <Cog8ToothIcon className="w-4 h-4" />
                      </button>

                      {site.status === 'running' || site.status === 'stopping' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStopSite(site.id);
                          }}
                          disabled={site.status === 'stopping'}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Stop Site"
                        >
                          {site.status === 'stopping' ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <StopIcon className="w-4 h-4" />
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartSite(site.id);
                          }}
                          disabled={site.status === 'starting'}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Start Site"
                        >
                          {site.status === 'starting' ? (
                            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <PlayIcon className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Modals */}
      <CreateSiteModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSiteCreated={handleSiteCreated}
      />
      <ImportSiteModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSiteImported={handleSiteImported}
      />
      {showTemplateLibrary && (
        <SiteTemplateLibrary
          isOpen={showTemplateLibrary}
          onClose={() => setShowTemplateLibrary(false)}
          onTemplateSelect={(template) => {
            setShowTemplateLibrary(false);
            // Handle template selection
          }}
        />
      )}
      
      <EnvironmentStatus
        isVisible={showEnvironmentStatus}
        onClose={() => setShowEnvironmentStatus(false)}
      />
    </div>
  );
}