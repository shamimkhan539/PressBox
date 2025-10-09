import React, { useState, useEffect } from 'react';
import { 
  PuzzlePieceIcon,
  MagnifyingGlassIcon,
  StarIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface WordPressPlugin {
  id: string;
  name: string;
  slug: string;
  version: string;
  description: string;
  author: string;
  authorProfile: string;
  rating: number;
  activeInstalls: number;
  lastUpdated: string;
  requiresWP: string;
  testedUpTo: string;
  requiresPHP: string;
  downloadCount: number;
  tags: string[];
  screenshots: string[];
  isInstalled: boolean;
  isActive: boolean;
  hasUpdate: boolean;
  newVersion?: string;
}

interface PluginManagerProps {
  siteId: string;
  siteName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PluginManager({ siteId, siteName, isOpen, onClose }: PluginManagerProps) {
  const [activeTab, setActiveTab] = useState<'installed' | 'browse' | 'upload'>('installed');
  const [plugins, setPlugins] = useState<WordPressPlugin[]>([]);
  const [browsePlugins, setBrowsePlugins] = useState<WordPressPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Mock installed plugins
  const mockInstalledPlugins: WordPressPlugin[] = [
    {
      id: '1',
      name: 'Yoast SEO',
      slug: 'wordpress-seo',
      version: '21.5',
      description: 'The first true all-in-one SEO solution for WordPress, including on-page content analysis, XML sitemaps and much more.',
      author: 'Team Yoast',
      authorProfile: 'https://yoast.com/',
      rating: 4.6,
      activeInstalls: 5000000,
      lastUpdated: '2024-10-01',
      requiresWP: '6.2',
      testedUpTo: '6.4',
      requiresPHP: '7.4',
      downloadCount: 300000000,
      tags: ['seo', 'xml sitemaps', 'google', 'meta'],
      screenshots: [],
      isInstalled: true,
      isActive: true,
      hasUpdate: true,
      newVersion: '21.6'
    },
    {
      id: '2',
      name: 'WooCommerce',
      slug: 'woocommerce',
      version: '8.2.1',
      description: 'The most customizable eCommerce platform for building your online business. Build it exactly how you want.',
      author: 'Automattic',
      authorProfile: 'https://woocommerce.com/',
      rating: 4.4,
      activeInstalls: 4000000,
      lastUpdated: '2024-09-28',
      requiresWP: '6.2',
      testedUpTo: '6.4',
      requiresPHP: '7.4',
      downloadCount: 250000000,
      tags: ['ecommerce', 'shop', 'store', 'sell'],
      screenshots: [],
      isInstalled: true,
      isActive: false,
      hasUpdate: false
    },
    {
      id: '3',
      name: 'Contact Form 7',
      slug: 'contact-form-7',
      version: '5.8.2',
      description: 'Just another contact form plugin. Simple but flexible.',
      author: 'Takayuki Miyoshi',
      authorProfile: 'https://contactform7.com/',
      rating: 4.2,
      activeInstalls: 5000000,
      lastUpdated: '2024-09-15',
      requiresWP: '6.0',
      testedUpTo: '6.4',
      requiresPHP: '7.4',
      downloadCount: 400000000,
      tags: ['contact', 'form', 'email'],
      screenshots: [],
      isInstalled: true,
      isActive: true,
      hasUpdate: false
    }
  ];

  // Mock browse plugins
  const mockBrowsePlugins: WordPressPlugin[] = [
    {
      id: '4',
      name: 'Elementor Website Builder',
      slug: 'elementor',
      version: '3.16.5',
      description: 'The Elementor Website Builder has it all: drag and drop page builder, pixel perfect design, mobile responsive editing, and more.',
      author: 'Elementor.com',
      authorProfile: 'https://elementor.com/',
      rating: 4.7,
      activeInstalls: 5000000,
      lastUpdated: '2024-10-05',
      requiresWP: '6.0',
      testedUpTo: '6.4',
      requiresPHP: '7.4',
      downloadCount: 180000000,
      tags: ['page builder', 'elementor', 'builder', 'editor'],
      screenshots: [],
      isInstalled: false,
      isActive: false,
      hasUpdate: false
    },
    {
      id: '5',
      name: 'Wordfence Security',
      slug: 'wordfence',
      version: '7.11.4',
      description: 'Secure your website with the most comprehensive WordPress security plugin. Firewall, malware scan, blocking, live traffic.',
      author: 'Wordfence',
      authorProfile: 'https://wordfence.com/',
      rating: 4.8,
      activeInstalls: 4000000,
      lastUpdated: '2024-09-30',
      requiresWP: '5.9',
      testedUpTo: '6.4',
      requiresPHP: '7.4',
      downloadCount: 150000000,
      tags: ['security', 'firewall', 'malware', 'scan'],
      screenshots: [],
      isInstalled: false,
      isActive: false,
      hasUpdate: false
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setTimeout(() => {
        setPlugins(mockInstalledPlugins);
        setBrowsePlugins(mockBrowsePlugins);
        setLoading(false);
      }, 800);
    }
  }, [isOpen]);

  const handlePluginAction = (pluginId: string, action: 'activate' | 'deactivate' | 'update' | 'delete' | 'install') => {
    console.log(`${action} plugin ${pluginId}`);
    
    setPlugins(prev => prev.map(plugin => {
      if (plugin.id === pluginId) {
        if (action === 'activate') return { ...plugin, isActive: true };
        if (action === 'deactivate') return { ...plugin, isActive: false };
        if (action === 'update') return { ...plugin, version: plugin.newVersion || plugin.version, hasUpdate: false };
      }
      return plugin;
    }));
  };

  const filteredInstalledPlugins = plugins.filter(plugin =>
    plugin.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBrowsePlugins = browsePlugins.filter(plugin =>
    plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plugin.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plugin.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <PuzzlePieceIcon className="w-8 h-8 text-purple-600 dark:text-purple-400 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Plugin Manager
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {siteName} - WordPress Plugins
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <span className="sr-only">Close</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'installed', label: 'Installed Plugins', count: plugins.length },
                { id: 'browse', label: 'Browse Repository', count: null },
                { id: 'upload', label: 'Upload Plugin', count: null }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search plugins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            {activeTab === 'browse' && (
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Categories</option>
                <option value="security">Security</option>
                <option value="seo">SEO</option>
                <option value="ecommerce">E-commerce</option>
                <option value="performance">Performance</option>
                <option value="social">Social</option>
              </select>
            )}
          </div>

          {/* Installed Plugins Tab */}
          {activeTab === 'installed' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="spinner w-8 h-8 mx-auto"></div>
                </div>
              ) : (
                filteredInstalledPlugins.map((plugin) => (
                  <div key={plugin.id} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                            {plugin.name}
                          </h4>
                          {plugin.isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <CheckCircleIcon className="w-3 h-3 mr-1" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                              <XCircleIcon className="w-3 h-3 mr-1" />
                              Inactive
                            </span>
                          )}
                          {plugin.hasUpdate && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                              <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                              Update Available
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {plugin.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>Version {plugin.version}</span>
                          <span>By {plugin.author}</span>
                          <div className="flex items-center">
                            <StarIconSolid className="w-4 h-4 text-yellow-400 mr-1" />
                            <span>{plugin.rating}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-6">
                        {plugin.hasUpdate && (
                          <button
                            onClick={() => handlePluginAction(plugin.id, 'update')}
                            className="btn-primary flex items-center text-sm"
                          >
                            <ArrowPathIcon className="w-4 h-4 mr-1" />
                            Update to {plugin.newVersion}
                          </button>
                        )}
                        
                        {plugin.isActive ? (
                          <button
                            onClick={() => handlePluginAction(plugin.id, 'deactivate')}
                            className="btn-outline flex items-center text-sm"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePluginAction(plugin.id, 'activate')}
                            className="btn-primary flex items-center text-sm"
                          >
                            Activate
                          </button>
                        )}
                        
                        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <Cog6ToothIcon className="w-5 h-5" />
                        </button>
                        
                        <button 
                          onClick={() => handlePluginAction(plugin.id, 'delete')}
                          className="p-2 text-red-400 hover:text-red-600"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Browse Plugins Tab */}
          {activeTab === 'browse' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {loading ? (
                <div className="col-span-2 text-center py-8">
                  <div className="spinner w-8 h-8 mx-auto"></div>
                </div>
              ) : (
                filteredBrowsePlugins.map((plugin) => (
                  <div key={plugin.id} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {plugin.name}
                      </h4>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <StarIconSolid className="w-4 h-4 text-yellow-400 mr-1" />
                        <span>{plugin.rating}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {plugin.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                      <span>By {plugin.author}</span>
                      <span>{(plugin.activeInstalls / 1000000).toFixed(1)}M+ active installations</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {plugin.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>Version {plugin.version}</span>
                        <span>•</span>
                        <span>Updated {plugin.lastUpdated}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handlePluginAction(plugin.id, 'install')}
                          className="btn-primary flex items-center text-sm"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                          Install
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Upload Plugin Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Upload Plugin</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  If you have a plugin in a .zip format, you may install it by uploading it here.
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <PuzzlePieceIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Upload Plugin ZIP</h4>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Drag and drop a plugin ZIP file here, or click to select
                  </p>
                </div>
                <div className="mt-6">
                  <button className="btn-primary">
                    Choose File
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" />
                  <div>
                    <h5 className="font-medium text-yellow-800 dark:text-yellow-200">Important Notes</h5>
                    <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                      <li>• Only install plugins from trusted sources</li>
                      <li>• Always backup your site before installing new plugins</li>
                      <li>• Check plugin compatibility with your WordPress version</li>
                      <li>• Review plugin permissions and requirements</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}