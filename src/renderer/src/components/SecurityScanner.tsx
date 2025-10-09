import React, { useState } from 'react';
import { 
  XMarkIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  DocumentMagnifyingGlassIcon,
  CogIcon,
  BugAntIcon,
  KeyIcon,
  LockClosedIcon,
  EyeSlashIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { WordPressSite } from '../../../shared/types';

interface SecurityScannerProps {
  isOpen: boolean;
  onClose: () => void;
  site: WordPressSite | null;
}

interface SecurityIssue {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'vulnerability' | 'configuration' | 'permissions' | 'malware' | 'outdated';
  title: string;
  description: string;
  file?: string;
  line?: number;
  recommendation: string;
  cve?: string;
  cvssScore?: number;
  detectedAt: string;
  status: 'new' | 'acknowledged' | 'fixed' | 'false-positive';
}

interface ScanResult {
  scanId: string;
  startedAt: string;
  completedAt: string | null;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  totalFiles: number;
  scannedFiles: number;
  issues: SecurityIssue[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

const mockSecurityIssues: SecurityIssue[] = [
  {
    id: 'sec-001',
    type: 'critical',
    category: 'vulnerability',
    title: 'SQL Injection Vulnerability in Contact Plugin',
    description: 'Potential SQL injection vulnerability found in user input handling.',
    file: '/wp-content/plugins/contact-form/contact.php',
    line: 127,
    recommendation: 'Update plugin to version 2.1.3 or use prepared statements for database queries.',
    cve: 'CVE-2024-12345',
    cvssScore: 9.1,
    detectedAt: '2024-10-09T10:30:00Z',
    status: 'new'
  },
  {
    id: 'sec-002',
    type: 'high',
    category: 'configuration',
    title: 'Debug Mode Enabled in Production',
    description: 'WordPress debug mode is enabled, which may expose sensitive information.',
    file: '/wp-config.php',
    line: 45,
    recommendation: 'Set WP_DEBUG to false in wp-config.php for production environments.',
    detectedAt: '2024-10-09T10:31:15Z',
    status: 'new'
  },
  {
    id: 'sec-003',
    type: 'high',
    category: 'outdated',
    title: 'Outdated WordPress Core Version',
    description: 'WordPress core is running version 6.2.1, latest is 6.4.1.',
    recommendation: 'Update WordPress core to the latest version to patch security vulnerabilities.',
    detectedAt: '2024-10-09T10:32:00Z',
    status: 'acknowledged'
  },
  {
    id: 'sec-004',
    type: 'medium',
    category: 'permissions',
    title: 'Overly Permissive File Permissions',
    description: 'Some files have world-writable permissions (777).',
    file: '/wp-content/uploads/',
    recommendation: 'Change file permissions to 644 for files and 755 for directories.',
    detectedAt: '2024-10-09T10:33:45Z',
    status: 'new'
  },
  {
    id: 'sec-005',
    type: 'medium',
    category: 'configuration',
    title: 'Default Admin Username Detected',
    description: 'Admin user account is using default username "admin".',
    recommendation: 'Change the admin username to something less predictable.',
    detectedAt: '2024-10-09T10:34:20Z',
    status: 'fixed'
  },
  {
    id: 'sec-006',
    type: 'low',
    category: 'configuration',
    title: 'Directory Listing Enabled',
    description: 'Directory browsing is enabled for uploads folder.',
    file: '/wp-content/uploads/.htaccess',
    recommendation: 'Add "Options -Indexes" to .htaccess file to disable directory listing.',
    detectedAt: '2024-10-09T10:35:00Z',
    status: 'new'
  }
];

const mockScanResult: ScanResult = {
  scanId: 'scan-2024-10-09-001',
  startedAt: '2024-10-09T10:30:00Z',
  completedAt: '2024-10-09T10:37:30Z',
  status: 'completed',
  progress: 100,
  totalFiles: 2847,
  scannedFiles: 2847,
  issues: mockSecurityIssues,
  summary: {
    critical: 1,
    high: 2,
    medium: 2,
    low: 1,
    info: 0
  }
};

export function SecurityScanner({ isOpen, onClose, site }: SecurityScannerProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [scanResult, setScanResult] = useState<ScanResult>(mockScanResult);
  const [isScanning, setIsScanning] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen || !site) return null;

  const filteredIssues = scanResult.issues.filter(issue => {
    const matchesType = filterType === 'all' || issue.type === filterType;
    const matchesCategory = filterCategory === 'all' || issue.category === filterCategory;
    const matchesSearch = searchQuery === '' || 
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (issue.file && issue.file.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesType && matchesCategory && matchesSearch;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'info': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'critical': return <ShieldExclamationIcon className="w-4 h-4" />;
      case 'high': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'medium': return <ClockIcon className="w-4 h-4" />;
      case 'low': return <MagnifyingGlassIcon className="w-4 h-4" />;
      default: return <ShieldCheckIcon className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'vulnerability': return <BugAntIcon className="w-4 h-4" />;
      case 'configuration': return <CogIcon className="w-4 h-4" />;
      case 'permissions': return <KeyIcon className="w-4 h-4" />;
      case 'malware': return <FireIcon className="w-4 h-4" />;
      case 'outdated': return <ClockIcon className="w-4 h-4" />;
      default: return <ShieldCheckIcon className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-red-100 text-red-700';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-700';
      case 'fixed': return 'bg-green-100 text-green-700';
      case 'false-positive': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleStartScan = () => {
    setIsScanning(true);
    console.log(`Starting security scan for site: ${site?.name}`);
    
    // Simulate scanning process
    setTimeout(() => {
      setIsScanning(false);
      setScanResult({
        ...scanResult,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: 'completed'
      });
    }, 5000);
  };

  const handleFixIssue = (issueId: string) => {
    console.log(`Attempting to fix issue: ${issueId}`);
    // Implementation for automated fixes
  };

  const handleIgnoreIssue = (issueId: string) => {
    console.log(`Marking issue as false positive: ${issueId}`);
    // Update issue status
  };

  const totalIssues = Object.values(scanResult.summary).reduce((a, b) => a + b, 0);
  const riskScore = (scanResult.summary.critical * 10 + scanResult.summary.high * 7 + scanResult.summary.medium * 4 + scanResult.summary.low * 1) / Math.max(totalIssues, 1);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
              <ShieldCheckIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Security Scanner</h2>
              <p className="text-sm text-gray-500">Comprehensive security audit for {site.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <XMarkIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Security Overview
          </button>
          <button
            onClick={() => setActiveTab('issues')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'issues'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Issues ({totalIssues})
          </button>
          <button
            onClick={() => setActiveTab('scan-history')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'scan-history'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Scan History
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Scan Settings
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'overview' && (
            <div className="h-full overflow-auto p-6">
              {/* Security Score Card */}
              <div className="bg-gradient-to-r from-red-500 to-orange-600 rounded-xl p-6 text-white mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Security Score</h3>
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl font-bold">{Math.max(0, 100 - Math.round(riskScore * 10))}/100</div>
                      <div className="text-sm opacity-90">
                        Last scan: {new Date(scanResult.completedAt!).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={handleStartScan}
                      disabled={isScanning}
                      className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
                    >
                      {isScanning ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Scanning...</span>
                        </div>
                      ) : (
                        <>
                          <DocumentMagnifyingGlassIcon className="w-4 h-4 inline mr-2" />
                          Start New Scan
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Issue Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white border-2 border-red-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <ShieldExclamationIcon className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{scanResult.summary.critical}</div>
                      <div className="text-sm text-gray-600">Critical</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 border-orange-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{scanResult.summary.high}</div>
                      <div className="text-sm text-gray-600">High</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 border-yellow-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <ClockIcon className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">{scanResult.summary.medium}</div>
                      <div className="text-sm text-gray-600">Medium</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MagnifyingGlassIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{scanResult.summary.low}</div>
                      <div className="text-sm text-gray-600">Low</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{scanResult.summary.info}</div>
                      <div className="text-sm text-gray-600">Info</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Issues */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Critical & High Priority Issues</h3>
                <div className="space-y-3">
                  {scanResult.issues
                    .filter(issue => issue.type === 'critical' || issue.type === 'high')
                    .slice(0, 3)
                    .map((issue) => (
                    <div key={issue.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-lg ${getTypeColor(issue.type)}`}>
                        {getTypeIcon(issue.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{issue.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                        {issue.file && (
                          <p className="text-xs text-gray-500 mt-1">
                            {issue.file}{issue.line && `:${issue.line}`}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleFixIssue(issue.id)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Fix
                        </button>
                        <button
                          onClick={() => handleIgnoreIssue(issue.id)}
                          className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-400 transition-colors"
                        >
                          Ignore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scan Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Scan Coverage</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Files Scanned</span>
                      <span className="font-medium">{scanResult.scannedFiles.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Files</span>
                      <span className="font-medium">{scanResult.totalFiles.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Coverage</span>
                      <span className="font-medium">{Math.round((scanResult.scannedFiles / scanResult.totalFiles) * 100)}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Vulnerability Database</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">CVE Records</span>
                      <span className="font-medium">247,351</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Last Updated</span>
                      <span className="font-medium">2 hours ago</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Signatures</span>
                      <span className="font-medium">15,847</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Performance Impact</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Scan Duration</span>
                      <span className="font-medium">7m 30s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">CPU Usage</span>
                      <span className="font-medium">Low (12%)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Memory Usage</span>
                      <span className="font-medium">245 MB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'issues' && (
            <div className="h-full flex flex-col">
              {/* Filters */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search security issues..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="info">Info</option>
                  </select>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    <option value="vulnerability">Vulnerabilities</option>
                    <option value="configuration">Configuration</option>
                    <option value="permissions">Permissions</option>
                    <option value="malware">Malware</option>
                    <option value="outdated">Outdated Components</option>
                  </select>
                </div>
              </div>

              {/* Issues List */}
              <div className="flex-1 overflow-auto p-6">
                <div className="space-y-4">
                  {filteredIssues.map((issue) => (
                    <div key={issue.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <div className={`p-2 rounded-lg border ${getTypeColor(issue.type)}`}>
                            {getTypeIcon(issue.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-gray-900">{issue.title}</h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(issue.type)}`}>
                                {issue.type.toUpperCase()}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(issue.status)}`}>
                                {issue.status.replace('-', ' ').toUpperCase()}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-3">{issue.description}</p>
                            
                            {/* Additional Details */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                {getCategoryIcon(issue.category)}
                                <span>{issue.category}</span>
                              </div>
                              {issue.file && (
                                <div className="flex items-center space-x-1">
                                  <DocumentMagnifyingGlassIcon className="w-4 h-4" />
                                  <span>
                                    {issue.file.split('/').pop()}{issue.line && `:${issue.line}`}
                                  </span>
                                </div>
                              )}
                              {issue.cvssScore && (
                                <div className="flex items-center space-x-1">
                                  <span className="font-medium">CVSS: {issue.cvssScore}</span>
                                </div>
                              )}
                              {issue.cve && (
                                <div className="flex items-center space-x-1">
                                  <span className="font-medium">{issue.cve}</span>
                                </div>
                              )}
                              <span>
                                Detected {new Date(issue.detectedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleFixIssue(issue.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Auto Fix
                          </button>
                          <button
                            onClick={() => handleIgnoreIssue(issue.id)}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                          >
                            Mark as False Positive
                          </button>
                        </div>
                      </div>

                      {/* Recommendation */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">Recommended Action:</h4>
                        <p className="text-blue-800 text-sm">{issue.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scan-history' && (
            <div className="h-full overflow-auto p-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Security Scans</h3>
                <div className="space-y-4">
                  {[mockScanResult].map((scan, index) => (
                    <div key={scan.scanId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          scan.status === 'completed' ? 'bg-green-100' : 
                          scan.status === 'failed' ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                          {scan.status === 'completed' ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-600" />
                          ) : scan.status === 'failed' ? (
                            <XMarkIcon className="w-5 h-5 text-red-600" />
                          ) : (
                            <ClockIcon className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{scan.scanId}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(scan.startedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {Object.values(scan.summary).reduce((a, b) => a + b, 0)} issues found
                        </div>
                        <div className="text-xs text-gray-500">
                          {scan.scannedFiles.toLocaleString()} files scanned
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="h-full overflow-auto p-6">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">Scan WordPress core files</span>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">Scan plugins and themes</span>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">Check file permissions</span>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">Malware detection</span>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Deep file content analysis (slower)</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Automated Scans</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Enable scheduled scans</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Scan Frequency</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
                        <option>Daily</option>
                        <option>Weekly</option>
                        <option>Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Scan after plugin/theme updates</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Exclusions</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Exclude Directories</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        rows={3}
                        placeholder="/wp-content/cache/&#10;/wp-content/uploads/backup/"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Exclude File Types</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="*.log, *.tmp, *.bak"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}