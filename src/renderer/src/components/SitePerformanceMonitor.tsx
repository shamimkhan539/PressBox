import React, { useState, useEffect } from 'react';
import { WordPressSite, SiteStatus } from '../../../shared/types';
import { 
  ChartBarIcon, 
  ClockIcon, 
  ServerIcon, 
  GlobeAltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  activeConnections: number;
  requestsPerMinute: number;
  errorRate: number;
  uptime: number;
}

interface SitePerformanceMonitorProps {
  site: WordPressSite;
  isOpen: boolean;
  onClose: () => void;
}

export function SitePerformanceMonitor({ site, isOpen, onClose }: SitePerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    responseTime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    diskUsage: 0,
    activeConnections: 0,
    requestsPerMinute: 0,
    errorRate: 0,
    uptime: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && site.status === SiteStatus.RUNNING) {
      fetchMetrics();
      const interval = setInterval(fetchMetrics, 5000); // Update every 5 seconds
      setRefreshInterval(interval);
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [isOpen, site.status]);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Simulate fetching performance metrics
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 300));
      
      // Generate realistic performance data
      const newMetrics: PerformanceMetrics = {
        responseTime: 150 + Math.random() * 200, // 150-350ms
        memoryUsage: 45 + Math.random() * 30, // 45-75%
        cpuUsage: 10 + Math.random() * 20, // 10-30%
        diskUsage: 60 + Math.random() * 15, // 60-75%
        activeConnections: Math.floor(5 + Math.random() * 20), // 5-25 connections
        requestsPerMinute: Math.floor(50 + Math.random() * 100), // 50-150 req/min
        errorRate: Math.random() * 2, // 0-2% error rate
        uptime: 99.5 + Math.random() * 0.4 // 99.5-99.9% uptime
      };
      
      setMetrics(newMetrics);
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (value: number, thresholds: [number, number]) => {
    if (value <= thresholds[0]) return 'text-green-600 dark:text-green-400';
    if (value <= thresholds[1]) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusIcon = (value: number, thresholds: [number, number]) => {
    if (value <= thresholds[0]) return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
    if (value <= thresholds[1]) return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
    return <XCircleIcon className="w-4 h-4 text-red-500" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2" />
            Performance Monitor: {site.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>

        {site.status !== SiteStatus.RUNNING ? (
          <div className="text-center py-12">
            <ServerIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Site Not Running
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Performance monitoring is only available for running sites.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Response Time</p>
                    <p className="text-2xl font-bold">
                      {isLoading ? '...' : `${Math.round(metrics.responseTime)}ms`}
                    </p>
                  </div>
                  <ClockIcon className="w-8 h-8 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Uptime</p>
                    <p className="text-2xl font-bold">
                      {isLoading ? '...' : `${metrics.uptime.toFixed(2)}%`}
                    </p>
                  </div>
                  <CheckCircleIcon className="w-8 h-8 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Requests/Min</p>
                    <p className="text-2xl font-bold">
                      {isLoading ? '...' : metrics.requestsPerMinute}
                    </p>
                  </div>
                  <GlobeAltIcon className="w-8 h-8 text-purple-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Error Rate</p>
                    <p className="text-2xl font-bold">
                      {isLoading ? '...' : `${metrics.errorRate.toFixed(2)}%`}
                    </p>
                  </div>
                  <ExclamationTriangleIcon className="w-8 h-8 text-orange-200" />
                </div>
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Resource Usage
                </h3>
                <div className="space-y-4">
                  {/* Memory Usage */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(metrics.memoryUsage, [60, 80])}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Memory Usage
                      </span>
                    </div>
                    <span className={`text-sm font-medium ${getStatusColor(metrics.memoryUsage, [60, 80])}`}>
                      {metrics.memoryUsage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${metrics.memoryUsage}%` }}
                    />
                  </div>

                  {/* CPU Usage */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(metrics.cpuUsage, [50, 70])}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        CPU Usage
                      </span>
                    </div>
                    <span className={`text-sm font-medium ${getStatusColor(metrics.cpuUsage, [50, 70])}`}>
                      {metrics.cpuUsage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${metrics.cpuUsage}%` }}
                    />
                  </div>

                  {/* Disk Usage */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(metrics.diskUsage, [80, 90])}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Disk Usage
                      </span>
                    </div>
                    <span className={`text-sm font-medium ${getStatusColor(metrics.diskUsage, [80, 90])}`}>
                      {metrics.diskUsage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${metrics.diskUsage}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Connection Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Active Connections</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {metrics.activeConnections}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Requests per Minute</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {metrics.requestsPerMinute}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Average Response Time</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {Math.round(metrics.responseTime)}ms
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Error Rate</span>
                    <span className={`font-medium ${getStatusColor(metrics.errorRate, [1, 3])}`}>
                      {metrics.errorRate.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
              <div className="flex space-x-3">
                <button
                  onClick={fetchMetrics}
                  className="btn-outline text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? 'Refreshing...' : 'Refresh Now'}
                </button>
                <button className="btn-outline text-sm">
                  Export Report
                </button>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Auto-refresh every 5 seconds
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}