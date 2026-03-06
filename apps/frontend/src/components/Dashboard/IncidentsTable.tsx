import React from 'react';
import { PaginatedIncidents, SEVERITY_COLORS, Severity } from '@incident-system/shared';

interface IncidentsTableProps {
  incidents: PaginatedIncidents | null;
  loading: boolean;
  error?: string | null;
  onPageChange: (page: number) => void;
  showFavoritesOnly?: boolean;
}

export const IncidentsTable: React.FC<IncidentsTableProps> = ({
  incidents,
  loading,
  error,
  onPageChange,
  showFavoritesOnly = false
}) => {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
  const [favorites, setFavorites] = React.useState<Set<string>>(() => {
    // Load favorites from localStorage on mount
    const saved = localStorage.getItem('favorite-incidents');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Listen for localStorage changes (including from track page)
  React.useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('favorite-incidents');
      setFavorites(saved ? new Set(JSON.parse(saved)) : new Set());
    };

    // Listen for storage events (changes from other tabs/pages)
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom event (changes within same page)
    window.addEventListener('favorites-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('favorites-updated', handleStorageChange);
    };
  }, []);

  const toggleRowExpansion = (incidentId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(incidentId)) {
        newSet.delete(incidentId);
      } else {
        newSet.add(incidentId);
      }
      return newSet;
    });
  };

  const toggleFavorite = (incidentId: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(incidentId)) {
        newSet.delete(incidentId);
      } else {
        newSet.add(incidentId);
      }
      // Save to localStorage
      localStorage.setItem('favorite-incidents', JSON.stringify(Array.from(newSet)));

      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('favorites-updated'));

      return newSet;
    });
  };

  // Filter incidents based on favorites if needed (must be before early returns)
  const filteredIncidents = React.useMemo(() => {
    if (!incidents || !showFavoritesOnly) return incidents;

    return {
      ...incidents,
      incidents: incidents.incidents.filter(incident => favorites.has(incident.incidentId)),
      total: incidents.incidents.filter(incident => favorites.has(incident.incidentId)).length
    };
  }, [incidents, showFavoritesOnly, favorites]);

  const isEmpty = !filteredIncidents || filteredIncidents.incidents.length === 0;

  const getSeverityClass = (severity: Severity): string => {
    const classes = {
      CRITICAL: 'severity-critical',
      HIGH: 'severity-high',
      MEDIUM: 'severity-medium',
      LOW: 'severity-low'
    };
    return `severity-badge ${classes[severity] || ''}`;
  };

  const getJiraStatusBadgeColor = (status: string | null): string => {
    if (!status) return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';

    const statusLower = status.toLowerCase();

    if (statusLower.includes('done') || statusLower.includes('resolved') || statusLower.includes('closed') || statusLower.includes('complete')) {
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
    }
    if (statusLower.includes('cancel') || statusLower.includes('rejected') || statusLower.includes('declined')) {
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
    }
    if (statusLower.includes('progress') || statusLower.includes('working') || statusLower.includes('development')) {
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
    }
    if (statusLower.includes('waiting') || statusLower.includes('pending') || statusLower.includes('blocked') || statusLower.includes('review')) {
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
    }
    if (statusLower.includes('to do') || statusLower.includes('backlog') || statusLower.includes('open')) {
      return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200';
    }
    return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200';
  };

  const formatDate = (dateStr: string): { dayOfWeek: string; dateTime: string } => {
    try {
      const date = new Date(dateStr);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const dateTime = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      return { dayOfWeek, dateTime };
    } catch {
      return { dayOfWeek: '', dateTime: dateStr };
    }
  };

  if (loading) {
    return (
      <div className="bg-surface-card dark:bg-gray-800 rounded-lg shadow-md border border-line" aria-busy="true" aria-label="Loading incidents table">
        <div className="px-6 py-4 border-b border-line">
          <h3 className="text-lg font-semibold text-text">Recent Incidents</h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
        <span className="sr-only">Loading incidents data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface-card dark:bg-gray-800 rounded-lg shadow-md border border-line">
        <div className="px-6 py-4 border-b border-line">
          <h3 className="text-lg font-semibold text-text">Recent Incidents</h3>
        </div>
        <div className="p-6 text-center" role="alert">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-card dark:bg-gray-800 rounded-lg shadow-md border border-line">
      <div className="px-5 py-3 border-b border-line">
        <h3 className="text-base font-semibold text-text">
          {showFavoritesOnly ? 'Favorite Incidents' : 'Recent Incidents'}
        </h3>
        {filteredIncidents && (
          <p className="text-xs text-text-muted mt-0.5">
            Showing {filteredIncidents.incidents.length} of {filteredIncidents.total} {showFavoritesOnly ? 'favorite' : 'total'} incidents
          </p>
        )}
      </div>

      {isEmpty ? (
        <div className="p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-text">No incidents found</h3>
          <p className="mt-1 text-sm text-text-muted">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <caption className="sr-only">
                List of recent manufacturing incidents showing incident IDs, titles, reporters, assignees, affected areas, systems, status, and dates
              </caption>
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-text-secondary uppercase tracking-wide w-16">
                    <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="sr-only">Favorite</span>
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wide">
                    Incident ID / Jira
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wide">
                    Title
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wide">
                    Reporter
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wide">
                    Assignee
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wide">
                    Area
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wide">
                    System
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wide">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wide">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface-card divide-y divide-border">
                {filteredIncidents?.incidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => toggleFavorite(incident.incidentId)}
                        className={`p-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 min-h-[32px] min-w-[32px] ${
                          favorites.has(incident.incidentId)
                            ? 'text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-500'
                            : 'text-gray-300 hover:text-gray-400 dark:text-gray-600 dark:hover:text-gray-500'
                        }`}
                        aria-label={favorites.has(incident.incidentId) ? 'Remove from favorites' : 'Add to favorites'}
                        aria-pressed={favorites.has(incident.incidentId)}
                      >
                        <svg className="w-5 h-5" fill={favorites.has(incident.incidentId) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-text text-[11px]">{incident.incidentId}</span>
                        {incident.jiraTicketKey && incident.jiraTicketUrl ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={incident.jiraTicketUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                              aria-label={`View Jira ticket ${incident.jiraTicketKey} (opens in new tab)`}
                            >
                              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                              </svg>
                              {incident.jiraTicketKey}
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(incident.jiraTicketUrl!);
                              }}
                              className="p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 min-h-[20px] min-w-[20px]"
                              aria-label={`Copy Jira URL for ${incident.jiraTicketKey}`}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">No ticket</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 max-w-xs">
                      <div className="text-sm text-text-secondary">
                        <div
                          className={`whitespace-pre-wrap break-words overflow-hidden ${
                            expandedRows.has(incident.id)
                              ? 'max-h-none'
                              : 'line-clamp-2 max-h-[3rem]'
                          }`}
                          title={incident.impactDescription}
                        >
                          {incident.impactDescription}
                        </div>
                        {incident.impactDescription.length > 100 && (
                          <button
                            onClick={() => toggleRowExpansion(incident.id)}
                            className="mt-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded px-2 py-1"
                            aria-expanded={expandedRows.has(incident.id)}
                            aria-label={expandedRows.has(incident.id) ? 'Show less' : 'Show more'}
                          >
                            {expandedRows.has(incident.id) ? '↑ Show less' : '↓ Show more'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-text text-sm">{incident.reporterName}</span>
                        <a
                          href={`mailto:${incident.reporterContact}`}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded"
                        >
                          {incident.reporterContact}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {incident.jiraAssignee ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-semibold">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          {incident.jiraAssignee}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-text-secondary font-medium">
                      {incident.affectedArea}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-text-secondary font-medium">
                      {incident.system}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <span className={getSeverityClass(incident.severity)}>
                          {incident.severity}
                        </span>
                        {incident.jiraStatus ? (
                          <span
                            className={`px-2 py-0.5 inline-flex text-xs leading-tight font-semibold rounded-full justify-center ${getJiraStatusBadgeColor(
                              incident.jiraStatus
                            )}`}
                          >
                            {incident.jiraStatus}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 inline-flex text-xs leading-tight font-medium rounded-full justify-center bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                            No Status
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-text leading-tight text-sm">
                          {formatDate(incident.createdAt).dayOfWeek}
                        </span>
                        <span className="text-text-muted text-xs leading-tight mt-0.5">
                          {formatDate(incident.createdAt).dateTime}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredIncidents && filteredIncidents.totalPages > 1 && !showFavoritesOnly && (
            <nav className="px-5 py-3 border-t border-line flex items-center justify-between" aria-label="Pagination">
              <div className="text-xs text-text-muted" aria-live="polite" aria-atomic="true">
                Page {filteredIncidents.page} of {filteredIncidents.totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onPageChange(filteredIncidents.page - 1)}
                  disabled={filteredIncidents.page === 1}
                  className="px-3 py-1.5 text-xs font-medium text-text-secondary bg-surface-card border border-line rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-800 min-h-[32px]"
                  aria-label="Go to previous page"
                >
                  Previous
                </button>
                <button
                  onClick={() => onPageChange(filteredIncidents.page + 1)}
                  disabled={filteredIncidents.page >= filteredIncidents.totalPages}
                  className="px-3 py-1.5 text-xs font-medium text-text-secondary bg-surface-card border border-line rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-800 min-h-[32px]"
                  aria-label="Go to next page"
                >
                  Next
                </button>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
};
