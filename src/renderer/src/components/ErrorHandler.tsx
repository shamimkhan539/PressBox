import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

interface ErrorDetails {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  details?: string;
  timestamp: Date;
  source?: string;
  actions?: ErrorAction[];
  autoClose?: boolean;
  duration?: number;
}

interface ErrorAction {
  label: string;
  action: () => void | Promise<void>;
  style?: 'primary' | 'secondary' | 'danger';
}

interface ErrorContextType {
  errors: ErrorDetails[];
  showError: (error: Omit<ErrorDetails, 'id' | 'timestamp'>) => string;
  showSuccess: (message: string, duration?: number) => string;
  showWarning: (message: string, duration?: number) => string;
  showInfo: (message: string, duration?: number) => string;
  dismissError: (id: string) => void;
  clearAll: () => void;
}

const ErrorContext = createContext<ErrorContextType | null>(null);

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: ReactNode;
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const [errors, setErrors] = useState<ErrorDetails[]>([]);

  const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

  const addError = useCallback((errorData: Omit<ErrorDetails, 'id' | 'timestamp'>) => {
    const id = generateId();
    const error: ErrorDetails = {
      ...errorData,
      id,
      timestamp: new Date()
    };

    setErrors(prev => [...prev, error]);

    // Auto-remove if specified
    if (error.autoClose !== false) {
      const duration = error.duration || (error.type === 'success' ? 3000 : error.type === 'info' ? 5000 : 0);
      if (duration > 0) {
        setTimeout(() => {
          setErrors(prev => prev.filter(e => e.id !== id));
        }, duration);
      }
    }

    return id;
  }, []);

  const showError = useCallback((error: Omit<ErrorDetails, 'id' | 'timestamp'>) => {
    return addError({ ...error, type: 'error' });
  }, [addError]);

  const showSuccess = useCallback((message: string, duration = 3000) => {
    return addError({
      type: 'success',
      title: 'Success',
      message,
      duration,
      autoClose: true
    });
  }, [addError]);

  const showWarning = useCallback((message: string, duration = 5000) => {
    return addError({
      type: 'warning',
      title: 'Warning',
      message,
      duration,
      autoClose: true
    });
  }, [addError]);

  const showInfo = useCallback((message: string, duration = 5000) => {
    return addError({
      type: 'info',
      title: 'Information',
      message,
      duration,
      autoClose: true
    });
  }, [addError]);

  const dismissError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setErrors([]);
  }, []);

  const value: ErrorContextType = {
    errors,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    dismissError,
    clearAll
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
      <ErrorDisplay />
    </ErrorContext.Provider>
  );
}

