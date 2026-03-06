import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PublicIncidentData } from '@incident-system/shared';
import { lookupIncident, searchIncidents } from '../../api/tracking';
import { Header } from '../common/Header';
import { IncidentStatusCard } from './IncidentStatusCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const TrackingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('id') || '');
  const [searchMode, setSearchMode] = useState<'id' | 'keyword'>('id');
  const [loading, setLoading] = useState(false);
  const [incident, setIncident] = useState<PublicIncidentData | null>(null);
  const [searchResults, setSearchResults] = useState<Array<{incidentId: string; symptoms: string; affectedArea: string; severity: string}>>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [bookmarkedDetails, setBookmarkedDetails] = useState<Map<string, {symptoms: string; severity: string}>>(new Map());

  // Load bookmarks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bookmarked_incidents');
    if (saved) {
      try {
        const ids = JSON.parse(saved);
        setBookmarkedIds(ids);
        // Fetch details for bookmarked incidents
        ids.forEach(async (id: string) => {
          try {
            const result = await lookupIncident(id);
            if (result.success && result.incident) {
              setBookmarkedDetails(prev => new Map(prev).set(id, {
                symptoms: result.incident!.symptoms,
                severity: result.incident!.severity
              }));
            }
          } catch (e) {
            console.error('Failed to fetch bookmark details', e);
          }
        });
      } catch (e) {
        console.error('Failed to load bookmarks', e);
      }
    }
  }, []);

  // Auto-search if ID is in URL params
  useEffect(() => {
    const urlTrackingId = searchParams.get('id');
    if (urlTrackingId && !hasSearched) {
      setSearchQuery(urlTrackingId);
      setSearchMode('id');
      handleSearchById(urlTrackingId);
    }
  }, [searchParams]);

  const handleSearchById = async (id: string) => {
    const searchId = id.trim().toUpperCase();

    if (!searchId) {
      setError('Please enter a tracking ID');
      return;
    }

    // Basic format validation
    const trackingIdPattern = /^INC-\d{8}-\d{3}$/;
    if (!trackingIdPattern.test(searchId)) {
      setError('Invalid tracking ID format. Expected format: INC-YYYYMMDD-###');
      return;
    }

    setLoading(true);
    setError(null);
    setIncident(null);
    setSearchResults([]);
    setHasSearched(true);

    try {
      const result = await lookupIncident(searchId);

      if (result.success && result.incident) {
        setIncident(result.incident);
        setSearchParams({ id: searchId });
      } else {
        setError(result.error || 'Incident not found');
      }
    } catch (err) {
      setError('Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByKeyword = async (query: string) => {
    const searchQuery = query.trim();

    if (searchQuery.length < 3) {
      setError('Please enter at least 3 characters to search');
      return;
    }

    setLoading(true);
    setError(null);
    setIncident(null);
    setSearchResults([]);
    setHasSearched(true);

    try {
      const response = await fetch(`${API_URL}/api/tracking/search/${encodeURIComponent(searchQuery)}`);
      const result = await response.json();

      if (result.success && result.incidents) {
        setSearchResults(result.incidents);
        if (result.incidents.length === 0) {
          setError('No incidents found matching your search');
        }
      } else {
        setError(result.error || 'Search failed');
      }
    } catch (err) {
      setError('Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchMode === 'id') {
      await handleSearchById(searchQuery);
    } else {
      await handleSearchByKeyword(searchQuery);
    }
  };

  const handleSelectResult = async (incidentId: string) => {
    setSearchQuery(incidentId);
    setSearchMode('id');
    await handleSearchById(incidentId);
  };

  const toggleBookmark = (incidentId: string) => {
    setBookmarkedIds(prev => {
      const newBookmarks = prev.includes(incidentId)
        ? prev.filter(id => id !== incidentId)
        : [...prev, incidentId];
      localStorage.setItem('bookmarked_incidents', JSON.stringify(newBookmarks));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />

      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">Track Your Incident</h1>
          <p className="text-text-secondary">
            Search by tracking ID or keywords to find your incident
          </p>
        </div>

        {/* Bookmarked Incidents */}
        {bookmarkedIds.length > 0 && !incident && !loading && (
          <section className="bg-surface-card dark:bg-gray-800 rounded-xl shadow-sm border border-line p-4 mb-6" aria-label="Bookmarked incidents">
            <div className="flex items-center mb-3">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <h2 className="text-sm font-semibold text-text">Bookmarked Incidents</h2>
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
          {/* Search Mode Toggle */}
          <div className="flex gap-2 mb-4" role="group" aria-label="Search mode selector">
            <button
              onClick={() => setSearchMode('id')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-800 min-h-[44px] ${
                searchMode === 'id'
                  ? 'bg-primary-600 dark:bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              aria-pressed={searchMode === 'id'}
              aria-label="Search by tracking ID"
            >
              Tracking ID
            </button>
            <button
              onClick={() => setSearchMode('keyword')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-800 min-h-[44px] ${
                searchMode === 'keyword'
                  ? 'bg-primary-600 dark:bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              aria-pressed={searchMode === 'keyword'}
              aria-label="Search by keywords"
            >
              Keyword Search
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="searchQuery" className="block text-sm font-medium text-text mb-2">
                {searchMode === 'id' ? 'Tracking ID' : 'Search Keywords'}
              </label>
              <input
                id="searchQuery"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(searchMode === 'id' ? e.target.value.toUpperCase() : e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={searchMode === 'id' ? 'INC-20260302-###' : 'e.g., assembly line, conveyor'}
                className="w-full px-4 py-3 bg-surface border border-line text-text rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-lg placeholder:text-text-muted min-h-[44px]"
                disabled={loading}
                aria-label={searchMode === 'id' ? 'Enter tracking ID' : 'Enter search keywords'}
              />
              <p className="mt-1 text-xs text-text-muted">
                {searchMode === 'id' ? 'Example: INC-20260302-451' : 'Search by symptoms, area, or description'}
              </p>
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
              Found {searchResults.length} incident{searchResults.length !== 1 ? 's' : ''}
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
            <h3 className="text-lg font-semibold text-text mb-2">Ready to Track</h3>
            <p className="text-text-secondary mb-4">
              Enter a tracking ID or search by keywords to find your incident
            </p>
            <div className="max-w-md mx-auto bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-line">
              <p className="text-sm font-medium text-text mb-2">Search Options:</p>
              <ul className="text-sm text-text-secondary text-left space-y-1">
                <li>• Search by exact tracking ID (INC-YYYYMMDD-###)</li>
                <li>• Search by keywords in symptoms or description</li>
                <li>• Search by affected area or system</li>
                <li>• Bookmark incidents for quick access</li>
              </ul>
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
            <IncidentStatusCard incident={incident} />
          </div>
        )}
      </main>
    </div>
  );
};
