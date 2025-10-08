import React, { useState, useEffect } from 'react';
import { WordPressSite } from '../../../shared/types';

export interface ExportOptions {
    includeFiles: boolean;
    includeDatabases: boolean;
    includeConfigs: boolean;
    includeLogFiles: boolean;
    includePressBoxSettings: boolean;
    excludePatterns: string[];
    compressionLevel: 'none' | 'fast' | 'best';
}

interface ExportWizardProps {
    site: WordPressSite;
    isOpen: boolean;
    onClose: () => void;
    onExportComplete: (result: any) => void;
}

export const ExportWizard: React.FC<ExportWizardProps> = ({
    site,
    isOpen,
    onClose,
    onExportComplete
}) => {
    const [step, setStep] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState('');
    const [exportOptions, setExportOptions] = useState<ExportOptions>({
        includeFiles: true,
        includeDatabases: true,
        includeConfigs: true,
        includeLogFiles: false,
        includePressBoxSettings: true,
        excludePatterns: [
            '*.git*',
            '.DS_Store',
            'Thumbs.db',
            'node_modules',
            '*.psd',
            '*.ai',
            '*.tmp',
            '*.cache',
            '*.log'
        ],
        compressionLevel: 'best'
    });

    const [customExcludePattern, setCustomExcludePattern] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setIsExporting(false);
            setExportProgress('');
        }
    }, [isOpen]);

    const handleExport = async () => {
        setIsExporting(true);
        setExportProgress('Preparing export...');

        try {
            setExportProgress('Exporting site files...');
            // Simulate progress updates
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setExportProgress('Exporting database...');
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            setExportProgress('Exporting configurations...');
            await new Promise(resolve => setTimeout(resolve, 800));
            
            setExportProgress('Creating archive...');
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mock export result for now
            const result = {
                exportId: 'export-123',
                exportPath: `C:/PressBox/exports/${site.name}-${Date.now()}.pbx`,
                size: 125 * 1024 * 1024, // 125MB
                duration: 5300,
                componentsExported: ['files', 'database', 'configs', 'pressbox-settings']
            };

            onExportComplete(result);
            setExportProgress('Export completed successfully!');
            
            // Close after showing success
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (error) {
            setExportProgress(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsExporting(false);
        }
    };

    const addExcludePattern = () => {
        if (customExcludePattern.trim() && !exportOptions.excludePatterns.includes(customExcludePattern.trim())) {
            setExportOptions(prev => ({
                ...prev,
                excludePatterns: [...prev.excludePatterns, customExcludePattern.trim()]
            }));
            setCustomExcludePattern('');
        }
    };

    const removeExcludePattern = (index: number) => {
        setExportOptions(prev => ({
            ...prev,
            excludePatterns: prev.excludePatterns.filter((_, i) => i !== index)
        }));
    };

    const getEstimatedSize = () => {
        let size = 0;
        if (exportOptions.includeFiles) size += 50; // MB
        if (exportOptions.includeDatabases) size += 10;
        if (exportOptions.includeConfigs) size += 1;
        if (exportOptions.includeLogFiles) size += 5;
        if (exportOptions.includePressBoxSettings) size += 1;
        
        return `~${size}MB`;
    };

    if (!isOpen) return null;

    const steps = [
        { id: 1, title: 'Components', description: 'Select what to export' },
        { id: 2, title: 'Exclusions', description: 'Configure file exclusions' },
        { id: 3, title: 'Settings', description: 'Export settings' },
        { id: 4, title: 'Review', description: 'Review and export' }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Export Site: {site.name}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {site.domain} • {site.phpVersion} • {site.webServer.toUpperCase()}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isExporting}
                            className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    {/* Step Indicator */}
                    <div className="flex items-center space-x-4 mt-4">
                        {steps.map((stepInfo, index) => (
                            <div key={stepInfo.id} className="flex items-center">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                                    step >= stepInfo.id 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                }`}>
                                    {stepInfo.id}
                                </div>
                                <div className="ml-2 hidden sm:block">
                                    <p className={`text-sm font-medium ${
                                        step >= stepInfo.id 
                                            ? 'text-blue-600 dark:text-blue-400' 
                                            : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                        {stepInfo.title}
                                    </p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`w-8 h-0.5 mx-4 ${
                                        step > stepInfo.id 
                                            ? 'bg-blue-500' 
                                            : 'bg-gray-200 dark:bg-gray-700'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4 max-h-96 overflow-y-auto">
                    {step === 1 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Select Components to Export
                            </h3>
                            
                            <div className="space-y-3">
                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={exportOptions.includeFiles}
                                        onChange={(e) => setExportOptions(prev => ({
                                            ...prev, 
                                            includeFiles: e.target.checked
                                        }))}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            WordPress Files
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            All WordPress core files, themes, plugins, and uploads
                                        </div>
                                    </div>
                                </label>

                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={exportOptions.includeDatabases}
                                        onChange={(e) => setExportOptions(prev => ({
                                            ...prev, 
                                            includeDatabases: e.target.checked
                                        }))}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            Database
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            Complete MySQL database with all content and settings
                                        </div>
                                    </div>
                                </label>

                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={exportOptions.includeConfigs}
                                        onChange={(e) => setExportOptions(prev => ({
                                            ...prev, 
                                            includeConfigs: e.target.checked
                                        }))}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            Server Configurations
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            NGINX/Apache, PHP, and MySQL configuration files
                                        </div>
                                    </div>
                                </label>

                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={exportOptions.includeLogFiles}
                                        onChange={(e) => setExportOptions(prev => ({
                                            ...prev, 
                                            includeLogFiles: e.target.checked
                                        }))}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            Log Files
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            Error logs, access logs, and debug information
                                        </div>
                                    </div>
                                </label>

                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={exportOptions.includePressBoxSettings}
                                        onChange={(e) => setExportOptions(prev => ({
                                            ...prev, 
                                            includePressBoxSettings: e.target.checked
                                        }))}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            PressBox Settings
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            Site-specific PressBox configuration and metadata
                                        </div>
                                    </div>
                                </label>
                            </div>

                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div className="text-sm text-blue-800 dark:text-blue-200">
                                    <strong>Estimated Size:</strong> {getEstimatedSize()}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                File Exclusion Patterns
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Specify patterns for files and folders to exclude from the export.
                            </p>

                            <div className="space-y-2">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={customExcludePattern}
                                        onChange={(e) => setCustomExcludePattern(e.target.value)}
                                        placeholder="Add exclusion pattern (e.g., *.log, node_modules)"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                addExcludePattern();
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={addExcludePattern}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                    >
                                        Add
                                    </button>
                                </div>

                                <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                                    {exportOptions.excludePatterns.map((pattern, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                                            <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                                                {pattern}
                                            </span>
                                            <button
                                                onClick={() => removeExcludePattern(index)}
                                                className="text-red-500 hover:text-red-700 text-sm"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Export Settings
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Compression Level
                                </label>
                                <select
                                    value={exportOptions.compressionLevel}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev, 
                                        compressionLevel: e.target.value as 'none' | 'fast' | 'best'
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="none">No Compression (Fastest)</option>
                                    <option value="fast">Fast Compression</option>
                                    <option value="best">Best Compression (Smallest)</option>
                                </select>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Higher compression reduces file size but takes more time.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Review Export Configuration
                            </h3>

                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                    Components to Export:
                                </h4>
                                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    {exportOptions.includeFiles && <li>• WordPress Files</li>}
                                    {exportOptions.includeDatabases && <li>• Database</li>}
                                    {exportOptions.includeConfigs && <li>• Server Configurations</li>}
                                    {exportOptions.includeLogFiles && <li>• Log Files</li>}
                                    {exportOptions.includePressBoxSettings && <li>• PressBox Settings</li>}
                                </ul>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                    Settings:
                                </h4>
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    <div>Compression: {exportOptions.compressionLevel}</div>
                                    <div>Exclude Patterns: {exportOptions.excludePatterns.length}</div>
                                    <div>Estimated Size: {getEstimatedSize()}</div>
                                </div>
                            </div>

                            {isExporting && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                                        <span className="text-sm text-blue-700 dark:text-blue-300">
                                            {exportProgress}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                    <button
                        onClick={() => step > 1 && setStep(step - 1)}
                        disabled={step === 1 || isExporting}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>

                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            disabled={isExporting}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        
                        {step < 4 ? (
                            <button
                                onClick={() => setStep(step + 1)}
                                disabled={isExporting}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                            >
                                {isExporting ? 'Exporting...' : 'Start Export'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};