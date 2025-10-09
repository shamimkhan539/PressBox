import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  CircleStackIcon,
  MagnifyingGlassIcon,
  TableCellsIcon,
  CommandLineIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { WordPressSite } from '../../../shared/types';

interface DatabaseBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  site: WordPressSite | null;
}

interface DatabaseTable {
  name: string;
  engine: string;
  rows: number;
  size: string;
  collation: string;
  comment: string;
}

interface TableColumn {
  field: string;
  type: string;
  null: boolean;
  key: string;
  default: string | null;
  extra: string;
}

interface QueryResult {
  columns: string[];
  rows: any[][];
  affectedRows?: number;
  executionTime: number;
  query: string;
}

const mockDatabaseTables: DatabaseTable[] = [
  {
    name: 'wp_posts',
    engine: 'InnoDB',
    rows: 1247,
    size: '2.1 MB',
    collation: 'utf8mb4_unicode_ci',
    comment: 'WordPress posts table'
  },
  {
    name: 'wp_postmeta',
    engine: 'InnoDB',
    rows: 3891,
    size: '1.8 MB',
    collation: 'utf8mb4_unicode_ci',
    comment: 'Post metadata'
  },
  {
    name: 'wp_users',
    engine: 'InnoDB',
    rows: 12,
    size: '16 KB',
    collation: 'utf8mb4_unicode_ci',
    comment: 'WordPress users'
  },
  {
    name: 'wp_usermeta',
    engine: 'InnoDB',
    rows: 156,
    size: '64 KB',
    collation: 'utf8mb4_unicode_ci',
    comment: 'User metadata'
  },
  {
    name: 'wp_options',
    engine: 'InnoDB',
    rows: 428,
    size: '512 KB',
    collation: 'utf8mb4_unicode_ci',
    comment: 'WordPress options'
  },
  {
    name: 'wp_comments',
    engine: 'InnoDB',
    rows: 89,
    size: '32 KB',
    collation: 'utf8mb4_unicode_ci',
    comment: 'Comments table'
  },
  {
    name: 'wp_commentmeta',
    engine: 'InnoDB',
    rows: 234,
    size: '48 KB',
    collation: 'utf8mb4_unicode_ci',
    comment: 'Comment metadata'
  },
  {
    name: 'wp_terms',
    engine: 'InnoDB',
    rows: 67,
    size: '16 KB',
    collation: 'utf8mb4_unicode_ci',
    comment: 'Taxonomy terms'
  }
];

const mockQueryResults: QueryResult[] = [
  {
    query: 'SELECT * FROM wp_users LIMIT 5',
    columns: ['ID', 'user_login', 'user_email', 'user_registered', 'user_status'],
    rows: [
      ['1', 'admin', 'admin@example.com', '2024-01-15 10:30:00', '0'],
      ['2', 'editor', 'editor@example.com', '2024-02-10 14:22:00', '0'],
      ['3', 'author', 'author@example.com', '2024-03-05 09:15:00', '0']
    ],
    executionTime: 0.002
  }
];

