import {
  SummaryMetrics,
  TimeSeriesDataPoint,
  DistributionData,
  IncidentSummary,
  PaginatedIncidents,
  AnalyticsFilters,
  Severity
} from '@incident-system/shared';
import { StorageService } from './storage.service';
import { getDb } from '../config/database';
import { logger } from '../utils/logger';

export class AnalyticsService {
  constructor(private storageService: StorageService) {}

  private getColumnValue(columns: string[], row: any[], name: string): any {
    const index = columns.indexOf(name);
    return index >= 0 ? row[index] : null;
  }

  private buildWhereClause(filters: AnalyticsFilters): { clause: string; values: any[] } {
    const conditions: string[] = [];
    const values: any[] = [];

    if (filters.startDate) {
      conditions.push('created_at >= ?');
      values.push(filters.startDate);
    }

    if (filters.endDate) {
      // Append end of day time to make the end date inclusive
      conditions.push('created_at <= ?');
      values.push(filters.endDate + ' 23:59:59');
    }

    if (filters.severity && filters.severity.length > 0) {
      const placeholders = filters.severity.map(() => '?').join(',');
      conditions.push(`severity IN (${placeholders})`);
      values.push(...filters.severity);
    }

    if (filters.system && filters.system.length > 0) {
      const placeholders = filters.system.map(() => '?').join(',');
      conditions.push(`system IN (${placeholders})`);
      values.push(...filters.system);
    }

    if (filters.status && filters.status.length > 0) {
      const placeholders = filters.status.map(() => '?').join(',');
      conditions.push(`status IN (${placeholders})`);
      values.push(...filters.status);
    }

    // Text search across multiple fields
    if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
      const searchTerm = `%${filters.searchQuery.trim()}%`;
      conditions.push(`(
        incident_id LIKE ? OR
        affected_area LIKE ? OR
        system LIKE ? OR
        impact_description LIKE ? OR
        symptoms LIKE ? OR
        reporter_name LIKE ? OR
        jira_ticket_key LIKE ?
      )`);
      // Add the search term for each field
      for (let i = 0; i < 7; i++) {
        values.push(searchTerm);
      }
    }

    // Filter by user who submitted the incident
    if (filters.submittedByUserId) {
      conditions.push('submitted_by_user_id = ?');
      values.push(filters.submittedByUserId);
    }

