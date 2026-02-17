import axios from 'axios';
import {
  SummaryMetrics,
  TimeSeriesDataPoint,
  DistributionData,
  PaginatedIncidents,
  AnalyticsFilters
} from '@incident-system/shared';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

function buildQueryParams(filters: AnalyticsFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.startDate) {
    params.append('startDate', filters.startDate);
  }

  if (filters.endDate) {
    params.append('endDate', filters.endDate);
  }

  if (filters.severity && filters.severity.length > 0) {
    params.append('severity', filters.severity.join(','));
  }

  if (filters.system && filters.system.length > 0) {
    params.append('system', filters.system.join(','));
  }

  if (filters.status && filters.status.length > 0) {
    params.append('status', filters.status.join(','));
  }

  if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
    params.append('searchQuery', filters.searchQuery.trim());
  }

  return params;
}

export async function getSummaryMetrics(filters: AnalyticsFilters): Promise<SummaryMetrics> {
  try {
    const params = buildQueryParams(filters);
    const response = await apiClient.get<SummaryMetrics>(`/analytics/summary?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.error || 'Failed to fetch summary metrics');
    }
    throw new Error(error.message || 'Network error occurred');
  }
}

export async function getIncidents(
  filters: AnalyticsFilters,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedIncidents> {
  try {
    const params = buildQueryParams(filters);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    const response = await apiClient.get<PaginatedIncidents>(`/analytics/incidents?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.error || 'Failed to fetch incidents');
    }
    throw new Error(error.message || 'Network error occurred');
  }
}

export async function getTimelineData(
  filters: AnalyticsFilters,
  groupBy: 'day' | 'week' | 'month' = 'day'
): Promise<TimeSeriesDataPoint[]> {
  try {
    const params = buildQueryParams(filters);
    params.append('groupBy', groupBy);
    const response = await apiClient.get<TimeSeriesDataPoint[]>(`/analytics/timeline?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.error || 'Failed to fetch timeline data');
    }
    throw new Error(error.message || 'Network error occurred');
  }
}

export async function getSeverityDistribution(filters: AnalyticsFilters): Promise<DistributionData[]> {
  try {
    const params = buildQueryParams(filters);
    const response = await apiClient.get<DistributionData[]>(`/analytics/by-severity?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.error || 'Failed to fetch severity distribution');
    }
    throw new Error(error.message || 'Network error occurred');
  }
}

export async function getSystemDistribution(filters: AnalyticsFilters): Promise<DistributionData[]> {
  try {
    const params = buildQueryParams(filters);
    const response = await apiClient.get<DistributionData[]>(`/analytics/by-system?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.error || 'Failed to fetch system distribution');
    }
    throw new Error(error.message || 'Network error occurred');
  }
}

export async function syncJiraStatuses(): Promise<{ success: boolean; updated: number; failed: number; skipped: number }> {
  try {
    const response = await apiClient.post<{ success: boolean; updated: number; failed: number; skipped: number }>(
      '/analytics/sync-jira-status'
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.error || 'Failed to sync Jira statuses');
    }
    throw new Error(error.message || 'Network error occurred');
  }
}
