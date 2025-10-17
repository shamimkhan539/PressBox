import React, { useState, useEffect } from 'react';
import { XMarkIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { SiteTemplateSelector } from './SiteTemplateSelector';
import { SiteBlueprintSelector } from './SiteBlueprintSelector';
import { SiteTemplate } from '../data/siteTemplates';

interface CreateSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSiteCreated: () => void;
}

// Available versions
const PHP_VERSIONS = ['7.4', '8.0', '8.1', '8.2', '8.3'];
const WORDPRESS_VERSIONS = ['latest', '6.4', '6.3', '6.2', '6.1'];
const MYSQL_VERSIONS = ['8.0', '8.1', '8.2', '5.7'];
const MARIADB_VERSIONS = ['11.2', '11.1', '11.0', '10.11', '10.6', '10.5'];
const NGINX_VERSIONS = ['1.25', '1.24', '1.23', '1.22'];
const APACHE_VERSIONS = ['2.4', '2.2'];

// WordPress languages
const WP_LANGUAGES = [
  { code: 'en_US', name: 'English (United States)' },
  { code: 'en_GB', name: 'English (UK)' },
  { code: 'es_ES', name: 'Español' },
  { code: 'fr_FR', name: 'Français' },
  { code: 'de_DE', name: 'Deutsch' },
  { code: 'it_IT', name: 'Italiano' },
  { code: 'pt_BR', name: 'Português (Brasil)' },
  { code: 'pt_PT', name: 'Português (Portugal)' },
  { code: 'ru_RU', name: 'Русский' },
  { code: 'ja', name: '日本語' },
  { code: 'zh_CN', name: '简体中文' },
  { code: 'zh_TW', name: '繁體中文' },
  { code: 'ko_KR', name: '한국어' },
  { code: 'ar', name: 'العربية' },
  { code: 'nl_NL', name: 'Nederlands' },
  { code: 'pl_PL', name: 'Polski' },
  { code: 'tr_TR', name: 'Türkçe' },
  { code: 'sv_SE', name: 'Svenska' },
  { code: 'da_DK', name: 'Dansk' },
  { code: 'fi', name: 'Suomi' },
];

