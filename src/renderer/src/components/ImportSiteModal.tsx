import React, { useState } from 'react';

interface ImportSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSiteImported: () => void;
}

export function ImportSiteModal({ isOpen, onClose, onSiteImported }: ImportSiteModalProps) {
  const [importPath, setImportPath] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importPath.trim()) {
      setError('Please enter a valid path');
      return;
    }

    try {
      setImporting(true);
      setError(null);

      const result = await window.electronAPI.sites.import(importPath.trim());

      if ((result as any).success) {
        setImportPath('');
        onSiteImported();
        onClose();
      } else {
        setError((result as any).error || 'Failed to import site');
      }
    } catch (error) {
      setError('Failed to import site. Please check the path and try again.');
    } finally {
      setImporting(false);
    }
  };

  const handleBrowse = () => {
    // Simulate file dialog - in a real app, you'd use electron's dialog
    const mockPath = `C:\\Users\\${process.env.USERNAME || 'User'}\\Sites\\wordpress-site`;
    setImportPath(mockPath);
    if (error) setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full transform scale-100 opacity-100 transition-all duration-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Import Existing Site
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={importing}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Info */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Import an existing WordPress site from your local filesystem. The site folder should contain WordPress files.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Path Input */}
            <div>
              <label className="form-label">Site Path *</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={importPath}
                  onChange={(e) => {
                    setImportPath(e.target.value);
                    if (error) setError(null);
                  }}
                  className="form-input flex-1"
                  placeholder="C:\Users\Username\Sites\my-wordpress-site"
                  disabled={importing}
                  required
                />
                <button
                  type="button"
                  onClick={handleBrowse}
                  className="btn-secondary px-3"
                  disabled={importing}
                >
                  Browse
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Select the folder containing your WordPress installation
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
                disabled={importing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={importing || !importPath.trim()}
              >
                {importing ? (
                  <span className="flex items-center justify-center">
                    <div className="spinner w-4 h-4 mr-2"></div>
                    Importing...
                  </span>
                ) : (
                  'Import Site'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}