import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  ComputerDesktopIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { WordPressSite } from '../../../shared/types';

interface HostsManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HostEntry {
  id: string;
  ip: string;
  hostname: string;
  comment: string;
  enabled: boolean;
  isWordPress: boolean;
  siteId?: string;
  lastModified: string;
}

const mockHostEntries: HostEntry[] = [
  {
    id: '1',
    ip: '127.0.0.1',
    hostname: 'myblog.local',
    comment: 'PressBox - My Blog',
    enabled: true,
    isWordPress: true,
    siteId: '1',
    lastModified: '2024-10-09T10:30:00Z'
  },
  {
    id: '2',
    ip: '127.0.0.1',
    hostname: 'portfolio.local',
    comment: 'PressBox - Portfolio Site',
    enabled: true,
    isWordPress: true,
    siteId: '2',
    lastModified: '2024-10-09T11:15:00Z'
  },
  {
    id: '3',
    ip: '127.0.0.1',
    hostname: 'store.local',
    comment: 'PressBox - E-commerce Store',
    enabled: false,
    isWordPress: true,
    siteId: '3',
    lastModified: '2024-10-09T12:00:00Z'
  },
  {
    id: '4',
    ip: '127.0.0.1',
    hostname: 'api.test',
    comment: 'Local API Development',
    enabled: true,
    isWordPress: false,
    lastModified: '2024-10-08T16:45:00Z'
  },
  {
    id: '5',
    ip: '192.168.1.100',
    hostname: 'dev.company.com',
    comment: 'Company Development Server',
    enabled: true,
    isWordPress: false,
    lastModified: '2024-10-07T09:20:00Z'
  }
];

