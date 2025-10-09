import React, { useState, useEffect } from 'react';
import { XMarkIcon, ShieldExclamationIcon, CommandLineIcon } from '@heroicons/react/24/outline';

interface AdminNotificationProps {
  isVisible: boolean;
  onClose: () => void;
}

export function AdminNotification({ isVisible, onClose }: AdminNotificationProps) {
  const [adminStatus, setAdminStatus] = useState<{
    isAdmin: boolean;
    canModifyHosts: boolean;
    platform: string;
    error?: string;
  } | null>(null);
  const [instructions, setInstructions] = useState<{
    windows: string[];
    macos: string[];
    linux: string[];
  } | null>(null);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (isVisible) {
      checkAdminStatus();
      loadInstructions();
    }
  }, [isVisible]);

  const checkAdminStatus = async () => {
    try {
      const status = await window.electronAPI.system.checkAdmin();
      setAdminStatus(status);
    } catch (error) {
      console.error('Failed to check admin status:', error);
    }
  };

  const loadInstructions = async () => {
    try {
      const instructions = await window.electronAPI.system.getElevationInstructions();
      setInstructions(instructions);
    } catch (error) {
      console.error('Failed to load elevation instructions:', error);
    }
  };

  const requestElevation = async () => {
    try {
      setRequesting(true);
      const success = await window.electronAPI.system.requestElevation();
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to request elevation:', error);
    } finally {
      setRequesting(false);
    }
  };

  const getPlatformInstructions = () => {
    if (!instructions || !adminStatus) return [];
    
    switch (adminStatus.platform) {
      case 'win32':
        return instructions.windows;
      case 'darwin':
        return instructions.macos;
      case 'linux':
        return instructions.linux;
      default:
        return [];
    }
  };

  const getPlatformName = () => {
    if (!adminStatus) return 'Unknown';
    
    switch (adminStatus.platform) {
      case 'win32':
        return 'Windows';
      case 'darwin':
        return 'macOS';
      case 'linux':
        return 'Linux';
      default:
        return adminStatus.platform;
    }
  };

  if (!isVisible || !adminStatus) return null;

  // If admin privileges are already available, don't show notification
  if (adminStatus.isAdmin && adminStatus.canModifyHosts) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg flex items-center justify-center">
                <ShieldExclamationIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Administrator Privileges Required
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getPlatformName()} System Modification Access Needed
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

          {/* Status */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <ShieldExclamationIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Why are administrator privileges needed?
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  PressBox needs to modify your system's hosts file (
                  <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded text-xs">
                    {adminStatus.platform === 'win32' 
                      ? 'C:\\Windows\\System32\\drivers\\etc\\hosts' 
                      : '/etc/hosts'
                    }
                  </code>
                  ) to register local domain names like <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded text-xs">mysite.local</code> for your WordPress development sites.
                </p>
                {adminStatus.error && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    <strong>Current Status:</strong> {adminStatus.error}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <CommandLineIcon className="w-5 h-5 mr-2" />
              How to Grant Administrator Privileges
            </h3>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <ol className="space-y-3">
                {getPlatformInstructions().map((instruction, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Windows automatic elevation button */}
            {adminStatus.platform === 'win32' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Automatic Elevation (Windows)
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      PressBox can automatically restart itself with administrator privileges.
                    </p>
                  </div>
                  <button
                    onClick={requestElevation}
                    disabled={requesting}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {requesting ? (
                      <>
                        <div className="spinner w-4 h-4"></div>
                        <span>Restarting...</span>
                      </>
                    ) : (
                      <>
                        <ShieldExclamationIcon className="w-4 h-4" />
                        <span>Restart as Admin</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* What happens next */}
          <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
              What happens after granting privileges?
            </h4>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• PressBox can automatically register domains like <code>mysite.local</code></li>
              <li>• Your WordPress sites will be accessible via custom local domains</li>
              <li>• No manual hosts file editing required</li>
              <li>• Full local development environment functionality</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Continue Without Admin
            </button>
            <button
              onClick={checkAdminStatus}
              className="btn-primary"
            >
              Check Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}