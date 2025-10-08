import React, { useState, useEffect } from 'react';

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  enabled: boolean;
  type: 'core' | 'community' | 'custom';
}

/**
 * Plugins Page Component
 * 
 * Displays and manages PressBox plugins and extensions.
 */
export function Plugins() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    try {
      setLoading(true);
      setError(null);
      const pluginsData = await window.electronAPI.plugins.list();
      setPlugins(pluginsData as unknown as Plugin[]);
    } catch (err) {
      console.error('Failed to load plugins:', err);
      setError('Failed to load plugins. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlugin = (pluginId: string) => {
    // TODO: Implement plugin toggle functionality
    setPlugins(prev => prev.map(plugin => 
      plugin.id === pluginId 
        ? { ...plugin, enabled: !plugin.enabled }
        : plugin
    ));
  };

  const handleInstallPlugin = () => {
    // TODO: Open plugin marketplace or installation dialog
    console.log('Install new plugin');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="spinner w-8 h-8"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading plugins...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="card p-6 text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-lg font-medium">{error}</p>
          </div>
          <button onClick={loadPlugins} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const enabledPlugins = plugins.filter(p => p.enabled);
  const disabledPlugins = plugins.filter(p => !p.enabled);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Plugin Manager
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Extend PressBox functionality with plugins and addons
          </p>
        </div>
        <button onClick={handleInstallPlugin} className="btn-primary">
          + Install Plugin
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Plugins</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{plugins.length}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Plugins</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{enabledPlugins.length}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inactive Plugins</h3>
          <p className="text-3xl font-bold text-gray-600 mt-2">{disabledPlugins.length}</p>
        </div>
      </div>

      {plugins.length === 0 ? (
        /* Empty State */
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Plugins Installed
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Install plugins to extend PressBox functionality and improve your workflow
          </p>
          <button onClick={handleInstallPlugin} className="btn-primary">
            Browse Plugin Marketplace
          </button>
        </div>
      ) : (
        /* Plugins List */
        <div className="space-y-8">
          {/* Active Plugins */}
          {enabledPlugins.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Active Plugins ({enabledPlugins.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enabledPlugins.map((plugin) => (
                  <div key={plugin.id} className="card p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {plugin.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          v{plugin.version} by {plugin.author}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        plugin.type === 'core' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        plugin.type === 'community' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      }`}>
                        {plugin.type}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      {plugin.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                        Active
                      </span>
                      <button
                        onClick={() => handleTogglePlugin(plugin.id)}
                        className="btn-secondary text-sm py-1 px-3"
                        disabled={plugin.type === 'core'}
                      >
                        {plugin.type === 'core' ? 'Core Plugin' : 'Disable'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inactive Plugins */}
          {disabledPlugins.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Inactive Plugins ({disabledPlugins.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {disabledPlugins.map((plugin) => (
                  <div key={plugin.id} className="card p-6 opacity-75">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {plugin.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          v{plugin.version} by {plugin.author}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        plugin.type === 'core' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        plugin.type === 'community' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      }`}>
                        {plugin.type}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      {plugin.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                        Inactive
                      </span>
                      <button
                        onClick={() => handleTogglePlugin(plugin.id)}
                        className="btn-success text-sm py-1 px-3"
                      >
                        Activate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Plugin Development Info */}
      <div className="card p-6 mt-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Plugin Development
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Create Custom Plugins
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Extend PressBox functionality by creating custom plugins using our plugin API.
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• JavaScript/TypeScript plugin API</li>
              <li>• Custom UI components and views</li>
              <li>• Integration with WordPress sites</li>
              <li>• Docker container management</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Plugin Types
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">core</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Built-in PressBox functionality</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">community</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Community-developed plugins</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">custom</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your custom developed plugins</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}