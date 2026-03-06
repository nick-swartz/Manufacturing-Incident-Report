import { Severity } from '../constants/severity';

export interface SummaryMetrics {
  totalIncidents: number;
  bySeverity: {
    [key in Severity]: number;
  };
  byStatus: {
    pending: number;
    submitted: number;
    failed: number;
  };
  recentActivity: number; // Last 24 hours
}

export interface TimeSeriesDataPoint {
  date: string;
  count: number;
}

export interface DistributionData {
  label: string;
  count: number;
  percentage: number;
}

export interface IncidentSummary {
  id: string;
  incidentId: string;
  affectedArea: string;
  system: string;
  severity: Severity;
  impactDescription: string;
  status: 'pending' | 'submitted' | 'failed';
  createdAt: string;
  jiraTicketKey: string | null;
  jiraTicketUrl: string | null;
  jiraStatus: string | null;
  jiraStatusUpdatedAt: string | null;
  reporterName: string;
  reporterContact: string;
  jiraAssignee: string | null;
}

export interface PaginatedIncidents {
  incidents: IncidentSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  severity?: Severity[];
  system?: string[];
  status?: ('pending' | 'submitted' | 'failed')[];
  searchQuery?: string;
  submittedByUserId?: string;
}
