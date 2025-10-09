import React, { useState, useEffect } from 'react';
import {
    ChartBarIcon,
    CpuChipIcon,
    ServerIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

interface SiteMetrics {
    siteName: string;
    environment: 'local' | 'docker';
    status: 'running' | 'stopped' | 'error';
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    requestsPerSecond: number;
    responseTime: number;
    errorRate: number;
    diskUsage: number;
    phpVersion: string;
    wordpressVersion: string;
    lastUpdated: Date;
}

interface PerformanceMonitorProps {
    siteName: string;
    environment?: 'local' | 'docker';
    className?: string;
}

export function SitePerformanceMonitor({ siteName, environment, className = '' }: PerformanceMonitorProps) {
    const [metrics, setMetrics] = useState<SiteMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds

    useEffect(() => {
        loadMetrics();
        
        let interval: NodeJS.Timeout;
        if (autoRefresh) {
            interval = setInterval(loadMetrics, refreshInterval);
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [siteName, environment, autoRefresh, refreshInterval]);

    const loadMetrics = async () => {
        try {
            setError(null);
            
            // Get site metrics from appropriate environment
            const siteMetrics = await getSiteMetrics(siteName, environment);
            setMetrics(siteMetrics);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load metrics');
        } finally {
            setLoading(false);
        }
    };

    const getSiteMetrics = async (siteName: string, env?: 'local' | 'docker'): Promise<SiteMetrics> => {
        // Mock implementation - replace with actual API calls
        const mockMetrics: SiteMetrics = {
            siteName,
            environment: env || 'local',
            status: Math.random() > 0.1 ? 'running' : 'stopped',
            uptime: Math.floor(Math.random() * 86400), // 0-24 hours in seconds
            memoryUsage: Math.random() * 100, // 0-100%
            cpuUsage: Math.random() * 100, // 0-100%
            requestsPerSecond: Math.random() * 50,
            responseTime: Math.random() * 1000 + 50, // 50-1050ms
            errorRate: Math.random() * 5, // 0-5%
            diskUsage: Math.random() * 100, // 0-100%
            phpVersion: '8.3.4',
            wordpressVersion: '6.4.1',
            lastUpdated: new Date()
        };
        
        return new Promise(resolve => {
            setTimeout(() => resolve(mockMetrics), 500);
        });
    };

    const formatUptime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'running': return 'text-green-600';
            case 'stopped': return 'text-gray-600';
            case 'error': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'running': return CheckCircleIcon;
            case 'stopped': return ExclamationTriangleIcon;
            case 'error': return ExclamationTriangleIcon;
            default: return ExclamationTriangleIcon;
        }
    };

    const getMetricColor = (value: number, type: 'cpu' | 'memory' | 'error' | 'response'): string => {
        switch (type) {
            case 'cpu':
            case 'memory':
                if (value > 80) return 'text-red-600';
                if (value > 60) return 'text-yellow-600';
                return 'text-green-600';
            case 'error':
                if (value > 2) return 'text-red-600';
                if (value > 1) return 'text-yellow-600';
                return 'text-green-600';
            case 'response':
                if (value > 500) return 'text-red-600';
                if (value > 200) return 'text-yellow-600';
                return 'text-green-600';
            default:
                return 'text-gray-600';
        }
    };

    if (loading) {
        return (
            <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
                <div className="flex items-center space-x-2">
                    <ArrowPathIcon className="h-5 w-5 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-500">Loading site metrics...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-red-50 rounded-lg border border-red-200 p-6 ${className}`}>
                <div className="flex items-center space-x-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                    <span className="text-sm text-red-700">Error: {error}</span>
                </div>
                <button
                    onClick={loadMetrics}
                    className="mt-3 text-sm text-red-600 hover:text-red-700 underline"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className={`bg-gray-50 rounded-lg border p-6 ${className}`}>
                <span className="text-sm text-gray-500">No metrics available</span>
            </div>
        );
    }

    const StatusIcon = getStatusIcon(metrics.status);

    return (
        <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <ChartBarIcon className="h-6 w-6 text-blue-600" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Site Performance Monitor
                            </h3>
                            <p className="text-sm text-gray-600">
                                Real-time metrics for {siteName}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <StatusIcon className={`h-5 w-5 ${getStatusColor(metrics.status)}`} />
                            <span className={`text-sm font-medium ${getStatusColor(metrics.status)}`}>
                                {metrics.status.charAt(0).toUpperCase() + metrics.status.slice(1)}
                            </span>
                        </div>
                        
                        <button
                            onClick={loadMetrics}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Refresh metrics"
                        >
                            <ArrowPathIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    {/* CPU Usage */}
                    <div className="text-center">
                        <CpuChipIcon className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.cpuUsage, 'cpu')}`}>
                            {metrics.cpuUsage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">CPU Usage</div>
                    </div>

                    {/* Memory Usage */}
                    <div className="text-center">
                        <ServerIcon className="h-8 w-8 mx-auto text-green-600 mb-2" />
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.memoryUsage, 'memory')}`}>
                            {metrics.memoryUsage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">Memory Usage</div>
                    </div>

                    {/* Response Time */}
                    <div className="text-center">
                        <ClockIcon className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.responseTime, 'response')}`}>
                            {metrics.responseTime.toFixed(0)}ms
                        </div>
                        <div className="text-xs text-gray-500">Response Time</div>
                    </div>

                    {/* Error Rate */}
                    <div className="text-center">
                        <ExclamationTriangleIcon className="h-8 w-8 mx-auto text-red-600 mb-2" />
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.errorRate, 'error')}`}>
                            {metrics.errorRate.toFixed(2)}%
                        </div>
                        <div className="text-xs text-gray-500">Error Rate</div>
                    </div>
                </div>

                {/* Additional Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-700">Uptime</div>
                        <div className="text-lg font-semibold text-gray-900">
                            {formatUptime(metrics.uptime)}
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-700">Requests/sec</div>
                        <div className="text-lg font-semibold text-gray-900">
                            {metrics.requestsPerSecond.toFixed(1)}
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-700">Disk Usage</div>
                        <div className="text-lg font-semibold text-gray-900">
                            {metrics.diskUsage.toFixed(1)}%
                        </div>
                    </div>
                </div>

                {/* Environment Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Environment Information</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-blue-700">Environment:</span>
                            <div className="font-medium capitalize">{metrics.environment}</div>
                        </div>
                        <div>
                            <span className="text-blue-700">PHP Version:</span>
                            <div className="font-medium">{metrics.phpVersion}</div>
                        </div>
                        <div>
                            <span className="text-blue-700">WordPress:</span>
                            <div className="font-medium">{metrics.wordpressVersion}</div>
                        </div>
                        <div>
                            <span className="text-blue-700">Last Updated:</span>
                            <div className="font-medium">{metrics.lastUpdated.toLocaleTimeString()}</div>
                        </div>
                    </div>
                </div>

                {/* Auto-refresh Controls */}
                <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600"
                            />
                            <span className="text-gray-700">Auto-refresh</span>
                        </label>
                        
                        {autoRefresh && (
                            <select
                                value={refreshInterval}
                                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                                className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                                <option value={1000}>1s</option>
                                <option value={5000}>5s</option>
                                <option value={10000}>10s</option>
                                <option value={30000}>30s</option>
                            </select>
                        )}
                    </div>
                    
                    <span className="text-xs text-gray-500">
                        Environment: {metrics.environment} | Site: {siteName}
                    </span>
                </div>
            </div>
        </div>
    );
}