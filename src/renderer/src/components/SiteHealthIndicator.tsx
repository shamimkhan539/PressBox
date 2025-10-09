import React, { useState, useEffect } from 'react';
import { WordPressSite, SiteStatus } from '../../../shared/types';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface SiteHealthIndicatorProps {
  site: WordPressSite;
  onHealthCheck?: (siteId: string, health: SiteHealth) => void;
}

export interface SiteHealth {
  status: 'healthy' | 'warning' | 'error' | 'checking';
  uptime: string;
  responseTime: number;
  lastChecked: Date;
  issues: string[];
}

export function SiteHealthIndicator({ site, onHealthCheck }: SiteHealthIndicatorProps) {
  const [health, setHealth] = useState<SiteHealth>({
    status: 'checking',
    uptime: '0m',
    responseTime: 0,
    lastChecked: new Date(),
    issues: []
  });

  useEffect(() => {
    if (site.status === SiteStatus.RUNNING) {
      checkSiteHealth();
      const interval = setInterval(checkSiteHealth, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    } else {
      setHealth(prev => ({ 
        ...prev, 
        status: 'error',
        issues: ['Site is not running']
      }));
    }
  }, [site.status]);

  const checkSiteHealth = async () => {
    try {
      const startTime = Date.now();
      const url = site.domain.startsWith('http') ? site.domain : `http://${site.domain}`;
      
      // Simulate health check (in real implementation, this would ping the actual site)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
      
      const responseTime = Date.now() - startTime;
      const issues: string[] = [];
      
      // Simulate health analysis
      if (responseTime > 2000) {
        issues.push('Slow response time');
      }
      
      const newHealth: SiteHealth = {
        status: issues.length === 0 ? 'healthy' : 'warning',
        uptime: calculateUptime(site),
        responseTime,
        lastChecked: new Date(),
        issues
      };
      
      setHealth(newHealth);
      onHealthCheck?.(site.id, newHealth);
    } catch (error) {
      const errorHealth: SiteHealth = {
        status: 'error',
        uptime: '0m',
        responseTime: 0,
        lastChecked: new Date(),
        issues: ['Connection failed']
      };
      setHealth(errorHealth);
      onHealthCheck?.(site.id, errorHealth);
    }
  };

  const calculateUptime = (site: WordPressSite): string => {
    if (site.status !== SiteStatus.RUNNING) return '0m';
    
    // Simulate uptime calculation
    const minutes = Math.floor(Math.random() * 120) + 1;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getHealthIcon = () => {
    switch (health.status) {
      case 'healthy':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      case 'checking':
        return <ClockIcon className="w-4 h-4 text-gray-400 animate-spin" />;
    }
  };

  const getHealthColor = () => {
    switch (health.status) {
      case 'healthy':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'checking':
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mt-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getHealthIcon()}
          <span className={`text-sm font-medium ${getHealthColor()}`}>
            {health.status === 'checking' ? 'Checking...' : 
             health.status === 'healthy' ? 'Healthy' :
             health.status === 'warning' ? 'Warning' : 'Offline'}
          </span>
        </div>
        <button 
          onClick={checkSiteHealth}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Refresh
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
        <div>
          <span className="font-medium">Uptime:</span> {health.uptime}
        </div>
        <div>
          <span className="font-medium">Response:</span> {health.responseTime}ms
        </div>
      </div>
      
      {health.issues.length > 0 && (
        <div className="mt-2">
          <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">Issues:</div>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            {health.issues.map((issue, index) => (
              <li key={index} className="flex items-center space-x-1">
                <span>•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Last checked: {health.lastChecked.toLocaleTimeString()}
      </div>
    </div>
  );
}