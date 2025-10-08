import React, { useState, useEffect, useRef } from 'react';
import {
  XMarkIcon,
  DocumentDuplicateIcon,
  FolderOpenIcon,
  ArrowPathIcon,
  PlayIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface FileEditorProps {
  siteId: string;
  filePath: string;
  onClose: () => void;
}

interface FileContent {
  content: string;
  encoding: string;
  size: number;
  modified: Date;
  readOnly: boolean;
}

export function FileEditor({ siteId, filePath, onClose }: FileEditorProps) {
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [currentContent, setCurrentContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveReload, setLiveReload] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fileName = filePath.split('/').pop() || '';
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

  useEffect(() => {
    loadFileContent();
  }, [siteId, filePath]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Add syntax highlighting classes based on file extension
    textarea.className = `w-full h-full resize-none font-mono text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border-none focus:ring-0 focus:outline-none p-4 ${getSyntaxClass()}`;
  }, [fileExtension]);

  useEffect(() => {
    if (fileContent) {
      setHasChanges(currentContent !== fileContent.content);
    }
  }, [currentContent, fileContent]);

  const loadFileContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const content = await (window.electronAPI as any).files.read({
        siteId,
        filePath
      });
      setFileContent(content);
      setCurrentContent(content.content);
    } catch (error: any) {
      setError(error.message || 'Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const saveFile = async () => {
    if (!hasChanges) return;
    
    setSaving(true);
    setError(null);
    try {
      await (window.electronAPI as any).files.write({
        siteId,
        filePath,
        content: currentContent
      });
      
      // Update file content state
      if (fileContent) {
        setFileContent({
          ...fileContent,
          content: currentContent,
          modified: new Date()
        });
      }
      
      // Trigger live reload if enabled
      if (liveReload && isReloadableFile()) {
        await triggerLiveReload();
      }
    } catch (error: any) {
      setError(error.message || 'Failed to save file');
    } finally {
      setSaving(false);
    }
  };

  const triggerLiveReload = async () => {
    try {
      await (window.electronAPI as any).files.liveReload({
        siteId,
        filePath
      });
    } catch (error) {
      console.warn('Live reload failed:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+S to save
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveFile();
    }
    
    // Tab handling for better code editing
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newContent = currentContent.substring(0, start) + '  ' + currentContent.substring(end);
      setCurrentContent(newContent);
      
      // Restore cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const getSyntaxClass = () => {
    switch (fileExtension) {
      case 'php':
        return 'language-php';
      case 'js':
      case 'jsx':
        return 'language-javascript';
      case 'ts':
      case 'tsx':
        return 'language-typescript';
      case 'css':
        return 'language-css';
      case 'scss':
      case 'sass':
        return 'language-scss';
      case 'html':
        return 'language-html';
      case 'json':
        return 'language-json';
      case 'md':
        return 'language-markdown';
      default:
        return 'language-text';
    }
  };

  const isReloadableFile = () => {
    const reloadableExtensions = ['php', 'css', 'scss', 'js', 'ts'];
    return reloadableExtensions.includes(fileExtension);
  };

  const getFileIcon = () => {
    switch (fileExtension) {
      case 'php':
        return '🐘';
      case 'js':
      case 'jsx':
        return '📜';
      case 'ts':
      case 'tsx':
        return '📘';
      case 'css':
      case 'scss':
        return '🎨';
      case 'html':
        return '🌐';
      case 'json':
        return '📋';
      case 'md':
        return '📝';
      default:
        return '📄';
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < sizes.length - 1) {
      bytes /= 1024;
      i++;
    }
    return `${bytes.toFixed(1)} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <div className="flex items-center space-x-3">
            <div className="spinner w-6 h-6"></div>
            <span className="text-gray-900 dark:text-white">Loading file...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 w-full h-full max-w-6xl max-h-[90vh] m-4 rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getFileIcon()}</span>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {fileName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filePath} • {fileContent && formatFileSize(fileContent.size)}
                {fileContent?.readOnly && ' • Read Only'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isReloadableFile() && (
              <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={liveReload}
                  onChange={(e) => setLiveReload(e.target.checked)}
                  className="rounded"
                />
                <span>Live reload</span>
              </label>
            )}
            
            <button
              onClick={saveFile}
              disabled={!hasChanges || saving || fileContent?.readOnly}
              className={`btn-primary text-sm ${
                !hasChanges || fileContent?.readOnly ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {saving ? (
                <div className="flex items-center space-x-2">
                  <div className="spinner w-4 h-4"></div>
                  <span>Saving...</span>
                </div>
              ) : hasChanges ? (
                <div className="flex items-center space-x-2">
                  <DocumentDuplicateIcon className="w-4 h-4" />
                  <span>Save (Ctrl+S)</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <CheckIcon className="w-4 h-4" />
                  <span>Saved</span>
                </div>
              )}
            </button>
            
            <button
              onClick={loadFileContent}
              className="btn-secondary text-sm"
              title="Reload file"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
            
            <button
              onClick={onClose}
              className="btn-secondary text-sm"
              title="Close"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={currentContent}
            onChange={(e) => setCurrentContent(e.target.value)}
            onKeyDown={handleKeyDown}
            readOnly={fileContent?.readOnly}
            className="w-full h-full resize-none font-mono text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border-none focus:ring-0 focus:outline-none p-4"
            placeholder="Start typing..."
            spellCheck={false}
          />
          
          {/* Status Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gray-100 dark:bg-gray-700 px-4 py-2 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <span>Lines: {currentContent.split('\n').length}</span>
                <span>Characters: {currentContent.length}</span>
                <span>Type: {fileExtension.toUpperCase() || 'Text'}</span>
              </div>
              <div className="flex items-center space-x-4">
                {hasChanges && <span className="text-orange-500">• Modified</span>}
                {fileContent && (
                  <span>
                    Last modified: {new Intl.DateTimeFormat('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }).format(fileContent.modified)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}