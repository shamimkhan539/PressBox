import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateSiteModal } from '../components/CreateSiteModal.tsx';
import { ImportSiteModal } from '../components/ImportSiteModal.tsx';

interface WordPressSite {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
  domain: string;
  path: string;
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

  // Load dashboard data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get sites data
      const sitesData = await window.electronAPI.sites.list();
      setSites(sitesData);
      
      // Get Docker status
      const [dockerInstalled, dockerRunning] = await Promise.all([
        window.electronAPI.docker.isInstalled(),
        window.electronAPI.docker.isRunning()
      ]);
      
      // Calculate stats
      const totalSites = sitesData.length;
      const runningSites = sitesData.filter(site => site.status === 'running').length;
      
      let dockerStatusText = 'Unknown';
      if (!dockerInstalled) {
        dockerStatusText = 'Not Installed';
      } else if (dockerRunning) {
        dockerStatusText = 'Running';
      } else {
        dockerStatusText = 'Stopped';
      }
      
      setStats({
        totalSites,
        runningSites,
        dockerStatus: dockerStatusText
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setStats(prev => ({ ...prev, dockerStatus: 'Error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSite = () => {
    setShowCreateModal(true);
  };

  const handleImportSite = () => {
    setShowImportModal(true);
  };

  const handleSiteCreated = () => {
    loadDashboardData(); // Refresh data after creating site
  };

  const handleSiteImported = () => {
    loadDashboardData(); // Refresh data after importing site
  };

  const handleViewAllSites = () => {
    navigate('/sites');
  };

  const handleBrowsePlugins = () => {
    navigate('/plugins');
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 md:mb-8">
        <div className="card p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sites</p>
              {loading ? (
                <div className="spinner w-4 h-4 mt-1"></div>
              ) : (
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSites}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Running</p>
              {loading ? (
                <div className="spinner w-4 h-4 mt-1"></div>
              ) : (
                <p className="text-xl md:text-2xl font-bold text-green-600">{stats.runningSites}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Docker</p>
              {loading ? (
                <div className="spinner w-4 h-4 mt-1"></div>
              ) : (
                <p className={`text-sm md:text-base font-semibold ${
                  stats.dockerStatus === 'Running' ? 'text-green-600' : 
                  stats.dockerStatus === 'Stopped' ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>{stats.dockerStatus}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Plugins</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">2</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Actions
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Sites</span>
              {loading ? (
                <div className="spinner w-4 h-4"></div>
              ) : (
                <span className="font-medium text-gray-900 dark:text-white">{stats.totalSites}</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Running Sites</span>
              {loading ? (
                <div className="spinner w-4 h-4"></div>
              ) : (
                <span className="font-medium text-green-600">{stats.runningSites}</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Docker Status</span>
              {loading ? (
                <div className="spinner w-4 h-4"></div>
              ) : (
                <span className={`font-medium ${
                  stats.dockerStatus === 'Running' ? 'text-green-600' : 
                  stats.dockerStatus === 'Stopped' ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>{stats.dockerStatus}</span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-3">
            <button 
              className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/30 dark:hover:to-blue-700/30 transition-all group"
              onClick={handleCreateSite}
            >
              <div className="flex items-center">
                <div className="p-2 bg-blue-600 rounded-lg mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">Create New Site</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Set up a fresh WordPress installation</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button 
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all group"
              onClick={handleImportSite}
            >
              <div className="flex items-center">
                <div className="p-2 bg-gray-600 rounded-lg mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">Import Existing Site</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Import from existing WordPress folder</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button 
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all group"
              onClick={handleViewAllSites}
            >
              <div className="flex items-center">
                <div className="p-2 bg-gray-600 rounded-lg mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">Manage All Sites</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">View and manage your WordPress sites</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Recent Sites */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Sites
          </h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="spinner w-6 h-6"></div>
            </div>
          ) : sites.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No sites created yet
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Create your first site to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sites.slice(0, 3).map((site) => (
                <div key={site.id} className="group p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        site.status === 'running' ? 'bg-green-500' : 
                        site.status === 'starting' ? 'bg-yellow-500 animate-pulse' :
                        site.status === 'stopping' ? 'bg-orange-500 animate-pulse' :
                        'bg-gray-400'
                      }`}></div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{site.name}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>{site.domain}</span>
                          <span>•</span>
                          <span>PHP {(site as any).phpVersion || '8.1'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        site.status === 'running' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                        site.status === 'stopped' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
                        site.status === 'starting' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {site.status}
                      </span>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
              {sites.length > 3 && (
                <button className="btn-secondary w-full mt-3" onClick={handleViewAllSites}>
                  View All {sites.length} Sites
                </button>
              )}
            </div>
          )}
        </div>
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
    </div>
  );
}