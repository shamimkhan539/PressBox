import React, { useState, useEffect } from 'react';
import {
  HeartIcon,
  CpuChipIcon,
  CircleStackIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { AsyncWrapper } from './AsyncWrapper';

interface SiteHealthData {
  siteId: string;
  siteName: string;
  overallScore: number;
  lastChecked: Date;
  checks: HealthCheck[];
  performance: PerformanceMetrics;
  security: SecurityCheck[];
  recommendations: Recommendation[];
}

interface HealthCheck {
  id: string;
  name: string;
  category: 'critical' | 'recommended' | 'optional';
  status: 'pass' | 'fail' | 'warning' | 'info';
  message: string;
  description?: string;
  impact: 'high' | 'medium' | 'low';
  fixable: boolean;
  autoFix?: () => Promise<void>;
  learnMoreUrl?: string;
}

interface PerformanceMetrics {
  responseTime: number;
  pageSize: number;
  requests: number;
  lighthouse: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  uptime: number;
  memoryUsage: number;
  diskUsage: number;
}

interface SecurityCheck {
  id: string;
  name: string;
  status: 'secure' | 'vulnerable' | 'unknown';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  recommendation?: string;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'performance' | 'security' | 'seo' | 'maintenance';
  effort: 'low' | 'medium' | 'high';
  action?: () => Promise<void>;
}

interface SiteHealthDashboardProps {
  siteId: string;
  siteName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SiteHealthDashboard({ siteId, siteName, isOpen, onClose }: SiteHealthDashboardProps) {
  const [healthData, setHealthData] = useState<SiteHealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'security' | 'recommendations'>('overview');
  const [runningChecks, setRunningChecks] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHealthData();
    }
  }, [isOpen, siteId]);

  const loadHealthData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await (window.electronAPI as any).sites.getHealthData(siteId);
      setHealthData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load site health data');
    } finally {
      setLoading(false);
    }
  };

  const runHealthChecks = async () => {
    setRunningChecks(true);
    try {
      const data = await (window.electronAPI as any).sites.runHealthChecks(siteId);
      setHealthData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to run health checks');
    } finally {
      setRunningChecks(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 90) return 'bg-green-100 dark:bg-green-900/20';
    if (score >= 70) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'fail':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getCategoryChecks = (category: HealthCheck['category']) => {
    return healthData?.checks.filter(check => check.category === category) || [];
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < sizes.length - 1) {
      bytes /= 1024;
      i++;
    }
    return `${bytes.toFixed(1)} ${sizes[i]}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-6xl h-[90vh] rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <HeartIcon className="w-6 h-6 text-red-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Site Health Dashboard
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{siteName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={runHealthChecks}
              disabled={runningChecks}
              className="btn-primary text-sm flex items-center space-x-2"
            >
              <ArrowPathIcon className={`w-4 h-4 ${runningChecks ? 'animate-spin' : ''}`} />
              <span>{runningChecks ? 'Running Checks...' : 'Run Health Check'}</span>
            </button>
            <button
              onClick={onClose}
              className="btn-secondary text-sm"
            >
              Close
            </button>
          </div>
        </div>

        <AsyncWrapper
          loading={loading}
          error={error}
          onRetry={loadHealthData}
          loadingText="Loading health data..."
          errorTitle="Failed to load site health"
        >
          {healthData && (
            <>
              {/* Health Score Overview */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Overall Health Score
                  </h3>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Last checked: {healthData.lastChecked.toLocaleString()}
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center ${getScoreBackground(healthData.overallScore)}`}>
                    <span className={`text-2xl font-bold ${getScoreColor(healthData.overallScore)}`}>
                      {healthData.overallScore}
                    </span>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
                        {getCategoryChecks('critical').filter(c => c.status === 'pass').length}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Critical Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">
                        {getCategoryChecks('recommended').filter(c => c.status === 'warning').length}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Warnings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-red-600 dark:text-red-400">
                        {healthData.checks.filter(c => c.status === 'fail').length}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Issues</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  {[
                    { key: 'overview', label: 'Overview', icon: HeartIcon },
                    { key: 'performance', label: 'Performance', icon: ChartBarIcon },
                    { key: 'security', label: 'Security', icon: ShieldCheckIcon },
                    { key: 'recommendations', label: 'Recommendations', icon: ExclamationTriangleIcon },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        activeTab === tab.key
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Critical Checks */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Critical Health Checks
                      </h4>
                      <div className="space-y-3">
                        {getCategoryChecks('critical').map((check) => (
                          <div
                            key={check.id}
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(check.status)}
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {check.name}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {check.message}
                                </div>
                              </div>
                            </div>
                            
                            {check.fixable && check.status !== 'pass' && (
                              <button
                                onClick={check.autoFix}
                                className="btn-primary text-sm"
                              >
                                Auto Fix
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Quick Stats
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                          <GlobeAltIcon className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                          <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {healthData.performance.responseTime}ms
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Response Time</div>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                          <CpuChipIcon className="w-6 h-6 mx-auto mb-2 text-green-500" />
                          <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {healthData.performance.uptime}%
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Uptime</div>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                          <CircleStackIcon className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                          <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {formatBytes(healthData.performance.pageSize)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Page Size</div>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                          <ShieldCheckIcon className="w-6 h-6 mx-auto mb-2 text-red-500" />
                          <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {healthData.security.filter(s => s.status === 'secure').length}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Security Checks</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'performance' && (
                  <div className="space-y-6">
                    {/* Lighthouse Scores */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Lighthouse Scores
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(healthData.performance.lighthouse).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <span className={`text-lg font-bold ${getScoreColor(value)}`}>
                                {value}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${value >= 90 ? 'bg-green-500' : value >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${value}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Detailed Metrics
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Response Time</div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {healthData.performance.responseTime}ms
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">HTTP Requests</div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {healthData.performance.requests}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {formatBytes(healthData.performance.memoryUsage)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Disk Usage</div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {formatBytes(healthData.performance.diskUsage)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Page Size</div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {formatBytes(healthData.performance.pageSize)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {healthData.performance.uptime}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-4">
                    {healthData.security.map((check) => (
                      <div
                        key={check.id}
                        className={`p-4 rounded-lg border ${
                          check.status === 'secure'
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : check.status === 'vulnerable'
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                              {check.name}
                            </h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {check.description}
                            </p>
                            {check.recommendation && (
                              <p className="text-sm text-blue-600 dark:text-blue-400">
                                <strong>Recommendation:</strong> {check.recommendation}
                              </p>
                            )}
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            check.severity === 'critical'
                              ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                              : check.severity === 'high'
                              ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                              : check.severity === 'medium'
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                          }`}>
                            {check.severity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'recommendations' && (
                  <div className="space-y-4">
                    {healthData.recommendations.map((rec) => (
                      <div key={rec.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            {rec.title}
                          </h5>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              rec.impact === 'performance'
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                : rec.impact === 'security'
                                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                : rec.impact === 'seo'
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                            }`}>
                              {rec.impact}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              rec.effort === 'low'
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : rec.effort === 'medium'
                                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            }`}>
                              {rec.effort} effort
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {rec.description}
                        </p>
                        {rec.action && (
                          <button
                            onClick={rec.action}
                            className="btn-primary text-sm"
                          >
                            Apply Recommendation
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </AsyncWrapper>
      </div>
    </div>
  );
}