import React, { useState, useEffect } from 'react';
import { ToolIcons, StatusDisplay } from '../components/Icons.tsx';

interface ToolsProps {}

interface DockerStatus {
  installed: boolean;
  running: boolean;
  version?: string;
}

interface SystemInfo {
  version: string;
  platform: string;
  architecture: string;
}

/**
 * Tools Page Component
 * 
 * WordPress development tools and utilities similar to LocalWP's utilities
 */
export function Tools() {
  const [dockerStatus, setDockerStatus] = useState<DockerStatus>({ installed: false, running: false });
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadToolsData();
  }, []);

  const loadToolsData = async () => {
    try {
      setLoading(true);
      
      // Get Docker status
      const [installed, running] = await Promise.all([
        window.electronAPI.docker.isInstalled(),
        window.electronAPI.docker.isRunning()
      ]);
      
      setDockerStatus({ installed, running });

      // Get system info
      const [version, platform, architecture] = await Promise.all([
        window.electronAPI.system.getVersion(),
        window.electronAPI.system.getPlatform(),
        window.electronAPI.system.getArchitecture()
      ]);

      setSystemInfo({ version, platform, architecture });
    } catch (error) {
      console.error('Failed to load tools data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLogs = () => {
    // Open logs directory
    console.log('Opening logs directory...');
  };

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings? This will restore PressBox to default configuration.')) {
      console.log('Resetting settings...');
    }
  };

  const handleExportSettings = () => {
    console.log('Exporting settings...');
  };

  const handleImportSettings = () => {
    console.log('Importing settings...');
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading tools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Developer Tools
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          WordPress development utilities and system management
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Docker Status */}
        <div className="card">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                <ToolIcons.Docker className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              Docker Status
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="font-medium text-gray-700 dark:text-gray-300">Docker Desktop</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  dockerStatus.installed
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                }`}>
                  {dockerStatus.installed ? 'Installed' : 'Not Installed'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="font-medium text-gray-700 dark:text-gray-300">Docker Service</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  dockerStatus.running
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                }`}>
                  {dockerStatus.running ? 'Running' : 'Stopped'}
                </span>
              </div>

              {!dockerStatus.installed && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                    Docker Desktop is required to run WordPress sites locally.
                  </p>
                  <button className="btn-primary text-sm">
                    Download Docker Desktop
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="card">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-3">
                <ToolIcons.System className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              System Information
            </h2>
            
            {systemInfo && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">PressBox Version</span>
                  <span className="text-gray-900 dark:text-white font-medium">{systemInfo.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Platform</span>
                  <span className="text-gray-900 dark:text-white font-medium">{systemInfo.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Architecture</span>
                  <span className="text-gray-900 dark:text-white font-medium">{systemInfo.architecture}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* WordPress CLI Tools */}
        <div className="card">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-3">
                ⚡
              </div>
              WordPress CLI Tools
            </h2>
            
            <div className="space-y-3">
              <button className="w-full p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="font-medium text-gray-900 dark:text-white">WP-CLI Terminal</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Open WordPress command line interface</div>
              </button>
              
              <button className="w-full p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="font-medium text-gray-900 dark:text-white">Database Manager</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Manage WordPress databases with Adminer</div>
              </button>
              
              <button className="w-full p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="font-medium text-gray-900 dark:text-white">Mail Catcher</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">View outgoing emails from WordPress</div>
              </button>
            </div>
          </div>
        </div>

        {/* Application Settings */}
        <div className="card">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mr-3">
                ⚙️
              </div>
              Application Settings
            </h2>
            
            <div className="space-y-3">
              <button 
                onClick={handleOpenLogs}
                className="w-full p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="font-medium text-gray-900 dark:text-white">View Logs</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Open application log files</div>
              </button>
              
              <button 
                onClick={handleExportSettings}
                className="w-full p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="font-medium text-gray-900 dark:text-white">Export Settings</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Backup your PressBox configuration</div>
              </button>
              
              <button 
                onClick={handleImportSettings}
                className="w-full p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="font-medium text-gray-900 dark:text-white">Import Settings</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Restore PressBox configuration</div>
              </button>
              
              <button 
                onClick={handleResetSettings}
                className="w-full p-4 text-left border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <div className="font-medium text-red-600 dark:text-red-400">Reset Settings</div>
                <div className="text-sm text-red-500 dark:text-red-400">Restore default configuration</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Tips */}
      <div className="mt-8 card">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mr-3">
              <ToolIcons.Tip className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            Performance Tips
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2 flex items-center space-x-2">
                <ToolIcons.Memory className="w-4 h-4" />
                <span>Memory Usage</span>
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Allocate at least 4GB RAM to Docker for optimal WordPress performance.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h3 className="font-medium text-green-900 dark:text-green-300 mb-2 flex items-center space-x-2">
                <ToolIcons.CPU className="w-4 h-4" />
                <span>CPU Performance</span>
              </h3>
              <p className="text-sm text-green-800 dark:text-green-300">
                Enable Docker's experimental features for better CPU utilization.
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <h3 className="font-medium text-purple-900 dark:text-purple-300 mb-2 flex items-center space-x-2">
                <ToolIcons.FileSync className="w-4 h-4" />
                <span>File Sync</span>
              </h3>
              <p className="text-sm text-purple-800 dark:text-purple-300">
                Use bind mounts for faster file synchronization during development.
              </p>
            </div>
            
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <h3 className="font-medium text-orange-900 dark:text-orange-300 mb-2 flex items-center space-x-2">
                <ToolIcons.Extensions className="w-4 h-4" />
                <span>Extensions</span>
              </h3>
              <p className="text-sm text-orange-800 dark:text-orange-300">
                Disable unnecessary WordPress plugins in development for better performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}