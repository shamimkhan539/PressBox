import React, { useState, useEffect } from 'react';
import { WordPressSite, SiteStatus } from '../../../shared/types';
import { 
  DocumentTextIcon, 
  FolderIcon, 
  CodeBracketIcon, 
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: 'apache' | 'nginx' | 'php' | 'mysql' | 'wordpress' | 'system';
  message: string;
  details?: string;
}

interface AdvancedDeveloperToolsProps {
  site: WordPressSite;
  isOpen: boolean;
  onClose: () => void;
}

export function AdvancedDeveloperTools({ site, isOpen, onClose }: AdvancedDeveloperToolsProps) {
  const [activeTab, setActiveTab] = useState<'logs' | 'files' | 'debug' | 'tools'>('logs');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'warn' | 'info'>('all');

  useEffect(() => {
    if (isOpen && site.status === SiteStatus.RUNNING) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen, site.status, activeTab]);

  const fetchLogs = async () => {
    if (activeTab !== 'logs') return;
    
    setIsLoading(true);
    try {
      // Simulate fetching logs
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const sampleLogs: LogEntry[] = [
        {
          timestamp: new Date(Date.now() - 30000),
          level: 'info',
          source: 'apache',
          message: 'Server started successfully',
          details: 'Apache/2.4.41 (Ubuntu) Server started on port 80'
        },
        {
          timestamp: new Date(Date.now() - 25000),
          level: 'info',
          source: 'php',
          message: 'PHP-FPM process manager started',
          details: 'PHP 8.1.0 FPM pool www listening on /run/php/php8.1-fpm.sock'
        },
        {
          timestamp: new Date(Date.now() - 20000),
          level: 'info',
          source: 'mysql',
          message: 'Database connection established',
          details: 'MySQL 8.0.28 ready for connections on localhost:3306'
        },
        {
          timestamp: new Date(Date.now() - 15000),
          level: 'warn',
          source: 'wordpress',
          message: 'Deprecated function called',
          details: 'wp_get_attachment_thumb_file() is deprecated since version 2.1.0'
        },
        {
          timestamp: new Date(Date.now() - 10000),
          level: 'error',
          source: 'php',
          message: 'Fatal error in plugin',
          details: 'Call to undefined function in /wp-content/plugins/example/example.php:42'
        },
        {
          timestamp: new Date(Date.now() - 5000),
          level: 'info',
          source: 'system',
          message: 'Cache cleared successfully',
          details: 'Object cache and page cache cleared'
        }
      ];

      setLogs(sampleLogs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    logFilter === 'all' || log.level === logFilter
  );

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'warn': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'info': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'debug': return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      case 'warn': return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
      case 'info': return <CheckCircleIcon className="w-4 h-4 text-blue-500" />;
      case 'debug': return <CodeBracketIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <WrenchScrewdriverIcon className="w-5 h-5 mr-2" />
            Advanced Developer Tools: {site.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>

        {site.status !== SiteStatus.RUNNING ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-12">
              <WrenchScrewdriverIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Site Not Running
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Developer tools require the site to be running.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {[
                { id: 'logs', label: 'System Logs', icon: DocumentTextIcon },
                { id: 'files', label: 'File Browser', icon: FolderIcon },
                { id: 'debug', label: 'Debug Console', icon: CodeBracketIcon },
                { id: 'tools', label: 'Dev Tools', icon: WrenchScrewdriverIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'logs' && (
                <div className="h-full flex flex-col">
                  {/* Log Filters */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex space-x-2">
                      {(['all', 'error', 'warn', 'info'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setLogFilter(filter)}
                          className={`px-3 py-1 text-sm rounded-md capitalize ${
                            logFilter === filter
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          {filter} {filter !== 'all' && `(${logs.filter(l => l.level === filter).length})`}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={fetchLogs}
                      disabled={isLoading}
                      className="btn-outline text-sm"
                    >
                      {isLoading ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>

                  {/* Log Entries */}
                  <div className="flex-1 overflow-auto space-y-2">
                    {filteredLogs.map((log, index) => (
                      <div key={index} className={`rounded-lg p-3 ${getLevelColor(log.level)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2 flex-1">
                            {getLevelIcon(log.level)}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-xs font-medium uppercase tracking-wider">
                                  {log.source}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {log.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="font-medium mb-1">{log.message}</div>
                              {log.details && (
                                <div className="text-sm opacity-75 font-mono">
                                  {log.details}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'files' && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <FolderIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      File Browser
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Advanced file browser with editing capabilities coming soon!
                    </p>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Features will include:<br/>
                      • WordPress file tree navigation<br/>
                      • Syntax highlighting editor<br/>
                      • Real-time file changes<br/>
                      • Theme and plugin editing
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'debug' && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <CodeBracketIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Debug Console
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Interactive PHP debugging console coming soon!
                    </p>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Features will include:<br/>
                      • PHP code execution<br/>
                      • WordPress function testing<br/>
                      • Database queries<br/>
                      • Variable inspection
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tools' && (
                <div className="h-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
                    {/* Quick Tools */}
                    <div className="card p-4">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Quick Actions</h3>
                      <div className="space-y-2">
                        <button className="w-full btn-outline text-sm py-2">
                          Clear All Caches
                        </button>
                        <button className="w-full btn-outline text-sm py-2">
                          Regenerate Thumbnails
                        </button>
                        <button className="w-full btn-outline text-sm py-2">
                          Update Permalinks
                        </button>
                        <button className="w-full btn-outline text-sm py-2">
                          Flush Rewrite Rules
                        </button>
                      </div>
                    </div>

                    {/* Database Tools */}
                    <div className="card p-4">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Database</h3>
                      <div className="space-y-2">
                        <button className="w-full btn-outline text-sm py-2">
                          Optimize Database
                        </button>
                        <button className="w-full btn-outline text-sm py-2">
                          Repair Tables
                        </button>
                        <button className="w-full btn-outline text-sm py-2">
                          Export SQL
                        </button>
                        <button className="w-full btn-outline text-sm py-2">
                          Import SQL
                        </button>
                      </div>
                    </div>

                    {/* Performance Tools */}
                    <div className="card p-4">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Performance</h3>
                      <div className="space-y-2">
                        <button className="w-full btn-outline text-sm py-2">
                          Enable Object Cache
                        </button>
                        <button className="w-full btn-outline text-sm py-2">
                          Generate Critical CSS
                        </button>
                        <button className="w-full btn-outline text-sm py-2">
                          Minify Assets
                        </button>
                        <button className="w-full btn-outline text-sm py-2">
                          Image Optimization
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}