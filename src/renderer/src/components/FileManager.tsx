import React, { useState, useEffect } from 'react';
import {
  FolderIcon,
  DocumentIcon,
  CodeBracketIcon,
  PhotoIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  FolderPlusIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  modified?: Date;
  extension?: string;
}

interface FileManagerProps {
  siteId: string;
  currentPath: string;
  onPathChange: (path: string) => void;
}

export function FileManager({ siteId, currentPath, onPathChange }: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showHidden, setShowHidden] = useState(false);

  const pathParts = currentPath.split('/').filter(Boolean);

  useEffect(() => {
    loadFiles();
  }, [currentPath, siteId]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await (window.electronAPI as any).files.list({
        siteId,
        path: currentPath
      });
      setFiles(response.files || []);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') {
      return <FolderIcon className="w-5 h-5 text-blue-500" />;
    }

    const extension = file.extension?.toLowerCase();
    switch (extension) {
      case 'php':
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'css':
      case 'scss':
      case 'html':
      case 'json':
        return <CodeBracketIcon className="w-5 h-5 text-green-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
      case 'webp':
        return <PhotoIcon className="w-5 h-5 text-purple-500" />;
      default:
        return <DocumentIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'folder') {
      const newPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      onPathChange(newPath);
    } else {
      // Open file for editing
      handleEditFile(file);
    }
  };

  const handleEditFile = async (file: FileItem) => {
    try {
      await (window.electronAPI as any).files.openEditor({
        siteId,
        filePath: file.path
      });
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const handleCreateFile = async () => {
    const fileName = prompt('Enter file name:');
    if (!fileName) return;

    try {
      await (window.electronAPI as any).files.create({
        siteId,
        path: currentPath,
        fileName
      });
      loadFiles();
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  };

  const handleCreateFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    try {
      await (window.electronAPI as any).files.createFolder({
        siteId,
        path: currentPath,
        folderName
      });
      loadFiles();
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleDeleteFiles = async () => {
    if (selectedFiles.length === 0) return;
    
    const confirmed = confirm(`Delete ${selectedFiles.length} item(s)?`);
    if (!confirmed) return;

    try {
      await (window.electronAPI as any).files.delete({
        siteId,
        files: selectedFiles
      });
      setSelectedFiles([]);
      loadFiles();
    } catch (error) {
      console.error('Failed to delete files:', error);
    }
  };

  const handleUploadFiles = async () => {
    try {
      const result = await (window.electronAPI as any).files.upload({
        siteId,
        targetPath: currentPath
      });
      if (result.success) {
        loadFiles();
      }
    } catch (error) {
      console.error('Failed to upload files:', error);
    }
  };

  const filteredFiles = files.filter(file => {
    if (!showHidden && file.name.startsWith('.')) return false;
    if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < sizes.length - 1) {
      bytes /= 1024;
      i++;
    }
    return `${bytes.toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            File Manager
          </h3>
          
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => onPathChange('/')}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Root
            </button>
            {pathParts.map((part, index) => (
              <React.Fragment key={index}>
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => onPathChange('/' + pathParts.slice(0, index + 1).join('/'))}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {part}
                </button>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCreateFile}
            className="btn-secondary text-sm"
            title="New File"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleCreateFolder}
            className="btn-secondary text-sm"
            title="New Folder"
          >
            <FolderPlusIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleUploadFiles}
            className="btn-secondary text-sm"
            title="Upload Files"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
          </button>
          {selectedFiles.length > 0 && (
            <button
              onClick={handleDeleteFiles}
              className="btn-danger text-sm"
              title="Delete Selected"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search and Options */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={showHidden}
                onChange={(e) => setShowHidden(e.target.checked)}
                className="rounded"
              />
              <span>Show hidden</span>
            </label>
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="spinner w-6 h-6"></div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredFiles.map((file) => (
              <div
                key={file.path}
                className={`flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                  selectedFiles.includes(file.path) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
                onClick={() => handleFileClick(file)}
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.path)}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (e.target.checked) {
                      setSelectedFiles([...selectedFiles, file.path]);
                    } else {
                      setSelectedFiles(selectedFiles.filter(f => f !== file.path));
                    }
                  }}
                  className="mr-3"
                />
                
                <div className="mr-3">
                  {getFileIcon(file)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center space-x-2 ml-4">
                      {file.type === 'file' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditFile(file);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="Edit"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle file preview
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="Preview"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatFileSize(file.size)}</span>
                    <span>{formatDate(file.modified)}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredFiles.length === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No files found matching your search' : 'No files in this directory'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}