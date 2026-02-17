import React from 'react';
import { PaginatedIncidents, SEVERITY_COLORS, Severity } from '@incident-system/shared';

interface IncidentsTableProps {
  incidents: PaginatedIncidents | null;
  loading: boolean;
  error?: string | null;
  onPageChange: (page: number) => void;
}

export const IncidentsTable: React.FC<IncidentsTableProps> = ({
  incidents,
  loading,
  error,
  onPageChange
}) => {
  const getSeverityBadgeColor = (severity: Severity): string => {
    return SEVERITY_COLORS[severity] || '#94a3b8';
  };

  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'submitted':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getJiraStatusBadgeColor = (status: string | null): string => {
    if (!status) return 'bg-gray-100 text-gray-600';

    const statusLower = status.toLowerCase();

    // Green - Completed/Successful statuses
    if (statusLower.includes('done') ||
        statusLower.includes('resolved') ||
        statusLower.includes('closed') ||
        statusLower.includes('complete')) {
      return 'bg-green-100 text-green-800';
    }

    // Red - Cancelled/Rejected statuses (handle both American and British spellings)
    if (statusLower.includes('cancel') ||
        statusLower.includes('rejected') ||
        statusLower.includes('declined')) {
      return 'bg-red-100 text-red-800';
    }

    // Blue - Active/In Progress statuses
    if (statusLower.includes('progress') ||
        statusLower.includes('working') ||
        statusLower.includes('development')) {
      return 'bg-blue-100 text-blue-800';
    }

    // Yellow - Waiting/Blocked statuses
    if (statusLower.includes('waiting') ||
        statusLower.includes('pending') ||
        statusLower.includes('blocked') ||
        statusLower.includes('review')) {
      return 'bg-yellow-100 text-yellow-800';
    }

    // Orange - To Do/Backlog statuses
    if (statusLower.includes('to do') ||
        statusLower.includes('backlog') ||
        statusLower.includes('open')) {
      return 'bg-orange-100 text-orange-800';
    }

    // Purple - Unknown/Other statuses
    return 'bg-purple-100 text-purple-800';
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Incidents</h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Incidents</h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  const isEmpty = !incidents || incidents.incidents.length === 0;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Incidents</h3>
        {incidents && (
          <p className="text-sm text-gray-600 mt-1">
            Showing {incidents.incidents.length} of {incidents.total} total incidents
          </p>
        )}
      </div>

      {isEmpty ? (
        <div className="p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No incidents found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Incident ID / Jira
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reporter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    System
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity / Status
                  </th>
                  <th className="pl-3 pr-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[170px]">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {incidents?.incidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-gray-900 text-xs">{incident.incidentId}</span>
                        {incident.jiraTicketKey && incident.jiraTicketUrl ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={incident.jiraTicketUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold hover:bg-blue-100 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                              </svg>
                              {incident.jiraTicketKey}
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(incident.jiraTicketUrl!);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Copy Jira URL"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No Jira ticket</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-gray-900">{incident.reporterName}</span>
                        <a
                          href={`mailto:${incident.reporterContact}`}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {incident.reporterContact}
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {incident.jiraAssignee ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          {incident.jiraAssignee}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {incident.affectedArea}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {incident.system}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                          style={{
                            backgroundColor: `${getSeverityBadgeColor(incident.severity)}20`,
                            color: getSeverityBadgeColor(incident.severity)
                          }}
                        >
                          {incident.severity}
                        </span>
                        {incident.jiraStatus ? (
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getJiraStatusBadgeColor(
                              incident.jiraStatus
                            )}`}
                          >
                            {incident.jiraStatus}
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-600">
                            No Jira Status
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="pl-3 pr-6 py-4 whitespace-nowrap text-xs text-gray-700 min-w-[170px]">
                      {formatDate(incident.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {incidents && incidents.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {incidents.page} of {incidents.totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onPageChange(incidents.page - 1)}
                  disabled={incidents.page === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => onPageChange(incidents.page + 1)}
                  disabled={incidents.page >= incidents.totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
