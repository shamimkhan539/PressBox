import React, { useState } from 'react';

interface DatabaseModalProps {
  siteId: string;
  siteName: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Database Management Modal Component
 * 
 * Provides database management tools for WordPress sites
 */
export function DatabaseModal({ siteId, siteName, isOpen, onClose }: DatabaseModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isExecuting, setIsExecuting] = useState(false);

  if (!isOpen) return null;

  const handleOpenAdminer = () => {
    // In a real implementation, this would open Adminer for the site
    const adminerUrl = `http://localhost:8080/adminer?server=db-${siteId}`;
    (window.electronAPI as any).shell.openExternal(adminerUrl);
  };

  const handleExportDatabase = async () => {
    setIsExecuting(true);
    try {
      // In a real implementation, this would export the database
      const result = await (window.electronAPI as any)['wp-cli'].execute(siteId, 'db export');
      if (result.success) {
        alert('Database exported successfully');
      } else {
        alert(`Export failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error}`);
    }
    setIsExecuting(false);
  };

  const handleImportDatabase = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.sql,.gz';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setIsExecuting(true);
        try {
          // In a real implementation, this would import the database
          const result = await (window.electronAPI as any)['wp-cli'].execute(siteId, `db import ${file.name}`);
          if (result.success) {
            alert('Database imported successfully');
          } else {
            alert(`Import failed: ${result.error}`);
          }
        } catch (error) {
          alert(`Error: ${error}`);
        }
        setIsExecuting(false);
      }
    };
    input.click();
  };

  const handleResetDatabase = async () => {
    if (!confirm('Are you sure you want to reset the database? This will delete all content and restore WordPress to its initial state.')) {
      return;
    }

    setIsExecuting(true);
    try {
      // In a real implementation, this would reset the database
      const result = await (window.electronAPI as any)['wp-cli'].execute(siteId, 'db reset --yes');
      if (result.success) {
        alert('Database reset successfully');
      } else {
        alert(`Reset failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error}`);
    }
    setIsExecuting(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 10000 }}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        style={{ zIndex: 10001 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Database Management</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Site Info */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Managing database for: <strong>{siteName}</strong>
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Database Tools</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleOpenAdminer}
                  disabled={isExecuting}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                      🗄️
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">Open Adminer</div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Web-based database management interface
                  </div>
                </button>

                <button
                  onClick={handleExportDatabase}
                  disabled={isExecuting}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-3">
                      📦
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">Export Database</div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Create SQL backup of your database
                  </div>
                </button>

                <button
                  onClick={handleImportDatabase}
                  disabled={isExecuting}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-3">
                      📥
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">Import Database</div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Restore database from SQL file
                  </div>
                </button>

                <button
                  onClick={handleResetDatabase}
                  disabled={isExecuting}
                  className="p-4 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mr-3">
                      🔄
                    </div>
                    <div className="font-medium text-red-600 dark:text-red-400">Reset Database</div>
                  </div>
                  <div className="text-sm text-red-500 dark:text-red-400">
                    Restore fresh WordPress installation
                  </div>
                </button>
              </div>
            </div>

            {/* Database Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Database Information</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Database Name</span>
                    <span className="text-sm text-gray-900 dark:text-white font-mono">wordpress_{siteId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Host</span>
                    <span className="text-sm text-gray-900 dark:text-white font-mono">localhost</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Port</span>
                    <span className="text-sm text-gray-900 dark:text-white font-mono">3306</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Username</span>
                    <span className="text-sm text-gray-900 dark:text-white font-mono">wordpress</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick SQL Commands */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Commands</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <code className="text-sm text-gray-600 dark:text-gray-400">
                    wp db query "SELECT COUNT(*) FROM wp_posts WHERE post_status='publish'"
                  </code>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Run</button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <code className="text-sm text-gray-600 dark:text-gray-400">
                    wp db query "SELECT option_value FROM wp_options WHERE option_name='siteurl'"
                  </code>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Run</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {isExecuting && (
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-gray-900 dark:text-white">Executing...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}