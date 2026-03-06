import React, { useState } from 'react';
import { PublicIncidentData } from '@incident-system/shared';

interface Props {
  incident: PublicIncidentData;
}

export const IncidentStatusCard: React.FC<Props> = ({ incident }) => {
  const [copied, setCopied] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [expandedSymptoms, setExpandedSymptoms] = useState(false);
  const [expandedImpact, setExpandedImpact] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(incident.incidentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleCommentExpansion = (commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600';
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'severity-critical';
      case 'HIGH':
        return 'severity-high';
      case 'MEDIUM':
        return 'severity-medium';
      case 'LOW':
        return 'severity-low';
      default:
        return 'bg-gray-600 dark:bg-gray-500 text-white';
    }
  };

  const getJiraStatusColor = (status?: string | null) => {
    if (!status) return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('done') || statusLower.includes('closed') || statusLower.includes('resolved')) {
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
    }
    if (statusLower.includes('progress') || statusLower.includes('review')) {
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
    }
    if (statusLower.includes('blocked')) {
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
    }
    return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getRelativeTime = (date: string | null) => {
    if (!date) return null;
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(past);
  };

  return (
    <article className="bg-surface-card dark:bg-gray-800 rounded-xl shadow-sm border border-line overflow-hidden">
      {/* Header with Tracking ID */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-primary-100 dark:text-primary-200 text-sm font-medium">Tracking ID</p>
            <p className="text-white text-2xl font-mono font-bold">{incident.incidentId}</p>
          </div>
          <button
            onClick={copyToClipboard}
            className="self-start sm:self-center px-4 py-2 bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 text-white rounded-lg font-medium transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-primary-700 dark:focus:ring-offset-primary-600 min-h-[44px]"
            aria-label={copied ? 'Tracking ID copied to clipboard' : 'Copy tracking ID to clipboard'}
          >
            {copied ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Section */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-line">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(incident.status)}`}>
            {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getSeverityClass(incident.severity)}`}>
            {incident.severity}
          </span>
          {incident.jiraStatus && (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getJiraStatusColor(incident.jiraStatus)}`}>
              Jira: {incident.jiraStatus}
            </span>
          )}
          <span className="text-sm text-text-secondary">
            Submitted {getRelativeTime(incident.createdAt.toString())}
          </span>
        </div>
      </div>

      {/* Incident Details */}
      <div className="px-6 py-6 space-y-6">
        {/* Location & System */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-text-muted mb-1">Affected Area</p>
            <p className="text-base font-semibold text-text">{incident.affectedArea}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-text-muted mb-1">System</p>
            <p className="text-base font-semibold text-text">{incident.system}</p>
          </div>
        </div>

        {/* Symptoms */}
        <div>
          <p className="text-sm font-medium text-text-muted mb-2">Reported Issue</p>
          <div className="text-base text-text bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-line">
            <p
              className={`whitespace-pre-wrap break-words overflow-hidden ${
                expandedSymptoms
                  ? 'max-h-none'
                  : 'line-clamp-3 max-h-[4.5rem]'
              }`}
            >
              {incident.symptoms}
            </p>
            {incident.symptoms.length > 150 && (
              <button
                onClick={() => setExpandedSymptoms(!expandedSymptoms)}
                className="mt-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded px-2 py-1"
                aria-expanded={expandedSymptoms}
              >
                {expandedSymptoms ? '↑ Show less' : '↓ Show more'}
              </button>
            )}
          </div>
        </div>

        {/* Impact Description */}
        <div>
          <p className="text-sm font-medium text-text-muted mb-2">Impact</p>
          <div className="text-base text-text bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-line">
            <p
              className={`whitespace-pre-wrap break-words overflow-hidden ${
                expandedImpact
                  ? 'max-h-none'
                  : 'line-clamp-3 max-h-[4.5rem]'
              }`}
            >
              {incident.impactDescription}
            </p>
            {incident.impactDescription.length > 150 && (
              <button
                onClick={() => setExpandedImpact(!expandedImpact)}
                className="mt-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded px-2 py-1"
                aria-expanded={expandedImpact}
              >
                {expandedImpact ? '↑ Show less' : '↓ Show more'}
              </button>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <p className="text-sm font-medium text-text-muted mb-3">Timeline</p>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-500 mt-2 mr-3" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm font-medium text-text">Incident Started</p>
                <p className="text-sm text-text-secondary">{formatDate(incident.startTime)}</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-500 mt-2 mr-3" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm font-medium text-text">Reported</p>
                <p className="text-sm text-text-secondary">{formatDate(incident.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Jira Ticket */}
        {incident.jiraTicketKey && (
          <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4" aria-label="Jira ticket information">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.94 4.34 4.34 4.34V2.84a.84.84 0 00-.84-.84h-9.63zM2 11.47c2.4 0 4.35 1.97 4.35 4.35v1.78h1.7c2.4 0 4.34 1.94 4.34 4.34H2.84a.84.84 0 01-.84-.84v-9.63z" />
                  </svg>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Jira Ticket Created</p>
                </div>
                <p className="text-lg font-mono font-bold text-blue-700 dark:text-blue-300 mb-2">
                  {incident.jiraTicketKey}
                </p>
                {incident.jiraStatus && (
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getJiraStatusColor(incident.jiraStatus)}`}>
                      {incident.jiraStatus}
                    </span>
                    {incident.jiraAssignee && (
                      <span className="text-xs text-text-secondary">
                        Assigned to: {incident.jiraAssignee}
                      </span>
                    )}
                  </div>
                )}
                {incident.jiraStatusUpdatedAt && (
                  <p className="text-xs text-text-muted">
                    Last updated {getRelativeTime(incident.jiraStatusUpdatedAt)}
                  </p>
                )}
              </div>
              {incident.jiraTicketUrl && (
                <a
                  href={incident.jiraTicketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-800 min-h-[44px]"
                  aria-label={`View Jira ticket ${incident.jiraTicketKey} (opens in new tab)`}
                >
                  <span>View in Jira</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </section>
        )}

        {!incident.jiraTicketKey && incident.status === 'submitted' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4" role="status">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-1">Jira Ticket Pending</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  A Jira ticket is being created for this incident. Check back soon for updates.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Comments Section - Always show if Jira ticket exists */}
        {incident.jiraTicketKey && (
          <section className="border-t border-line pt-6" aria-label="Activity and comments">
            <div className="flex items-center mb-4">
              <svg className="w-5 h-5 text-text-secondary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <h3 className="text-sm font-medium text-text-muted">
                Activity & Comments {incident.jiraComments && `(${incident.jiraComments.length})`}
              </h3>
            </div>
            {incident.jiraComments && incident.jiraComments.length > 0 ? (
              <div className="space-y-4" role="list">
                {incident.jiraComments.map((comment) => (
                  <article key={comment.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-line" role="listitem">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white font-semibold text-sm" aria-hidden="true">
                          {comment.authorDisplayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text">{comment.authorDisplayName}</p>
                          <p className="text-xs text-text-muted">
                            <time dateTime={comment.created}>{getRelativeTime(comment.created)}</time>
                            {comment.updated !== comment.created && ' (edited)'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-10">
                      <div
                        className={`text-sm text-text-secondary whitespace-pre-wrap break-words overflow-hidden ${
                          expandedComments.has(comment.id)
                            ? 'max-h-none'
                            : 'line-clamp-3 max-h-[4.5rem]'
                        }`}
                      >
                        {comment.body}
                      </div>
                      {comment.body.length > 150 && (
                        <button
                          onClick={() => toggleCommentExpansion(comment.id)}
                          className="mt-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded px-2 py-1"
                          aria-expanded={expandedComments.has(comment.id)}
                        >
                          {expandedComments.has(comment.id) ? '↑ Show less' : '↓ Show more'}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 border border-line text-center">
                <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm text-text-secondary font-medium">No comments yet</p>
                <p className="text-xs text-text-muted mt-1">Comments and updates will appear here</p>
              </div>
            )}
          </section>
        )}
      </div>
    </article>
  );
};
