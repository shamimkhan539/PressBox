import React, { useState, useEffect } from 'react';
import { PlayIcon, StopIcon, CogIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface DatabaseServer {
    type: 'mysql' | 'mariadb';
    version: string;
    isRunning: boolean;
    port: number;
    processId?: number;
    installPath?: string;
    dataPath?: string;
    configPath?: string;
}

interface DatabaseManagementProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DatabaseManagement({ isOpen, onClose }: DatabaseManagementProps) {
    const [servers, setServers] = useState<DatabaseServer[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [diagnosticSite, setDiagnosticSite] = useState<string>("");
    const [diagnosticResult, setDiagnosticResult] = useState<{ success: boolean; type?: string; message?: string; error?: string } | null>(null);
    const [showDiagnostics, setShowDiagnostics] = useState(false);

    // Load database server statuses
    const loadServerStatuses = async () => {
        setLoading(true);
        try {
            const statuses = await window.electronAPI.databaseServers.getStatuses();
            setServers(statuses);
        } catch (error) {
            console.error('Failed to load database server statuses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadServerStatuses();
        }
    }, [isOpen]);

    // Start a database server
    const startServer = async (server: DatabaseServer) => {
        setActionLoading(`${server.type}-${server.version}-${server.port}`);
        try {
            const result = await window.electronAPI.databaseServers.start(server);
            if (result.success) {
                await loadServerStatuses(); // Refresh statuses
            } else {
                alert(`Failed to start ${server.type} ${server.version}: ${result.error}`);
            }
        } catch (error) {
            console.error('Failed to start server:', error);
            alert('Failed to start database server');
        } finally {
            setActionLoading(null);
        }
    };

    // Stop a database server
    const stopServer = async (server: DatabaseServer) => {
        setActionLoading(`${server.type}-${server.version}-${server.port}`);
        try {
            const result = await window.electronAPI.databaseServers.stop(server);
            if (result.success) {
                await loadServerStatuses(); // Refresh statuses
            } else {
                alert(`Failed to stop ${server.type} ${server.version}: ${result.error}`);
            }
        } catch (error) {
            console.error('Failed to stop server:', error);
            alert('Failed to stop database server');
        } finally {
            setActionLoading(null);
        }
    };

    // Initialize a database server
    const initializeServer = async (server: DatabaseServer) => {
        setActionLoading(`${server.type}-${server.version}-${server.port}`);
        try {
            const result = await window.electronAPI.databaseServers.initialize(server);
            if (result.success) {
                alert(`${server.type} ${server.version} initialized successfully`);
                await loadServerStatuses(); // Refresh statuses
            } else {
                alert(`Failed to initialize ${server.type} ${server.version}: ${result.error}`);
            }
        } catch (error) {
            console.error('Failed to initialize server:', error);
            alert('Failed to initialize database server');
        } finally {
            setActionLoading(null);
        }
    };

    // Test site database connection
    const testSiteConnection = async () => {
        if (!diagnosticSite.trim()) return;

        setActionLoading("diagnostics");
        try {
            const result = await window.electronAPI.databaseServers.testSiteConnection(diagnosticSite.trim());
            setDiagnosticResult(result);
        } catch (error) {
            setDiagnosticResult({ success: false, error: "Failed to run diagnostics" });
        } finally {
            setActionLoading(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Database Server Management</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Manage MySQL and MariaDB servers for your WordPress sites
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading database servers...</span>
                        </div>
                    ) : servers.length === 0 ? (
                        <div className="text-center py-12">
                            <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Database Servers Found</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                No MySQL or MariaDB installations were found on your system.
                            </p>
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <p>Common installation locations checked:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>C:\Program Files\MySQL\</li>
                                    <li>C:\Program Files\MariaDB\</li>
                                    <li>C:\xampp\mysql\</li>
                                    <li>C:\wamp\bin\mysql\</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {servers.map((server) => {
                                const serverKey = `${server.type}-${server.version}-${server.port}`;
                                const isActionLoading = actionLoading === serverKey;

                                return (
                                    <div key={serverKey} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-3 h-3 rounded-full ${
                                                    server.isRunning ? 'bg-green-500' : 'bg-red-500'
                                                }`}></div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                                        {server.type.toUpperCase()} {server.version}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Port {server.port} • {server.isRunning ? 'Running' : 'Stopped'}
                                                        {server.processId && ` (PID: ${server.processId})`}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                {!server.isRunning && (
                                                    <button
                                                        onClick={() => initializeServer(server)}
                                                        disabled={isActionLoading}
                                                        className="btn-secondary flex items-center space-x-1 text-xs"
                                                        title="Initialize server (create data directory and config)"
                                                    >
                                                        <CogIcon className="w-4 h-4" />
                                                        <span>Initialize</span>
                                                    </button>
                                                )}

                                                {server.isRunning ? (
                                                    <button
                                                        onClick={() => stopServer(server)}
                                                        disabled={isActionLoading}
                                                        className="btn-danger flex items-center space-x-1"
                                                    >
                                                        {isActionLoading ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        ) : (
                                                            <StopIcon className="w-4 h-4" />
                                                        )}
                                                        <span>Stop</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => startServer(server)}
                                                        disabled={isActionLoading}
                                                        className="btn-success flex items-center space-x-1"
                                                    >
                                                        {isActionLoading ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        ) : (
                                                            <PlayIcon className="w-4 h-4" />
                                                        )}
                                                        <span>Start</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {server.installPath && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                                <div><strong>Install Path:</strong> {server.installPath}</div>
                                                {server.dataPath && <div><strong>Data Path:</strong> {server.dataPath}</div>}
                                                {server.configPath && <div><strong>Config Path:</strong> {server.configPath}</div>}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Database Connection Diagnostics */}
                <div className="mt-8 border-t border-gray-200 dark:border-gray-600 pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Database Connection Diagnostics</h3>
                        <button
                            onClick={() => setShowDiagnostics(!showDiagnostics)}
                            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                            {showDiagnostics ? 'Hide' : 'Show'} Diagnostics
                        </button>
                    </div>

                    {showDiagnostics && (
                        <div className="space-y-4">
                            <div className="flex space-x-3">
                                <input
                                    type="text"
                                    value={diagnosticSite}
                                    onChange={(e) => setDiagnosticSite(e.target.value)}
                                    placeholder="Enter site name (e.g., mysite)"
                                    className="flex-1 form-input"
                                />
                                <button
                                    onClick={testSiteConnection}
                                    disabled={actionLoading === "diagnostics" || !diagnosticSite.trim()}
                                    className="btn-primary"
                                >
                                    {actionLoading === "diagnostics" ? "Testing..." : "Test Connection"}
                                </button>
                            </div>

                            {diagnosticResult && (
                                <div className={`p-4 rounded-lg ${
                                    diagnosticResult.success
                                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                }`}>
                                    <div className="flex items-center space-x-2 mb-2">
                                        {diagnosticResult.success ? (
                                            <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                                        )}
                                        <span className={`font-medium ${
                                            diagnosticResult.success
                                                ? 'text-green-800 dark:text-green-300'
                                                : 'text-red-800 dark:text-red-300'
                                        }`}>
                                            {diagnosticResult.success ? 'Connection Successful' : 'Connection Failed'}
                                        </span>
                                    </div>

                                    {diagnosticResult.type && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            <strong>Database Type:</strong> {diagnosticResult.type.toUpperCase()}
                                        </p>
                                    )}

                                    <p className={`text-sm ${
                                        diagnosticResult.success
                                            ? 'text-green-700 dark:text-green-300'
                                            : 'text-red-700 dark:text-red-300'
                                    }`}>
                                        {diagnosticResult.message || diagnosticResult.error}
                                    </p>
                                </div>
                            )}

                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                <p className="mb-2"><strong>Troubleshooting Tips:</strong></p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Ensure the database server is running (check status above)</li>
                                    <li>For MySQL/MariaDB sites, verify the server is started on the correct port</li>
                                    <li>For SQLite sites, check that the database file exists in wp-content/database/</li>
                                    <li>Try restarting the site after fixing database issues</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {servers.length > 0 && (
                            <span>
                                {servers.filter(s => s.isRunning).length} of {servers.length} servers running
                            </span>
                        )}
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={loadServerStatuses}
                            disabled={loading}
                            className="btn-secondary"
                        >
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </button>

                        <button
                            onClick={onClose}
                            className="btn-primary"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}