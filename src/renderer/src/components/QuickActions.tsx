import React, { useState, useEffect } from 'react';
import { WordPressSite, SiteStatus } from '../../../shared/types';
import { EyeIcon, EyeSlashIcon, KeyIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

interface QuickActionsProps {
  site: WordPressSite;
  onAction: (action: string, data?: any) => void;
}

export function QuickActions({ site, onAction }: QuickActionsProps) {
  const [showCredentials, setShowCredentials] = useState(false);
  const [adminUrl, setAdminUrl] = useState('');

  useEffect(() => {
    // Generate admin URL based on site domain
    const baseUrl = site.domain.startsWith('http') ? site.domain : `http://${site.domain}`;
    setAdminUrl(`${baseUrl}/wp-admin`);
  }, [site.domain]);

  const handleQuickAction = (action: string, data?: any) => {
    onAction(action, { siteId: site.id, ...data });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      onAction('showMessage', { 
        type: 'success', 
        message: `${label} copied to clipboard!` 
      });
    }).catch(() => {
      onAction('showMessage', { 
        type: 'error', 
        message: `Failed to copy ${label}` 
      });
    });
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mt-2">
      <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
        Quick Actions
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {/* Admin Access */}
        <button
          onClick={() => handleQuickAction('openAdmin')}
          className="flex items-center justify-center space-x-1 px-3 py-2 text-xs bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800/50 disabled:opacity-50"
          disabled={site.status !== SiteStatus.RUNNING}
        >
          <KeyIcon className="w-3 h-3" />
          <span>Admin</span>
        </button>

        {/* View Site */}
        <button
          onClick={() => handleQuickAction('viewSite')}
          className="flex items-center justify-center space-x-1 px-3 py-2 text-xs bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800/50 disabled:opacity-50"
          disabled={site.status !== SiteStatus.RUNNING}
        >
          <GlobeAltIcon className="w-3 h-3" />
          <span>View</span>
        </button>

        {/* Copy URL */}
        <button
          onClick={() => copyToClipboard(site.domain, 'Site URL')}
          className="flex items-center justify-center space-x-1 px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          <span>📋</span>
          <span>Copy URL</span>
        </button>

        {/* Toggle Credentials */}
        <button
          onClick={() => setShowCredentials(!showCredentials)}
          className="flex items-center justify-center space-x-1 px-3 py-2 text-xs bg-purple-100 dark:bg-purple-800/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800/50"
        >
          {showCredentials ? <EyeSlashIcon className="w-3 h-3" /> : <EyeIcon className="w-3 h-3" />}
          <span>Creds</span>
        </button>
      </div>

      {/* Credentials Section */}
      {showCredentials && (
        <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded border">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            WordPress Admin
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Username:</span>
              <button
                onClick={() => copyToClipboard('admin', 'Username')}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                admin
              </button>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Password:</span>
              <button
                onClick={() => copyToClipboard('password', 'Password')}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                password
              </button>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Admin URL:</span>
              <button
                onClick={() => copyToClipboard(adminUrl, 'Admin URL')}
                className="text-blue-600 dark:text-blue-400 hover:underline truncate ml-2 max-w-24"
              >
                /wp-admin
              </button>
            </div>
          </div>
          
          <div className="mt-2 p-1 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-700 dark:text-yellow-300">
            💡 Default dev credentials - change after setup
          </div>
        </div>
      )}

      {/* Development Tools */}
      <div className="mt-3 space-y-2">
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => handleQuickAction('openLogs')}
            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            disabled={site.status !== SiteStatus.RUNNING}
          >
            📊 Logs
          </button>
          <button
            onClick={() => handleQuickAction('clearCache')}
            className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-800/30 text-orange-700 dark:text-orange-300 rounded hover:bg-orange-200 dark:hover:bg-orange-800/50"
            disabled={site.status !== SiteStatus.RUNNING}
          >
            🔄 Cache
          </button>
          <button
            onClick={() => handleQuickAction('debugMode')}
            className="px-2 py-1 text-xs bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800/50"
            disabled={site.status !== SiteStatus.RUNNING}
          >
            🐛 Debug
          </button>
        </div>
        
        {/* Advanced Tools */}
        <div className="space-y-1">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => handleQuickAction('cloneSite')}
              className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800/50"
            >
              📋 Clone
            </button>
            <button
              onClick={() => handleQuickAction('performanceMonitor')}
              className="px-2 py-1 text-xs bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800/50"
              disabled={site.status !== SiteStatus.RUNNING}
            >
              📈 Stats
            </button>
            <button
              onClick={() => handleQuickAction('sslManager')}
              className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-800/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800/50"
            >
              🔒 SSL
            </button>
          </div>
          
          {/* Developer Tools */}
          <div className="grid grid-cols-1 gap-1">
            <button
              onClick={() => handleQuickAction('developerTools')}
              className="px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-800/30 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800/50 flex items-center justify-center space-x-1"
              disabled={site.status !== SiteStatus.RUNNING}
            >
              <span>🛠️</span>
              <span>Advanced Developer Tools</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}