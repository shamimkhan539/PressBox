import React, { useState, useEffect } from 'react';
import { WordPressSite } from '../../../shared/types';
import { 
  DocumentDuplicateIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  GlobeAltIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface SiteTemplate {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'blog' | 'ecommerce' | 'portfolio' | 'agency' | 'nonprofit';
  complexity: 'simple' | 'advanced' | 'enterprise';
  features: string[];
  estimatedTime: string;
  plugins: string[];
  theme: string;
  demoUrl?: string;
  screenshot?: string;
}

interface SiteTemplateLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelect: (template: SiteTemplate) => void;
}

const PROFESSIONAL_TEMPLATES: SiteTemplate[] = [
  {
    id: 'modern-business',
    name: 'Modern Business Suite',
    description: 'Complete business website with CRM integration, booking system, and team management.',
    category: 'business',
    complexity: 'enterprise',
    features: ['Contact Forms', 'Team Showcase', 'Service Pages', 'Testimonials', 'CRM Integration', 'Analytics'],
    estimatedTime: '15-20 minutes',
    plugins: ['Contact Form 7', 'Yoast SEO', 'WooCommerce', 'Elementor Pro', 'MonsterInsights'],
    theme: 'Astra Pro',
    demoUrl: 'https://demo.example.com/modern-business'
  },
  {
    id: 'tech-startup',
    name: 'Tech Startup Platform',
    description: 'High-performance startup website with investor deck, product showcase, and team profiles.',
    category: 'business',
    complexity: 'advanced',
    features: ['Product Demos', 'Investor Relations', 'Tech Blog', 'API Documentation', 'Job Listings'],
    estimatedTime: '12-15 minutes',
    plugins: ['Elementor', 'Yoast SEO', 'WP Rocket', 'Mailchimp', 'Custom Post Types'],
    theme: 'OceanWP',
    demoUrl: 'https://demo.example.com/tech-startup'
  },
  {
    id: 'creative-portfolio',
    name: 'Creative Portfolio Pro',
    description: 'Stunning portfolio for designers, photographers, and creative professionals.',
    category: 'portfolio',
    complexity: 'advanced',
    features: ['Image Galleries', 'Video Showcases', 'Client Testimonials', 'Contact Forms', 'Social Integration'],
    estimatedTime: '10-12 minutes',
    plugins: ['Elementor Pro', 'Essential Grid', 'Instagram Feed', 'Contact Form 7'],
    theme: 'Bridge Creative',
    demoUrl: 'https://demo.example.com/creative-portfolio'
  },
  {
    id: 'ecommerce-fashion',
    name: 'Fashion E-commerce Store',
    description: 'Complete fashion store with product catalog, wishlist, reviews, and payment integration.',
    category: 'ecommerce',
    complexity: 'enterprise',
    features: ['Product Catalog', 'Shopping Cart', 'Payment Gateway', 'Inventory Management', 'Customer Reviews'],
    estimatedTime: '20-25 minutes',
    plugins: ['WooCommerce', 'WooCommerce Subscriptions', 'YITH Wishlist', 'WC Vendors', 'Stripe'],
    theme: 'Flatsome',
    demoUrl: 'https://demo.example.com/fashion-store'
  },
  {
    id: 'news-magazine',
    name: 'News & Magazine Hub',
    description: 'Professional news website with multi-author support, categorization, and ad management.',
    category: 'blog',
    complexity: 'advanced',
    features: ['Multi-Author', 'Article Categories', 'Breaking News', 'Newsletter', 'Ad Management'],
    estimatedTime: '15-18 minutes',
    plugins: ['Newspaper Theme', 'Ad Inserter', 'Mailchimp', 'Social Share', 'SEO Framework'],
    theme: 'Newspaper X',
    demoUrl: 'https://demo.example.com/news-magazine'
  },
  {
    id: 'restaurant-booking',
    name: 'Restaurant & Booking System',
    description: 'Complete restaurant website with menu, online reservations, and delivery integration.',
    category: 'business',
    complexity: 'advanced',
    features: ['Menu Display', 'Online Reservations', 'Delivery Integration', 'Photo Gallery', 'Reviews'],
    estimatedTime: '12-15 minutes',
    plugins: ['OpenTable', 'WooCommerce', 'Restaurant Reservations', 'Photo Gallery', 'Google Reviews'],
    theme: 'Savoy',
    demoUrl: 'https://demo.example.com/restaurant'
  },
  {
    id: 'nonprofit-fundraiser',
    name: 'Nonprofit Fundraising Platform',
    description: 'Nonprofit website with donation system, volunteer management, and event organization.',
    category: 'nonprofit',
    complexity: 'advanced',
    features: ['Donation Forms', 'Volunteer Portal', 'Event Management', 'Impact Stories', 'Newsletter'],
    estimatedTime: '15-20 minutes',
    plugins: ['Give Donations', 'Events Calendar', 'Mailchimp', 'Volunteer Hub', 'Impact Tracker'],
    theme: 'Charity WP',
    demoUrl: 'https://demo.example.com/nonprofit'
  },
  {
    id: 'agency-corporate',
    name: 'Digital Agency Corporate',
    description: 'Professional agency website with case studies, team profiles, and client portal.',
    category: 'agency',
    complexity: 'enterprise',
    features: ['Case Studies', 'Team Profiles', 'Client Portal', 'Service Pages', 'Project Timeline'],
    estimatedTime: '18-22 minutes',
    plugins: ['Elementor Pro', 'WP Project Manager', 'Client Portal', 'Case Study CPT', 'Live Chat'],
    theme: 'TheGem',
    demoUrl: 'https://demo.example.com/digital-agency'
  }
];