    const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { clause, values };
  }

  getSummaryMetrics(filters: AnalyticsFilters): SummaryMetrics {
    try {
      const db = getDb();
      const { clause, values } = this.buildWhereClause(filters);

      const totalQuery = `SELECT COUNT(*) as count FROM incidents ${clause}`;
      const totalResult = db.exec(totalQuery, values);
      const totalIncidents = totalResult.length > 0 && totalResult[0].values.length > 0
        ? Number(totalResult[0].values[0][0])
        : 0;

      const severityQuery = `
        SELECT severity, COUNT(*) as count
        FROM incidents
        ${clause}
        GROUP BY severity
      `;
      const severityResult = db.exec(severityQuery, values);
      const bySeverity: SummaryMetrics['bySeverity'] = {
        [Severity.CRITICAL]: 0,
        [Severity.HIGH]: 0,
        [Severity.MEDIUM]: 0,
        [Severity.LOW]: 0
      };

      if (severityResult.length > 0 && severityResult[0].values.length > 0) {
        const columns = severityResult[0].columns;
        for (const row of severityResult[0].values) {
          const severity = this.getColumnValue(columns, row, 'severity') as Severity;
          const count = Number(this.getColumnValue(columns, row, 'count'));
          if (severity in bySeverity) {
            bySeverity[severity] = count;
          }
        }
      }

      const statusQuery = `
        SELECT status, COUNT(*) as count
        FROM incidents
        ${clause}
        GROUP BY status
      `;
      const statusResult = db.exec(statusQuery, values);
      const byStatus = {
        pending: 0,
        submitted: 0,
        failed: 0
      };

      if (statusResult.length > 0 && statusResult[0].values.length > 0) {
        const columns = statusResult[0].columns;
        for (const row of statusResult[0].values) {
          const status = this.getColumnValue(columns, row, 'status') as string;
          const count = Number(this.getColumnValue(columns, row, 'count'));
          if (status in byStatus) {
            byStatus[status as keyof typeof byStatus] = count;
          }
        }
      }

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const recentFilters = { ...filters, startDate: yesterday.toISOString() };
      const { clause: recentClause, values: recentValues } = this.buildWhereClause(recentFilters);

      const recentQuery = `SELECT COUNT(*) as count FROM incidents ${recentClause}`;
      const recentResult = db.exec(recentQuery, recentValues);
      const recentActivity = recentResult.length > 0 && recentResult[0].values.length > 0
        ? Number(recentResult[0].values[0][0])
        : 0;

      return {
        totalIncidents,
        bySeverity,
        byStatus,
        recentActivity
      };
    } catch (error) {
      logger.error('Failed to get summary metrics', error);
      throw new Error('Failed to retrieve summary metrics');
    }
  }

  getIncidents(filters: AnalyticsFilters, page: number = 1, limit: number = 20): PaginatedIncidents {
    try {
      const db = getDb();
      const { clause, values } = this.buildWhereClause(filters);

      const countQuery = `SELECT COUNT(*) as count FROM incidents ${clause}`;
      const countResult = db.exec(countQuery, values);
      const total = countResult.length > 0 && countResult[0].values.length > 0
        ? Number(countResult[0].values[0][0])
        : 0;

      const offset = (page - 1) * limit;
      const query = `
        SELECT id, incident_id, affected_area, system, severity, impact_description, status, created_at,
               jira_ticket_key, jira_ticket_url, jira_status, jira_status_updated_at,
               reporter_name, reporter_contact, jira_assignee
        FROM incidents
        ${clause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      const result = db.exec(query, [...values, limit, offset]);

      const incidents: IncidentSummary[] = [];
      if (result.length > 0 && result[0].values.length > 0) {
        const columns = result[0].columns;
        for (const row of result[0].values) {
          incidents.push({
            id: this.getColumnValue(columns, row, 'id') as string,
            incidentId: this.getColumnValue(columns, row, 'incident_id') as string,
            affectedArea: this.getColumnValue(columns, row, 'affected_area') as string,
            system: this.getColumnValue(columns, row, 'system') as string,
            severity: this.getColumnValue(columns, row, 'severity') as Severity,
            impactDescription: this.getColumnValue(columns, row, 'impact_description') as string,
            status: this.getColumnValue(columns, row, 'status') as 'pending' | 'submitted' | 'failed',
            createdAt: this.getColumnValue(columns, row, 'created_at') as string,
            jiraTicketKey: this.getColumnValue(columns, row, 'jira_ticket_key') as string | null,
            jiraTicketUrl: this.getColumnValue(columns, row, 'jira_ticket_url') as string | null,
            jiraStatus: this.getColumnValue(columns, row, 'jira_status') as string | null,
            jiraStatusUpdatedAt: this.getColumnValue(columns, row, 'jira_status_updated_at') as string | null,
            reporterName: this.getColumnValue(columns, row, 'reporter_name') as string,
            reporterContact: this.getColumnValue(columns, row, 'reporter_contact') as string,
            jiraAssignee: this.getColumnValue(columns, row, 'jira_assignee') as string | null
          });
        }
      }

      const totalPages = Math.ceil(total / limit);

      return {
        incidents,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      logger.error('Failed to get incidents', error);
      throw new Error('Failed to retrieve incidents');
    }
  }

  getTimelineData(filters: AnalyticsFilters, groupBy: 'day' | 'week' | 'month' = 'day'): TimeSeriesDataPoint[] {
    try {
      const db = getDb();
      const { clause, values } = this.buildWhereClause(filters);

      let dateFormat: string;
      switch (groupBy) {
        case 'week':
          dateFormat = `strftime('%Y-W%W', created_at)`;
          break;
        case 'month':
          dateFormat = `strftime('%Y-%m', created_at)`;
          break;
        case 'day':
        default:
          dateFormat = `DATE(created_at)`;
          break;
      }

      const query = `
        SELECT ${dateFormat} as date, COUNT(*) as count
        FROM incidents
        ${clause}
        GROUP BY ${dateFormat}
        ORDER BY date ASC
      `;

      const result = db.exec(query, values);
      const timeline: TimeSeriesDataPoint[] = [];

      if (result.length > 0 && result[0].values.length > 0) {
        const columns = result[0].columns;
        for (const row of result[0].values) {
          timeline.push({
            date: this.getColumnValue(columns, row, 'date') as string,
            count: Number(this.getColumnValue(columns, row, 'count'))
          });
        }
      }

      return timeline;
    } catch (error) {
      logger.error('Failed to get timeline data', error);
      throw new Error('Failed to retrieve timeline data');
    }
  }

  getSeverityDistribution(filters: AnalyticsFilters): DistributionData[] {
    try {
      const db = getDb();
      const { clause, values } = this.buildWhereClause(filters);

      const query = `
        SELECT severity, COUNT(*) as count
        FROM incidents
        ${clause}
        GROUP BY severity
      `;

      const result = db.exec(query, values);
      const distribution: DistributionData[] = [];
      let total = 0;

      if (result.length > 0 && result[0].values.length > 0) {
        const columns = result[0].columns;
        const counts: { [key: string]: number } = {};

        for (const row of result[0].values) {
          const severity = this.getColumnValue(columns, row, 'severity') as string;
          const count = Number(this.getColumnValue(columns, row, 'count'));
          counts[severity] = count;
          total += count;
        }

        for (const [severity, count] of Object.entries(counts)) {
          distribution.push({
            label: severity,
            count,
            percentage: total > 0 ? (count / total) * 100 : 0
          });
        }
      }

      return distribution;
    } catch (error) {
      logger.error('Failed to get severity distribution', error);
      throw new Error('Failed to retrieve severity distribution');
    }
  }

  getSystemDistribution(filters: AnalyticsFilters): DistributionData[] {
    try {
      const db = getDb();
      const { clause, values } = this.buildWhereClause(filters);

      const query = `
        SELECT system, COUNT(*) as count
        FROM incidents
        ${clause}
        GROUP BY system
        ORDER BY count DESC
      `;

      const result = db.exec(query, values);
      const distribution: DistributionData[] = [];
      let total = 0;

      if (result.length > 0 && result[0].values.length > 0) {
        const columns = result[0].columns;
        const counts: { [key: string]: number } = {};

        for (const row of result[0].values) {
          const system = this.getColumnValue(columns, row, 'system') as string;
          const count = Number(this.getColumnValue(columns, row, 'count'));
          counts[system] = count;
          total += count;
        }

        for (const [system, count] of Object.entries(counts)) {
          distribution.push({
            label: system,
            count,
            percentage: total > 0 ? (count / total) * 100 : 0
          });
        }
      }

      return distribution;
    } catch (error) {
      logger.error('Failed to get system distribution', error);
      throw new Error('Failed to retrieve system distribution');
    }
  }
}
