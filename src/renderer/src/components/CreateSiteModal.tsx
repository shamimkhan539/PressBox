import React, { useState } from 'react';
import { XMarkIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { SiteTemplateSelector } from './SiteTemplateSelector';
import { SiteBlueprintSelector } from './SiteBlueprintSelector';
import { SiteTemplate } from '../data/siteTemplates';

interface CreateSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSiteCreated: () => void;
}

export function CreateSiteModal({ isOpen, onClose, onSiteCreated }: CreateSiteModalProps) {
  const [creationMode, setCreationMode] = useState<'template' | 'blueprint'>('template');
  const [currentStep, setCurrentStep] = useState<'mode' | 'template' | 'configuration' | 'review'>('mode');
  const [selectedTemplate, setSelectedTemplate] = useState<SiteTemplate | null>(null);
  const [selectedBlueprint, setSelectedBlueprint] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    databaseName: '',
    phpVersion: '8.2',
    wordPressVersion: 'latest'
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBlueprintSelector, setShowBlueprintSelector] = useState(false);

  const handleTemplateSelect = (template: SiteTemplate) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      phpVersion: template.config.phpVersion,
      wordPressVersion: template.config.wordpressVersion
    }));
  };

  const handleBlueprintSelect = (blueprint: any) => {
    setSelectedBlueprint(blueprint);
    if (blueprint) {
      setFormData(prev => ({
        ...prev,
        phpVersion: blueprint.config?.phpVersion || '8.2',
        wordPressVersion: blueprint.config?.wordpressVersion || 'latest'
      }));
    }
    setShowBlueprintSelector(false);
  };

  const handleModeSelect = (mode: 'template' | 'blueprint') => {
    setCreationMode(mode);
    setCurrentStep('template');
    setSelectedTemplate(null);
    setSelectedBlueprint(null);
  };

  const handleNext = () => {
    if (currentStep === 'mode') {
      setCurrentStep('template');
    } else if (currentStep === 'template' && (selectedTemplate || selectedBlueprint)) {
      setCurrentStep('configuration');
    } else if (currentStep === 'configuration') {
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    if (currentStep === 'template') {
      setCurrentStep('mode');
    } else if (currentStep === 'configuration') {
      setCurrentStep('template');
    } else if (currentStep === 'review') {
      setCurrentStep('configuration');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || (!selectedTemplate && !selectedBlueprint)) {
      setError('Please complete all required fields');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      let result;

      if (creationMode === 'blueprint' && selectedBlueprint) {
        // Create site from blueprint
        result = await window.electronAPI.blueprints.createSite(selectedBlueprint.id, {
          name: formData.name.trim(),
          domain: formData.domain.trim() || `${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.local`,
          phpVersion: formData.phpVersion,
          wordPressVersion: formData.wordPressVersion
        });
      } else if (selectedTemplate) {
        // Create site from template
        result = await window.electronAPI.sites.create({
          name: formData.name.trim(),
          domain: formData.domain.trim() || `${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.local`,
          phpVersion: formData.phpVersion,
          wordPressVersion: formData.wordPressVersion,
          template: selectedTemplate.id,
          plugins: selectedTemplate.config.plugins,
          themes: selectedTemplate.config.themes
        });
      }

      if ((result as any).success || result) {
        resetModal();
        onSiteCreated();
        onClose();
      } else {
        setError((result as any).error || 'Failed to create site');
      }
    } catch (error) {
      setError('Failed to create site. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const resetModal = () => {
    setCurrentStep('mode');
    setCreationMode('template');
    setSelectedTemplate(null);
    setSelectedBlueprint(null);
    setFormData({ name: '', domain: '', databaseName: '', phpVersion: '8.2', wordPressVersion: 'latest' });
    setError(null);
    setCreating(false);
    setShowBlueprintSelector(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Auto-generate database name and domain when site name changes
      if (field === 'name' && value) {
        const sanitized = value.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '') // Remove special characters
          .replace(/\s+/g, '_') // Replace spaces with underscores
          .substring(0, 20); // Limit length
        
        if (!prev.databaseName || prev.databaseName.startsWith(prev.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 20))) {
          newData.databaseName = `wp_${sanitized}`;
        }
        
        if (!prev.domain || prev.domain.startsWith(prev.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').substring(0, 20))) {
          newData.domain = `${sanitized.replace(/_/g, '-')}.local`;
        }
      }
      
      return newData;
    });
    if (error) setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform scale-100 opacity-100 transition-all duration-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              {currentStep !== 'template' && (
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  disabled={creating}
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Create New WordPress Site
                </h2>
                <div className="flex space-x-2 mt-2">
                  {['template', 'configuration', 'review'].map((step, index) => (
                    <div
                      key={step}
                      className={`h-2 w-8 rounded-full ${
                        step === currentStep
                          ? 'bg-blue-500'
                          : index < ['template', 'configuration', 'review'].indexOf(currentStep)
                          ? 'bg-green-500'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                resetModal();
                onClose();
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              disabled={creating}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {/* Step 1: Mode Selection */}
            {currentStep === 'mode' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Choose Creation Method</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Select how you'd like to create your WordPress site</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                    onClick={() => handleModeSelect('template')}
                    className="p-6 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left group bg-white dark:bg-gray-700"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Basic Templates</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Choose from simple, pre-configured WordPress setups with common configurations.</p>
                  </button>

                  <button
                    onClick={() => handleModeSelect('blueprint')}
                    className="p-6 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left group bg-white dark:bg-gray-700"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50">
                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Site Blueprints</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Advanced templates with plugins, themes, content, and custom configurations ready to use.</p>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Template Selection */}
            {currentStep === 'template' && (
              <div className="space-y-4">
                {creationMode === 'template' ? (
                  <SiteTemplateSelector
                    onSelectTemplate={handleTemplateSelect}
                    selectedTemplate={selectedTemplate}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="max-w-md mx-auto">
                      <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Choose a Blueprint</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                        {selectedBlueprint 
                          ? `Selected: ${selectedBlueprint.name}` 
                          : 'Browse our collection of professional WordPress site blueprints with pre-installed themes, plugins, and content.'
                        }
                      </p>
                      <button
                        onClick={() => setShowBlueprintSelector(true)}
                        className="btn-primary"
                      >
                        {selectedBlueprint ? 'Change Blueprint' : 'Browse Blueprints'}
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between pt-4">
                  <button
                    onClick={handleBack}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!selectedTemplate && !selectedBlueprint}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <span>Continue</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Configuration */}
            {currentStep === 'configuration' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Site Configuration
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Site Name */}
                    <div>
                      <label className="form-label">Site Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="form-input"
                        placeholder="My Awesome Site"
                        disabled={creating}
                        required
                      />
                    </div>

                    {/* Domain */}
                    <div>
                      <label className="form-label">Local Domain</label>
                      <input
                        type="text"
                        value={formData.domain}
                        onChange={(e) => handleInputChange('domain', e.target.value)}
                        className="form-input"
                        placeholder="mysite.local"
                        disabled={creating}
                      />
                    </div>

                    {/* Database Name */}
                    <div>
                      <label className="form-label">Database Name *</label>
                      <input
                        type="text"
                        value={formData.databaseName}
                        onChange={(e) => handleInputChange('databaseName', e.target.value)}
                        className="form-input"
                        placeholder="wp_mysite"
                        disabled={creating}
                        required
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        MySQL database name (auto-generated from site name)
                      </p>
                    </div>

                    {/* PHP Version */}
                    <div>
                      <label className="form-label">PHP Version</label>
                      <select
                        value={formData.phpVersion}
                        onChange={(e) => handleInputChange('phpVersion', e.target.value)}
                        className="form-input"
                        disabled={creating}
                      >
                        <option value="7.4">PHP 7.4</option>
                        <option value="8.0">PHP 8.0</option>
                        <option value="8.1">PHP 8.1</option>
                        <option value="8.2">PHP 8.2</option>
                        <option value="8.3">PHP 8.3</option>
                      </select>
                    </div>

                    {/* WordPress Version */}
                    <div>
                      <label className="form-label">WordPress Version</label>
                      <select
                        value={formData.wordPressVersion}
                        onChange={(e) => handleInputChange('wordPressVersion', e.target.value)}
                        className="form-input"
                        disabled={creating}
                      >
                        <option value="6.0">WordPress 6.0</option>
                        <option value="6.1">WordPress 6.1</option>
                        <option value="6.2">WordPress 6.2</option>
                        <option value="6.3">WordPress 6.3</option>
                        <option value="latest">Latest Version</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleNext}
                    disabled={!formData.name.trim()}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <span>Review</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 'review' && selectedTemplate && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Review Site Configuration
                  </h3>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Template</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{selectedTemplate.icon}</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {selectedTemplate.name}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Site Name</span>
                        <p className="font-medium text-gray-900 dark:text-white">{formData.name}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Domain</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formData.domain || `${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.local`}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Tech Stack</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          PHP {formData.phpVersion} • WP {formData.wordPressVersion}
                        </p>
                      </div>
                    </div>

                    {selectedTemplate.config.plugins.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Plugins ({selectedTemplate.config.plugins.length})
                        </span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedTemplate.config.plugins.slice(0, 6).map((plugin, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                            >
                              {plugin}
                            </span>
                          ))}
                          {selectedTemplate.config.plugins.length > 6 && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs">
                              +{selectedTemplate.config.plugins.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="btn-primary flex items-center space-x-2"
                    disabled={creating}
                  >
                    {creating ? (
                      <>
                        <div className="spinner w-4 h-4"></div>
                        <span>Creating Site...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Site</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Blueprint Selector Modal */}
      <SiteBlueprintSelector
        isOpen={showBlueprintSelector}
        onClose={() => setShowBlueprintSelector(false)}
        onSelectBlueprint={handleBlueprintSelect}
        selectedBlueprintId={selectedBlueprint?.id}
      />
    </div>
  );
}