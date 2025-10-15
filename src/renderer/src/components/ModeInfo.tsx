/**
 * Mode Information Component
 * 
 * Shows users whether they're in admin or non-admin mode and allows them to change settings
 */

import React, { useState, useEffect } from 'react';
import { waitForElectronAPI } from '../utils/electronApi';

interface ModeInfoProps {
    className?: string;
}

interface ModeStatus {
    enabled: boolean;
    hasUserMadeChoice: boolean;
    lastChoice: 'admin' | 'non-admin';
    explanation: {
        mode: string;
        description: string;
        urls: string;
        adminRequired: boolean;
    };
}

export const ModeInfo: React.FC<ModeInfoProps> = ({ className = '' }) => {
    const [modeStatus, setModeStatus] = useState<ModeStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [switching, setSwitching] = useState(false);

    useEffect(() => {
        loadModeStatus();
    }, []);

    const loadModeStatus = async () => {
        try {
            const electronAPI = await waitForElectronAPI();
            const status = await electronAPI.nonAdminMode.getStatus();
            setModeStatus(status);
        } catch (error) {
            console.error('Failed to load mode status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResetChoice = async () => {
        if (!confirm('This will reset your mode preference and show the mode selection dialog again. Continue?')) {
            return;
        }
        
        setSwitching(true);
        try {
            const electronAPI = await waitForElectronAPI();
            await electronAPI.nonAdminMode.resetPreferences();
            await loadModeStatus();
        } catch (error) {
            console.error('Failed to reset preferences:', error);
        } finally {
            setSwitching(false);
        }
    };

    const handleModeSwitch = async (enableNonAdminMode: boolean) => {
        if (!modeStatus) return;
        
        setSwitching(true);
        try {
            const electronAPI = await waitForElectronAPI();
            
            let result;
            if (enableNonAdminMode) {
                result = await electronAPI.nonAdminMode.enable();
            } else {
                result = await electronAPI.nonAdminMode.disable();
            }
            
            // Reload status to get updated information
            await loadModeStatus();
            
            console.log(`Mode switched to: ${result.mode}`);
        } catch (error) {
            console.error('Failed to switch mode:', error);
        } finally {
            setSwitching(false);
        }
    };

    if (loading) {
        return (
            <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
                <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-sm text-gray-600">Loading mode information...</span>
                </div>
            </div>
        );
    }

    if (!modeStatus) {
        return (
            <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
                <div className="text-sm text-red-700">
                    Failed to load mode information.
                </div>
            </div>
        );
    }

    const isNonAdminMode = modeStatus.enabled;
    const bgColor = isNonAdminMode ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200';
    const iconColor = isNonAdminMode ? 'text-blue-400' : 'text-yellow-400';
    const textColor = isNonAdminMode ? 'text-blue-800' : 'text-yellow-800';
    const descriptionColor = isNonAdminMode ? 'text-blue-700' : 'text-yellow-700';

    return (
        <div className={`${bgColor} border rounded-lg p-4 ${className}`}>
            <div className="flex items-start justify-between">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        {isNonAdminMode ? (
                            <svg className={`h-5 w-5 ${iconColor}`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className={`h-5 w-5 ${iconColor}`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 8A6 6 0 006 8c0 1.093.239 2.132.671 3.062L6.671 11.062a.75.75 0 101.414.562 4.5 4.5 0 016.914-4.062 4.5 4.5 0 01-2.9 3.975.75.75 0 101.118 1.006A6.002 6.002 0 0018 8zM5.231 4.231A3.5 3.5 0 018.5 1.5h3A3.5 3.5 0 0115 5v.5a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2V5a3.5 3.5 0 01.231-1.231z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                    <div className="ml-3">
                        <h3 className={`text-sm font-medium ${textColor}`}>
                            {modeStatus.explanation.mode}
                        </h3>
                        <div className={`mt-2 text-sm ${descriptionColor}`}>
                            <p>{modeStatus.explanation.description}</p>
                            <p className="mt-1">
                                <strong>URLs:</strong> {modeStatus.explanation.urls}
                            </p>
                            {isNonAdminMode ? (
                                <ul className="mt-2 list-disc list-inside space-y-1">
                                    <li>No administrator privileges required</li>
                                    <li>No hosts file modification</li>
                                    <li>Works on any system</li>
                                </ul>
                            ) : (
                                <ul className="mt-2 list-disc list-inside space-y-1">
                                    <li>Requires administrator privileges</li>
                                    <li>Modifies system hosts file</li>
                                    <li>Custom domains like mysite.local</li>
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col gap-2">
                    {/* Mode Toggle Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleModeSwitch(true)}
                            disabled={switching || isNonAdminMode}
                            className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                                isNonAdminMode
                                    ? 'bg-blue-100 text-blue-700 border-blue-300 cursor-default'
                                    : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                            } ${switching ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {switching && isNonAdminMode ? (
                                <>
                                    <span className="inline-block animate-spin rounded-full h-3 w-3 border-b border-current mr-1"></span>
                                    Switching...
                                </>
                            ) : (
                                'Non-Admin'
                            )}
                        </button>
                        
                        <button
                            onClick={() => handleModeSwitch(false)}
                            disabled={switching || !isNonAdminMode}
                            className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                                !isNonAdminMode
                                    ? 'bg-yellow-100 text-yellow-700 border-yellow-300 cursor-default'
                                    : 'bg-yellow-600 text-white border-yellow-600 hover:bg-yellow-700'
                            } ${switching ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {switching && !isNonAdminMode ? (
                                <>
                                    <span className="inline-block animate-spin rounded-full h-3 w-3 border-b border-current mr-1"></span>
                                    Switching...
                                </>
                            ) : (
                                'Admin Mode'
                            )}
                        </button>
                    </div>
                    
                    <div className="text-xs text-gray-500 text-right">
                        {modeStatus.hasUserMadeChoice ? (
                            <div className="space-y-1">
                                <div>Last choice: {modeStatus.lastChoice}</div>
                                <button
                                    onClick={handleResetChoice}
                                    className="text-blue-600 hover:text-blue-800 underline text-xs"
                                    disabled={switching}
                                >
                                    Reset choice
                                </button>
                            </div>
                        ) : (
                            'Default setting'
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};