import React, { useState, useMemo } from 'react';
import { SiteTemplate, siteTemplates, getTemplatesByCategory, searchTemplates } from '../data/siteTemplates';
import { MagnifyingGlassIcon, TagIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface SiteTemplateSelectorProps {
  onSelectTemplate: (template: SiteTemplate) => void;
  selectedTemplate?: SiteTemplate | null;
  className?: string;
}

export function SiteTemplateSelector({ onSelectTemplate, selectedTemplate, className = '' }: SiteTemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Templates', count: siteTemplates.length },
    { id: 'basic', name: 'Basic', count: getTemplatesByCategory('basic').length },
    { id: 'ecommerce', name: 'E-commerce', count: getTemplatesByCategory('ecommerce').length },
    { id: 'blog', name: 'Blog & Content', count: getTemplatesByCategory('blog').length },
    { id: 'development', name: 'Development', count: getTemplatesByCategory('development').length },
    { id: 'business', name: 'Business', count: getTemplatesByCategory('business').length },
  ];

  const filteredTemplates = useMemo(() => {
    let templates = selectedCategory === 'all' 
      ? siteTemplates 
      : getTemplatesByCategory(selectedCategory);
    
    if (searchQuery.trim()) {
      templates = searchTemplates(searchQuery);
    }
    
    return templates;
  }, [searchQuery, selectedCategory]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Choose a Template</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Start with a pre-configured template or create a custom WordPress site
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 py-3 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {category.name} ({category.count})
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplate?.id === template.id}
            onSelect={() => onSelectTemplate(template)}
          />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4 text-6xl">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No templates found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or category filter
          </p>
        </div>
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: SiteTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4">
          <CheckCircleIcon className="w-6 h-6 text-blue-600" />
        </div>
      )}

      {/* Template Icon */}
      <div className="text-4xl mb-4">{template.icon}</div>

      {/* Template Info */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {template.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {template.description}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
            >
              <TagIcon className="w-3 h-3 mr-1" />
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
              +{template.tags.length - 3} more
            </span>
          )}
        </div>

        {/* Tech Stack */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>PHP {template.config.phpVersion}</span>
            <span>WP {template.config.wordpressVersion}</span>
            <span>{template.config.plugins.length} plugins</span>
          </div>
        </div>
      </div>
    </div>
  );
}