import React, { useState, useEffect } from 'react';
import { CreateSiteModal } from '../components/CreateSiteModal.tsx';
import { SiteDetailsModal } from '../components/SiteDetailsModal.tsx';
import { ExportWizard, ImportWizard } from '../components';
import { TrashIcon, CloudArrowUpIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline';
import { WordPressSite, SiteStatus } from '../../../shared/types';

/**
 * Sites Page Component
 * 
 * Displays all WordPress sites with management options.
 */
export function Sites() {
  const [sites, setSites] = useState<WordPressSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSites();
    
    // Poll for site status updates every 5 seconds
    const interval = setInterval(() => {
      loadSites();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadSites = async () => {
    try {
      setLoading(true);
      setError(null);
      const sitesData = await window.electronAPI.sites.list();
      setSites(sitesData);
    } catch (err) {
      console.error('Failed to load sites:', err);
      setError('Failed to load sites. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState<WordPressSite | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExportWizard, setShowExportWizard] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [exportSite, setExportSite] = useState<WordPressSite | null>(null);

  const handleCreateSite = () => {
    setShowCreateModal(true);
  };

  const handleSiteCreated = () => {
    loadSites(); // Refresh sites list
  };

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
          result = await window.electronAPI.sites.delete(siteId);
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
    } catch (error) {
      setError(`Failed to ${action} site. Please try again.`);
    }
  };

  const handleOpenSite = (site: WordPressSite) => {
    if (site.status === SiteStatus.RUNNING) {
      const url = site.domain.startsWith('http') ? site.domain : `http://${site.domain}`;
      (window.electronAPI as any).shell.openExternal(url);
      
      // Show informative message
      setTimeout(() => {
        setError(`Opened ${site.name} at ${url}. Note: This is a development version - full Docker integration will start actual WordPress sites.`);
        setTimeout(() => setError(null), 8000);
      }, 500);
    } else if (site.status === SiteStatus.STOPPED) {
      setError(`Site "${site.name}" is stopped. Please start it first to access the website.`);
      setTimeout(() => setError(null), 5000);
    } else {
      setError(`Site "${site.name}" is ${site.status}. Please wait for it to finish starting.`);
      setTimeout(() => setError(null), 5000);
    }
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
          <button onClick={loadSites} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            WordPress Sites
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your local WordPress development sites
          </p>
        </div>
        <div className="flex space-x-3">
          <button onClick={handleCreateSite} className="btn-primary">
            + Create New Site
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
          {sites.map((site) => (
            <div key={site.id} className="card p-6">
              {/* Site Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                    {site.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {site.domain}
                  </p>
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
                      setExportSite(site);
                      setShowExportWizard(true);
                    }}
                    className="btn-outline px-3 py-2"
                    title="Export Site"
                  >
                    <CloudArrowUpIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
    </div>
  );
}