export function SiteTemplateLibrary({ isOpen, onClose, onTemplateSelect }: SiteTemplateLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<SiteTemplate | null>(null);

  const categories = [
    { id: 'all', name: 'All Categories', icon: GlobeAltIcon },
    { id: 'business', name: 'Business', icon: ChartBarIcon },
    { id: 'blog', name: 'Blog & News', icon: DocumentDuplicateIcon },
    { id: 'ecommerce', name: 'E-commerce', icon: CpuChipIcon },
    { id: 'portfolio', name: 'Portfolio', icon: RocketLaunchIcon },
    { id: 'agency', name: 'Agency', icon: ShieldCheckIcon },
    { id: 'nonprofit', name: 'Nonprofit', icon: GlobeAltIcon }
  ];

  const filteredTemplates = PROFESSIONAL_TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesComplexity = selectedComplexity === 'all' || template.complexity === selectedComplexity;
    const matchesSearch = searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.features.some(feature => feature.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesComplexity && matchesSearch;
  });

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'advanced': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'enterprise': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const handleTemplateUse = (template: SiteTemplate) => {
    onTemplateSelect(template);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-7xl mx-4 max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Professional Site Templates
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
          >
            ×
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <category.icon className="w-4 h-4" />
                <span>{category.name}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <select
              value={selectedComplexity}
              onChange={(e) => setSelectedComplexity(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Complexity Levels</option>
              <option value="simple">Simple</option>
              <option value="advanced">Advanced</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                    {template.name}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getComplexityColor(template.complexity)}`}>
                    {template.complexity}
                  </span>
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {template.description}
                </p>

                <div className="space-y-3 mb-4">
                  <div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Key Features
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.features.slice(0, 4).map((feature) => (
                        <span key={feature} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                          {feature}
                        </span>
                      ))}
                      {template.features.length > 4 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                          +{template.features.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Setup time: {template.estimatedTime}</span>
                    <span>{template.plugins.length} plugins</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedTemplate(template)}
                    className="flex-1 btn-outline text-sm py-2"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => handleTemplateUse(template)}
                    className="flex-1 btn-primary text-sm py-2"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <DocumentDuplicateIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Templates Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search criteria to find the perfect template.
              </p>
            </div>
          )}
        </div>

        {/* Template Preview Modal */}
        {selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedTemplate.name}
                </h3>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedTemplate.description}
                </p>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">All Features:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.features.map((feature) => (
                      <span key={feature} className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Included Plugins:</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedTemplate.plugins.join(', ')}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="flex-1 btn-outline"
                  >
                    Close Preview
                  </button>
                  <button
                    onClick={() => handleTemplateUse(selectedTemplate)}
                    className="flex-1 btn-primary"
                  >
                    Use This Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}