import React, { useState } from 'react';
import { 
  XMarkIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PaintBrushIcon,
  Cog6ToothIcon,
  StarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  SwatchIcon
} from '@heroicons/react/24/outline';
import { WordPressSite } from '../../../shared/types';

interface ThemeManagerProps {
  isOpen: boolean;
  onClose: () => void;
  site: WordPressSite | null;
}

interface WordPressTheme {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  screenshot: string;
  isActive: boolean;
  isParent: boolean;
  hasChildTheme: boolean;
  lastUpdated: string;
  rating: number;
  downloads: number;
  tags: string[];
  status: 'active' | 'inactive' | 'needs-update' | 'error';
}

interface ThemeRepository {
  id: string;
  name: string;
  author: string;
  version: string;
  rating: number;
  downloads: number;
  lastUpdated: string;
  screenshot: string;
  description: string;
  tags: string[];
  price: number;
  isPremium: boolean;
}

const mockInstalledThemes: WordPressTheme[] = [
  {
    id: 'twentytwentyfour',
    name: 'Twenty Twenty-Four',
    version: '1.0',
    author: 'WordPress Team',
    description: 'Default WordPress theme for 2024 with modern block patterns.',
    screenshot: 'https://via.placeholder.com/300x225?text=Twenty+Twenty-Four',
    isActive: true,
    isParent: true,
    hasChildTheme: false,
    lastUpdated: '2024-01-15',
    rating: 4.5,
    downloads: 2500000,
    tags: ['blog', 'portfolio', 'block-patterns'],
    status: 'active'
  },
  {
    id: 'astra',
    name: 'Astra',
    version: '3.9.4',
    author: 'Brainstorm Force',
    description: 'Fast, lightweight and highly customizable theme.',
    screenshot: 'https://via.placeholder.com/300x225?text=Astra',
    isActive: false,
    isParent: true,
    hasChildTheme: true,
    lastUpdated: '2024-09-20',
    rating: 4.8,
    downloads: 1200000,
    tags: ['business', 'e-commerce', 'blog'],
    status: 'inactive'
  },
  {
    id: 'astra-child',
    name: 'Astra Child',
    version: '1.0.0',
    author: 'Custom Development',
    description: 'Child theme of Astra with custom modifications.',
    screenshot: 'https://via.placeholder.com/300x225?text=Astra+Child',
    isActive: false,
    isParent: false,
    hasChildTheme: false,
    lastUpdated: '2024-08-15',
    rating: 0,
    downloads: 0,
    tags: ['child-theme', 'custom'],
    status: 'inactive'
  },
  {
    id: 'oceanwp',
    name: 'OceanWP',
    version: '3.5.1',
    author: 'OceanWP',
    description: 'Multipurpose theme with extensive customization options.',
    screenshot: 'https://via.placeholder.com/300x225?text=OceanWP',
    isActive: false,
    isParent: true,
    hasChildTheme: false,
    lastUpdated: '2024-09-10',
    rating: 4.7,
    downloads: 800000,
    tags: ['multipurpose', 'woocommerce', 'responsive'],
    status: 'needs-update'
  }
];

const mockThemeRepository: ThemeRepository[] = [
  {
    id: 'hello-elementor',
    name: 'Hello Elementor',
    author: 'Elementor Team',
    version: '2.8.0',
    rating: 4.6,
    downloads: 5000000,
    lastUpdated: '2024-09-25',
    screenshot: 'https://via.placeholder.com/300x225?text=Hello+Elementor',
    description: 'Lightweight theme designed for Elementor page builder.',
    tags: ['elementor', 'lightweight', 'page-builder'],
    price: 0,
    isPremium: false
  },
  {
    id: 'generatepress',
    name: 'GeneratePress',
    author: 'Tom Usborne',
    version: '3.4.0',
    rating: 4.9,
    downloads: 400000,
    lastUpdated: '2024-09-20',
    screenshot: 'https://via.placeholder.com/300x225?text=GeneratePress',
    description: 'Lightweight, fast, and flexible theme for any website.',
    tags: ['performance', 'seo', 'accessibility'],
    price: 0,
    isPremium: false
  },
  {
    id: 'divi',
    name: 'Divi',
    author: 'Elegant Themes',
    version: '4.22.0',
    rating: 4.8,
    downloads: 600000,
    lastUpdated: '2024-09-28',
    screenshot: 'https://via.placeholder.com/300x225?text=Divi',
    description: 'Ultimate visual page builder theme with drag & drop editor.',
    tags: ['page-builder', 'multipurpose', 'visual-editor'],
    price: 89,
    isPremium: true
  },
  {
    id: 'storefront',
    name: 'Storefront',
    author: 'WooCommerce',
    version: '4.5.2',
    rating: 4.4,
    downloads: 900000,
    lastUpdated: '2024-09-15',
    screenshot: 'https://via.placeholder.com/300x225?text=Storefront',
    description: 'Perfect theme for WooCommerce stores with deep integration.',
    tags: ['woocommerce', 'e-commerce', 'shop'],
    price: 0,
    isPremium: false
  }
];

