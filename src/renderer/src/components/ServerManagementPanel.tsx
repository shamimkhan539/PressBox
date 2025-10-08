import React, { useState, useEffect } from 'react';
import { WordPressSite } from '../../../shared/types';
import { SwapServerOptions, PHPVersionChangeOptions, ServiceSwapResult } from '../../../main/services/serverManager';

interface ServerManagementPanelProps {
    site: WordPressSite;
    onServerChange: (result: ServiceSwapResult) => void;
    onClose: () => void;
}

interface ServerStats {
    uptime: string;
    memory: string;
    cpu: string;
    requests: number;
}

export const ServerManagementPanel: React.FC<ServerManagementPanelProps> = ({
    site,
    onServerChange,
    onClose
}) => {
    const [isSwapping, setIsSwapping] = useState(false);
    const [swapProgress, setSwapProgress] = useState('');
    const [selectedPhpVersion, setSelectedPhpVersion] = useState(site.phpVersion);
    const [serverStats, setServerStats] = useState<ServerStats | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const availablePhpVersions = ['7.4', '8.0', '8.1', '8.2', '8.3'];
    const currentWebServer = site.webServer || 'nginx';
    const alternateServer = currentWebServer === 'nginx' ? 'apache' : 'nginx';
    const siteUrl = site.url || site.domain;

    useEffect(() => {
        fetchServerStats();
        const interval = setInterval(fetchServerStats, 10000); // Update every 10 seconds
        return () => clearInterval(interval);
    }, [site.id]);

    const fetchServerStats = async () => {
        try {
            const stats = await window.electronAPI.getServiceStats(site.id, currentWebServer);
            setServerStats(stats);
        } catch (error) {
            console.error('Failed to fetch server stats:', error);
        }
    };

    const handleServerSwap = async () => {
        if (isSwapping) return;

        setIsSwapping(true);
        setSwapProgress('Preparing server swap...');

        try {
            const options: SwapServerOptions = {
                fromServer: currentWebServer,
                toServer: alternateServer,
                preserveConfig: true,
                migrateSslCerts: site.ssl || false,
                backupConfigs: true
            };

            setSwapProgress(`Switching from ${currentWebServer.toUpperCase()} to ${alternateServer.toUpperCase()}...`);
            
            const result = await window.electronAPI.swapWebServer(site.id, options);
            
            if (result.success) {
                setSwapProgress(`Successfully switched to ${alternateServer.toUpperCase()} in ${result.duration}ms`);
                onServerChange(result);
                
                // Auto-close progress after success
                setTimeout(() => {
                    setSwapProgress('');
                }, 3000);
            } else {
                setSwapProgress(`Error: ${result.errors.join(', ')}`);
            }
            
        } catch (error: any) {
            setSwapProgress(`Error: ${error.message}`);
        } finally {
            setIsSwapping(false);
        }
    };

    const handlePHPVersionChange = async () => {
        if (selectedPhpVersion === site.phpVersion || isSwapping) return;

        setIsSwapping(true);
        setSwapProgress(`Changing PHP version to ${selectedPhpVersion}...`);

        try {
            const options: PHPVersionChangeOptions = {
                newVersion: selectedPhpVersion,
                migrateExtensions: true,
                preserveConfig: true,
                restartServices: true
            };

            const result = await window.electronAPI.changePHPVersion(site.id, options);
            
            if (result.success) {
                setSwapProgress(`Successfully changed to PHP ${selectedPhpVersion} in ${result.duration}ms`);
                onServerChange(result);
                
                setTimeout(() => {
                    setSwapProgress('');
                }, 3000);
            } else {
                setSwapProgress(`Error: ${result.errors.join(', ')}`);
            }
            
        } catch (error: any) {
            setSwapProgress(`Error: ${error.message}`);
        } finally {
            setIsSwapping(false);
        }
    };

    const handleUrlChange = async (newUrl: string) => {
        if (!newUrl.trim() || isSwapping) return;

        setIsSwapping(true);
        setSwapProgress(`Updating site URL to ${newUrl}...`);

        try {
            await window.electronAPI.updateSiteURL(site.id, newUrl, true);
            setSwapProgress(`Successfully updated site URL to ${newUrl}`);
            
            setTimeout(() => {
                setSwapProgress('');
            }, 3000);
            
        } catch (error: any) {
            setSwapProgress(`Error: ${error.message}`);
        } finally {
            setIsSwapping(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                            Server Configuration
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {site.name} • {siteUrl}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    {/* Progress Indicator */}
                    {swapProgress && (
                        <div className={`rounded-lg p-4 ${
                            swapProgress.includes('Error') 
                                ? 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800' 
                                : swapProgress.includes('Successfully')
                                ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800'
                                : 'bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                        }`}>
                            <div className="flex items-center">
                                {isSwapping && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-3"></div>
                                )}
                                <span className={`text-sm font-medium ${
                                    swapProgress.includes('Error') 
                                        ? 'text-red-700 dark:text-red-300' 
                                        : swapProgress.includes('Successfully')
                                        ? 'text-green-700 dark:text-green-300'
                                        : 'text-blue-700 dark:text-blue-300'
                                }`}>
                                    {swapProgress}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Server Stats */}
                    {serverStats && (
                        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {serverStats.uptime}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Uptime</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {serverStats.memory}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Memory</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                    {serverStats.cpu}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">CPU</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {serverStats.requests}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Requests</div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Web Server Selection */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Web Server</h3>
                            
                            <div className="space-y-3">
                                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                    currentWebServer === 'nginx'
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">NGINX</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                High-performance web server
                                            </div>
                                        </div>
                                        {currentWebServer === 'nginx' && (
                                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                        )}
                                    </div>
                                </div>

                                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                    currentWebServer === 'apache'
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">Apache</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                Flexible and widely supported
                                            </div>
                                        </div>
                                        {currentWebServer === 'apache' && (
                                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleServerSwap}
                                disabled={isSwapping}
                                className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
                                    isSwapping
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                                }`}
                            >
                                {isSwapping 
                                    ? 'Switching...' 
                                    : `Switch to ${alternateServer.toUpperCase()}`
                                }
                            </button>
                        </div>

                        {/* PHP Version Selection */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">PHP Version</h3>
                            
                            <div className="space-y-2">
                                <select
                                    value={selectedPhpVersion}
                                    onChange={(e) => setSelectedPhpVersion(e.target.value)}
                                    disabled={isSwapping}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    {availablePhpVersions.map(version => (
                                        <option key={version} value={version}>
                                            PHP {version}
                                        </option>
                                    ))}
                                </select>

                                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                                    <p>✓ Opcache enabled</p>
                                    <p>✓ Xdebug ready</p>
                                    <p>✓ WordPress optimized</p>
                                </div>
                            </div>

                            <button
                                onClick={handlePHPVersionChange}
                                disabled={selectedPhpVersion === site.phpVersion || isSwapping}
                                className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
                                    selectedPhpVersion === site.phpVersion || isSwapping
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                                }`}
                            >
                                {isSwapping 
                                    ? 'Updating...' 
                                    : selectedPhpVersion === site.phpVersion
                                    ? 'Current Version'
                                    : `Update to PHP ${selectedPhpVersion}`
                                }
                            </button>
                        </div>
                    </div>

                    {/* Advanced Configuration */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <svg 
                                className={`w-5 h-5 mr-2 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            Advanced Configuration
                        </button>

                        {showAdvanced && (
                            <div className="mt-6 space-y-6">
                                {/* URL Management */}
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Site URL</h4>
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="text"
                                            defaultValue={siteUrl}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleUrlChange(e.currentTarget.value);
                                                }
                                            }}
                                            disabled={isSwapping}
                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="site.local"
                                        />
                                        <button 
                                            onClick={() => {
                                                const input = document.querySelector('input[defaultValue="' + siteUrl + '"]') as HTMLInputElement;
                                                if (input) handleUrlChange(input.value);
                                            }}
                                            disabled={isSwapping}
                                            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                                                     hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                                                     disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Update
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Database URLs will be automatically updated
                                    </p>
                                </div>

                                {/* Quick Actions */}
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Quick Actions</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                                                     hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            disabled={isSwapping}
                                        >
                                            Edit Config Files
                                        </button>
                                        <button 
                                            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                                                     hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            disabled={isSwapping}
                                        >
                                            View Logs
                                        </button>
                                        <button 
                                            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                                                     hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            disabled={isSwapping}
                                        >
                                            Restart Services
                                        </button>
                                        <button 
                                            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                                                     hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            disabled={isSwapping}
                                        >
                                            Health Check
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServerManagementPanel;