import React, { useState, useEffect } from 'react';
import { 
    ComputerDesktopIcon, 
    CloudIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

interface EnvironmentCapabilities {
    local: {
        type: 'local';
        available: boolean;
        preferred: boolean;
        description: string;
    };
    docker: {
        type: 'docker';
        available: boolean;
        preferred: boolean;
        description: string;
    };
}

interface EnvironmentSelectorProps {
    onEnvironmentChange?: (environment: 'local' | 'docker') => void;
    className?: string;
}

export function EnvironmentSelector({ onEnvironmentChange, className = '' }: EnvironmentSelectorProps) {
    const [capabilities, setCapabilities] = useState<EnvironmentCapabilities | null>(null);
    const [currentEnvironment, setCurrentEnvironment] = useState<'local' | 'docker'>('local');
    const [loading, setLoading] = useState(true);
    const [switching, setSwitching] = useState(false);

    useEffect(() => {
        loadEnvironmentCapabilities();
        getCurrentEnvironment();
    }, []);

    const loadEnvironmentCapabilities = async () => {
        try {
            const caps = await window.electronAPI.environment.getCapabilities();
            setCapabilities(caps);
        } catch (error) {
            console.error('Failed to load environment capabilities:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentEnvironment = async () => {
        try {
            const current = await window.electronAPI.environment.getCurrent();
            setCurrentEnvironment(current);
        } catch (error) {
            console.error('Failed to get current environment:', error);
        }
    };

    const handleEnvironmentSwitch = async (environment: 'local' | 'docker') => {
        if (environment === currentEnvironment || !capabilities?.[environment]?.available) {
            return;
        }

        setSwitching(true);
        try {
            const success = await window.electronAPI.environment.switch(environment);
            if (success) {
                setCurrentEnvironment(environment);
                onEnvironmentChange?.(environment);
                
                // Show success notification
                console.log(`✅ Switched to ${environment} environment`);
            }
        } catch (error) {
            console.error(`Failed to switch to ${environment} environment:`, error);
            // Show error notification
        } finally {
            setSwitching(false);
        }
    };

    const getEnvironmentIcon = (type: 'local' | 'docker') => {
        return type === 'local' ? ComputerDesktopIcon : CloudIcon;
    };

    const getStatusIcon = (available: boolean, isCurrent: boolean) => {
        if (isCurrent) return CheckCircleIcon;
        if (available) return InformationCircleIcon;
        return ExclamationTriangleIcon;
    };

    const getStatusColor = (available: boolean, isCurrent: boolean) => {
        if (isCurrent) return 'text-green-600';
        if (available) return 'text-blue-600';
        return 'text-yellow-600';
    };

    if (loading) {
        return (
            <div className={`flex items-center space-x-2 ${className}`}>
                <ArrowPathIcon className="h-5 w-5 animate-spin text-gray-400" />
                <span className="text-sm text-gray-500">Loading environments...</span>
            </div>
        );
    }

    if (!capabilities) {
        return (
            <div className={`text-sm text-red-600 ${className}`}>
                Failed to load environment capabilities
            </div>
        );
    }

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-800">Development Environment</h3>
                {switching && <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-500" />}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(capabilities).map(([type, config]) => {
                    const isCurrent = currentEnvironment === type;
                    const EnvironmentIcon = getEnvironmentIcon(type as 'local' | 'docker');
                    const StatusIcon = getStatusIcon(config.available, isCurrent);
                    const statusColor = getStatusColor(config.available, isCurrent);
                    
                    return (
                        <div
                            key={type}
                            className={`
                                relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                                ${isCurrent 
                                    ? 'border-green-500 bg-green-50 shadow-lg' 
                                    : config.available
                                        ? 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                                        : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                                }
                            `}
                            onClick={() => config.available && handleEnvironmentSwitch(type as 'local' | 'docker')}
                        >
                            {/* Current environment indicator */}
                            {isCurrent && (
                                <div className="absolute top-2 right-2">
                                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                                </div>
                            )}
                            
                            <div className="flex items-start space-x-3">
                                <EnvironmentIcon className={`h-8 w-8 mt-1 ${
                                    config.available ? 'text-blue-600' : 'text-gray-400'
                                }`} />
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                        <h4 className="font-semibold text-gray-900 capitalize">
                                            {type} Environment
                                        </h4>
                                        <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                                    </div>
                                    
                                    <p className="text-sm text-gray-600 mt-1">
                                        {config.description}
                                    </p>
                                    
                                    <div className="mt-2 flex items-center space-x-4 text-xs">
                                        <span className={`
                                            px-2 py-1 rounded-full
                                            ${config.available 
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }
                                        `}>
                                            {config.available ? 'Available' : 'Not Available'}
                                        </span>
                                        
                                        {config.preferred && (
                                            <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                                Recommended
                                            </span>
                                        )}
                                        
                                        {isCurrent && (
                                            <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 font-semibold">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Action indicator */}
                            {!isCurrent && config.available && (
                                <div className="mt-3 text-xs text-blue-600 font-medium">
                                    Click to switch →
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Environment details */}
            <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Environment Features:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <strong>Local Environment:</strong>
                        <ul className="mt-1 space-y-1 text-gray-600">
                            <li>• Uses system PHP or portable PHP</li>
                            <li>• PHP built-in development server</li>
                            <li>• File-based WordPress installations</li>
                            <li>• Fast startup and lightweight</li>
                            <li>• SQLite database (optional MySQL)</li>
                        </ul>
                    </div>
                    <div>
                        <strong>Docker Environment:</strong>
                        <ul className="mt-1 space-y-1 text-gray-600">
                            <li>• Containerized WordPress + MySQL</li>
                            <li>• Production-like environment</li>
                            <li>• Isolated dependencies</li>
                            <li>• Optional Nginx + SSL</li>
                            <li>• Easy version switching</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Current status summary */}
            <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                        Currently using: <span className="capitalize">{currentEnvironment}</span> environment
                    </span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                    {capabilities[currentEnvironment]?.description}
                </p>
            </div>
        </div>
    );
}