import React, { useState, useMemo } from 'react';
import { AnalyticsFilters, Severity } from '@incident-system/shared';
import { useAnalytics } from '../../hooks/useAnalytics';
import { syncJiraStatuses } from '../../api/analytics';
import { useAuth } from '../../contexts/AuthContext';
import { Header } from '../common/Header';
import { SearchBar } from './SearchBar';
import { QuickFilters } from './QuickFilters';
import { ActiveFilterChips } from './ActiveFilterChips';
import { MetricsCards } from './MetricsCards';
import { SeverityChart } from './SeverityChart';
import { TimelineChart } from './TimelineChart';
import { SystemDistributionChart } from './SystemDistributionChart';
import { IncidentsTable } from './IncidentsTable';
import { DashboardFilters } from './DashboardFilters';
import { TabNavigation, DashboardTab } from './TabNavigation';
import { TrackById } from './TrackById';

export const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Start with no date filter - show all incidents
  const [filters, setFilters] = useState<AnalyticsFilters>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('all');
  const [favoritesRefresh, setFavoritesRefresh] = useState(0);

  // Apply tab-specific filters
  const effectiveFilters = useMemo(() => {
    const tabFilters = { ...filters };

    if (activeTab === 'my-incidents' && user) {
      tabFilters.submittedByUserId = user.userId;
    }

    return tabFilters;
  }, [filters, activeTab, user]);

  const {
    summary,
    timeline,
    severityDistribution,
    systemDistribution,
    incidents,
    loading,
    error,
    refetch
  } = useAnalytics(effectiveFilters, page, 20);

  // Show favorites only when on favorites tab
  const showFavoritesOnly = activeTab === 'favorites';

  // Listen for favorites updates
  React.useEffect(() => {
    const handleFavoritesUpdate = () => {
      setFavoritesRefresh(prev => prev + 1);
    };

    window.addEventListener('favorites-updated', handleFavoritesUpdate);
    window.addEventListener('storage', handleFavoritesUpdate);

    return () => {
      window.removeEventListener('favorites-updated', handleFavoritesUpdate);
      window.removeEventListener('storage', handleFavoritesUpdate);
    };
  }, []);

  // Calculate counts for tab badges
  const favoritesCount = useMemo(() => {
    try {
      const saved = localStorage.getItem('favorite-incidents');
      return saved ? JSON.parse(saved).length : 0;
    } catch {
      return 0;
    }
  }, [favoritesRefresh]); // Re-calculate when favorites change

  const myIncidentsCount = summary?.totalIncidents || 0; // Total in current filtered view

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, searchQuery }));
    setPage(1);
    setActiveQuickFilter(null);
  };

  const handleQuickFilterSelect = (filterId: string, quickFilters: Partial<AnalyticsFilters>) => {
    if (activeQuickFilter === filterId) {
      // Deselect - reset to no filters
      setActiveQuickFilter(null);
      setFilters({});
      setSearchQuery('');
    } else {
      // Apply quick filter
      setActiveQuickFilter(filterId);
      setFilters(prev => ({
        ...prev,
        ...quickFilters
      }));
    }
    setPage(1);
  };

  const handleFiltersChange = (newFilters: AnalyticsFilters) => {
    setFilters(newFilters);
    setPage(1);
    setActiveQuickFilter(null);
  };

  const handleRemoveFilter = (filterKey: keyof AnalyticsFilters, value?: string) => {
    setFilters(prev => {
      const updated = { ...prev };

      if (filterKey === 'startDate' || filterKey === 'endDate') {
        // Remove both date filters - don't add defaults
        delete updated.startDate;
        delete updated.endDate;
      } else if (filterKey === 'searchQuery') {
        delete updated.searchQuery;
        setSearchQuery('');
      } else if (value && Array.isArray(updated[filterKey])) {
        // Remove specific value from array
        const arr = updated[filterKey] as string[];
        updated[filterKey] = arr.filter(v => v !== value) as any;
        if ((updated[filterKey] as any[]).length === 0) {
          delete updated[filterKey];
        }
      } else {
        delete updated[filterKey];
      }

      return updated;
    });
    setActiveQuickFilter(null);
  };

  const handleClearAll = () => {
    setFilters({});
    setSearchQuery('');
    setActiveQuickFilter(null);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    setPage(1); // Reset to first page when changing tabs
    setActiveQuickFilter(null); // Clear quick filters when changing tabs
  };

  const handleSyncJiraStatuses = async () => {
    setSyncing(true);
    setSyncMessage(null);

    try {
      const result = await syncJiraStatuses();
      setSyncMessage({
        type: 'success',
        text: `Sync completed: ${result.updated} updated, ${result.failed} failed, ${result.skipped} skipped`
      });
      await refetch();
    } catch (error: any) {
      setSyncMessage({
        type: 'error',
        text: error.message || 'Failed to sync Jira statuses'
      });
    } finally {
      setSyncing(false);
    }
  };

  const hasActiveFilters = filters.searchQuery ||
    (filters.severity && filters.severity.length > 0) ||
    (filters.system && filters.system.length > 0) ||
    (filters.status && filters.status.length > 0) ||
    filters.startDate ||
    filters.endDate;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text">Incident Analytics Dashboard</h1>
          <p className="text-text-secondary mt-2">
            Comprehensive overview of manufacturing incidents and trends
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
          />
        </div>

        {/* Quick Filters */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <QuickFilters
              activeFilterId={activeQuickFilter}
              onFilterSelect={handleQuickFilterSelect}
            />
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-4 py-2 rounded-md text-sm font-medium bg-surface-card text-text-secondary border border-line hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-800 min-h-[44px]"
              aria-expanded={showAdvancedFilters}
              aria-controls="advanced-filters"
              aria-label={showAdvancedFilters ? 'Hide advanced filters' : 'Show more filters'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={showAdvancedFilters ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
                />
              </svg>
              {showAdvancedFilters ? 'Hide' : 'More'} Filters
            </button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="mb-4">
            <ActiveFilterChips
              filters={filters}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={handleClearAll}
            />
          </div>
        )}

        {/* Advanced Filters */}
        <DashboardFilters
          filters={filters}
          onChange={handleFiltersChange}
          isExpanded={showAdvancedFilters}
          onToggleExpanded={() => setShowAdvancedFilters(!showAdvancedFilters)}
        />

        {error && (
          <div role="alert" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
            <button
              onClick={refetch}
              className="mt-3 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-800 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 min-h-[44px]"
              aria-label="Retry loading dashboard data"
            >
              Retry
            </button>
          </div>
        )}

        {/* Quick Track by ID */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <TrackById />
          </div>
          <div className="text-xs text-text-muted">
            Quick lookup by incident ID
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <TabNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isAuthenticated={isAuthenticated}
            myIncidentsCount={activeTab === 'my-incidents' ? myIncidentsCount : undefined}
            favoritesCount={favoritesCount}
          />
        </div>

        <MetricsCards summary={summary} loading={loading} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SeverityChart data={severityDistribution} loading={loading} error={null} />
          <TimelineChart data={timeline} loading={loading} error={null} />
        </div>

        <div className="mb-6">
          <SystemDistributionChart data={systemDistribution} loading={loading} error={null} />
        </div>

        <div className="mb-4 flex justify-end">
          <button
            onClick={handleSyncJiraStatuses}
            disabled={syncing}
            className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-800 min-h-[44px]"
            aria-label={syncing ? 'Syncing Jira statuses' : 'Sync Jira statuses'}
            aria-live="polite"
            aria-busy={syncing}
          >
            {syncing ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync Jira Status
              </>
            )}
          </button>
        </div>

        {syncMessage && (
          <div
            role="alert"
            aria-live="polite"
            className={`mb-4 p-4 rounded-lg ${
              syncMessage.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}
          >
            <div className="flex items-center">
              {syncMessage.type === 'success' ? (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <p>{syncMessage.text}</p>
            </div>
          </div>
        )}

        <IncidentsTable
          incidents={incidents}
          loading={loading}
          error={null}
          onPageChange={handlePageChange}
          showFavoritesOnly={showFavoritesOnly}
        />
      </main>
    </div>
  );
};
