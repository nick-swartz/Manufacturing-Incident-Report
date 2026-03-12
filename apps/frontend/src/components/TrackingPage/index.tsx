import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PublicIncidentData } from '@incident-system/shared';
import { lookupIncident, searchIncidents } from '../../api/tracking';
import { syncJiraQueue } from '../../api/incidents';
import { Header } from '../common/Header';
import { IncidentStatusCard } from './IncidentStatusCard';
import { Comments } from '../Comments/Comments';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface TrackingPageProps {
  systemType?: 'manufacturing' | 'erp-support';
}

export const TrackingPage: React.FC<TrackingPageProps> = ({ systemType = 'manufacturing' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('id') || '');
  const [loading, setLoading] = useState(false);
  const [incident, setIncident] = useState<PublicIncidentData | null>(null);
  const [searchResults, setSearchResults] = useState<Array<{incidentId: string; symptoms: string; affectedArea: string; severity: string}>>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [bookmarkedDetails, setBookmarkedDetails] = useState<Map<string, {symptoms: string; severity: string}>>(new Map());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isErpSupport = systemType === 'erp-support';
  const systemName = isErpSupport ? 'Support Request' : 'Incident';
  const queueFilter = isErpSupport ? 'erp-support' : 'manufacturing';

  // Use unified localStorage key for favorites (same as dashboard)
  const bookmarkStorageKey = 'favorite-incidents';

  // Load bookmarks from localStorage
  useEffect(() => {
    const loadFavorites = async () => {
      const saved = localStorage.getItem(bookmarkStorageKey);
      if (saved) {
        try {
          const ids = JSON.parse(saved);
          const validIds: string[] = [];
          const newDetails = new Map<string, {symptoms: string; severity: string}>();

          // Fetch details for bookmarked incidents and filter out invalid ones
          for (const id of ids) {
            try {
              const result = await lookupIncident(id);
              if (result.success && result.incident) {
                validIds.push(id);
                newDetails.set(id, {
                  symptoms: result.incident.symptoms,
                  severity: result.incident.severity
                });
              }
            } catch (e) {
              // Silently skip invalid favorites
              console.warn(`Skipping invalid favorite: ${id}`);
            }
          }

          // Update state with only valid favorites
          if (validIds.length !== ids.length) {
            localStorage.setItem(bookmarkStorageKey, JSON.stringify(validIds));
          }
          setBookmarkedIds(validIds);
          setBookmarkedDetails(newDetails);
        } catch (e) {
          console.error('Failed to load bookmarks', e);
        }
      }
    };

    loadFavorites();

    // Listen for storage events (changes from other tabs/pages or dashboard)
    window.addEventListener('storage', loadFavorites);
    window.addEventListener('favorites-updated', loadFavorites);

    return () => {
      window.removeEventListener('storage', loadFavorites);
      window.removeEventListener('favorites-updated', loadFavorites);
    };
  }, [bookmarkStorageKey]);

  // Auto-search if ID is in URL params
  useEffect(() => {
    const urlTrackingId = searchParams.get('id');
    if (urlTrackingId && !hasSearched) {
      setSearchQuery(urlTrackingId);
      handleSmartSearch(urlTrackingId);
    }
  }, [searchParams]);

  const handleSmartSearch = async (query: string) => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery || trimmedQuery.length < 2) {
      setError('Please enter at least 2 characters to search');
      return;
    }

    setLoading(true);
    setError(null);
    setIncident(null);
    setSearchResults([]);
    setHasSearched(true);

    try {
      // Check if it looks like a full tracking ID for direct lookup
      const trackingIdPattern = /^INC-\d{8}-\d{3,}$/i;

      if (trackingIdPattern.test(trimmedQuery)) {
        // Direct lookup for full tracking ID
        const result = await lookupIncident(trimmedQuery.toUpperCase());

        if (result.success && result.incident) {
          setIncident(result.incident);
          setSearchParams({ id: trimmedQuery.toUpperCase() });
        } else {
          setError(result.error || 'Incident not found');
        }
      } else {
        // Smart search for everything else (partial ID, Jira ticket, email, keywords)
        const params = new URLSearchParams();
        params.append('queue', queueFilter);

        const response = await fetch(`${API_URL}/api/tracking/search/${encodeURIComponent(trimmedQuery)}?${params.toString()}`);
        const result = await response.json();

        if (result.success && result.incidents) {
          setSearchResults(result.incidents);
          if (result.incidents.length === 0) {
            setError(`No results found for "${trimmedQuery}"`);
          }
        } else {
          setError(result.error || 'Search failed');
        }
      }
    } catch (err) {
      setError('Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    await handleSmartSearch(searchQuery);
  };

  const handleSelectResult = async (incidentId: string) => {
    setSearchQuery(incidentId);
    await handleSmartSearch(incidentId);
  };

  const toggleBookmark = (incidentId: string) => {
    setBookmarkedIds(prev => {
      const newBookmarks = prev.includes(incidentId)
        ? prev.filter(id => id !== incidentId)
        : [...prev, incidentId];
      localStorage.setItem(bookmarkStorageKey, JSON.stringify(newBookmarks));

      // Dispatch custom event to notify dashboard and other components
      window.dispatchEvent(new Event('favorites-updated'));

      return newBookmarks;
    });

    // Save incident details if bookmarking and we have the current incident
    if (incident && incident.incidentId === incidentId && !bookmarkedIds.includes(incidentId)) {
      setBookmarkedDetails(prev => new Map(prev).set(incidentId, {
        symptoms: incident.symptoms,
        severity: incident.severity
      }));
    } else if (bookmarkedIds.includes(incidentId)) {
      // Remove from details when unbookmarking
      setBookmarkedDetails(prev => {
        const newMap = new Map(prev);
        newMap.delete(incidentId);
        return newMap;
      });
    }
  };

  const isBookmarked = (incidentId: string) => bookmarkedIds.includes(incidentId);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const refreshIncidentData = async () => {
    if (incident) {
      const result = await lookupIncident(incident.incidentId);
      if (result.success && result.incident) {
        setIncident(result.incident);
      }
    }
  };

  const handleSyncJiraQueue = async (clearExisting: boolean = false) => {
    setIsSyncing(true);
    setSyncMessage(null);

    const result = await syncJiraQueue('PHXERP', clearExisting);

    if (result.success) {
      const messages = [];
      if (clearExisting && result.cleared) {
        messages.push(`Cleared ${result.cleared} old tickets`);
      }
      messages.push(`Synced ${result.synced} ${clearExisting ? 'tickets' : 'new tickets'}`);
      if (result.skipped > 0 && !clearExisting) {
        messages.push(`${result.skipped} already existed`);
      }

      setSyncMessage({
        type: 'success',
        text: messages.join(', ')
      });
      setTimeout(() => setSyncMessage(null), 5000);

      // Refresh the page after a moment if we cleared and re-synced
      if (clearExisting) {
        setTimeout(() => window.location.reload(), 2000);
      }
    } else {
      setSyncMessage({
        type: 'error',
        text: result.error || 'Failed to sync Jira queue'
      });
      setTimeout(() => setSyncMessage(null), 5000);
    }

    setIsSyncing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />

      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2 flex-wrap">
            <h1 className="text-3xl font-bold text-text">Track Your {systemName}</h1>
            {isErpSupport && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleSyncJiraQueue(false)}
                  disabled={isSyncing}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white text-sm font-semibold rounded-lg transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Sync new tickets from PHXERP Jira queue"
                  title="Sync new tickets only (skip existing)"
                >
                  <svg className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{isSyncing ? 'Syncing...' : 'Sync New'}</span>
                </button>
                <button
                  onClick={() => handleSyncJiraQueue(true)}
                  disabled={isSyncing}
                  className="px-3 py-2 bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Clear and re-sync all tickets from PHXERP"
                  title="Clear existing synced tickets and re-sync all (up to 1000)"
                >
                  <svg className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{isSyncing ? 'Re-syncing...' : 'Clear & Re-sync'}</span>
                </button>
              </div>
            )}
          </div>
          <p className="text-text-secondary">
            Search by tracking ID or keywords to find your {systemName.toLowerCase()}
          </p>
          {syncMessage && (
            <div className={`mt-3 inline-block px-4 py-2 rounded-lg text-sm ${
              syncMessage.type === 'success'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            }`}>
              {syncMessage.text}
            </div>
          )}
        </div>

        {/* Bookmarked Incidents */}
        {bookmarkedIds.length > 0 && !incident && !loading && (
          <section className="bg-surface-card dark:bg-gray-800 rounded-xl shadow-sm border border-line p-4 mb-6" aria-label="Bookmarked incidents">
            <div className="flex items-center mb-3">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <h2 className="text-sm font-semibold text-text">Bookmarked {systemName}s</h2>
            </div>
            <div className="space-y-2">
              {bookmarkedIds.map(id => {
                const details = bookmarkedDetails.get(id);
                return (
                  <button
                    key={id}
                    onClick={() => handleSelectResult(id)}
                    className="w-full text-left px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg transition-colors group focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 min-h-[60px]"
                    aria-label={`View bookmarked incident ${id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-mono font-bold text-yellow-900 dark:text-yellow-200">{id}</span>
                          {details && (
                            <span className={`severity-badge ${
                              details.severity === 'CRITICAL' ? 'severity-critical' :
                              details.severity === 'HIGH' ? 'severity-high' :
                              details.severity === 'MEDIUM' ? 'severity-medium' :
                              'severity-low'
                            }`}>
                              {details.severity}
                            </span>
                          )}
                        </div>
                        {details && (
                          <p className="text-sm text-text-secondary line-clamp-1">{details.symptoms}</p>
                        )}
                      </div>
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-yellow-700 dark:group-hover:text-yellow-400 transition-colors ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Search Form */}
        <section className="bg-surface-card dark:bg-gray-800 rounded-xl shadow-sm border border-line p-6 mb-8" role="search" aria-label="Search for incidents">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="searchQuery" className="block text-sm font-medium text-text mb-2">
                Smart Search
              </label>
              <input
                id="searchQuery"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isErpSupport
                  ? "INC-20260302-451, 672, ERP-5677, email@ping.com, keywords..."
                  : "INC-20260302-451, 672, MIS-1234, email@ping.com, keywords..."}
                className="w-full px-4 py-3 bg-surface border border-line text-text rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-lg placeholder:text-text-muted min-h-[44px]"
                disabled={loading}
                aria-label="Smart search for incidents"
              />
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                <span>💡 <strong>Tracking ID:</strong> INC-20260302-451</span>
                <span>💡 <strong>Last digits:</strong> 672</span>
                <span>💡 <strong>Jira ticket:</strong> {isErpSupport ? 'PHXERP-5677 or ERP-5677' : 'PHXMIS-1234'}</span>
                <span>💡 <strong>Email:</strong> user@ping.com</span>
                <span>💡 <strong>Keywords:</strong> {isErpSupport ? 'eq, m3, order' : 'conveyor, assembly line'}</span>
              </div>
            </div>
            <div className="sm:self-end">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 text-white font-semibold rounded-lg shadow-md hover:from-primary-700 hover:to-primary-800 dark:hover:from-primary-600 dark:hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-h-[44px]"
                aria-label={loading ? 'Searching for incidents' : 'Search for incidents'}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Searching...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                  </span>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Search Results List */}
        {searchResults.length > 0 && !incident && (
          <section className="bg-surface-card dark:bg-gray-800 rounded-xl shadow-sm border border-line p-6 mb-8" aria-label="Search results">
            <h3 className="text-lg font-semibold text-text mb-4">
              Found {searchResults.length} {systemName.toLowerCase()}{searchResults.length !== 1 ? 's' : ''}
            </h3>
            <div className="space-y-2" role="list">
              {searchResults.map(result => (
                <button
                  key={result.incidentId}
                  onClick={() => handleSelectResult(result.incidentId)}
                  className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-line rounded-lg transition-colors group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-800 min-h-[60px]"
                  role="listitem"
                  aria-label={`View incident ${result.incidentId}, ${result.severity} severity`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-mono font-bold text-primary-600 dark:text-primary-400">{result.incidentId}</span>
                        <span className={`severity-badge ${
                          result.severity === 'CRITICAL' ? 'severity-critical' :
                          result.severity === 'HIGH' ? 'severity-high' :
                          result.severity === 'MEDIUM' ? 'severity-medium' :
                          'severity-low'
                        }`}>
                          {result.severity}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary line-clamp-2 mb-1">{result.symptoms}</p>
                      <p className="text-xs text-text-muted">{result.affectedArea}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!hasSearched && !incident && !error && (
          <div className="bg-surface-card dark:bg-gray-800 rounded-xl shadow-sm border border-line p-12 text-center">
            <svg className="w-20 h-20 mx-auto mb-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-text mb-2">Smart Search Ready</h3>
            <p className="text-text-secondary mb-4">
              Search for {systemName.toLowerCase()}s using tracking IDs, Jira tickets, emails, or keywords
            </p>
            <div className="max-w-2xl mx-auto bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-line">
              <p className="text-sm font-medium text-text mb-3">What You Can Search:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-text-secondary text-left">
                <div className="flex items-start">
                  <span className="text-primary-600 dark:text-primary-400 mr-2">📋</span>
                  <span><strong>Full ID:</strong> INC-20260302-451</span>
                </div>
                <div className="flex items-start">
                  <span className="text-primary-600 dark:text-primary-400 mr-2">🔢</span>
                  <span><strong>Last digits:</strong> 672, 1234</span>
                </div>
                <div className="flex items-start">
                  <span className="text-primary-600 dark:text-primary-400 mr-2">🎫</span>
                  <span><strong>Jira ticket:</strong> {isErpSupport ? 'PHXERP-5677 or ERP-5677' : 'PHXMIS-1234'}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-primary-600 dark:text-primary-400 mr-2">📧</span>
                  <span><strong>Reporter email:</strong> user@ping.com</span>
                </div>
                <div className="flex items-start">
                  <span className="text-primary-600 dark:text-primary-400 mr-2">🔍</span>
                  <span><strong>Keywords:</strong> conveyor, assembly</span>
                </div>
                <div className="flex items-start">
                  <span className="text-primary-600 dark:text-primary-400 mr-2">⭐</span>
                  <span><strong>Bookmarks</strong> for quick access</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6" role="alert">
            <div className="flex">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">Error</h3>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Incident Details */}
        {incident && (
          <div className="relative">
            {/* Queue Mismatch Warning */}
            {incident.queue !== queueFilter && (
              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl" role="alert">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-yellow-900 dark:text-yellow-100 mb-1">
                      Different System Type
                    </h3>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      This is a <strong>{incident.queue === 'manufacturing' ? 'Manufacturing Incident' : 'ERP Support Request'}</strong>.
                      You're currently viewing the {systemName} tracking page.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bookmark Button */}
            <button
              onClick={() => toggleBookmark(incident.incidentId)}
              className={`absolute -top-4 right-4 z-10 p-3 rounded-full shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[48px] min-w-[48px] ${
                isBookmarked(incident.incidentId)
                  ? 'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 focus:ring-yellow-500 dark:focus:ring-yellow-400'
                  : 'bg-surface-card dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-line focus:ring-primary-500 dark:focus:ring-primary-400'
              } dark:focus:ring-offset-gray-800`}
              aria-label={isBookmarked(incident.incidentId) ? `Remove bookmark for incident ${incident.incidentId}` : `Bookmark incident ${incident.incidentId}`}
              aria-pressed={isBookmarked(incident.incidentId)}
            >
              <svg className={`w-6 h-6 ${isBookmarked(incident.incidentId) ? 'text-white' : 'text-text-secondary dark:text-gray-300'}`} fill={isBookmarked(incident.incidentId) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
            <IncidentStatusCard incident={incident} onStatusRefresh={refreshIncidentData} />

            {/* Comments Section */}
            <div className="mt-6">
              <Comments
                incidentId={incident.incidentId}
                defaultAuthorName=""
                defaultAuthorEmail=""
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
