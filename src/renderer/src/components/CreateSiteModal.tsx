import React, { useState } from 'react';
import { XMarkIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { SiteTemplateSelector } from './SiteTemplateSelector';
import { SiteTemplate } from '../data/siteTemplates';

interface CreateSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSiteCreated: () => void;
}

export function CreateSiteModal({ isOpen, onClose, onSiteCreated }: CreateSiteModalProps) {
  const [currentStep, setCurrentStep] = useState<'template' | 'configuration' | 'review'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<SiteTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    phpVersion: '8.2',
    wordPressVersion: 'latest'
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTemplateSelect = (template: SiteTemplate) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      phpVersion: template.config.phpVersion,
      wordPressVersion: template.config.wordpressVersion
    }));
  };

  const handleNext = () => {
    if (currentStep === 'template' && selectedTemplate) {
      setCurrentStep('configuration');
    } else if (currentStep === 'configuration') {
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    if (currentStep === 'configuration') {
      setCurrentStep('template');
    } else if (currentStep === 'review') {
      setCurrentStep('configuration');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !selectedTemplate) {
      setError('Please complete all required fields');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const result = await window.electronAPI.sites.create({
        name: formData.name.trim(),
        domain: formData.domain.trim() || `${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.local`,
        phpVersion: formData.phpVersion,
        wordPressVersion: formData.wordPressVersion,
        template: selectedTemplate.id,
        plugins: selectedTemplate.config.plugins,
        themes: selectedTemplate.config.themes
      });

      if ((result as any).success) {
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
    setCurrentStep('template');
    setSelectedTemplate(null);
    setFormData({ name: '', domain: '', phpVersion: '8.2', wordPressVersion: 'latest' });
    setError(null);
    setCreating(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
            {/* Step 1: Template Selection */}
            {currentStep === 'template' && (
              <div className="space-y-4">
                <SiteTemplateSelector
                  onSelectTemplate={handleTemplateSelect}
                  selectedTemplate={selectedTemplate}
                />
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleNext}
                    disabled={!selectedTemplate}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </div>
  );
}