import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface EnvironmentStatusProps {
  isVisible: boolean;
  onClose: () => void;
}

interface SystemStatus {
  docker: boolean;
  php: { available: boolean; version: string; path: string };
  admin: { isAdmin: boolean; canModifyHosts: boolean };
}

export function EnvironmentStatus({ isVisible, onClose }: EnvironmentStatusProps) {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [installingPHP, setInstallingPHP] = useState(false);
  const [phpInstructions, setPHPInstructions] = useState<string[]>([]);

  useEffect(() => {
    if (isVisible) {
      checkSystemStatus();
      loadPHPInstructions();
    }
  }, [isVisible]);

  const loadPHPInstructions = async () => {
    try {
      const instructions = await window.electronAPI.system.getPHPInstructions();
      setPHPInstructions(instructions);
    } catch (error) {
      console.error('Failed to load PHP instructions:', error);
    }
  };

  const handleInstallPortablePHP = async () => {
    try {
      setInstallingPHP(true);
      const installPath = 'portable-php'; // This could be made configurable
      const success = await window.electronAPI.system.installPortablePHP(installPath);
      
      if (success) {
        // Refresh system status after installation
        await checkSystemStatus();
      } else {
        console.error('Failed to install portable PHP');
      }
    } catch (error) {
      console.error('Error installing portable PHP:', error);
    } finally {
      setInstallingPHP(false);
    }
  };

  const checkSystemStatus = async () => {
    setLoading(true);
    try {
      const [dockerStatus, phpStatus, adminStatus] = await Promise.all([
        window.electronAPI.system.checkDocker?.() || { isInstalled: false, isRunning: false },
        window.electronAPI.system.checkPHP?.() || { isInstalled: false, version: '', path: '' },
        window.electronAPI.system.checkAdmin()
      ]);

      setSystemStatus({
        docker: dockerStatus.isInstalled && dockerStatus.isRunning,
        php: {
          available: phpStatus.isInstalled,
          version: phpStatus.version || '',
          path: phpStatus.path || '',
        },
        admin: adminStatus
      });
    } catch (error) {
      console.error('Failed to check system status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <InformationCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  System Environment Status
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  PressBox Development Environment Check
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner w-8 h-8"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Checking system status...</span>
            </div>
          ) : systemStatus ? (
            <div className="space-y-6">
              {/* Environment Mode */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-3">Development Environment</h3>
                
                {systemStatus.docker ? (
                  <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span>Docker Mode - Full containerized environment available</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                    <InformationCircleIcon className="w-5 h-5" />
                    <span>Local Mode - Using local PHP and file-based setup</span>
                  </div>
                )}
              </div>

              {/* System Requirements */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">System Requirements</h3>
                
                {/* Docker Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {systemStatus.docker ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Docker Desktop</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {systemStatus.docker ? 'Running and available' : 'Not available - using local mode'}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    systemStatus.docker 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {systemStatus.docker ? 'Available' : 'Optional'}
                  </span>
                </div>

                {/* PHP Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {systemStatus.php.available ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">PHP Runtime</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {systemStatus.php.available 
                          ? `PHP ${systemStatus.php.version} available` 
                          : 'Not available - will use portable PHP if needed'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      systemStatus.php.available 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {systemStatus.php.available ? 'Available' : 'Optional'}
                    </span>
                    
                    {!systemStatus.php.available && (
                      <button
                        onClick={handleInstallPortablePHP}
                        disabled={installingPHP}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        {installingPHP ? 'Installing...' : 'Install Portable PHP'}
                      </button>
                    )}
                  </div>
                </div>

                {/* PHP Installation Instructions */}
                {!systemStatus.php.available && phpInstructions.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">PHP Installation Guide</h4>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                      {phpInstructions.map((instruction, index) => (
                        <div key={index} className={instruction === '' ? 'h-2' : ''}>
                          {instruction}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Privileges */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {systemStatus.admin.canModifyHosts ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Administrator Privileges</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {systemStatus.admin.canModifyHosts 
                          ? 'Can modify hosts file for local domains' 
                          : 'Required for automatic domain registration'}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    systemStatus.admin.canModifyHosts 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {systemStatus.admin.canModifyHosts ? 'Available' : 'Required'}
                  </span>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recommendations</h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  {!systemStatus.docker && (
                    <div>• Install Docker Desktop for full containerized environment support</div>
                  )}
                  {!systemStatus.php.available && (
                    <div>• Install PHP locally for better performance (PressBox will provide portable PHP as fallback)</div>
                  )}
                  {!systemStatus.admin.canModifyHosts && (
                    <div>• Run PressBox as administrator for automatic local domain registration</div>
                  )}
                  {systemStatus.docker && systemStatus.admin.canModifyHosts && (
                    <div className="text-green-600 dark:text-green-400">✅ Your system is fully configured for optimal WordPress development!</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Failed to check system status</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={checkSystemStatus}
              className="btn-secondary"
              disabled={loading}
            >
              {loading ? 'Checking...' : 'Refresh Status'}
            </button>
            <button
              onClick={onClose}
              className="btn-primary"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}