export function CreateSiteModal({ isOpen, onClose, onSiteCreated }: CreateSiteModalProps) {
  const [creationMode, setCreationMode] = useState<'template' | 'blueprint' | 'custom'>('custom');
  const [currentStep, setCurrentStep] = useState<'mode' | 'template' | 'configuration' | 'wordpress' | 'review'>('mode');
  const [selectedTemplate, setSelectedTemplate] = useState<SiteTemplate | null>(null);
  const [selectedBlueprint, setSelectedBlueprint] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    domain: '',
    
    // Environment Configuration
    phpVersion: '8.2',
    wordPressVersion: 'latest',
    
    // Database Configuration
    database: 'mysql' as 'mysql' | 'mariadb' | 'sqlite',
    databaseVersion: '8.0',
    
    // Web Server Configuration
    webServer: 'nginx' as 'nginx' | 'apache',
    webServerVersion: '1.25',
    
    // Features
    ssl: false,
    multisite: false,
    
    // WordPress Admin
    adminUser: 'admin',
    adminPassword: '',
    adminEmail: '',
    wpLanguage: 'en_US',
  });

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBlueprintSelector, setShowBlueprintSelector] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Auto-generate secure password on mount
  useEffect(() => {
    if (!formData.adminPassword) {
      setFormData(prev => ({
        ...prev,
        adminPassword: generateSecurePassword(),
        adminEmail: 'admin@localhost.test'
      }));
    }
  }, []);

  // Update database version when database type changes
  useEffect(() => {
    if (formData.database === 'mysql') {
      setFormData(prev => ({ ...prev, databaseVersion: '8.0' }));
    } else if (formData.database === 'mariadb') {
      setFormData(prev => ({ ...prev, databaseVersion: '11.2' }));
    } else if (formData.database === 'sqlite') {
      setFormData(prev => ({ ...prev, databaseVersion: '' }));
    }
  }, [formData.database]);

  // Update web server version when server type changes
  useEffect(() => {
    if (formData.webServer === 'nginx') {
      setFormData(prev => ({ ...prev, webServerVersion: '1.25' }));
    } else {
      setFormData(prev => ({ ...prev, webServerVersion: '2.4' }));
    }
  }, [formData.webServer]);

  const generateSecurePassword = () => {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

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
        wordPressVersion: blueprint.config?.wordpressVersion || 'latest',
        database: blueprint.config?.database || 'mysql',
        webServer: blueprint.config?.webServer || 'nginx',
        ssl: blueprint.config?.ssl || false,
        multisite: blueprint.config?.multisite || false,
      }));
    }
    setShowBlueprintSelector(false);
  };

  const handleModeSelect = (mode: 'template' | 'blueprint' | 'custom') => {
    setCreationMode(mode);
    if (mode === 'custom') {
      setCurrentStep('configuration');
    } else {
      setCurrentStep('template');
    }
    setSelectedTemplate(null);
    setSelectedBlueprint(null);
  };

  const handleNext = () => {
    if (currentStep === 'mode') {
      if (creationMode === 'custom') {
        setCurrentStep('configuration');
      } else {
        setCurrentStep('template');
      }
    } else if (currentStep === 'template' && (selectedTemplate || selectedBlueprint)) {
      setCurrentStep('configuration');
    } else if (currentStep === 'configuration') {
      setCurrentStep('wordpress');
    } else if (currentStep === 'wordpress') {
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    if (currentStep === 'template') {
      setCurrentStep('mode');
    } else if (currentStep === 'configuration') {
      if (creationMode === 'custom') {
        setCurrentStep('mode');
      } else {
        setCurrentStep('template');
      }
    } else if (currentStep === 'wordpress') {
      setCurrentStep('configuration');
    } else if (currentStep === 'review') {
      setCurrentStep('wordpress');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError('Please enter a site name');
      return;
    }
    if (!formData.adminUser.trim()) {
      setError('Please enter an admin username');
      return;
    }
    if (!formData.adminPassword.trim()) {
      setError('Please enter an admin password');
      return;
    }
    if (!formData.adminEmail.trim() || !formData.adminEmail.includes('@')) {
      setError('Please enter a valid admin email');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const siteConfig = {
        name: formData.name.trim(),
        domain: formData.domain.trim() || `${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.local`,
        phpVersion: formData.phpVersion,
        wordPressVersion: formData.wordPressVersion,
        database: formData.database,
        databaseVersion: formData.databaseVersion,
        webServer: formData.webServer,
        webServerVersion: formData.webServerVersion,
        ssl: formData.ssl,
        multisite: formData.multisite,
        adminUser: formData.adminUser,
        adminPassword: formData.adminPassword,
        adminEmail: formData.adminEmail,
        wpLanguage: formData.wpLanguage,
      };

      let result;

      if (creationMode === 'blueprint' && selectedBlueprint) {
        result = await window.electronAPI.blueprints.createSite(selectedBlueprint.id, siteConfig);
      } else if (selectedTemplate) {
        result = await window.electronAPI.sites.create({
          ...siteConfig,
          template: selectedTemplate.id,
          plugins: selectedTemplate.config.plugins,
          themes: selectedTemplate.config.themes,
        });
      } else {
        result = await window.electronAPI.sites.create(siteConfig);
      }

      if ((result as any).success || result) {
        resetModal();
        onSiteCreated();
        onClose();
      } else {
        setError((result as any).error || 'Failed to create site');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create site. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const resetModal = () => {
    setCurrentStep('mode');
    setCreationMode('custom');
    setSelectedTemplate(null);
    setSelectedBlueprint(null);
    setFormData({
      name: '',
      domain: '',
      phpVersion: '8.2',
      wordPressVersion: 'latest',
      database: 'mysql',
      databaseVersion: '8.0',
      webServer: 'nginx',
      webServerVersion: '1.25',
      ssl: false,
      multisite: false,
      adminUser: 'admin',
      adminPassword: generateSecurePassword(),
      adminEmail: 'admin@localhost.test',
      wpLanguage: 'en_US',
    });
    setError(null);
    setCreating(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Site</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {currentStep === 'mode' && 'Choose how you want to create your site'}
              {currentStep === 'template' && 'Select a template or blueprint'}
              {currentStep === 'configuration' && 'Configure your environment'}
              {currentStep === 'wordpress' && 'WordPress settings'}
              {currentStep === 'review' && 'Review and create'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            disabled={creating}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            {['Mode', creationMode !== 'custom' ? 'Template' : null, 'Environment', 'WordPress', 'Review'].filter(Boolean).map((step, index, arr) => (
              <React.Fragment key={step}>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    arr.indexOf(currentStep.charAt(0).toUpperCase() + currentStep.slice(1)) >= index
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    arr.indexOf(currentStep.charAt(0).toUpperCase() + currentStep.slice(1)) >= index
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step}
                  </span>
                </div>
                {index < arr.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    arr.indexOf(currentStep.charAt(0).toUpperCase() + currentStep.slice(1)) > index
                      ? 'bg-blue-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Step 1: Mode Selection */}
          {currentStep === 'mode' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => handleModeSelect('custom')}
                  className="p-6 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left group bg-white dark:bg-gray-700"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800/50">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Custom Setup</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Full control over all settings - choose your database, web server, and configure everything yourself.</p>
                </button>

                <button
                  type="button"
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
                  <p className="text-sm text-gray-600 dark:text-gray-300">Quick start with pre-configured WordPress setups for common use cases.</p>
                </button>

                <button
                  type="button"
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
                  <p className="text-sm text-gray-600 dark:text-gray-300">Advanced templates with plugins, themes, and content ready to use.</p>
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
                        : 'Browse professional WordPress site blueprints with pre-installed themes, plugins, and content.'
                      }
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowBlueprintSelector(true)}
                      className="btn-primary"
                    >
                      {selectedBlueprint ? 'Change Blueprint' : 'Browse Blueprints'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Environment Configuration */}
          {currentStep === 'configuration' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Leave empty to auto-generate
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Database Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Database Type *</label>
                    <select
                      value={formData.database}
                      onChange={(e) => handleInputChange('database', e.target.value as any)}
                      className="form-input"
                      disabled={creating}
                    >
                      <option value="mysql">MySQL</option>
                      <option value="mariadb">MariaDB</option>
                      <option value="sqlite">SQLite</option>
                    </select>
                  </div>

                  {formData.database !== 'sqlite' && (
                    <div>
                      <label className="form-label">Database Version</label>
                      <select
                        value={formData.databaseVersion}
                        onChange={(e) => handleInputChange('databaseVersion', e.target.value)}
                        className="form-input"
                        disabled={creating}
                      >
                        {formData.database === 'mysql' && MYSQL_VERSIONS.map(v => (
                          <option key={v} value={v}>MySQL {v}</option>
                        ))}
                        {formData.database === 'mariadb' && MARIADB_VERSIONS.map(v => (
                          <option key={v} value={v}>MariaDB {v}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Web Server Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">Web Server *</label>
                    <select
                      value={formData.webServer}
                      onChange={(e) => handleInputChange('webServer', e.target.value as any)}
                      className="form-input"
                      disabled={creating}
                    >
                      <option value="nginx">Nginx</option>
                      <option value="apache">Apache</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Server Version</label>
                    <select
                      value={formData.webServerVersion}
                      onChange={(e) => handleInputChange('webServerVersion', e.target.value)}
                      className="form-input"
                      disabled={creating}
                    >
                      {formData.webServer === 'nginx' && NGINX_VERSIONS.map(v => (
                        <option key={v} value={v}>Nginx {v}</option>
                      ))}
                      {formData.webServer === 'apache' && APACHE_VERSIONS.map(v => (
                        <option key={v} value={v}>Apache {v}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">PHP Version</label>
                    <select
                      value={formData.phpVersion}
                      onChange={(e) => handleInputChange('phpVersion', e.target.value)}
                      className="form-input"
                      disabled={creating}
                    >
                      {PHP_VERSIONS.map(v => (
                        <option key={v} value={v}>PHP {v}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <input
                      type="checkbox"
                      checked={formData.ssl}
                      onChange={(e) => handleInputChange('ssl', e.target.checked)}
                      className="form-checkbox h-5 w-5 text-blue-600 rounded"
                      disabled={creating}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">Enable SSL</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Use HTTPS for local development</div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <input
                      type="checkbox"
                      checked={formData.multisite}
                      onChange={(e) => handleInputChange('multisite', e.target.checked)}
                      className="form-checkbox h-5 w-5 text-blue-600 rounded"
                      disabled={creating}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">WordPress Multisite</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Enable WordPress network/multisite</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: WordPress Configuration */}
          {currentStep === 'wordpress' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">WordPress Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">WordPress Version</label>
                    <select
                      value={formData.wordPressVersion}
                      onChange={(e) => handleInputChange('wordPressVersion', e.target.value)}
                      className="form-input"
                      disabled={creating}
                    >
                      {WORDPRESS_VERSIONS.map(v => (
                        <option key={v} value={v}>{v === 'latest' ? 'Latest' : `WordPress ${v}`}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Language</label>
                    <select
                      value={formData.wpLanguage}
                      onChange={(e) => handleInputChange('wpLanguage', e.target.value)}
                      className="form-input"
                      disabled={creating}
                    >
                      {WP_LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Administrator Account</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Admin Username *</label>
                    <input
                      type="text"
                      value={formData.adminUser}
                      onChange={(e) => handleInputChange('adminUser', e.target.value)}
                      className="form-input"
                      placeholder="admin"
                      disabled={creating}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Admin Email *</label>
                    <input
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                      className="form-input"
                      placeholder="admin@localhost.test"
                      disabled={creating}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="form-label">Admin Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.adminPassword}
                        onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                        className="form-input pr-24"
                        placeholder="Enter a secure password"
                        disabled={creating}
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
                        <button
                          type="button"
                          onClick={() => handleInputChange('adminPassword', generateSecurePassword())}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          disabled={creating}
                        >
                          Generate
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          disabled={creating}
                        >
                          {showPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Use a strong password for security
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4">Review Your Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Site Information</h4>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-blue-700 dark:text-blue-300">Name:</dt>
                        <dd className="text-blue-900 dark:text-blue-100 font-medium">{formData.name || '(not set)'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-blue-700 dark:text-blue-300">Domain:</dt>
                        <dd className="text-blue-900 dark:text-blue-100 font-medium">
                          {formData.domain || `${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.local`}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Environment</h4>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-blue-700 dark:text-blue-300">PHP:</dt>
                        <dd className="text-blue-900 dark:text-blue-100 font-medium">{formData.phpVersion}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-blue-700 dark:text-blue-300">WordPress:</dt>
                        <dd className="text-blue-900 dark:text-blue-100 font-medium">{formData.wordPressVersion}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-blue-700 dark:text-blue-300">Language:</dt>
                        <dd className="text-blue-900 dark:text-blue-100 font-medium">
                          {WP_LANGUAGES.find(l => l.code === formData.wpLanguage)?.name}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Database</h4>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-blue-700 dark:text-blue-300">Type:</dt>
                        <dd className="text-blue-900 dark:text-blue-100 font-medium capitalize">{formData.database}</dd>
                      </div>
                      {formData.database !== 'sqlite' && (
                        <div className="flex justify-between">
                          <dt className="text-blue-700 dark:text-blue-300">Version:</dt>
                          <dd className="text-blue-900 dark:text-blue-100 font-medium">{formData.databaseVersion}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Web Server</h4>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-blue-700 dark:text-blue-300">Server:</dt>
                        <dd className="text-blue-900 dark:text-blue-100 font-medium capitalize">{formData.webServer}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-blue-700 dark:text-blue-300">Version:</dt>
                        <dd className="text-blue-900 dark:text-blue-100 font-medium">{formData.webServerVersion}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Features</h4>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-blue-700 dark:text-blue-300">SSL:</dt>
                        <dd className="text-blue-900 dark:text-blue-100 font-medium">{formData.ssl ? 'Enabled' : 'Disabled'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-blue-700 dark:text-blue-300">Multisite:</dt>
                        <dd className="text-blue-900 dark:text-blue-100 font-medium">{formData.multisite ? 'Yes' : 'No'}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Admin Account</h4>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-blue-700 dark:text-blue-300">Username:</dt>
                        <dd className="text-blue-900 dark:text-blue-100 font-medium">{formData.adminUser}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-blue-700 dark:text-blue-300">Email:</dt>
                        <dd className="text-blue-900 dark:text-blue-100 font-medium">{formData.adminEmail}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
          <div>
            {currentStep !== 'mode' && (
              <button
                type="button"
                onClick={handleBack}
                className="btn-secondary flex items-center space-x-2"
                disabled={creating}
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              disabled={creating}
            >
              Cancel
            </button>
            
            {currentStep === 'review' ? (
              <button
                onClick={handleSubmit}
                className="btn-primary"
                disabled={creating}
              >
                {creating ? 'Creating Site...' : 'Create Site'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  (currentStep === 'template' && !selectedTemplate && !selectedBlueprint) ||
                  (currentStep === 'configuration' && !formData.name.trim())
                }
                className="btn-primary flex items-center space-x-2"
              >
                <span>Continue</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Blueprint Selector Modal */}
      {showBlueprintSelector && (
        <SiteBlueprintSelector
          isOpen={showBlueprintSelector}
          onClose={() => setShowBlueprintSelector(false)}
          onSelectBlueprint={handleBlueprintSelect}
        />
      )}
    </div>
  );
}