export function HostsManager({ isOpen, onClose }: HostsManagerProps) {
  const [hostEntries, setHostEntries] = useState<HostEntry[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEntry, setEditingEntry] = useState<HostEntry | null>(null);
  const [newEntry, setNewEntry] = useState({
    ip: '127.0.0.1',
    hostname: '',
    comment: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'wordpress' | 'custom'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const [lastBackup, setLastBackup] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadHostsData();
    }
  }, [isOpen]);

  const loadHostsData = async () => {
    setIsLoading(true);
    try {
      const [entries, stats] = await Promise.all([
        window.electronAPI.hosts.list(),
        window.electronAPI.hosts.getStats()
      ]);
      
      setHostEntries(entries.map((entry, index) => ({
        ...entry,
        id: entry.id || index.toString(),
        lastModified: entry.lastModified || new Date().toISOString()
      })));
      
      setHasBackup(stats.hasBackup);
      setLastBackup(stats.lastModified.toString());
    } catch (error) {
      console.error('Failed to load hosts data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredEntries = hostEntries.filter(entry => {
    const matchesSearch = entry.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.ip.includes(searchQuery);
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'wordpress' && entry.isWordPress) ||
                         (filterType === 'custom' && !entry.isWordPress);
    
    return matchesSearch && matchesFilter;
  });

  const handleAddEntry = async () => {
    if (!newEntry.hostname || !newEntry.ip) return;
    
    try {
      setIsLoading(true);
      await window.electronAPI.hosts.add({
        ip: newEntry.ip,
        hostname: newEntry.hostname,
        comment: newEntry.comment || 'Added by PressBox'
      });
      
      setNewEntry({ ip: '127.0.0.1', hostname: '', comment: '' });
      setShowAddForm(false);
      await loadHostsData();
    } catch (error) {
      console.error('Failed to add hosts entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEntry = (entry: HostEntry) => {
    setEditingEntry({ ...entry });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    
    try {
      setIsLoading(true);
      // Remove old entry and add new one
      const originalEntry = hostEntries.find(e => e.id === editingEntry.id);
      if (originalEntry) {
        await window.electronAPI.hosts.remove(originalEntry.hostname);
      }
      
      await window.electronAPI.hosts.add({
        ip: editingEntry.ip,
        hostname: editingEntry.hostname,
        comment: editingEntry.comment,
        isWordPress: editingEntry.isWordPress,
        siteId: editingEntry.siteId
      });
      
      setIsEditing(false);
      setEditingEntry(null);
      await loadHostsData();
    } catch (error) {
      console.error('Failed to update hosts entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this hosts entry?')) return;
    
    try {
      setIsLoading(true);
      const entry = hostEntries.find(e => e.id === id);
      if (entry) {
        await window.electronAPI.hosts.remove(entry.hostname);
        await loadHostsData();
      }
    } catch (error) {
      console.error('Failed to delete hosts entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEntry = async (id: string) => {
    try {
      const entry = hostEntries.find(e => e.id === id);
      if (entry) {
        setIsLoading(true);
        await window.electronAPI.hosts.toggle(entry.hostname, !entry.enabled);
        await loadHostsData();
      }
    } catch (error) {
      console.error('Failed to toggle hosts entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshHosts = async () => {
    await loadHostsData();
  };

  const handleBackupHosts = async () => {
    try {
      setIsLoading(true);
      await window.electronAPI.hosts.backup();
      await loadHostsData();
    } catch (error) {
      console.error('Failed to backup hosts file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreHosts = async () => {
    if (!window.confirm('Are you sure you want to restore hosts file from backup? This will overwrite current entries.')) return;
    
    try {
      setIsLoading(true);
      await window.electronAPI.hosts.restore();
      await loadHostsData();
    } catch (error) {
      console.error('Failed to restore hosts file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (enabled: boolean) => {
    return enabled 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  const wordpressEntries = hostEntries.filter(entry => entry.isWordPress);
  const customEntries = hostEntries.filter(entry => !entry.isWordPress);
  const enabledEntries = hostEntries.filter(entry => entry.enabled);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
              <ComputerDesktopIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Hosts File Manager</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage Windows hosts file entries (C:\Windows\System32\drivers\etc\hosts)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
          >
            <XMarkIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{hostEntries.length}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Entries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{enabledEntries.length}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{wordpressEntries.length}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">WordPress Sites</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${hasBackup ? 'text-green-600' : 'text-red-600'}`}>
                {hasBackup ? 'Yes' : 'No'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Backup Available</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search hosts entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <GlobeAltIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Entries</option>
                <option value="wordpress">WordPress Sites</option>
                <option value="custom">Custom Entries</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center space-x-2"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add Entry</span>
              </button>
              
              <button
                onClick={handleRefreshHosts}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-sm flex items-center space-x-2 disabled:opacity-50"
              >
                <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={handleBackupHosts}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center space-x-2 disabled:opacity-50"
              >
                <DocumentTextIcon className="w-4 h-4" />
                <span>Backup</span>
              </button>
              
              {hasBackup && (
                <button
                  onClick={handleRestoreHosts}
                  disabled={isLoading}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm flex items-center space-x-2 disabled:opacity-50"
                >
                  <ClockIcon className="w-4 h-4" />
                  <span>Restore</span>
                </button>
              )}
            </div>
          </div>

          {/* Backup Info */}
          {hasBackup && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-blue-700 dark:text-blue-300">
                <DocumentTextIcon className="w-4 h-4" />
                <span>
                  Last backup: {new Date(lastBackup).toLocaleString()} 
                  <span className="ml-2 text-blue-600 dark:text-blue-400">
                    ({hostEntries.length} entries backed up)
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Add Entry Form */}
        {showAddForm && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add New Hosts Entry</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  IP Address *
                </label>
                <input
                  type="text"
                  value={newEntry.ip}
                  onChange={(e) => setNewEntry({...newEntry, ip: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="127.0.0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hostname *
                </label>
                <input
                  type="text"
                  value={newEntry.hostname}
                  onChange={(e) => setNewEntry({...newEntry, hostname: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="example.local"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Comment
                </label>
                <input
                  type="text"
                  value={newEntry.comment}
                  onChange={(e) => setNewEntry({...newEntry, comment: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Description (optional)"
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEntry}
                disabled={!newEntry.hostname || !newEntry.ip}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Entry
              </button>
            </div>
          </div>
        )}

        {/* Hosts Entries List */}
        <div className="flex-1 overflow-auto">
          <div className="bg-white dark:bg-gray-800">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">IP Address</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Hostname</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Comment</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Modified</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleEntry(entry.id)}
                        className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(entry.enabled)}`}
                      >
                        {entry.enabled ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">
                      {entry.ip}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                      {entry.hostname}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {entry.comment}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {entry.isWordPress ? (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                          WordPress
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-full">
                          Custom
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(entry.lastModified).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditEntry(entry)}
                          className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Edit Entry"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete Entry"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredEntries.length === 0 && (
              <div className="text-center py-12">
                <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hosts entries found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery || filterType !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Add your first hosts entry to get started'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Edit Modal */}
        {isEditing && editingEntry && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Edit Hosts Entry
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    IP Address
                  </label>
                  <input
                    type="text"
                    value={editingEntry.ip}
                    onChange={(e) => setEditingEntry({...editingEntry, ip: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hostname
                  </label>
                  <input
                    type="text"
                    value={editingEntry.hostname}
                    onChange={(e) => setEditingEntry({...editingEntry, hostname: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Comment
                  </label>
                  <input
                    type="text"
                    value={editingEntry.comment}
                    onChange={(e) => setEditingEntry({...editingEntry, comment: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 mt-6">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditingEntry(null);
                  }}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}