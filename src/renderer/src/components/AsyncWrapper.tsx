import React from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface AsyncWrapperProps {
  loading: boolean;
  error: string | Error | null;
  onRetry?: () => void;
  children: React.ReactNode;
  loadingText?: string;
  errorTitle?: string;
  emptyState?: React.ReactNode;
  isEmpty?: boolean;
  minHeight?: string;
}

export function AsyncWrapper({
  loading,
  error,
  onRetry,
  children,
  loadingText = 'Loading...',
  errorTitle = 'Something went wrong',
  emptyState,
  isEmpty = false,
  minHeight = '200px'
}: AsyncWrapperProps) {
  const errorMessage = error instanceof Error ? error.message : error;

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center"
        style={{ minHeight }}
      >
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-3"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{loadingText}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="flex items-center justify-center"
        style={{ minHeight }}
      >
        <div className="text-center max-w-md">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {errorTitle}
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {errorMessage}
          </p>
          
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isEmpty && emptyState) {
    return (
      <div 
        className="flex items-center justify-center"
        style={{ minHeight }}
      >
        {emptyState}
      </div>
    );
  }

  return <>{children}</>;
}

// Specialized loading states for different scenarios
export const LoadingStates = {
  Sites: () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32"></div>
        </div>
      ))}
    </div>
  ),

  FileTree: () => (
    <div className="space-y-2">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="animate-pulse flex items-center space-x-3">
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
        </div>
      ))}
    </div>
  ),

  Terminal: () => (
    <div className="bg-black rounded-lg p-4 font-mono text-green-400">
      <div className="flex items-center space-x-2">
        <div className="animate-spin w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full"></div>
        <span>Executing command...</span>
      </div>
    </div>
  ),

  Table: () => (
    <div className="overflow-hidden">
      <table className="min-w-full">
        <thead>
          <tr>
            {[...Array(4)].map((_, i) => (
              <th key={i} className="px-6 py-3">
                <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i}>
              {[...Array(4)].map((_, j) => (
                <td key={j} className="px-6 py-4">
                  <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
};

// Hook for managing async operations with error handling
export const useAsyncOperation = <T,>(
  operation: () => Promise<T>,
  dependencies: React.DependencyList = []
) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [data, setData] = React.useState<T | null>(null);

  const execute = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unexpected error occurred');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, dependencies);

  const retry = React.useCallback(() => {
    execute();
  }, [execute]);

  return {
    loading,
    error,
    data,
    execute,
    retry
  };
};