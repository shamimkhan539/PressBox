import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  TableCellsIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CodeBracketIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { WordPressSite } from '../../../shared/types';

interface DatabaseBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  site: WordPressSite | null;
}

interface TableInfo {
  name: string;
  sql: string;
  type: string;
}

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

interface QueryResult {
  columns: string[];
  rows: any[];
  rowCount: number;
  executionTime: number;
}

export function DatabaseBrowser({ isOpen, onClose, site }: DatabaseBrowserProps) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableSchema, setTableSchema] = useState<ColumnInfo[]>([]);
  const [tableData, setTableData] = useState<QueryResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalRows, setTotalRows] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchColumn, setSearchColumn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'structure' | 'query'>('browse');
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<Record<string, any>>({});
  const [showAddRow, setShowAddRow] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});

  // Load tables on mount
  useEffect(() => {
    if (isOpen && site) {
      loadTables();
    }
  }, [isOpen, site]);

  // Load table data when table selection changes
  useEffect(() => {
    if (selectedTable) {
      loadTableData();
      loadTableSchema();
    }
  }, [selectedTable, currentPage, pageSize, searchTerm, searchColumn]);

  const loadTables = async () => {
    try {
      setLoading(true);
      const result = await window.electronAPI.database.getTables(site?.name || '');
      setTables(result);
      if (result.length > 0 && !selectedTable) {
        setSelectedTable(result[0].name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const loadTableSchema = async () => {
    if (!selectedTable) return;

    try {
      const schema = await window.electronAPI.database.getSchema(site?.name || '', selectedTable);
      setTableSchema(schema);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schema');
    }
  };

  const loadTableData = async () => {
    if (!selectedTable) return;

    try {
      setLoading(true);
      const [data, count] = await Promise.all([
        window.electronAPI.database.getTableData(
          site?.name || '',
          selectedTable,
          currentPage,
          pageSize,
          searchTerm || undefined,
          searchColumn || undefined
        ),
        window.electronAPI.database.getRowCount(
          site?.name || '',
          selectedTable,
          searchTerm || undefined,
          searchColumn || undefined
        ),
      ]);
      setTableData(data);
      setTotalRows(count);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load table data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadTableData();
  };

  const handleRefresh = () => {
    loadTableData();
  };

  const handleDeleteRow = async (row: any) => {
    if (!selectedTable) return;

    const confirmed = confirm('Are you sure you want to delete this row?');
    if (!confirmed) return;

    try {
      // Find primary key column
      const pkColumn = tableSchema.find(col => col.pk === 1);
      if (!pkColumn) {
        alert('Cannot delete row: No primary key found');
        return;
      }

      const whereClause = `${pkColumn.name} = ?`;
      const whereParams = [row[pkColumn.name]];

      const result = await window.electronAPI.database.deleteRow(
        site?.name || '',
        selectedTable,
        whereClause,
        whereParams
      );

      if (result.success) {
        loadTableData();
      } else {
        alert(`Delete failed: ${result.error}`);
      }
    } catch (err) {
      alert(`Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleEditRow = (index: number, row: any) => {
    setEditingRow(index);
    setEditedData({ ...row });
  };

  const handleSaveEdit = async () => {
    if (!selectedTable || editingRow === null) return;

    try {
      // Find primary key column
      const pkColumn = tableSchema.find(col => col.pk === 1);
      if (!pkColumn) {
        alert('Cannot update row: No primary key found');
        return;
      }

      const whereClause = `${pkColumn.name} = ?`;
      const whereParams = [editedData[pkColumn.name]];

      // Remove primary key from update data
      const updateData = { ...editedData };
      delete updateData[pkColumn.name];

      const result = await window.electronAPI.database.updateRow(
        site?.name || '',
        selectedTable,
        updateData,
        whereClause,
        whereParams
      );

      if (result.success) {
        setEditingRow(null);
        setEditedData({});
        loadTableData();
      } else {
        alert(`Update failed: ${result.error}`);
      }
    } catch (err) {
      alert(`Update failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditedData({});
  };

  const handleAddRow = () => {
    const initialData: Record<string, any> = {};
    tableSchema.forEach(col => {
      initialData[col.name] = col.dflt_value || '';
    });
    setNewRowData(initialData);
    setShowAddRow(true);
  };

  const handleSaveNewRow = async () => {
    if (!selectedTable) return;

    try {
      const result = await window.electronAPI.database.insertRow(
        site?.name || '',
        selectedTable,
        newRowData
      );

      if (result.success) {
        setShowAddRow(false);
        setNewRowData({});
        loadTableData();
      } else {
        alert(`Insert failed: ${result.error}`);
      }
    } catch (err) {
      alert(`Insert failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleExecuteQuery = async () => {
    if (!sqlQuery.trim()) return;

    try {
      setLoading(true);
      const result = await window.electronAPI.database.executeRaw(site?.name || '', sqlQuery);

      if (result.success) {
        setQueryResult(result.result);
        setError(null);
      } else {
        setError(result.error || 'Query execution failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query execution failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const result = await window.electronAPI.dialog.showSaveDialog({
        title: 'Export Database',
        defaultPath: `${site?.name || 'database'}-export.sql`,
        filters: [{ name: 'SQL Files', extensions: ['sql'] }],
      });

      if (result.filePath) {
        const exportResult = await window.electronAPI.database.exportDatabase(
          site?.name || '',
          result.filePath,
          selectedTable ? [selectedTable] : undefined
        );

        if (exportResult.success) {
          alert('Database exported successfully!');
        } else {
          alert(`Export failed: ${exportResult.error}`);
        }
      }
    } catch (err) {
      alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleImport = async () => {
    try {
      const result = await window.electronAPI.dialog.showOpenDialog({
        title: 'Import SQL File',
        filters: [{ name: 'SQL Files', extensions: ['sql'] }],
        properties: ['openFile'],
      });

      if (result.filePaths && result.filePaths.length > 0) {
        const importResult = await window.electronAPI.database.importDatabase(
          site?.name || '',
          result.filePaths[0]
        );

        if (importResult.success) {
          alert('Database imported successfully!');
          loadTables();
          loadTableData();
        } else {
          alert(`Import failed: ${importResult.error}`);
        }
      }
    } catch (err) {
      alert(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const totalPages = Math.ceil(totalRows / pageSize);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <TableCellsIcon className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Database Browser
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Site: {site?.name || 'No site selected'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="btn-secondary flex items-center space-x-2"
              title="Export Database"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              onClick={handleImport}
              className="btn-secondary flex items-center space-x-2"
              title="Import SQL"
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
              <span>Import</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Table List */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="p-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tables ({tables.length})
              </h3>
              <div className="space-y-1">
                {tables.map((table) => (
                  <button
                    key={table.name}
                    onClick={() => setSelectedTable(table.name)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedTable === table.name
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <TableCellsIcon className="w-4 h-4" />
                      <span className="truncate">{table.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex space-x-4 px-4">
                <button
                  onClick={() => setActiveTab('browse')}
                  className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'browse'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Browse Data
                </button>
                <button
                  onClick={() => setActiveTab('structure')}
                  className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'structure'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Structure
                </button>
                <button
                  onClick={() => setActiveTab('query')}
                  className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'query'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  SQL Query
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden p-4">
              {/* Browse Tab */}
              {activeTab === 'browse' && selectedTable && (
                <div className="h-full flex flex-col">
                  {/* Toolbar */}
                  <div className="flex items-center justify-between mb-4 space-x-4">
                    <div className="flex items-center space-x-2 flex-1">
                      <select
                        value={searchColumn}
                        onChange={(e) => setSearchColumn(e.target.value)}
                        className="form-select"
                      >
                        <option value="">All Columns</option>
                        {tableSchema.map((col) => (
                          <option key={col.name} value={col.name}>
                            {col.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                          placeholder="Search..."
                          className="form-input pl-10"
                        />
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      </div>
                      <button onClick={handleSearch} className="btn-primary">
                        Search
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleAddRow}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <PlusIcon className="w-4 h-4" />
                        <span>Add Row</span>
                      </button>
                      <button
                        onClick={handleRefresh}
                        className="btn-secondary p-2"
                        title="Refresh"
                      >
                        <ArrowPathIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Data Table */}
                  <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="spinner w-8 h-8"></div>
                      </div>
                    ) : error ? (
                      <div className="flex items-center justify-center h-full p-8">
                        <div className="text-center">
                          <InformationCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-2" />
                          <p className="text-red-600 dark:text-red-400">{error}</p>
                        </div>
                      </div>
                    ) : tableData && tableData.rows.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Actions
                            </th>
                            {tableData.columns.map((col) => (
                              <th
                                key={col}
                                className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {showAddRow && (
                            <tr className="bg-green-50 dark:bg-green-900/20">
                              <td className="px-4 py-2 whitespace-nowrap">
                                <div className="flex space-x-1">
                                  <button
                                    onClick={handleSaveNewRow}
                                    className="text-green-600 hover:text-green-800 dark:text-green-400"
                                    title="Save"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={() => setShowAddRow(false)}
                                    className="text-red-600 hover:text-red-800 dark:text-red-400"
                                    title="Cancel"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </td>
                              {tableData.columns.map((col) => (
                                <td key={col} className="px-4 py-2">
                                  <input
                                    type="text"
                                    value={newRowData[col] || ''}
                                    onChange={(e) =>
                                      setNewRowData({ ...newRowData, [col]: e.target.value })
                                    }
                                    className="form-input text-sm"
                                  />
                                </td>
                              ))}
                            </tr>
                          )}
                          {tableData.rows.map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-4 py-2 whitespace-nowrap">
                                {editingRow === index ? (
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={handleSaveEdit}
                                      className="text-green-600 hover:text-green-800 dark:text-green-400"
                                      title="Save"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="text-red-600 hover:text-red-800 dark:text-red-400"
                                      title="Cancel"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={() => handleEditRow(index, row)}
                                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                      title="Edit"
                                    >
                                      <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRow(row)}
                                      className="text-red-600 hover:text-red-800 dark:text-red-400"
                                      title="Delete"
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </td>
                              {tableData.columns.map((col) => (
                                <td
                                  key={col}
                                  className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100"
                                >
                                  {editingRow === index ? (
                                    <input
                                      type="text"
                                      value={editedData[col] || ''}
                                      onChange={(e) =>
                                        setEditedData({ ...editedData, [col]: e.target.value })
                                      }
                                      className="form-input text-sm"
                                    />
                                  ) : (
                                    <span className="truncate block max-w-xs">
                                      {row[col] === null ? (
                                        <span className="text-gray-400 italic">NULL</span>
                                      ) : (
                                        String(row[col])
                                      )}
                                    </span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500 dark:text-gray-400">No data available</p>
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {tableData && tableData.rows.length > 0 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        Showing {(currentPage - 1) * pageSize + 1} to{' '}
                        {Math.min(currentPage * pageSize, totalRows)} of {totalRows} rows
                        {tableData.executionTime && (
                          <span className="ml-2 text-gray-500">
                            ({tableData.executionTime}ms)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="form-select text-sm"
                        >
                          <option value="25">25 per page</option>
                          <option value="50">50 per page</option>
                          <option value="100">100 per page</option>
                          <option value="250">250 per page</option>
                        </select>
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Structure Tab */}
              {activeTab === 'structure' && selectedTable && (
                <div className="h-full overflow-auto">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Table: {selectedTable}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {totalRows} rows
                    </p>
                  </div>

                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Column
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Type
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Null
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Default
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Key
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {tableSchema.map((col) => (
                          <tr key={col.name}>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
                              {col.name}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                              {col.type}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                              {col.notnull ? 'NO' : 'YES'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                              {col.dflt_value || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {col.pk ? (
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                                  PRIMARY
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Query Tab */}
              {activeTab === 'query' && (
                <div className="h-full flex flex-col space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SQL Query
                    </label>
                    <textarea
                      value={sqlQuery}
                      onChange={(e) => setSqlQuery(e.target.value)}
                      placeholder="SELECT * FROM wp_posts WHERE post_status = 'publish' LIMIT 10;"
                      className="form-input font-mono text-sm h-32 resize-none"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={handleExecuteQuery}
                      disabled={loading || !sqlQuery.trim()}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <CodeBracketIcon className="w-4 h-4" />
                      <span>Execute</span>
                    </button>
                    <button
                      onClick={() => {
                        setSqlQuery('');
                        setQueryResult(null);
                        setError(null);
                      }}
                      className="btn-secondary"
                    >
                      Clear
                    </button>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  {queryResult && (
                    <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                      {queryResult.rows && queryResult.rows.length > 0 ? (
                        <>
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                              <tr>
                                {queryResult.columns.map((col) => (
                                  <th
                                    key={col}
                                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                  >
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {queryResult.rows.map((row, index) => (
                                <tr key={index}>
                                  {queryResult.columns.map((col) => (
                                    <td
                                      key={col}
                                      className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100"
                                    >
                                      <span className="truncate block max-w-xs">
                                        {row[col] === null ? (
                                          <span className="text-gray-400 italic">NULL</span>
                                        ) : (
                                          String(row[col])
                                        )}
                                      </span>
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                            {queryResult.rowCount} rows returned in {queryResult.executionTime}ms
                          </div>
                        </>
                      ) : (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                          Query executed successfully. No rows returned.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
