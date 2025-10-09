import React, { useState, useEffect } from 'react';
import { 
  ArchiveBoxIcon,
  ClockIcon,
  CalendarIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  TrashIcon,
  Cog6ToothIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  DocumentIcon,
  CircleStackIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

interface BackupJob {
  id: string;
  name: string;
  type: 'full' | 'database' | 'files';
  frequency: 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  time?: string;
  isActive: boolean;
  lastRun?: string;
  nextRun?: string;
  retention: number; // days
  destination: 'local' | 'cloud' | 'ftp';
  includeDatabase: boolean;
  includeFiles: boolean;
  includeUploads: boolean;
  includePlugins: boolean;
  includeThemes: boolean;
  excludePaths: string[];
}

interface BackupRecord {
  id: string;
  name: string;
  jobId: string;
  type: 'full' | 'database' | 'files';
  size: string;
  createdAt: string;
  status: 'completed' | 'running' | 'failed' | 'cancelled';
  duration: string;
  filePath: string;
  canRestore: boolean;
}

interface BackupManagerProps {
  siteId: string;
  siteName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BackupManager({ siteId, siteName, isOpen, onClose }: BackupManagerProps) {
  const [activeTab, setActiveTab] = useState<'backups' | 'jobs' | 'settings' | 'restore'>('backups');
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [backupRecords, setBackupRecords] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);

  // Mock backup jobs
  const mockBackupJobs: BackupJob[] = [
    {
      id: '1',
      name: 'Daily Full Backup',
      type: 'full',
      frequency: 'daily',
      time: '02:00',
      isActive: true,
      lastRun: '2024-10-09 02:00:00',
      nextRun: '2024-10-10 02:00:00',
      retention: 30,
      destination: 'local',
      includeDatabase: true,
      includeFiles: true,
      includeUploads: true,
      includePlugins: true,
      includeThemes: true,
      excludePaths: ['cache', 'logs']
    },
    {
      id: '2',
      name: 'Weekly Database Backup',
      type: 'database',
      frequency: 'weekly',
      time: '01:00',
      isActive: true,
      lastRun: '2024-10-07 01:00:00',
      nextRun: '2024-10-14 01:00:00',
      retention: 90,
      destination: 'cloud',
      includeDatabase: true,
      includeFiles: false,
      includeUploads: false,
      includePlugins: false,
      includeThemes: false,
      excludePaths: []
    }
  ];

  // Mock backup records
  const mockBackupRecords: BackupRecord[] = [
    {
      id: '1',
      name: 'backup_2024-10-09_02-00-00_full.zip',
      jobId: '1',
      type: 'full',
      size: '245.8 MB',
      createdAt: '2024-10-09 02:00:00',
      status: 'completed',
      duration: '3m 24s',
      filePath: '/backups/backup_2024-10-09_02-00-00_full.zip',
      canRestore: true
    },
    {
      id: '2',
      name: 'backup_2024-10-08_02-00-00_full.zip',
      jobId: '1',
      type: 'full',
      size: '243.2 MB',
      createdAt: '2024-10-08 02:00:00',
      status: 'completed',
      duration: '3m 18s',
      filePath: '/backups/backup_2024-10-08_02-00-00_full.zip',
      canRestore: true
    },
    {
      id: '3',
      name: 'backup_2024-10-07_01-00-00_database.sql',
      jobId: '2',
      type: 'database',
      size: '12.4 MB',
      createdAt: '2024-10-07 01:00:00',
      status: 'completed',
      duration: '45s',
      filePath: '/backups/backup_2024-10-07_01-00-00_database.sql',
      canRestore: true
    },
    {
      id: '4',
      name: 'backup_2024-10-07_02-00-00_full.zip',
      jobId: '1',
      type: 'full',
      size: '241.1 MB',
      createdAt: '2024-10-07 02:00:00',
      status: 'failed',
      duration: '1m 12s',
      filePath: '',
      canRestore: false
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setTimeout(() => {
        setBackupJobs(mockBackupJobs);
        setBackupRecords(mockBackupRecords);
        setLoading(false);
      }, 800);
    }
  }, [isOpen]);

  const createManualBackup = async (type: 'full' | 'database' | 'files') => {
    setIsCreatingBackup(true);
    // Simulate backup creation
    setTimeout(() => {
      const newBackup: BackupRecord = {
        id: Date.now().toString(),
        name: `manual_backup_${Date.now()}_${type}.${type === 'database' ? 'sql' : 'zip'}`,
        jobId: 'manual',
        type,
        size: type === 'database' ? '12.7 MB' : '248.5 MB',
        createdAt: new Date().toISOString().replace('T', ' ').split('.')[0],
        status: 'completed',
        duration: type === 'database' ? '52s' : '3m 35s',
        filePath: `/backups/manual_backup_${Date.now()}_${type}.${type === 'database' ? 'sql' : 'zip'}`,
        canRestore: true
      };
      setBackupRecords(prev => [newBackup, ...prev]);
      setIsCreatingBackup(false);
    }, 3000);
  };

  const toggleJob = (jobId: string) => {
    setBackupJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, isActive: !job.isActive } : job
    ));
  };

  const deleteBackup = (backupId: string) => {
    setBackupRecords(prev => prev.filter(backup => backup.id !== backupId));
  };

  const restoreBackup = (backup: BackupRecord) => {
    console.log(`Restoring backup: ${backup.name}`);
    // Implement restore logic
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <ArchiveBoxIcon className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Backup Manager
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {siteName} - Automated Backup & Restore System
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <span className="sr-only">Close</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Quick Backup</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Create an immediate backup of your site</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => createManualBackup('database')}
                  disabled={isCreatingBackup}
                  className="btn-outline flex items-center text-sm"
                >
                  <CircleStackIcon className="w-4 h-4 mr-2" />
                  Database Only
                </button>
                <button
                  onClick={() => createManualBackup('files')}
                  disabled={isCreatingBackup}
                  className="btn-outline flex items-center text-sm"
                >
                  <FolderIcon className="w-4 h-4 mr-2" />
                  Files Only
                </button>
                <button
                  onClick={() => createManualBackup('full')}
                  disabled={isCreatingBackup}
                  className="btn-primary flex items-center text-sm"
                >
                  {isCreatingBackup ? (
                    <div className="spinner w-4 h-4 mr-2"></div>
                  ) : (
                    <ArchiveBoxIcon className="w-4 h-4 mr-2" />
                  )}
                  Full Backup
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'backups', label: 'Backup History', count: backupRecords.length },
                { id: 'jobs', label: 'Scheduled Jobs', count: backupJobs.length },
                { id: 'restore', label: 'Restore', count: null },
                { id: 'settings', label: 'Settings', count: null }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600 dark:text-green-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Backup History Tab */}
          {activeTab === 'backups' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="spinner w-8 h-8 mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {backupRecords.map((backup) => (
                    <div key={backup.id} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {backup.type === 'full' && <ArchiveBoxIcon className="w-6 h-6 text-blue-500" />}
                            {backup.type === 'database' && <CircleStackIcon className="w-6 h-6 text-green-500" />}
                            {backup.type === 'files' && <FolderIcon className="w-6 h-6 text-purple-500" />}
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {backup.name}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <span>{backup.size}</span>
                              <span>•</span>
                              <span>{backup.createdAt}</span>
                              <span>•</span>
                              <span>Duration: {backup.duration}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            backup.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            backup.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {backup.status === 'completed' && <CheckCircleIcon className="w-3 h-3 mr-1" />}
                            {backup.status === 'failed' && <ExclamationCircleIcon className="w-3 h-3 mr-1" />}
                            {backup.status}
                          </span>
                          
                          {backup.canRestore && (
                            <button
                              onClick={() => restoreBackup(backup)}
                              className="btn-primary text-sm px-3 py-1"
                            >
                              Restore
                            </button>
                          )}
                          
                          <button className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400">
                            <CloudArrowDownIcon className="w-4 h-4" />
                          </button>
                          
                          <button 
                            onClick={() => deleteBackup(backup.id)}
                            className="p-2 text-red-600 hover:text-red-800 dark:text-red-400"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Scheduled Jobs Tab */}
          {activeTab === 'jobs' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">Backup Schedules</h4>
                <button
                  onClick={() => setShowJobModal(true)}
                  className="btn-primary"
                >
                  Create New Job
                </button>
              </div>
              
              <div className="space-y-4">
                {backupJobs.map((job) => (
                  <div key={job.id} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                            {job.name}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            job.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}>
                            {job.isActive ? 'Active' : 'Paused'}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            job.type === 'full' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            job.type === 'database' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          }`}>
                            {job.type}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Frequency:</span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                              {job.frequency} {job.time && `at ${job.time}`}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Last Run:</span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                              {job.lastRun || 'Never'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Next Run:</span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                              {job.nextRun || 'Not scheduled'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                          Retention: {job.retention} days • Destination: {job.destination}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-6">
                        <button
                          onClick={() => toggleJob(job.id)}
                          className={`p-2 rounded ${
                            job.isActive 
                              ? 'text-yellow-600 hover:text-yellow-800 dark:text-yellow-400'
                              : 'text-green-600 hover:text-green-800 dark:text-green-400'
                          }`}
                        >
                          {job.isActive ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                        </button>
                        
                        <button className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400">
                          <ArrowPathIcon className="w-5 h-5" />
                        </button>
                        
                        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <Cog6ToothIcon className="w-5 h-5" />
                        </button>
                        
                        <button className="p-2 text-red-600 hover:text-red-800 dark:text-red-400">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Restore Tab */}
          {activeTab === 'restore' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex">
                  <ExclamationCircleIcon className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Important Restore Information</h4>
                    <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                      Restoring a backup will replace all current site data. This action cannot be undone. 
                      We recommend creating a backup before proceeding with a restore operation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Available Backups</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {backupRecords.filter(backup => backup.canRestore).map((backup) => (
                      <div key={backup.id} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white">{backup.name}</h5>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {backup.createdAt} • {backup.size}
                            </p>
                          </div>
                          <button
                            onClick={() => restoreBackup(backup)}
                            className="btn-primary text-sm"
                          >
                            Select
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Restore Options</h4>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Restore database</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Restore files</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded" />
                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Restore uploads</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded" />
                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Restore plugins</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded" />
                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Restore themes</span>
                      </label>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-3">Before Restore</h5>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                          Create backup before restore
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">General Settings</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Default Backup Location
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option value="local">Local Storage</option>
                      <option value="cloud">Cloud Storage</option>
                      <option value="ftp">FTP Server</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Default Retention Period
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option value="7">7 days</option>
                      <option value="30">30 days</option>
                      <option value="90">90 days</option>
                      <option value="365">1 year</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notifications</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      Email notifications for backup completion
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      Email notifications for backup failures
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      Daily backup status summary
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}