export function ThemeManager({ isOpen, onClose, site }: ThemeManagerProps) {
  const [activeTab, setActiveTab] = useState('installed');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [installingTheme, setInstallingTheme] = useState<string | null>(null);
  const [uploadingTheme, setUploadingTheme] = useState(false);

  if (!isOpen || !site) return null;

  const filteredInstalledThemes = mockInstalledThemes.filter(theme =>
    theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    theme.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    theme.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredRepositoryThemes = mockThemeRepository.filter(theme => {
    const matchesSearch = theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         theme.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         theme.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
                           theme.tags.includes(selectedCategory) ||
                           (selectedCategory === 'free' && !theme.isPremium) ||
                           (selectedCategory === 'premium' && theme.isPremium);
    
    return matchesSearch && matchesCategory;
  });

  const handleActivateTheme = (themeId: string) => {
    console.log(`Activating theme: ${themeId} for site: ${site.name}`);
    // Implementation for theme activation
  };

  const handleInstallTheme = async (themeId: string) => {
    setInstallingTheme(themeId);
    console.log(`Installing theme: ${themeId} for site: ${site.name}`);
    
    // Simulate installation
    setTimeout(() => {
      setInstallingTheme(null);
    }, 3000);
  };

  const handleDeleteTheme = (themeId: string) => {
    if (window.confirm('Are you sure you want to delete this theme?')) {
      console.log(`Deleting theme: ${themeId} from site: ${site.name}`);
    }
  };

  const handleCreateChildTheme = (parentThemeId: string) => {
    console.log(`Creating child theme for: ${parentThemeId} on site: ${site.name}`);
  };

  const handleUploadTheme = () => {
    setUploadingTheme(true);
    console.log(`Uploading custom theme to site: ${site.name}`);
    
    // Simulate upload
    setTimeout(() => {
      setUploadingTheme(false);
    }, 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'inactive': return 'text-gray-600 bg-gray-50';
      case 'needs-update': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <PaintBrushIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Theme Manager</h2>
              <p className="text-sm text-gray-500">Manage themes for {site.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <XMarkIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('installed')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'installed'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Installed Themes
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'browse'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Browse Repository
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Upload Theme
          </button>
          <button
            onClick={() => setActiveTab('customizer')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'customizer'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Theme Customizer
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'installed' && (
            <div className="h-full flex flex-col">
              {/* Search and Filters */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search installed themes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="author">Sort by Author</option>
                    <option value="updated">Sort by Last Updated</option>
                    <option value="status">Sort by Status</option>
                  </select>
                </div>
              </div>

              {/* Installed Themes Grid */}
              <div className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredInstalledThemes.map((theme) => (
                    <div key={theme.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative">
                        <img
                          src={theme.screenshot}
                          alt={theme.name}
                          className="w-full h-48 object-cover"
                        />
                        <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(theme.status)}`}>
                          {theme.status === 'active' && <CheckCircleIcon className="w-3 h-3 inline mr-1" />}
                          {theme.status === 'needs-update' && <ExclamationTriangleIcon className="w-3 h-3 inline mr-1" />}
                          {theme.status.replace('-', ' ').toUpperCase()}
                        </div>
                        {theme.hasChildTheme && (
                          <div className="absolute top-3 right-3 px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">
                            Child Theme
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-gray-900 text-sm">{theme.name}</h3>
                          <span className="text-xs text-gray-500">{theme.version}</span>
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-2">by {theme.author}</p>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{theme.description}</p>
                        
                        <div className="flex items-center justify-between mb-3">
                          {theme.rating > 0 && (
                            <div className="flex items-center space-x-1">
                              <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-600">{theme.rating}</span>
                            </div>
                          )}
                          <span className="text-xs text-gray-500">
                            Updated {new Date(theme.lastUpdated).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {theme.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {!theme.isActive ? (
                            <button
                              onClick={() => handleActivateTheme(theme.id)}
                              className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs"
                            >
                              Activate
                            </button>
                          ) : (
                            <div className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-xs text-center">
                              Active Theme
                            </div>
                          )}
                          
                          <button
                            onClick={() => setShowPreview(theme.id)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          
                          {theme.isParent && !theme.hasChildTheme && (
                            <button
                              onClick={() => handleCreateChildTheme(theme.id)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <SwatchIcon className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteTheme(theme.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            disabled={theme.isActive}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'browse' && (
            <div className="h-full flex flex-col">
              {/* Search and Filters */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search WordPress themes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    <option value="blog">Blog</option>
                    <option value="business">Business</option>
                    <option value="portfolio">Portfolio</option>
                    <option value="e-commerce">E-Commerce</option>
                    <option value="free">Free Themes</option>
                    <option value="premium">Premium Themes</option>
                  </select>
                </div>
              </div>

              {/* Repository Themes Grid */}
              <div className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRepositoryThemes.map((theme) => (
                    <div key={theme.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative">
                        <img
                          src={theme.screenshot}
                          alt={theme.name}
                          className="w-full h-48 object-cover"
                        />
                        {theme.isPremium && (
                          <div className="absolute top-3 left-3 px-2 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-medium">
                            Premium
                          </div>
                        )}
                        <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 text-white rounded-full text-xs">
                          {theme.isPremium ? `$${theme.price}` : 'Free'}
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-gray-900 text-sm">{theme.name}</h3>
                          <span className="text-xs text-gray-500">{theme.version}</span>
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-2">by {theme.author}</p>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{theme.description}</p>
                        
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-1">
                            <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-600">{theme.rating}</span>
                            <span className="text-xs text-gray-500">({theme.downloads.toLocaleString()} downloads)</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {theme.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleInstallTheme(theme.id)}
                            disabled={installingTheme === theme.id}
                            className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs disabled:opacity-50"
                          >
                            {installingTheme === theme.id ? (
                              <div className="flex items-center justify-center space-x-1">
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Installing...</span>
                              </div>
                            ) : (
                              <>
                                <ArrowDownTrayIcon className="w-3 h-3 inline mr-1" />
                                Install
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => setShowPreview(theme.id)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-md w-full">
                <div className="text-center mb-6">
                  <CloudArrowUpIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Custom Theme</h3>
                  <p className="text-gray-600">Install a theme from a ZIP file</p>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-purple-400 transition-colors">
                  <input
                    type="file"
                    accept=".zip"
                    className="hidden"
                    id="theme-upload"
                    onChange={handleUploadTheme}
                  />
                  <label
                    htmlFor="theme-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mb-3" />
                    <span className="text-sm font-medium text-gray-900 mb-1">
                      Click to upload theme ZIP file
                    </span>
                    <span className="text-xs text-gray-500">
                      Maximum file size: 50MB
                    </span>
                  </label>
                </div>
                
                {uploadingTheme && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-blue-700">Uploading and installing theme...</span>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Upload Requirements:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Valid WordPress theme ZIP file</li>
                    <li>• Contains style.css with theme headers</li>
                    <li>• Maximum file size: 50MB</li>
                    <li>• Themes will be scanned for security</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customizer' && (
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white mb-6">
                  <h3 className="text-xl font-semibold mb-2">Theme Customizer</h3>
                  <p className="opacity-90">Customize your active theme with live preview</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Customization Panel */}
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                        <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2" />
                        Site Identity
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Site Title</label>
                          <input
                            type="text"
                            defaultValue={site.name}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
                          <input
                            type="text"
                            defaultValue="Just another WordPress site"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Site Logo</label>
                          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            Upload Logo
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                        <SwatchIcon className="w-5 h-5 mr-2" />
                        Colors
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              defaultValue="#6366f1"
                              className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              defaultValue="#6366f1"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              defaultValue="#ec4899"
                              className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              defaultValue="#ec4899"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                        <Cog6ToothIcon className="w-5 h-5 mr-2" />
                        Layout Options
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Site Layout</label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                            <option>Full Width</option>
                            <option>Boxed</option>
                            <option>Framed</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Header Style</label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                            <option>Default</option>
                            <option>Centered</option>
                            <option>Minimal</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Live Preview */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h4 className="font-medium text-gray-900 mb-4">Live Preview</h4>
                    <div className="bg-gray-100 rounded-lg p-4 h-96 flex items-center justify-center">
                      <div className="text-center">
                        <EyeIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">Live preview will appear here</p>
                        <button className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                          Launch Customizer
                        </button>
                      </div>
                    </div>
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