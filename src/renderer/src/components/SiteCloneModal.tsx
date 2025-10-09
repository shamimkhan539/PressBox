import React, { useState, useEffect } from 'react';
import { WordPressSite } from '../../../shared/types';
import { 
  DocumentDuplicateIcon, 
  ShieldCheckIcon, 
  ServerIcon, 
  ClockIcon,
  ChartBarIcon,
  CogIcon 
} from '@heroicons/react/24/outline';

interface SiteCloneModalProps {
  site: WordPressSite | null;
  isOpen: boolean;
  onClose: () => void;
  onCloneComplete: (result: any) => void;
}

export function SiteCloneModal({ site, isOpen, onClose, onCloneComplete }: SiteCloneModalProps) {
  const [cloneName, setCloneName] = useState('');
  const [cloneDomain, setCloneDomain] = useState('');
  const [includeDatabase, setIncludeDatabase] = useState(true);
  const [includeUploads, setIncludeUploads] = useState(true);
  const [includePlugins, setIncludePlugins] = useState(true);
  const [includeThemes, setIncludeThemes] = useState(true);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneProgress, setCloneProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  useEffect(() => {
    if (site && isOpen) {
      setCloneName(`${site.name} - Copy`);
      setCloneDomain(`${site.name.toLowerCase().replace(/\s+/g, '-')}-copy.local`);
      setCloneProgress(0);
      setCurrentStep('');
    }
  }, [site, isOpen]);

  const handleClone = async () => {
    if (!site || !cloneName.trim() || !cloneDomain.trim()) {
      return;
    }

    setIsCloning(true);
    setCloneProgress(0);

    try {
      // Simulate cloning process
      const steps = [
        'Preparing clone environment...',
        'Copying site files...',
        'Cloning database...',
        'Copying uploads directory...',
        'Installing plugins...',
        'Installing themes...',
        'Configuring new site...',
        'Starting services...',
        'Clone complete!'
      ];

      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i]);
        setCloneProgress(Math.round(((i + 1) / steps.length) * 100));
        
        // Simulate work time
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
      }

      const cloneResult = {
        success: true,
        siteName: cloneName,
        siteDomain: cloneDomain,
        originalSite: site.name,
        cloneId: `site_${Date.now()}`
      };

      onCloneComplete(cloneResult);
      onClose();
    } catch (error) {
      console.error('Clone failed:', error);
      setCurrentStep('Clone failed. Please try again.');
    } finally {
      setIsCloning(false);
    }
  };

  if (!isOpen || !site) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <DocumentDuplicateIcon className="w-5 h-5 mr-2" />
            Clone Site: {site.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={isCloning}
          >
            ×
          </button>
        </div>

        {isCloning ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Cloning Site...
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {currentStep}
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${cloneProgress}%` }}
                />
              </div>
              
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {cloneProgress}% Complete
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Clone Name
              </label>
              <input
                type="text"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter clone name..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Clone Domain
              </label>
              <input
                type="text"
                value={cloneDomain}
                onChange={(e) => setCloneDomain(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter clone domain..."
              />
            </div>

            <div className="border-t dark:border-gray-700 pt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                What to Clone
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeDatabase}
                    onChange={(e) => setIncludeDatabase(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Database (content, users, settings)
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeUploads}
                    onChange={(e) => setIncludeUploads(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Uploads directory (media files)
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includePlugins}
                    onChange={(e) => setIncludePlugins(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Plugins and configurations
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeThemes}
                    onChange={(e) => setIncludeThemes(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Themes and customizations
                  </span>
                </label>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="flex items-start">
                <ClockIcon className="w-4 h-4 text-blue-500 mt-0.5 mr-2" />
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>Estimated time:</strong> 2-5 minutes depending on site size and selected options.
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleClone}
                disabled={!cloneName.trim() || !cloneDomain.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clone Site
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}