import React, { useState } from 'react';

interface CreateSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSiteCreated: () => void;
}

export function CreateSiteModal({ isOpen, onClose, onSiteCreated }: CreateSiteModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    phpVersion: '8.1',
    wordPressVersion: '6.3'
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Site name is required');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const result = await window.electronAPI.sites.create({
        name: formData.name.trim(),
        domain: formData.domain.trim() || `${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.local`,
        phpVersion: formData.phpVersion,
        wordPressVersion: formData.wordPressVersion
      });

      if ((result as any).success) {
        setFormData({ name: '', domain: '', phpVersion: '8.1', wordPressVersion: '6.3' });
        onSiteCreated();
        onClose();
      } else {
        setError((result as any).error || 'Failed to create site');
      }
    } catch (error) {
      setError('Failed to create site. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transform scale-100 opacity-100 transition-all duration-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Create New WordPress Site
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={creating}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Site Name */}
            <div>
              <label className="form-label">Site Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="form-input"
                placeholder="My Awesome Site"
                disabled={creating}
                required
              />
            </div>

            {/* Domain */}
            <div>
              <label className="form-label">Local Domain</label>
              <input
                type="text"
                value={formData.domain}
                onChange={(e) => handleInputChange('domain', e.target.value)}
                className="form-input"
                placeholder="mysite.local"
                disabled={creating}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave empty to auto-generate from site name
              </p>
            </div>

            {/* PHP Version */}
            <div>
              <label className="form-label">PHP Version</label>
              <select
                value={formData.phpVersion}
                onChange={(e) => handleInputChange('phpVersion', e.target.value)}
                className="form-input"
                disabled={creating}
              >
                <option value="7.4">PHP 7.4</option>
                <option value="8.0">PHP 8.0</option>
                <option value="8.1">PHP 8.1</option>
                <option value="8.2">PHP 8.2</option>
                <option value="8.3">PHP 8.3</option>
              </select>
            </div>

            {/* WordPress Version */}
            <div>
              <label className="form-label">WordPress Version</label>
              <select
                value={formData.wordPressVersion}
                onChange={(e) => handleInputChange('wordPressVersion', e.target.value)}
                className="form-input"
                disabled={creating}
              >
                <option value="6.0">WordPress 6.0</option>
                <option value="6.1">WordPress 6.1</option>
                <option value="6.2">WordPress 6.2</option>
                <option value="6.3">WordPress 6.3</option>
                <option value="latest">Latest Version</option>
              </select>
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
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={creating || !formData.name.trim()}
              >
                {creating ? (
                  <span className="flex items-center justify-center">
                    <div className="spinner w-4 h-4 mr-2"></div>
                    Creating...
                  </span>
                ) : (
                  'Create Site'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}