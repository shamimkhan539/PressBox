import React, { useState, useEffect } from 'react';

interface DockerStatus {
  installed: boolean;
  running: boolean;
  version?: string;
}

/**
 * Docker Page Component
 * 
 * Manages Docker installation and container status for WordPress development.
 */
export function Docker() {
  const [status, setStatus] = useState<DockerStatus>({
    installed: false,
    running: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDockerStatus();
  }, []);

  const loadDockerStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [installed, running] = await Promise.all([
        window.electronAPI.docker.isInstalled(),
        window.electronAPI.docker.isRunning()
      ]);
      
      setStatus({ installed, running });
    } catch (err) {
      console.error('Failed to load Docker status:', err);
      setError('Failed to check Docker status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDockerAction = (action: 'start' | 'stop' | 'restart') => {
    // TODO: Implement Docker actions
    console.log(`Docker ${action} requested`);
  };

  const handleInstallDocker = () => {
    // TODO: Open Docker installation guide
    window.open('https://docs.docker.com/get-docker/', '_blank');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="spinner w-8 h-8"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Checking Docker status...</span>
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
          <button onClick={loadDockerStatus} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Docker Management
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage Docker containers for your WordPress sites
        </p>
      </div>

      {/* Docker Status Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Docker Status
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Installation</span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                status.installed ? 'status-running' : 'status-error'
              }`}>
                {status.installed ? 'Installed' : 'Not Installed'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Service Status</span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                status.running ? 'status-running' : 'status-stopped'
              }`}>
                {status.running ? 'Running' : 'Stopped'}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {!status.installed ? (
              <button onClick={handleInstallDocker} className="btn-primary w-full">
                Install Docker
              </button>
            ) : (
              <>
                {status.running ? (
                  <div className="space-y-2">
                    <button onClick={() => handleDockerAction('restart')} className="btn-secondary w-full">
                      Restart Docker
                    </button>
                    <button onClick={() => handleDockerAction('stop')} className="btn-danger w-full">
                      Stop Docker
                    </button>
                  </div>
                ) : (
                  <button onClick={() => handleDockerAction('start')} className="btn-success w-full">
                    Start Docker
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Quick Info Card */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Quick Info
          </h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                What is Docker?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Docker allows PressBox to create isolated WordPress environments with 
                different PHP versions, databases, and configurations.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Why do I need it?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Each WordPress site runs in its own container, preventing conflicts 
                and allowing you to test different configurations safely.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Docker Commands Section (if Docker is running) */}
      {status.installed && status.running && (
        <div className="mt-8">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Container Management
            </h2>
            
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                Container management features coming soon
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                View, start, stop, and manage WordPress containers
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}