export function DatabaseBrowser({ isOpen, onClose, site }: DatabaseBrowserProps) {
  const [activeTab, setActiveTab] = useState('tables');
  const [tables, setTables] = useState<DatabaseTable[]>(mockDatabaseTables);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM wp_users LIMIT 10;');
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([]);
  const [tableData, setTableData] = useState<any[][]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !site) return null;

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    table.comment.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setLoading(true);
    
    // Mock table structure
    const mockColumns: TableColumn[] = [
      { field: 'ID', type: 'bigint(20)', null: false, key: 'PRI', default: null, extra: 'auto_increment' },
      { field: 'user_login', type: 'varchar(60)', null: false, key: 'UNI', default: '', extra: '' },
      { field: 'user_email', type: 'varchar(100)', null: false, key: 'MUL', default: '', extra: '' },
      { field: 'user_registered', type: 'datetime', null: false, key: '', default: '0000-00-00 00:00:00', extra: '' },
      { field: 'user_status', type: 'int(11)', null: false, key: '', default: '0', extra: '' }
    ];

    const mockData = [
      ['1', 'admin', 'admin@example.com', '2024-01-15 10:30:00', '0'],
      ['2', 'editor', 'editor@example.com', '2024-02-10 14:22:00', '0'],
      ['3', 'author', 'author@example.com', '2024-03-05 09:15:00', '0']
    ];

    setTimeout(() => {
      setTableColumns(mockColumns);
      setTableData(mockData);
      setLoading(false);
    }, 500);
  };

  const handleExecuteQuery = () => {
    setIsExecuting(true);
    
    setTimeout(() => {
      const result: QueryResult = {
        query: sqlQuery,
        columns: ['ID', 'user_login', 'user_email', 'user_registered'],
        rows: [
          ['1', 'admin', 'admin@example.com', '2024-01-15 10:30:00'],
          ['2', 'editor', 'editor@example.com', '2024-02-10 14:22:00']
        ],
        executionTime: Math.random() * 0.1,
        affectedRows: sqlQuery.toLowerCase().includes('select') ? undefined : 2
      };
      
      setQueryResults([result, ...queryResults.slice(0, 4)]);
      setIsExecuting(false);
    }, 1000);
  };

  const handleRefreshTables = () => {
    setLoading(true);
    setTimeout(() => {
      setTables([...mockDatabaseTables]);
      setLoading(false);
    }, 500);
  };

  const getTotalSize = () => {
    return tables.reduce((total, table) => {
      const size = parseFloat(table.size.replace(/[^\d.]/g, ''));
      const unit = table.size.includes('MB') ? 1024 : 1;
      return total + (size * unit);
    }, 0);
  };

  const getTotalRows = () => {
    return tables.reduce((total, table) => total + table.rows, 0);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
              <CircleStackIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Database Browser</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                MySQL Database: {site.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_db
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

        {/* Database Stats */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{tables.length}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Tables</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalRows().toLocaleString()}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Rows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{(getTotalSize() / 1024).toFixed(1)} MB</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Database Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">Connected</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'tables'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <TableCellsIcon className="w-4 h-4 inline mr-2" />
            Tables
          </button>
          <button
            onClick={() => setActiveTab('query')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'query'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <CommandLineIcon className="w-4 h-4 inline mr-2" />
            SQL Query
          </button>
          <button
            onClick={() => setActiveTab('structure')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'structure'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            disabled={!selectedTable}
          >
            <DocumentTextIcon className="w-4 h-4 inline mr-2" />
            Structure {selectedTable && `(${selectedTable})`}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'tables' && (
            <div className="h-full flex flex-col">
              {/* Table Controls */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search tables..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleRefreshTables}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center space-x-2"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tables List */}
              <div className="flex-1 overflow-auto p-6">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Table</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Engine</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Rows</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Size</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Comment</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {filteredTables.map((table) => (
                        <tr 
                          key={table.name} 
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
                            selectedTable === table.name ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                          onClick={() => handleTableSelect(table.name)}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            {table.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {table.engine}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {table.rows.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {table.size}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {table.comment}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTableSelect(table.name);
                                  setActiveTab('structure');
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                title="View Structure"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSqlQuery(`SELECT * FROM ${table.name} LIMIT 10;`);
                                  setActiveTab('query');
                                }}
                                className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                title="Query Table"
                              >
                                <CommandLineIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'query' && (
            <div className="h-full flex flex-col">
              {/* Query Editor */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SQL Query
                    </label>
                    <textarea
                      value={sqlQuery}
                      onChange={(e) => setSqlQuery(e.target.value)}
                      className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
                      placeholder="Enter your SQL query here..."
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleExecuteQuery}
                        disabled={isExecuting || !sqlQuery.trim()}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {isExecuting ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CommandLineIcon className="w-4 h-4" />
                        )}
                        <span>{isExecuting ? 'Executing...' : 'Execute Query'}</span>
                      </button>
                      <button
                        onClick={() => setSqlQuery('')}
                        className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Tip: Use LIMIT to avoid large result sets
                    </div>
                  </div>
                </div>
              </div>

              {/* Query Results */}
              <div className="flex-1 overflow-auto p-6">
                {queryResults.length === 0 ? (
                  <div className="text-center py-12">
                    <CommandLineIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No queries executed</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Enter a SQL query above and click Execute to see results
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {queryResults.map((result, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                Query #{queryResults.length - index}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {result.query}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {result.executionTime.toFixed(3)}s
                            </div>
                          </div>
                        </div>
                        
                        {result.columns && result.rows ? (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-100 dark:bg-gray-600">
                                <tr>
                                  {result.columns.map((column) => (
                                    <th key={column} className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">
                                      {column}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                {result.rows.map((row, rowIndex) => (
                                  <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    {row.map((cell, cellIndex) => (
                                      <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900 dark:text-gray-300">
                                        {cell || <span className="text-gray-400 italic">NULL</span>}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="px-4 py-3">
                            <div className="text-sm text-green-600 dark:text-green-400">
                              Query executed successfully. {result.affectedRows} rows affected.
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'structure' && selectedTable && (
            <div className="h-full overflow-auto p-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Table Structure: {selectedTable}
                  </h3>
                </div>
                
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-gray-500 dark:text-gray-400">Loading table structure...</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 dark:bg-gray-600">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Field</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Type</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Null</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Key</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Default</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Extra</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {tableColumns.map((column) => (
                          <tr key={column.field} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
                              {column.field}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                              {column.type}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                              {column.null ? 'YES' : 'NO'}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {column.key && (
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  column.key === 'PRI' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                  column.key === 'UNI' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  column.key === 'MUL' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                }`}>
                                  {column.key}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                              {column.default || <span className="text-gray-400 italic">NULL</span>}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                              {column.extra || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}