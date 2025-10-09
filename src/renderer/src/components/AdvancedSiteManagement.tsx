import React, { useState, useEffect } from 'react';
import {
    Cog6ToothIcon,
    PlayIcon,
    StopIcon,
    TrashIcon,
    ArrowPathIcon,
    DocumentDuplicateIcon,
    EyeIcon,
    CodeBracketIcon,
    CloudArrowDownIcon,
    CloudArrowUpIcon,
    ServerIcon,
    ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { EnvironmentSelector, AdvancedPerformanceMonitor, SiteAnalytics } from './index';

interface WordPressSite {
    id: string;
    name: string;
    domain: string;
    environment: 'local' | 'docker';
    status: 'running' | 'stopped' | 'error';
    port: number;
    url: string;
    phpVersion: string;
    wordpressVersion: string;
    created: Date;
    lastAccessed: Date;
    size: number; // in MB
    themes: number;
    plugins: number;
    posts: number;
}

interface AdvancedSiteManagementProps {
    className?: string;
}

export function AdvancedSiteManagement({ className = '' }: AdvancedSiteManagementProps) {
    const [sites, setSites] = useState<WordPressSite[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSite, setSelectedSite] = useState<WordPressSite | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'performance' | 'analytics'>('list');
    const [currentEnvironment, setCurrentEnvironment] = useState<'local' | 'docker'>('local');

    useEffect(() => {
        loadSites();
    }, [currentEnvironment]);

    const loadSites = async () => {
        setLoading(true);
        try {
            // Get sites from the unified environment API
            const allSites = await window.electronAPI.environment.getAllSites();
            
            // Transform to our interface
            const transformedSites: WordPressSite[] = allSites.map(site => ({
                id: site.name,
                name: site.name,
                domain: site.config?.domain || `${site.name}.local`,
                environment: site.environment,
                status: site.status as 'running' | 'stopped' | 'error',
                port: site.config?.port || 8080,
                url: site.url,
                phpVersion: '8.3.4',
                wordpressVersion: '6.4.1',
                created: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
                lastAccessed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last 7 days
                size: Math.floor(Math.random() * 500) + 50, // 50-550 MB
                themes: Math.floor(Math.random() * 10) + 2, // 2-12 themes
                plugins: Math.floor(Math.random() * 20) + 5, // 5-25 plugins
                posts: Math.floor(Math.random() * 100) + 10 // 10-110 posts
            }));

            setSites(transformedSites);
        } catch (error) {
            console.error('Failed to load sites:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSiteAction = async (action: string, siteId: string) => {
        const site = sites.find(s => s.id === siteId);
        if (!site) return;

        try {
            switch (action) {
                case 'start':
                    await window.electronAPI.environment.startSite(siteId, site.environment);
                    break;
                case 'stop':
                    await window.electronAPI.environment.stopSite(siteId, site.environment);
                    break;
                case 'delete':
                    if (confirm(`Are you sure you want to delete "${site.name}"?`)) {
                        await window.electronAPI.environment.deleteSite(siteId, site.environment);
                    }
                    break;
                case 'clone':
                    const cloneName = prompt('Enter name for cloned site:', `${site.name}-copy`);
                    if (cloneName) {
                        // Clone functionality would be implemented here
                        console.log(`Cloning ${site.name} to ${cloneName}`);
                    }
                    break;
                case 'view':
                    window.open(site.url, '_blank');
                    break;
                case 'code':
                    // Open in code editor - would be implemented
                    console.log(`Opening ${site.name} in code editor`);
                    break;
                case 'export':
                    // Export site functionality
                    console.log(`Exporting ${site.name}`);
                    break;
                case 'migrate':
                    const targetEnv = site.environment === 'local' ? 'docker' : 'local';
                    if (confirm(`Migrate "${site.name}" from ${site.environment} to ${targetEnv}?`)) {
                        await window.electronAPI.environment.migrateSite(siteId, site.environment, targetEnv);
                    }
                    break;
                default:
                    console.log(`Unknown action: ${action} for site: ${siteId}`);
            }
            
            // Refresh sites after action
            await loadSites();
        } catch (error) {
            console.error(`Failed to execute ${action} for site ${siteId}:`, error);
        }
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'running': return 'text-green-600 bg-green-100';
            case 'stopped': return 'text-gray-600 bg-gray-100';
            case 'error': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getEnvironmentIcon = (environment: 'local' | 'docker') => {
        return environment === 'local' ? ComputerDesktopIcon : ServerIcon;
    };

    if (loading) {
        return (
            <div className={`bg-white rounded-lg shadow-sm border p-8 ${className}`}>
                <div className="flex items-center justify-center">
                    <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-3 text-gray-600">Loading sites...</span>
                </div>
            </div>
        );
    }

    if (viewMode === 'performance' && selectedSite) {
        return (
            <div className={`space-y-6 ${className}`}>
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setViewMode('list')}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                    >
                        <ArrowPathIcon className="h-4 w-4" />
                        <span>Back to Sites</span>
                    </button>
                    <h2 className="text-xl font-bold text-gray-900">{selectedSite.name} - Performance</h2>
                </div>
                <AdvancedPerformanceMonitor 
                    siteName={selectedSite.name} 
                    environment={selectedSite.environment}
                />
            </div>
        );
    }

    if (viewMode === 'analytics' && selectedSite) {
        return (
            <div className={`space-y-6 ${className}`}>
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setViewMode('list')}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                    >
                        <ArrowPathIcon className="h-4 w-4" />
                        <span>Back to Sites</span>
                    </button>
                    <h2 className="text-xl font-bold text-gray-900">{selectedSite.name} - Analytics</h2>
                </div>
                <SiteAnalytics 
                    siteName={selectedSite.name} 
                    environment={selectedSite.environment}
                />
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">WordPress Site Management</h1>
                        <p className="text-gray-600">Professional WordPress development environment</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={loadSites}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <ArrowPathIcon className="h-4 w-4" />
                            <span>Refresh</span>
                        </button>
                        <button
                            onClick={() => {/* Open create site modal */}}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            <ServerIcon className="h-4 w-4" />
                            <span>New Site</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Environment Selector */}
            <EnvironmentSelector 
                onEnvironmentChange={setCurrentEnvironment}
                className="bg-white rounded-lg shadow-sm border p-6"
            />

            {/* Sites Overview */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Your WordPress Sites ({sites.length})
                    </h2>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Environment:</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium capitalize">
                            {currentEnvironment}
                        </span>
                    </div>
                </div>

                {sites.length === 0 ? (
                    <div className="text-center py-12">
                        <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No sites found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Get started by creating your first WordPress site.
                        </p>
                        <div className="mt-6">
                            <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                                <ServerIcon className="mr-2 h-4 w-4" />
                                Create Site
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sites.map((site) => {
                            const EnvironmentIcon = getEnvironmentIcon(site.environment);
                            return (
                                <div
                                    key={site.id}
                                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <EnvironmentIcon className="h-8 w-8 text-blue-600" />
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">{site.name}</h3>
                                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                    <span>{site.domain}</span>
                                                    <span>•</span>
                                                    <span className="capitalize">{site.environment}</span>
                                                    <span>•</span>
                                                    <span>Port {site.port}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(site.status)}`}>
                                                {site.status}
                                            </span>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex items-center space-x-1">
                                                <button
                                                    onClick={() => handleSiteAction('view', site.id)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                                    title="View Site"
                                                >
                                                    <EyeIcon className="h-4 w-4" />
                                                </button>
                                                
                                                <button
                                                    onClick={() => {
                                                        setSelectedSite(site);
                                                        setViewMode('performance');
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                                                    title="Performance Monitor"
                                                >
                                                    <Cog6ToothIcon className="h-4 w-4" />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setSelectedSite(site);
                                                        setViewMode('analytics');
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                                                    title="Site Analytics"
                                                >
                                                    <ServerIcon className="h-4 w-4" />
                                                </button>

                                                {site.status === 'running' ? (
                                                    <button
                                                        onClick={() => handleSiteAction('stop', site.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                        title="Stop Site"
                                                    >
                                                        <StopIcon className="h-4 w-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleSiteAction('start', site.id)}
                                                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                                                        title="Start Site"
                                                    >
                                                        <PlayIcon className="h-4 w-4" />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleSiteAction('clone', site.id)}
                                                    className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                                                    title="Clone Site"
                                                >
                                                    <DocumentDuplicateIcon className="h-4 w-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleSiteAction('migrate', site.id)}
                                                    className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                                                    title="Migrate Environment"
                                                >
                                                    <CloudArrowUpIcon className="h-4 w-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleSiteAction('delete', site.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Delete Site"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Site Details */}
                                    <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">PHP:</span>
                                            <div className="font-medium">{site.phpVersion}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">WordPress:</span>
                                            <div className="font-medium">{site.wordpressVersion}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Size:</span>
                                            <div className="font-medium">{site.size} MB</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Themes:</span>
                                            <div className="font-medium">{site.themes}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Plugins:</span>
                                            <div className="font-medium">{site.plugins}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Posts:</span>
                                            <div className="font-medium">{site.posts}</div>
                                        </div>
                                    </div>

                                    {/* Quick Stats Bar */}
                                    <div className="mt-4 flex items-center space-x-4 text-xs text-gray-500">
                                        <span>Created: {site.created.toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>Last accessed: {site.lastAccessed.toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span className="text-blue-600 hover:text-blue-700 cursor-pointer">
                                            {site.url}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}