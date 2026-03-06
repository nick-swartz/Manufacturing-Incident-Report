import React from 'react';

interface ChartContainerProps {
  title: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  description,
  loading,
  error,
  children
}) => {
  return (
    <div className="bg-surface-card dark:bg-gray-800 rounded-lg shadow-md p-6 border border-line">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-text">{title}</h3>
        {description && <p className="text-sm text-text-secondary mt-1">{description}</p>}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64" aria-live="polite" aria-busy="true">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
          <span className="sr-only">Loading chart data...</span>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center h-64 text-center" role="alert">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-800 min-h-[44px]"
            aria-label="Retry loading chart"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && <div>{children}</div>}
    </div>
  );
};
