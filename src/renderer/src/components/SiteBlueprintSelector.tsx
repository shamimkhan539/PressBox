import React, { useState, useEffect } from 'react';
import { SiteBlueprint, BlueprintCategory } from '../../../shared/types';

interface SiteBlueprintSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectBlueprint: (blueprint: SiteBlueprint | null) => void;
    selectedBlueprintId?: string;
}

export const SiteBlueprintSelector: React.FC<SiteBlueprintSelectorProps> = ({
    isOpen,
    onClose,
    onSelectBlueprint,
    selectedBlueprintId
}) => {
    const [blueprints, setBlueprints] = useState<SiteBlueprint[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<BlueprintCategory | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadBlueprints();
        }
    }, [isOpen]);

    const loadBlueprints = async () => {
        try {
            setLoading(true);
            const loadedBlueprints = await window.electronAPI.blueprints.getAll();
            setBlueprints(loadedBlueprints);
        } catch (error) {
            console.error('Failed to load blueprints:', error);
            setBlueprints([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredBlueprints = blueprints.filter(blueprint => {
        const matchesCategory = selectedCategory === 'all' || blueprint.category === selectedCategory;
        const matchesSearch = blueprint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             blueprint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             blueprint.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        
        return matchesCategory && matchesSearch;
    });

    const categories = Object.values(BlueprintCategory);

    const getCategoryIcon = (category: BlueprintCategory) => {
        switch (category) {
            case BlueprintCategory.BLOG:
                return '📝';
            case BlueprintCategory.BUSINESS:
                return '🏢';
            case BlueprintCategory.ECOMMERCE:
                return '🛒';
            case BlueprintCategory.PORTFOLIO:
                return '🎨';
            case BlueprintCategory.LANDING_PAGE:
                return '📄';
            case BlueprintCategory.AGENCY:
                return '🏛️';
            case BlueprintCategory.EDUCATION:
                return '🎓';
            case BlueprintCategory.NONPROFIT:
                return '❤️';
            case BlueprintCategory.MAGAZINE:
                return '📰';
            case BlueprintCategory.CUSTOM:
                return '⚙️';
            default:
                return '📦';
        }
    };

    const formatCategoryName = (category: string) => {
        return category.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Choose a Site Blueprint
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Start with a pre-configured template to speed up your development
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Search and Filter */}
                    <div className="flex items-center space-x-4 mt-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search blueprints..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value as BlueprintCategory | 'all')}
                                className="block w-48 px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(category => (
                                    <option key={category} value={category}>
                                        {getCategoryIcon(category)} {formatCategoryName(category)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex h-[60vh]">
                    {/* Sidebar - Categories */}
                    <div className="w-64 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 overflow-y-auto">
                        <div className="p-4">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Categories</h3>
                            <ul className="space-y-1">
                                <li>
                                    <button
                                        onClick={() => setSelectedCategory('all')}
                                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                                            selectedCategory === 'all'
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        📦 All Categories
                                    </button>
                                </li>
                                {categories.map(category => (
                                    <li key={category}>
                                        <button
                                            onClick={() => setSelectedCategory(category)}
                                            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                                                selectedCategory === category
                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                                            }`}
                                        >
                                            {getCategoryIcon(category)} {formatCategoryName(category)}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Main Content - Blueprint Grid */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                    <p className="text-gray-500 dark:text-gray-400">Loading blueprints...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6">
                                {/* None/Custom Option */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Start Fresh</h4>
                                    <div
                                        onClick={() => onSelectBlueprint(null)}
                                        className={`cursor-pointer border-2 border-dashed rounded-lg p-6 transition-colors ${
                                            !selectedBlueprintId
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                        }`}
                                    >
                                        <div className="text-center">
                                            <div className="text-4xl mb-2">🚀</div>
                                            <h3 className="font-medium text-gray-900 dark:text-white">Blank WordPress Site</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                Start with a clean WordPress installation
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Blueprint Categories */}
                                {categories.filter(cat => selectedCategory === 'all' || selectedCategory === cat).map(category => {
                                    const categoryBlueprints = filteredBlueprints.filter(bp => bp.category === category);
                                    
                                    if (categoryBlueprints.length === 0) return null;

                                    return (
                                        <div key={category} className="mb-8">
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                                                {getCategoryIcon(category)} {formatCategoryName(category)}
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {categoryBlueprints.map(blueprint => (
                                                    <div
                                                        key={blueprint.id}
                                                        onClick={() => onSelectBlueprint(blueprint)}
                                                        className={`cursor-pointer border rounded-lg p-4 transition-colors hover:shadow-md ${
                                                            selectedBlueprintId === blueprint.id
                                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                                        }`}
                                                    >
                                                        {/* Blueprint Thumbnail */}
                                                        <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded-md mb-3 flex items-center justify-center">
                                                            <span className="text-2xl">{getCategoryIcon(blueprint.category)}</span>
                                                        </div>

                                                        {/* Blueprint Info */}
                                                        <div>
                                                            <div className="flex items-start justify-between mb-2">
                                                                <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                                                                    {blueprint.name}
                                                                </h3>
                                                                {blueprint.isOfficial && (
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                                        Official
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                                                {blueprint.description}
                                                            </p>
                                                            
                                                            {/* Tags */}
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {blueprint.tags.slice(0, 3).map(tag => (
                                                                    <span
                                                                        key={tag}
                                                                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
                                                                    >
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                                {blueprint.tags.length > 3 && (
                                                                    <span className="text-xs text-gray-400">
                                                                        +{blueprint.tags.length - 3} more
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Configuration Preview */}
                                                            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                                                PHP {blueprint.config.phpVersion} • {blueprint.config.webServer.toUpperCase()}
                                                                {blueprint.config.ssl && ' • SSL'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* No Results */}
                                {filteredBlueprints.length === 0 && !loading && (
                                    <div className="text-center py-12">
                                        <div className="text-4xl mb-4">🔍</div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                            No blueprints found
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            Try adjusting your search or category filter
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedBlueprintId ? (
                            <>Selected: {blueprints.find(bp => bp.id === selectedBlueprintId)?.name || 'Custom'}</>
                        ) : (
                            'Blank WordPress site selected'
                        )}
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                const blueprint = selectedBlueprintId 
                                    ? blueprints.find(bp => bp.id === selectedBlueprintId) 
                                    : null;
                                onSelectBlueprint(blueprint || null);
                                onClose();
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};