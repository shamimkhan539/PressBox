import React, { useState, useEffect } from 'react';
import { WPCLITerminal } from './WPCLITerminal.tsx';
import { DatabaseModal } from './DatabaseModal.tsx';
import { StatusDisplay, ActionIcons } from './Icons.tsx';

interface SiteDetailsModalProps {
  site: WordPressSite | null;
  isOpen: boolean;
  onClose: () => void;
}

interface WordPressSite {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
  domain: string;
  path: string;
  phpVersion?: string;
  wordPressVersion?: string;
  created?: Date;
  port?: number;
  ssl?: boolean;
  adminUrl?: string;
  frontendUrl?: string;
}

export function SiteDetailsModal({ site, isOpen, onClose }: SiteDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [siteInfo, setSiteInfo] = useState<WordPressSite | null>(null);
  const [showWPCLI, setShowWPCLI] = useState(false);
  const [showDatabase, setShowDatabase] = useState(false);

  useEffect(() => {
    if (site && isOpen) {
      setSiteInfo(site);
    }
  }, [site, isOpen]);

  if (!isOpen || !siteInfo) {
    return null;
  }

  const handleOpenSite = () => {
    if (siteInfo.frontendUrl) {
      (window.electronAPI as any).shell.openExternal(siteInfo.frontendUrl);
    }
  };

  const handleOpenAdmin = () => {
    if (siteInfo.adminUrl) {
      (window.electronAPI as any).shell.openExternal(siteInfo.adminUrl);
    }
  };

  const handleOpenInTerminal = () => {
    (window.electronAPI as any).shell.openPath(siteInfo.path);
  };

  const handleCloneSite = async () => {
    const newName = prompt('Enter name for the cloned site:');
    if (newName && siteInfo) {
      try {
        const result = await (window.electronAPI as any).site.clone(siteInfo.id, newName);
        if (result.success) {
          alert(`Site cloned successfully as "${newName}"`);
        } else {
          alert(`Failed to clone site: ${result.error}`);
        }
      } catch (error) {
        alert(`Error cloning site: ${error}`);
      }
    }
  };

  const handleBackupSite = async () => {
    if (siteInfo) {
      try {
        const result = await (window.electronAPI as any).site.backup(siteInfo.id);
        if (result.success) {
          alert(`Backup created: ${result.backupPath}`);
        } else {
          alert(`Failed to create backup: ${result.error}`);
        }
      } catch (error) {
        alert(`Error creating backup: ${error}`);
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 10000 }}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        style={{ zIndex: 10001 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{siteInfo.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{siteInfo.domain}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status and Quick Actions */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                siteInfo.status === 'running' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : siteInfo.status === 'stopped'
                  ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  : siteInfo.status === 'starting' || siteInfo.status === 'stopping'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
              }`}>
                <StatusDisplay status={siteInfo.status} className="flex items-center space-x-1" />
              </span>
              {siteInfo.ssl && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded text-sm font-medium flex items-center space-x-1">
                  <ActionIcons.SSL className="w-3 h-3" />
                  <span>SSL</span>
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {siteInfo.status === 'running' && (
                <>
                  <button
                    onClick={handleOpenSite}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Open Site
                  </button>
                  <button
                    onClick={handleOpenAdmin}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    WP Admin
                  </button>
                </>
              )}
              <button
                onClick={handleOpenInTerminal}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Open Folder
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'database', label: 'Database' },
              { key: 'ssl', label: 'SSL' },
              { key: 'utilities', label: 'Utilities' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Site Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Domain</label>
                      <p className="text-gray-900 dark:text-white">{siteInfo.domain}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Path</label>
                      <p className="text-gray-900 dark:text-white font-mono text-sm">{siteInfo.path}</p>
                    </div>
                    {siteInfo.port && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Port</label>
                        <p className="text-gray-900 dark:text-white">{siteInfo.port}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Environment</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">WordPress Version</label>
                      <p className="text-gray-900 dark:text-white">{siteInfo.wordPressVersion || '6.4.2'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">PHP Version</label>
                      <p className="text-gray-900 dark:text-white">{siteInfo.phpVersion || '8.2'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                      <p className="text-gray-900 dark:text-white">
                        {siteInfo.created ? new Date(siteInfo.created).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* URLs */}
              {siteInfo.status === 'running' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">URLs</h3>
                  <div className="space-y-2">
                    {siteInfo.frontendUrl && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Site URL</label>
                          <p className="text-gray-900 dark:text-white">{siteInfo.frontendUrl}</p>
                        </div>
                        <button
                          onClick={handleOpenSite}
                          className="px-3 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors text-sm"
                        >
                          Open
                        </button>
                      </div>
                    )}
                    {siteInfo.adminUrl && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Admin URL</label>
                          <p className="text-gray-900 dark:text-white">{siteInfo.adminUrl}</p>
                        </div>
                        <button
                          onClick={handleOpenAdmin}
                          className="px-3 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors text-sm"
                        >
                          Open
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Database Management</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setShowDatabase(true)}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Open Database Manager</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Full database management tools</div>
                  </button>
                  <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                    <div className="font-medium text-gray-900 dark:text-white">Quick Export</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create SQL backup</div>
                  </button>
                  <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                    <div className="font-medium text-gray-900 dark:text-white">Search & Replace</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">URL and content replacement</div>
                  </button>
                  <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                    <div className="font-medium text-gray-900 dark:text-white">Optimize Database</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Clean and optimize tables</div>
                  </button>
                </div>

                {/* Database Stats */}
                <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Database Stats</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">23</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Posts</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">8</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Pages</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">2.1MB</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Size</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ssl' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SSL Certificate</h3>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        SSL Status: {siteInfo.ssl ? 'Enabled' : 'Disabled'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {siteInfo.ssl 
                          ? 'Self-signed certificate is active' 
                          : 'Site is using HTTP only'
                        }
                      </p>
                    </div>
                    <button 
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        siteInfo.ssl
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {siteInfo.ssl ? 'Disable SSL' : 'Enable SSL'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'utilities' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Site Utilities</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setShowWPCLI(true)}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">WP-CLI Terminal</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">WordPress command line interface</div>
                  </button>
                  <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                    <div className="font-medium text-gray-900 dark:text-white">View Logs</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">View error and access logs</div>
                  </button>
                  <button 
                    onClick={handleCloneSite}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Clone Site</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Duplicate this site with all data</div>
                  </button>
                  <button 
                    onClick={handleBackupSite}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Create Backup</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Export site files and database</div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WP-CLI Terminal */}
      {siteInfo && (
        <WPCLITerminal
          siteId={siteInfo.id}
          siteName={siteInfo.name}
          isOpen={showWPCLI}
          onClose={() => setShowWPCLI(false)}
        />
      )}

      {/* Database Manager */}
      {siteInfo && (
        <DatabaseModal
          siteId={siteInfo.id}
          siteName={siteInfo.name}
          isOpen={showDatabase}
          onClose={() => setShowDatabase(false)}
        />
      )}
    </div>
  );
}