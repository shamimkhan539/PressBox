import React, { useState } from 'react';
import { ShieldCheckIcon, GlobeAltIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface AdminModeSelectorProps {
  isVisible: boolean;
  onModeSelected: (mode: 'admin' | 'non-admin') => void;
  onClose: () => void;
}

export function AdminModeSelector({ isVisible, onModeSelected, onClose }: AdminModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<'admin' | 'non-admin' | null>(null);

  if (!isVisible) return null;

  const handleModeSelect = (mode: 'admin' | 'non-admin') => {
    setSelectedMode(mode);
  };

  const handleConfirm = () => {
    if (selectedMode) {
      onModeSelected(selectedMode);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Choose PressBox Mode
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Select how you want to run PressBox. This choice can be changed later in settings.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Selection */}
          <div className="space-y-4 mb-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                How would you like to access your sites?
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Non-Admin Mode */}
              <button
                onClick={() => handleModeSelect('non-admin')}
                className={`p-6 border-2 rounded-lg transition-all text-left group ${
                  selectedMode === 'non-admin'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                }`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedMode === 'non-admin'
                      ? 'bg-blue-100 dark:bg-blue-900/50'
                      : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50'
                  }`}>
                    <GlobeAltIcon className={`w-5 h-5 ${
                      selectedMode === 'non-admin'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`} />
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Easy Mode (Recommended)</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Sites use localhost URLs like http://localhost:8080. No administrator privileges needed.
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <div>• No system modifications</div>
                  <div>• Works on all accounts</div>
                  <div>• Easier setup</div>
                </div>
              </button>

              {/* Admin Mode */}
              <button
                onClick={() => handleModeSelect('admin')}
                className={`p-6 border-2 rounded-lg transition-all text-left group ${
                  selectedMode === 'admin'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/10'
                }`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedMode === 'admin'
                      ? 'bg-green-100 dark:bg-green-900/50'
                      : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-green-100 dark:group-hover:bg-green-900/50'
                  }`}>
                    <ShieldCheckIcon className={`w-5 h-5 ${
                      selectedMode === 'admin'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`} />
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Custom Domains</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Sites use custom domains like http://mysite.local. Requires administrator privileges.
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <div>• Custom domain names</div>
                  <div>• Professional URLs</div>
                  <div>• Requires admin rights</div>
                </div>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedMode}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}