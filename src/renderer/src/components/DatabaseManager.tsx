import React, { useState, useEffect } from 'react';
import { 
  CircleStackIcon,
  TableCellsIcon,
  CodeBracketIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

interface DatabaseTable {
  name: string;
  rows: number;
  size: string;
  engine: string;
  collation: string;
  created: string;
}

interface DatabaseManagerProps {
  siteId: string;
  siteName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DatabaseManager({ siteId, siteName, isOpen, onClose }: DatabaseManagerProps) {
  const [activeTab, setActiveTab] = useState<'tables' | 'query' | 'backup' | 'import'>('tables');
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM wp_posts LIMIT 10;');
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // Mock data for WordPress tables
  const mockTables: DatabaseTable[] = [
    { name: 'wp_posts', rows: 145, size: '2.1 MB', engine: 'InnoDB', collation: 'utf8mb4_unicode_ci', created: '2024-01-15' },
    { name: 'wp_postmeta', rows: 432, size: '1.8 MB', engine: 'InnoDB', collation: 'utf8mb4_unicode_ci', created: '2024-01-15' },
    { name: 'wp_users', rows: 12, size: '16 KB', engine: 'InnoDB', collation: 'utf8mb4_unicode_ci', created: '2024-01-15' },
    { name: 'wp_usermeta', rows: 156, size: '48 KB', engine: 'InnoDB', collation: 'utf8mb4_unicode_ci', created: '2024-01-15' },
    { name: 'wp_terms', rows: 28, size: '12 KB', engine: 'InnoDB', collation: 'utf8mb4_unicode_ci', created: '2024-01-15' },
    { name: 'wp_term_taxonomy', rows: 28, size: '8 KB', engine: 'InnoDB', collation: 'utf8mb4_unicode_ci', created: '2024-01-15' },
    { name: 'wp_term_relationships', rows: 78, size: '24 KB', engine: 'InnoDB', collation: 'utf8mb4_unicode_ci', created: '2024-01-15' },
    { name: 'wp_comments', rows: 89, size: '156 KB', engine: 'InnoDB', collation: 'utf8mb4_unicode_ci', created: '2024-01-15' },
    { name: 'wp_commentmeta', rows: 23, size: '8 KB', engine: 'InnoDB', collation: 'utf8mb4_unicode_ci', created: '2024-01-15' },
    { name: 'wp_options', rows: 278, size: '892 KB', engine: 'InnoDB', collation: 'utf8mb4_unicode_ci', created: '2024-01-15' }
  ];

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      // Simulate loading tables
      setTimeout(() => {
        setTables(mockTables);
        setLoading(false);
      }, 800);
    }
  }, [isOpen]);

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const executeQuery = async () => {
    setLoading(true);
    // Simulate query execution
    setTimeout(() => {
      const mockResults = [
        { ID: 1, post_title: 'Hello World!', post_status: 'publish', post_date: '2024-01-15 10:30:00' },
        { ID: 2, post_title: 'Sample Page', post_status: 'publish', post_date: '2024-01-16 14:20:00' },
        { ID: 3, post_title: 'Privacy Policy', post_status: 'draft', post_date: '2024-01-17 09:15:00' }
      ];
      setQueryResults(mockResults);
      setLoading(false);
    }, 1000);
  };

  const exportTable = (tableName: string) => {
    console.log(`Exporting table: ${tableName}`);
    // Implement table export logic
  };

  const optimizeTable = (tableName: string) => {
    console.log(`Optimizing table: ${tableName}`);
    // Implement table optimization logic
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <CircleStackIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Database Manager
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {siteName} - MySQL Database Tools
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

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'tables', label: 'Tables', icon: TableCellsIcon },
                { id: 'query', label: 'SQL Query', icon: CodeBracketIcon },
                { id: 'backup', label: 'Backup', icon: ArrowDownTrayIcon },
                { id: 'import', label: 'Import', icon: ArrowUpTrayIcon }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tables Tab */}
          {activeTab === 'tables' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tables..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <button className="btn-primary flex items-center">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Table
                </button>
              </div>

              <div className="bg-white dark:bg-gray-900 shadow overflow-hidden sm:rounded-md">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Table Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Rows
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Engine
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center">
                          <div className="spinner w-6 h-6 mx-auto"></div>
                        </td>
                      </tr>
                    ) : (
                      filteredTables.map((table) => (
                        <tr key={table.name} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <TableCellsIcon className="w-5 h-5 text-blue-500 mr-3" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {table.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {table.rows.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {table.size}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {table.engine}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => setSelectedTable(table.name)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => exportTable(table.name)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400"
                            >
                              <ArrowDownTrayIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => optimizeTable(table.name)}
                              className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400"
                            >
                              <DocumentDuplicateIcon className="w-4 h-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900 dark:text-red-400">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SQL Query Tab */}
          {activeTab === 'query' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SQL Query
                </label>
                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  placeholder="Enter your SQL query..."
                />
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={executeQuery}
                  className="btn-primary flex items-center"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="spinner w-4 h-4 mr-2"></div>
                  ) : (
                    <CodeBracketIcon className="w-4 h-4 mr-2" />
                  )}
                  Execute Query
                </button>
                
                <div className="space-x-2">
                  <button className="btn-outline">Save Query</button>
                  <button className="btn-outline">Load Query</button>
                </div>
              </div>

              {queryResults.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Query Results ({queryResults.length} rows)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          {Object.keys(queryResults[0] || {}).map((key) => (
                            <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {queryResults.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            {Object.values(row).map((value: any, cellIndex) => (
                              <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Backup Tab */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Database Backup</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Create a complete backup of your WordPress database. All tables and data will be exported to an SQL file.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h5 className="font-medium text-gray-900 dark:text-white">Backup Options</h5>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Include all tables</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Include table structure</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Include data</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded" />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Compress backup</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="font-medium text-gray-900 dark:text-white">Recent Backups</h5>
                  
                  <div className="space-y-2">
                    {[
                      { name: 'backup_2024-10-09_13-00.sql', size: '2.4 MB', date: '2024-10-09 13:00' },
                      { name: 'backup_2024-10-08_12-30.sql', size: '2.3 MB', date: '2024-10-08 12:30' },
                      { name: 'backup_2024-10-07_11-15.sql', size: '2.2 MB', date: '2024-10-07 11:15' }
                    ].map((backup, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{backup.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{backup.size} • {backup.date}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                            <ArrowDownTrayIcon className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-800 dark:text-red-400">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button className="btn-primary flex items-center px-8">
                  <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                  Create Backup
                </button>
              </div>
            </div>
          )}

          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">⚠️ Import Database</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Importing a database will replace all existing data. Make sure to create a backup first!
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Upload SQL File</h4>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Drag and drop an SQL file here, or click to select
                  </p>
                </div>
                <div className="mt-6">
                  <button className="btn-primary">
                    Select File
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="font-medium text-gray-900 dark:text-white">Import Options</h5>
                
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Drop existing tables</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Disable foreign key checks</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Execute as single transaction</span>
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