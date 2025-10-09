import React, { useState, useEffect } from 'react';
import { WordPressSite, SiteStatus } from '../../../shared/types';
import { 
  ShieldCheckIcon,
  KeyIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

interface SSLConfiguration {
  enabled: boolean;
  certificateType: 'self-signed' | 'lets-encrypt' | 'custom' | 'none';
  domain: string;
  validFrom?: Date;
  validTo?: Date;
  issuer?: string;
  status: 'valid' | 'expiring' | 'expired' | 'invalid';
}

interface SSLManagerProps {
  site: WordPressSite;
  isOpen: boolean;
  onClose: () => void;
  onSSLUpdated: (siteId: string, config: SSLConfiguration) => void;
}

export function SSLManager({ site, isOpen, onClose, onSSLUpdated }: SSLManagerProps) {
  const [sslConfig, setSSLConfig] = useState<SSLConfiguration>({
    enabled: false,
    certificateType: 'none',
    domain: site?.domain || '',
    status: 'invalid'
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [customCertFile, setCustomCertFile] = useState<File | null>(null);
  const [customKeyFile, setCustomKeyFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen && site) {
      // Load existing SSL configuration
      loadSSLConfiguration();
    }
  }, [isOpen, site]);

  const loadSSLConfiguration = async () => {
    try {
      // Simulate loading SSL configuration
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Generate sample SSL configuration
      const hasSSL = Math.random() > 0.7; // 30% chance of having SSL
      
      if (hasSSL) {
        const validFrom = new Date();
        validFrom.setDate(validFrom.getDate() - 30);
        const validTo = new Date();
        validTo.setDate(validTo.getDate() + 60);
        
        setSSLConfig({
          enabled: true,
          certificateType: 'self-signed',
          domain: site.domain,
          validFrom,
          validTo,
          issuer: 'PressBox Self-Signed CA',
          status: 'valid'
        });
      } else {
        setSSLConfig({
          enabled: false,
          certificateType: 'none',
          domain: site.domain,
          status: 'invalid'
        });
      }
    } catch (error) {
      console.error('Failed to load SSL configuration:', error);
    }
  };

  const generateSelfSignedCertificate = async () => {
    setIsGenerating(true);
    
    try {
      const steps = [
        'Generating private key...',
        'Creating certificate request...',
        'Signing certificate...',
        'Installing certificate...',
        'Updating site configuration...',
        'Restarting web server...'
      ];

      for (let i = 0; i < steps.length; i++) {
        setGenerationStep(steps[i]);
        await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));
      }

      const validFrom = new Date();
      const validTo = new Date();
      validTo.setDate(validTo.getDate() + 365); // Valid for 1 year

      const newConfig: SSLConfiguration = {
        enabled: true,
        certificateType: 'self-signed',
        domain: site.domain,
        validFrom,
        validTo,
        issuer: 'PressBox Self-Signed CA',
        status: 'valid'
      };

      setSSLConfig(newConfig);
      onSSLUpdated(site.id, newConfig);
      
      setGenerationStep('Certificate generated successfully!');
      setTimeout(() => setGenerationStep(''), 2000);
    } catch (error) {
      setGenerationStep('Failed to generate certificate');
      console.error('Certificate generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSSL = async (enabled: boolean) => {
    const newConfig = { ...sslConfig, enabled };
    setSSLConfig(newConfig);
    onSSLUpdated(site.id, newConfig);
  };

  const getSSLStatusColor = () => {
    switch (sslConfig.status) {
      case 'valid':
        return 'text-green-600 dark:text-green-400';
      case 'expiring':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'expired':
      case 'invalid':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getSSLStatusIcon = () => {
    switch (sslConfig.status) {
      case 'valid':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'expiring':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'expired':
      case 'invalid':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <LockClosedIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <ShieldCheckIcon className="w-5 h-5 mr-2" />
            SSL Certificate Manager
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Site Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <GlobeAltIcon className="w-5 h-5 text-gray-500" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{site.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{site.domain}</div>
              </div>
            </div>
          </div>

          {/* SSL Status */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                SSL Status
              </h3>
              <div className="flex items-center space-x-2">
                {getSSLStatusIcon()}
                <span className={`font-medium ${getSSLStatusColor()}`}>
                  {sslConfig.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            {sslConfig.enabled && sslConfig.validFrom && sslConfig.validTo && (
              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Certificate Type:</span>
                    <div className="font-medium text-gray-900 dark:text-white capitalize">
                      {sslConfig.certificateType.replace('-', ' ')}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Issuer:</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {sslConfig.issuer}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Valid From:</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {sslConfig.validFrom.toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Valid To:</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {sslConfig.validTo.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sslConfig.enabled}
                  onChange={(e) => toggleSSL(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  disabled={isGenerating}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Enable SSL/HTTPS for this site
                </span>
              </label>
            </div>
          </div>

          {/* Certificate Options */}
          {sslConfig.enabled && (
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Certificate Options
              </h3>

              {isGenerating ? (
                <div className="text-center py-6">
                  <div className="spinner w-8 h-8 mx-auto mb-4"></div>
                  <div className="text-gray-600 dark:text-gray-400">{generationStep}</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Self-Signed Certificate */}
                  <div className="border dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <KeyIcon className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          Self-Signed Certificate
                        </span>
                      </div>
                      <button
                        onClick={generateSelfSignedCertificate}
                        className="btn-primary text-sm"
                        disabled={site.status !== SiteStatus.RUNNING}
                      >
                        {sslConfig.certificateType === 'self-signed' ? 'Regenerate' : 'Generate'}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Quick setup for development. Browsers will show security warnings.
                    </p>
                  </div>

                  {/* Let's Encrypt */}
                  <div className="border dark:border-gray-600 rounded-lg p-4 opacity-60">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <LockClosedIcon className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          Let's Encrypt Certificate
                        </span>
                      </div>
                      <button className="btn-outline text-sm" disabled>
                        Coming Soon
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Free, trusted certificates for production use. Requires domain validation.
                    </p>
                  </div>

                  {/* Custom Certificate */}
                  <div className="border dark:border-gray-600 rounded-lg p-4 opacity-60">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <ShieldCheckIcon className="w-4 h-4 text-purple-500" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          Custom Certificate
                        </span>
                      </div>
                      <button className="btn-outline text-sm" disabled>
                        Upload
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Use your own certificate files (.crt and .key files).
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <div className="font-medium mb-1">Development Environment Notice</div>
                <p>
                  This is a local development environment. Self-signed certificates will trigger browser 
                  security warnings. For production sites, use proper SSL certificates from a trusted 
                  Certificate Authority.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}