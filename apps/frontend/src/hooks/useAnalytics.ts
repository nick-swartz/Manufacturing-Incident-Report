import { useState, useEffect, useCallback } from 'react';
import {
  SummaryMetrics,
  TimeSeriesDataPoint,
  DistributionData,
  PaginatedIncidents,
  AnalyticsFilters
} from '@incident-system/shared';
import {
  getSummaryMetrics,
  getIncidents,
  getTimelineData,
  getSeverityDistribution,
  getSystemDistribution
} from '../api/analytics';

interface UseAnalyticsResult {
  summary: SummaryMetrics | null;
  timeline: TimeSeriesDataPoint[];
  severityDistribution: DistributionData[];
  systemDistribution: DistributionData[];
  incidents: PaginatedIncidents | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAnalytics(
  filters: AnalyticsFilters,
  page: number = 1,
  limit: number = 20
): UseAnalyticsResult {
  const [summary, setSummary] = useState<SummaryMetrics | null>(null);
  const [timeline, setTimeline] = useState<TimeSeriesDataPoint[]>([]);
  const [severityDistribution, setSeverityDistribution] = useState<DistributionData[]>([]);
  const [systemDistribution, setSystemDistribution] = useState<DistributionData[]>([]);
  const [incidents, setIncidents] = useState<PaginatedIncidents | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const fetchId = Date.now();
      console.log(`[${fetchId}] Fetching with filters:`, filters);

      try {
        const [
          summaryData,
          timelineData,
          severityData,
          systemData,
          incidentsData
        ] = await Promise.all([
          getSummaryMetrics(filters),
          getTimelineData(filters, 'day'),
          getSeverityDistribution(filters),
          getSystemDistribution(filters),
          getIncidents(filters, page, limit)
        ]);

        console.log(`[${fetchId}] Summary result:`, summaryData);
        console.log(`[${fetchId}] Incidents result:`, incidentsData);

        // Only update if not cancelled (prevents race conditions)
        if (!cancelled) {
          setSummary(summaryData);
          setTimeline(timelineData);
          setSeverityDistribution(severityData);
          setSystemDistribution(systemData);
          setIncidents(incidentsData);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to fetch analytics data');
        }
        console.error(`[${fetchId}] Analytics fetch error:`, err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [
    filters.searchQuery,
    filters.startDate,
    filters.endDate,
    JSON.stringify(filters.severity || []),
    JSON.stringify(filters.system || []),
    JSON.stringify(filters.status || []),
    page,
    limit
  ]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        summaryData,
        timelineData,
        severityData,
        systemData,
        incidentsData
      ] = await Promise.all([
        getSummaryMetrics(filters),
        getTimelineData(filters, 'day'),
        getSeverityDistribution(filters),
        getSystemDistribution(filters),
        getIncidents(filters, page, limit)
      ]);

      setSummary(summaryData);
      setTimeline(timelineData);
      setSeverityDistribution(severityData);
      setSystemDistribution(systemData);
      setIncidents(incidentsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics data');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  return {
    summary,
    timeline,
    severityDistribution,
    systemDistribution,
    incidents,
    loading,
    error,
    refetch
  };
}
