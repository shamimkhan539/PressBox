import React, { useState, useEffect } from 'react';

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autoStart: boolean;
  notifications: boolean;
  dockerAutoStart: boolean;
  defaultPHPVersion: string;
  defaultWordPressVersion: string;
}

/**
 * Settings Page Component
 * 
 * Manages application settings and preferences.
 */
export function Settings() {
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'system',
    autoStart: false,
    notifications: true,
    dockerAutoStart: false,
    defaultPHPVersion: '8.1',
    defaultWordPressVersion: '6.3'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load individual settings
      const [theme, autoStart, notifications, dockerAutoStart, defaultPHP, defaultWP] = await Promise.all([
        window.electronAPI.settings.get('theme'),
        window.electronAPI.settings.get('autoStart'),
        window.electronAPI.settings.get('notifications'),
        window.electronAPI.settings.get('dockerAutoStart'),
        window.electronAPI.settings.get('defaultPHPVersion'),
        window.electronAPI.settings.get('defaultWordPressVersion')
      ]);

      setSettings({
        theme: theme || 'system',
        autoStart: autoStart || false,
        notifications: notifications !== false, // Default to true
        dockerAutoStart: dockerAutoStart || false,
        defaultPHPVersion: defaultPHP || '8.1',
        defaultWordPressVersion: defaultWP || '6.3'
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof AppSettings, value: any) => {
    try {
      setSaving(true);
      setSettings(prev => ({ ...prev, [key]: value }));
      await window.electronAPI.settings.set(key, value);
    } catch (error) {
      console.error('Failed to save setting:', error);
      // Revert the change if save failed
      loadSettings();
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    if (!confirm('Are you sure you want to reset all settings to default values?')) {
      return;
    }

    const defaultSettings: AppSettings = {
      theme: 'system',
      autoStart: false,
      notifications: true,
      dockerAutoStart: false,
      defaultPHPVersion: '8.1',
      defaultWordPressVersion: '6.3'
    };

    try {
      setSaving(true);
      
      // Save all default settings
      for (const [key, value] of Object.entries(defaultSettings)) {
        await window.electronAPI.settings.set(key, value);
      }
      
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Failed to reset settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="spinner w-8 h-8"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Customize PressBox to fit your development workflow
        </p>
      </div>

      <div className="space-y-8">
        {/* Appearance Settings */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Appearance
          </h2>
          <div className="space-y-4">
            <div>
              <label className="form-label">Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => updateSetting('theme', e.target.value as 'light' | 'dark' | 'system')}
                className="form-input"
                disabled={saving}
              >
                <option value="system">System Default</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Choose your preferred color scheme or follow system settings
              </p>
            </div>
          </div>
        </div>

        {/* Application Settings */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Application
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-900 dark:text-white">Auto-start PressBox</label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Launch PressBox automatically when your computer starts
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoStart}
                  onChange={(e) => updateSetting('autoStart', e.target.checked)}
                  className="sr-only peer"
                  disabled={saving}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-900 dark:text-white">Enable Notifications</label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Show desktop notifications for site status changes and updates
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => updateSetting('notifications', e.target.checked)}
                  className="sr-only peer"
                  disabled={saving}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Docker Settings */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Docker Integration
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-900 dark:text-white">Auto-start Docker</label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically start Docker Desktop when launching PressBox
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.dockerAutoStart}
                  onChange={(e) => updateSetting('dockerAutoStart', e.target.checked)}
                  className="sr-only peer"
                  disabled={saving}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Development Defaults */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Development Defaults
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Default PHP Version</label>
              <select
                value={settings.defaultPHPVersion}
                onChange={(e) => updateSetting('defaultPHPVersion', e.target.value)}
                className="form-input"
                disabled={saving}
              >
                <option value="7.4">PHP 7.4</option>
                <option value="8.0">PHP 8.0</option>
                <option value="8.1">PHP 8.1</option>
                <option value="8.2">PHP 8.2</option>
                <option value="8.3">PHP 8.3</option>
              </select>
            </div>

            <div>
              <label className="form-label">Default WordPress Version</label>
              <select
                value={settings.defaultWordPressVersion}
                onChange={(e) => updateSetting('defaultWordPressVersion', e.target.value)}
                className="form-input"
                disabled={saving}
              >
                <option value="6.0">WordPress 6.0</option>
                <option value="6.1">WordPress 6.1</option>
                <option value="6.2">WordPress 6.2</option>
                <option value="6.3">WordPress 6.3</option>
                <option value="latest">Latest Version</option>
              </select>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            These versions will be pre-selected when creating new WordPress sites
          </p>
        </div>

        {/* Reset Settings */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Reset Settings
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400">
                Reset all settings to their default values. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={resetSettings}
              className="btn-danger"
              disabled={saving}
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>

      {/* Save Status */}
      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
          <div className="spinner w-4 h-4 mr-2"></div>
          Saving settings...
        </div>
      )}
    </div>
  );
}