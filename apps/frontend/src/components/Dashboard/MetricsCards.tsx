import React from 'react';
import { SummaryMetrics, SEVERITY_COLORS } from '@incident-system/shared';

interface MetricsCardsProps {
  summary: SummaryMetrics | null;
  loading: boolean;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" role="status" aria-label="Loading metrics">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface-card dark:bg-gray-800 rounded-lg shadow-md p-6 border border-line animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
        <span className="sr-only">Loading metrics data...</span>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const criticalHighCount = summary.bySeverity.CRITICAL + summary.bySeverity.HIGH;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" role="region" aria-label="Incident metrics summary">
      <div className="bg-surface-card dark:bg-gray-800 rounded-lg shadow-md p-6 border border-line hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-secondary mb-1">Total Incidents</p>
            <p className="text-3xl font-bold text-text">{summary.totalIncidents}</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center" aria-hidden="true">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-surface-card dark:bg-gray-800 rounded-lg shadow-md p-6 border border-line hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-secondary mb-1">Critical / High</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {criticalHighCount}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-text-muted">
                Critical: {summary.bySeverity.CRITICAL}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-600" aria-hidden="true">|</span>
              <span className="text-xs text-text-muted">
                High: {summary.bySeverity.HIGH}
              </span>
            </div>
          </div>
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center" aria-hidden="true">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-surface-card dark:bg-gray-800 rounded-lg shadow-md p-6 border border-line hover:shadow-lg transition-shadow">
        <div>
          <p className="text-sm font-medium text-text-secondary mb-3">Status Breakdown</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Submitted</span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">{summary.byStatus.submitted}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Pending</span>
              <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">{summary.byStatus.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Failed</span>
              <span className="text-sm font-semibold text-red-600 dark:text-red-400">{summary.byStatus.failed}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-card dark:bg-gray-800 rounded-lg shadow-md p-6 border border-line hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-secondary mb-1">Recent Activity</p>
            <p className="text-3xl font-bold text-text">{summary.recentActivity}</p>
            <p className="text-xs text-text-muted mt-1">Last 24 hours</p>
          </div>
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center" aria-hidden="true">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
