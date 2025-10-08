import React, { useState, useEffect, useCallback } from 'react';
import { WordPressSite } from '../../../shared/types';

export interface ImportOptions {
    importFiles: boolean;
    importDatabases: boolean;
    importConfigs: boolean;
    importPressBoxSettings: boolean;
    overwriteExisting: boolean;
    createBackup: boolean;
    newSiteName?: string;
    newDomain?: string;
    phpVersion?: string;
    webServer?: 'nginx' | 'apache';
}

interface ImportManifest {
    version: string;
    siteInfo: {
        name: string;
        domain: string;
        phpVersion: string;
        webServer: 'nginx' | 'apache';
        wordpressVersion: string;
        exportedAt: string;
        size: number;
    };
    components: string[];
    fileCount: number;
    databaseSize: number;
    checksums: Record<string, string>;
}

interface ImportWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onImportComplete: (result: any) => void;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({
    isOpen,
    onClose,
    onImportComplete
}) => {
    const [step, setStep] = useState(1);
    const [selectedFile, setSelectedFile] = useState<string>('');
    const [manifest, setManifest] = useState<ImportManifest | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [importOptions, setImportOptions] = useState<ImportOptions>({
        importFiles: true,
        importDatabases: true,
        importConfigs: true,
        importPressBoxSettings: true,
        overwriteExisting: false,
        createBackup: true,
        newSiteName: '',
        newDomain: '',
        phpVersion: '8.2',
        webServer: 'nginx'
    });

    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setSelectedFile('');
            setManifest(null);
            setIsAnalyzing(false);
            setIsImporting(false);
            setImportProgress('');
            setImportOptions(prev => ({
                ...prev,
                newSiteName: '',
                newDomain: ''
            }));
        }
    }, [isOpen]);

    const handleFileSelect = useCallback(async (filePath: string) => {
        setSelectedFile(filePath);
        setIsAnalyzing(true);

        try {
            // Simulate manifest reading - in real implementation, this would use the IPC
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Mock manifest data
            const mockManifest: ImportManifest = {
                version: '1.0.0',
                siteInfo: {
                    name: 'Example WordPress Site',
                    domain: 'example.local',
                    phpVersion: '8.1',
                    webServer: 'nginx',
                    wordpressVersion: '6.4.2',
                    exportedAt: new Date().toISOString(),
                    size: 125 * 1024 * 1024 // 125MB
                },
                components: ['files', 'database', 'configs', 'pressbox-settings'],
                fileCount: 1247,
                databaseSize: 12 * 1024 * 1024, // 12MB
                checksums: {
                    'wordpress.tar.gz': 'abc123',
                    'database.sql': 'def456',
                    'configs.tar.gz': 'ghi789'
                }
            };

            setManifest(mockManifest);
            setImportOptions(prev => ({
                ...prev,
                newSiteName: mockManifest.siteInfo.name,
                newDomain: mockManifest.siteInfo.domain,
                phpVersion: mockManifest.siteInfo.phpVersion,
                webServer: mockManifest.siteInfo.webServer
            }));

        } catch (error) {
            console.error('Failed to read manifest:', error);
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        const pbxFile = files.find(file => file.name.endsWith('.pbx'));
        
        if (pbxFile) {
            handleFileSelect(pbxFile.path);
        }
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    }, []);

    const selectFile = async () => {
        // In real implementation, this would use the file dialog API
        // For now, simulate file selection
        const mockFilePath = 'C:/Users/Downloads/wordpress-site-backup.pbx';
        handleFileSelect(mockFilePath);
    };

    const handleImport = async () => {
        setIsImporting(true);
        setImportProgress('Preparing import...');

        try {
            if (importOptions.createBackup) {
                setImportProgress('Creating backup of existing site...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            if (importOptions.importFiles) {
                setImportProgress('Importing WordPress files...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            if (importOptions.importDatabases) {
                setImportProgress('Importing database...');
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            if (importOptions.importConfigs) {
                setImportProgress('Importing server configurations...');
                await new Promise(resolve => setTimeout(resolve, 800));
            }

            if (importOptions.importPressBoxSettings) {
                setImportProgress('Importing PressBox settings...');
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            setImportProgress('Finalizing site setup...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mock import result
            const result = {
                importId: 'import-123',
                siteName: importOptions.newSiteName || manifest?.siteInfo.name,
                domain: importOptions.newDomain || manifest?.siteInfo.domain,
                phpVersion: importOptions.phpVersion,
                webServer: importOptions.webServer,
                duration: 6800,
                componentsImported: Object.entries(importOptions)
                    .filter(([key, value]) => key.startsWith('import') && value)
                    .map(([key]) => key.replace('import', '').toLowerCase())
            };

            onImportComplete(result);
            setImportProgress('Import completed successfully!');
            
            // Close after showing success
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (error) {
            setImportProgress(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsImporting(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    if (!isOpen) return null;

    const steps = [
        { id: 1, title: 'Select File', description: 'Choose PressBox export file' },
        { id: 2, title: 'Configure', description: 'Configure import settings' },
        { id: 3, title: 'Review', description: 'Review and import' }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Import WordPress Site
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Import a site from a PressBox export file
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isImporting}
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
                                Select PressBox Export File
                            </h3>

                            {!selectedFile ? (
                                <div
                                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                        dragActive
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                    }`}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                >
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Drop a PressBox export file (.pbx) here, or{' '}
                                            <button
                                                onClick={selectFile}
                                                className="text-blue-500 hover:text-blue-600 underline"
                                            >
                                                browse to select
                                            </button>
                                        </p>
                                    </div>
                                </div>
                            ) : isAnalyzing ? (
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                                        <span className="text-blue-700 dark:text-blue-300">
                                            Analyzing export file...
                                        </span>
                                    </div>
                                </div>
                            ) : manifest ? (
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                                                Export file validated successfully
                                            </h4>
                                            <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                                                <div className="grid grid-cols-2 gap-4 mt-2">
                                                    <div>
                                                        <strong>Site:</strong> {manifest.siteInfo.name}
                                                    </div>
                                                    <div>
                                                        <strong>Domain:</strong> {manifest.siteInfo.domain}
                                                    </div>
                                                    <div>
                                                        <strong>PHP:</strong> {manifest.siteInfo.phpVersion}
                                                    </div>
                                                    <div>
                                                        <strong>Server:</strong> {manifest.siteInfo.webServer.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <strong>WordPress:</strong> {manifest.siteInfo.wordpressVersion}
                                                    </div>
                                                    <div>
                                                        <strong>Size:</strong> {formatFileSize(manifest.siteInfo.size)}
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-3">
                                                    <strong>Components:</strong> {manifest.components.join(', ')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
                                    <div className="text-red-700 dark:text-red-300">
                                        Failed to read export file. Please ensure it's a valid PressBox export.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && manifest && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Configure Import Settings
                            </h3>

                            {/* Site Information */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900 dark:text-white">Site Information</h4>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Site Name
                                        </label>
                                        <input
                                            type="text"
                                            value={importOptions.newSiteName || ''}
                                            onChange={(e) => setImportOptions(prev => ({
                                                ...prev,
                                                newSiteName: e.target.value
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Local Domain
                                        </label>
                                        <input
                                            type="text"
                                            value={importOptions.newDomain || ''}
                                            onChange={(e) => setImportOptions(prev => ({
                                                ...prev,
                                                newDomain: e.target.value
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            PHP Version
                                        </label>
                                        <select
                                            value={importOptions.phpVersion}
                                            onChange={(e) => setImportOptions(prev => ({
                                                ...prev,
                                                phpVersion: e.target.value
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="7.4">PHP 7.4</option>
                                            <option value="8.0">PHP 8.0</option>
                                            <option value="8.1">PHP 8.1</option>
                                            <option value="8.2">PHP 8.2</option>
                                            <option value="8.3">PHP 8.3</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Web Server
                                        </label>
                                        <select
                                            value={importOptions.webServer}
                                            onChange={(e) => setImportOptions(prev => ({
                                                ...prev,
                                                webServer: e.target.value as 'nginx' | 'apache'
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="nginx">NGINX</option>
                                            <option value="apache">Apache</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Import Components */}
                            <div className="space-y-3">
                                <h4 className="font-medium text-gray-900 dark:text-white">Import Components</h4>
                                
                                <div className="space-y-2">
                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={importOptions.importFiles}
                                            onChange={(e) => setImportOptions(prev => ({
                                                ...prev,
                                                importFiles: e.target.checked
                                            }))}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="text-sm text-gray-900 dark:text-white">
                                            WordPress Files ({manifest.fileCount} files)
                                        </span>
                                    </label>

                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={importOptions.importDatabases}
                                            onChange={(e) => setImportOptions(prev => ({
                                                ...prev,
                                                importDatabases: e.target.checked
                                            }))}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="text-sm text-gray-900 dark:text-white">
                                            Database ({formatFileSize(manifest.databaseSize)})
                                        </span>
                                    </label>

                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={importOptions.importConfigs}
                                            onChange={(e) => setImportOptions(prev => ({
                                                ...prev,
                                                importConfigs: e.target.checked
                                            }))}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="text-sm text-gray-900 dark:text-white">
                                            Server Configurations
                                        </span>
                                    </label>

                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={importOptions.importPressBoxSettings}
                                            onChange={(e) => setImportOptions(prev => ({
                                                ...prev,
                                                importPressBoxSettings: e.target.checked
                                            }))}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="text-sm text-gray-900 dark:text-white">
                                            PressBox Settings
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Import Options */}
                            <div className="space-y-3">
                                <h4 className="font-medium text-gray-900 dark:text-white">Import Options</h4>
                                
                                <div className="space-y-2">
                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={importOptions.createBackup}
                                            onChange={(e) => setImportOptions(prev => ({
                                                ...prev,
                                                createBackup: e.target.checked
                                            }))}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="text-sm text-gray-900 dark:text-white">
                                            Create backup before import (recommended)
                                        </span>
                                    </label>

                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={importOptions.overwriteExisting}
                                            onChange={(e) => setImportOptions(prev => ({
                                                ...prev,
                                                overwriteExisting: e.target.checked
                                            }))}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="text-sm text-gray-900 dark:text-white">
                                            Overwrite existing files
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && manifest && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Review Import Configuration
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                        Site Configuration:
                                    </h4>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                        <div>Name: {importOptions.newSiteName}</div>
                                        <div>Domain: {importOptions.newDomain}</div>
                                        <div>PHP: {importOptions.phpVersion}</div>
                                        <div>Server: {importOptions.webServer?.toUpperCase()}</div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                        Import Options:
                                    </h4>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                        <div>Files: {importOptions.importFiles ? 'Yes' : 'No'}</div>
                                        <div>Database: {importOptions.importDatabases ? 'Yes' : 'No'}</div>
                                        <div>Configs: {importOptions.importConfigs ? 'Yes' : 'No'}</div>
                                        <div>Settings: {importOptions.importPressBoxSettings ? 'Yes' : 'No'}</div>
                                        <div>Backup: {importOptions.createBackup ? 'Yes' : 'No'}</div>
                                    </div>
                                </div>
                            </div>

                            {isImporting && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                                        <span className="text-sm text-blue-700 dark:text-blue-300">
                                            {importProgress}
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
                        disabled={step === 1 || isImporting}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>

                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            disabled={isImporting}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        
                        {step === 1 && manifest ? (
                            <button
                                onClick={() => setStep(2)}
                                disabled={isImporting}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                            >
                                Configure Import
                            </button>
                        ) : step === 2 ? (
                            <button
                                onClick={() => setStep(3)}
                                disabled={isImporting}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                            >
                                Review
                            </button>
                        ) : step === 3 ? (
                            <button
                                onClick={handleImport}
                                disabled={isImporting}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                            >
                                {isImporting ? 'Importing...' : 'Start Import'}
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};