function ErrorDisplay() {
  const { errors, dismissError } = useError();

  const getIcon = (type: ErrorDetails['type']) => {
    switch (type) {
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStyles = (type: ErrorDetails['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const formatErrorForCopy = (error: ErrorDetails) => {
    let text = `${error.title}: ${error.message}`;
    if (error.details) {
      text += `\n\nDetails:\n${error.details}`;
    }
    if (error.source) {
      text += `\n\nSource: ${error.source}`;
    }
    text += `\n\nTimestamp: ${error.timestamp.toISOString()}`;
    return text;
  };

  if (errors.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {errors.slice(-5).map((error) => ( // Show only last 5 errors
        <div
          key={error.id}
          className={`p-4 border rounded-lg shadow-lg animate-in slide-in-from-right duration-300 ${getStyles(error.type)}`}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(error.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {error.title}
                  </h4>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    {error.message}
                  </p>
                  
                  {error.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200">
                        Show details
                      </summary>
                      <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded whitespace-pre-wrap overflow-x-auto">
                        {error.details}
                      </pre>
                    </details>
                  )}

                  {error.source && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Source: {error.source}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={() => copyToClipboard(formatErrorForCopy(error))}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Copy error details"
                  >
                    <ClipboardDocumentIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                  
                  <button
                    onClick={() => dismissError(error.id)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Dismiss"
                  >
                    <XMarkIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              {error.actions && error.actions.length > 0 && (
                <div className="mt-3 flex space-x-2">
                  {error.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        action.style === 'primary'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : action.style === 'danger'
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-2 text-xs text-gray-400">
                {error.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {errors.length > 5 && (
        <div className="text-center">
          <button
            onClick={() => {}} // TODO: Show error history modal
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            +{errors.length - 5} more errors
          </button>
        </div>
      )}
    </div>
  );
}

// Utility functions for common error scenarios
export const ErrorHelpers = {
  docker: {
    notRunning: () => ({
      title: 'Docker Not Running',
      message: 'Docker Desktop is not running. Please start Docker to manage WordPress sites.',
      details: 'PressBox requires Docker to create and manage WordPress sites. Make sure Docker Desktop is installed and running.',
      source: 'Docker Service',
      actions: [
        {
          label: 'Check Docker Status',
          action: async () => {
            // Refresh docker status
            window.location.reload();
          },
          style: 'primary' as const
        },
        {
          label: 'Install Docker',
          action: () => {
            (window.electronAPI as any).shell.openExternal('https://www.docker.com/products/docker-desktop/');
          },
          style: 'secondary' as const
        }
      ]
    }),

    notInstalled: () => ({
      title: 'Docker Not Found',
      message: 'Docker Desktop is not installed on your system.',
      details: 'PressBox requires Docker Desktop to create containerized WordPress environments. Please install Docker Desktop and restart the application.',
      source: 'Docker Installation',
      actions: [
        {
          label: 'Download Docker',
          action: () => {
            (window.electronAPI as any).shell.openExternal('https://www.docker.com/products/docker-desktop/');
          },
          style: 'primary' as const
        }
      ]
    })
  },

  site: {
    creationFailed: (siteName: string, error: string) => ({
      title: 'Site Creation Failed',
      message: `Failed to create WordPress site "${siteName}".`,
      details: error,
      source: 'Site Management',
      actions: [
        {
          label: 'Retry',
          action: () => {
            // TODO: Implement retry logic
          },
          style: 'primary' as const
        },
        {
          label: 'Check Logs',
          action: () => {
            // TODO: Open logs viewer
          },
          style: 'secondary' as const
        }
      ]
    }),

    startFailed: (siteName: string, error: string) => ({
      title: 'Site Start Failed',
      message: `Failed to start WordPress site "${siteName}".`,
      details: error,
      source: 'Site Management'
    }),

    portConflict: (port: number, siteName: string) => ({
      title: 'Port Conflict',
      message: `Port ${port} is already in use. Cannot start site "${siteName}".`,
      details: `The port ${port} is being used by another application or service. Try stopping other sites or changing the port.`,
      source: 'Port Management',
      actions: [
        {
          label: 'Auto-assign Port',
          action: async () => {
            // TODO: Implement auto port assignment
          },
          style: 'primary' as const
        }
      ]
    })
  },

  file: {
    readError: (filePath: string) => ({
      title: 'File Read Error',
      message: `Unable to read file: ${filePath}`,
      details: 'The file may be corrupted, missing, or you may not have permission to access it.',
      source: 'File System'
    }),

    writeError: (filePath: string) => ({
      title: 'File Write Error',
      message: `Unable to save file: ${filePath}`,
      details: 'Check if you have write permissions and sufficient disk space.',
      source: 'File System'
    }),

    permissionDenied: (filePath: string) => ({
      title: 'Permission Denied',
      message: `Access denied for file: ${filePath}`,
      details: 'You do not have sufficient permissions to access this file. Try running as administrator or check file permissions.',
      source: 'File System'
    })
  },

  network: {
    connectionFailed: (url: string) => ({
      title: 'Connection Failed',
      message: `Unable to connect to ${url}`,
      details: 'Check your internet connection or try again later.',
      source: 'Network'
    }),

    timeout: (operation: string) => ({
      title: 'Operation Timeout',
      message: `${operation} timed out after 30 seconds.`,
      details: 'The operation took too long to complete. This might be due to slow network or high server load.',
      source: 'Network'
    })
  }
};