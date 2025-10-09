import React, { useState, useEffect } from 'react';
import {
    ChartBarIcon,
    UserGroupIcon,
    GlobeAltIcon,
    ArrowDownIcon,
    ArrowUpIcon,
    CalendarDaysIcon,
    ArrowTrendingUpIcon as TrendingUpIcon
} from '@heroicons/react/24/outline';

interface AnalyticsData {
    pageViews: Array<{ date: string; views: number; users: number }>;
    topPages: Array<{ path: string; views: number; percentage: number }>;
    referrers: Array<{ source: string; visits: number; percentage: number }>;
    deviceTypes: Array<{ device: string; percentage: number; color: string }>;
    summary: {
        totalViews: number;
        uniqueUsers: number;
        bounceRate: number;
        averageSessionTime: number;
        conversionRate: number;
    };
}

interface SiteAnalyticsProps {
    siteName: string;
    environment?: 'local' | 'docker';
    className?: string;
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316'];

export function SiteAnalytics({ siteName, environment, className = '' }: SiteAnalyticsProps) {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

    useEffect(() => {
        loadAnalyticsData();
    }, [siteName, timeRange]);

    const loadAnalyticsData = async () => {
        setLoading(true);
        try {
            // Mock analytics data - replace with real analytics service
            const mockData: AnalyticsData = {
                pageViews: generatePageViewData(timeRange),
                topPages: [
                    { path: '/', views: 1245, percentage: 35 },
                    { path: '/about', views: 892, percentage: 25 },
                    { path: '/contact', views: 567, percentage: 16 },
                    { path: '/services', views: 434, percentage: 12 },
                    { path: '/blog', views: 289, percentage: 8 },
                    { path: '/portfolio', views: 143, percentage: 4 }
                ],
                referrers: [
                    { source: 'Direct', visits: 2145, percentage: 45 },
                    { source: 'Google', visits: 1289, percentage: 27 },
                    { source: 'Facebook', visits: 567, percentage: 12 },
                    { source: 'Twitter', visits: 342, percentage: 7 },
                    { source: 'LinkedIn', visits: 234, percentage: 5 },
                    { source: 'Other', visits: 193, percentage: 4 }
                ],
                deviceTypes: [
                    { device: 'Desktop', percentage: 52, color: COLORS[0] },
                    { device: 'Mobile', percentage: 35, color: COLORS[1] },
                    { device: 'Tablet', percentage: 13, color: COLORS[2] }
                ],
                summary: {
                    totalViews: Math.floor(Math.random() * 10000) + 5000,
                    uniqueUsers: Math.floor(Math.random() * 3000) + 2000,
                    bounceRate: Math.random() * 30 + 35, // 35-65%
                    averageSessionTime: Math.random() * 300 + 120, // 2-7 minutes
                    conversionRate: Math.random() * 5 + 2 // 2-7%
                }
            };

            await new Promise(resolve => setTimeout(resolve, 800));
            setAnalyticsData(mockData);
        } catch (error) {
            console.error('Failed to load analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    const generatePageViewData = (range: '7d' | '30d' | '90d') => {
        const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
        const data = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            data.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                views: Math.floor(Math.random() * 200) + 50,
                users: Math.floor(Math.random() * 100) + 25
            });
        }
        return data;
    };

    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}m ${remainingSeconds}s`;
    };

    const getChangeIcon = (isPositive: boolean) => {
        return isPositive ? ArrowUpIcon : ArrowDownIcon;
    };

    const getChangeColor = (isPositive: boolean): string => {
        return isPositive ? 'text-green-600' : 'text-red-600';
    };

    if (loading) {
        return (
            <div className={`bg-white rounded-lg shadow-sm border p-8 ${className}`}>
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading analytics...</span>
                </div>
            </div>
        );
    }

    if (!analyticsData) {
        return (
            <div className={`bg-gray-50 rounded-lg border p-8 ${className}`}>
                <div className="text-center text-gray-500">
                    No analytics data available for {siteName}
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <ChartBarIcon className="h-6 w-6 text-blue-600" />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Site Analytics</h2>
                            <p className="text-sm text-gray-600">Performance insights for {siteName}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
                            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                        >
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                            <option value="90d">Last 90 days</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Views</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {analyticsData.summary.totalViews.toLocaleString()}
                            </p>
                        </div>
                        <GlobeAltIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="mt-2 flex items-center">
                        <TrendingUpIcon className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600 ml-1">+12.5%</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Unique Users</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {analyticsData.summary.uniqueUsers.toLocaleString()}
                            </p>
                        </div>
                        <UserGroupIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="mt-2 flex items-center">
                        <TrendingUpIcon className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600 ml-1">+8.2%</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Bounce Rate</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {analyticsData.summary.bounceRate.toFixed(1)}%
                            </p>
                        </div>
                        <ArrowDownIcon className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div className="mt-2 flex items-center">
                        <ArrowDownIcon className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600 ml-1">-3.1%</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Avg. Session</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatDuration(analyticsData.summary.averageSessionTime)}
                            </p>
                        </div>
                        <CalendarDaysIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="mt-2 flex items-center">
                        <TrendingUpIcon className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600 ml-1">+15.3%</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Conversion</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {analyticsData.summary.conversionRate.toFixed(1)}%
                            </p>
                        </div>
                        <TrendingUpIcon className="h-8 w-8 text-red-600" />
                    </div>
                    <div className="mt-2 flex items-center">
                        <TrendingUpIcon className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600 ml-1">+5.7%</span>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Page Views Chart */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Views & Users</h3>
                    <div className="h-64 flex items-end justify-between space-x-2">
                        {analyticsData.pageViews.slice(-7).map((data, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center">
                                <div className="flex flex-col items-center space-y-1 w-full">
                                    <div
                                        className="w-full bg-blue-400 rounded-t-sm"
                                        style={{
                                            height: `${(data.views / Math.max(...analyticsData.pageViews.map(d => d.views))) * 150}px`
                                        }}
                                        title={`${data.views} views`}
                                    />
                                    <div
                                        className="w-full bg-green-400 rounded-t-sm"
                                        style={{
                                            height: `${(data.users / Math.max(...analyticsData.pageViews.map(d => d.users))) * 100}px`
                                        }}
                                        title={`${data.users} users`}
                                    />
                                </div>
                                <span className="text-xs text-gray-500 mt-2">{data.date}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-400 rounded"></div>
                            <span className="text-sm text-gray-600">Page Views</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-400 rounded"></div>
                            <span className="text-sm text-gray-600">Unique Users</span>
                        </div>
                    </div>
                </div>

                {/* Device Types */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Types</h3>
                    <div className="flex items-center justify-center mb-6">
                        <div className="relative w-48 h-48">
                            <svg viewBox="0 0 100 100" className="w-full h-full">
                                {analyticsData.deviceTypes.map((device, index) => {
                                    const previousPercentages = analyticsData.deviceTypes
                                        .slice(0, index)
                                        .reduce((sum, d) => sum + d.percentage, 0);
                                    const startAngle = (previousPercentages / 100) * 360;
                                    const endAngle = ((previousPercentages + device.percentage) / 100) * 360;
                                    
                                    const startAngleRad = (startAngle * Math.PI) / 180;
                                    const endAngleRad = (endAngle * Math.PI) / 180;
                                    
                                    const largeArcFlag = device.percentage > 50 ? 1 : 0;
                                    
                                    const x1 = 50 + 40 * Math.cos(startAngleRad);
                                    const y1 = 50 + 40 * Math.sin(startAngleRad);
                                    const x2 = 50 + 40 * Math.cos(endAngleRad);
                                    const y2 = 50 + 40 * Math.sin(endAngleRad);
                                    
                                    const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                                    
                                    return (
                                        <path
                                            key={index}
                                            d={pathData}
                                            fill={device.color}
                                            className="hover:opacity-80 transition-opacity"
                                        >
                                            <title>{`${device.device}: ${device.percentage}%`}</title>
                                        </path>
                                    );
                                })}
                            </svg>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {analyticsData.deviceTypes.map((device, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div 
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: device.color }}
                                    />
                                    <span className="text-sm text-gray-700">{device.device}</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                    {device.percentage}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Pages */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h3>
                    <div className="space-y-3">
                        {analyticsData.topPages.map((page, index) => (
                            <div key={index} className="flex items-center justify-between py-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {page.path}
                                    </p>
                                    <div className="mt-1 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{ width: `${page.percentage}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="ml-4 text-right">
                                    <p className="text-sm font-medium text-gray-900">
                                        {page.views.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500">{page.percentage}%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Traffic Sources */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h3>
                    <div className="space-y-3">
                        {analyticsData.referrers.map((referrer, index) => (
                            <div key={index} className="flex items-center justify-between py-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">
                                        {referrer.source}
                                    </p>
                                    <div className="mt-1 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-600 h-2 rounded-full"
                                            style={{ width: `${referrer.percentage}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="ml-4 text-right">
                                    <p className="text-sm font-medium text-gray-900">
                                        {referrer.visits.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500">{referrer.percentage}%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}