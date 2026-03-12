import { Router, Request, Response, NextFunction } from 'express';
import { StorageService } from '../services/storage.service';
import { JiraService } from '../services/jira.service';
import { PublicIncidentData } from '@incident-system/shared';
import { logger } from '../utils/logger';

const router = Router();
const storageService = new StorageService();

// Initialize Jira service for fetching comments
let jiraService: JiraService | null = null;
if (process.env.JIRA_URL && process.env.JIRA_EMAIL && process.env.JIRA_API_TOKEN && process.env.JIRA_PROJECT_KEY) {
  jiraService = new JiraService(
    process.env.JIRA_URL,
    process.env.JIRA_EMAIL,
    process.env.JIRA_API_TOKEN,
    process.env.JIRA_PROJECT_KEY
  );
}

// Smart search endpoint - automatically detects search type
router.get('/search/:query', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { query } = req.params;
    const { queue } = req.query;

    if (!query || query.trim().length < 2) {
      res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
      return;
    }

    const db = require('../config/database').getDb();
    let sql = '';
    let params: any[] = [];
    let searchType = 'keyword';

    // Detect search type
    const trimmedQuery = query.trim();

    // Full tracking ID: INC-20260206-672 (supports 3-5+ digit suffix)
    if (/^INC-\d{8}-\d{3,}$/i.test(trimmedQuery)) {
      searchType = 'tracking-id';
      sql = `SELECT incident_id, symptoms, affected_area, severity FROM incidents
             WHERE UPPER(incident_id) = ?`;
      params = [trimmedQuery.toUpperCase()];
    }
    // Partial tracking ID: last 3-5 digits (adaptive)
    else if (/^\d{3,5}$/.test(trimmedQuery)) {
      searchType = 'partial-id';
      sql = `SELECT incident_id, symptoms, affected_area, severity FROM incidents
             WHERE incident_id LIKE ?`;
      params = [`%-${trimmedQuery}`];
    }
    // Jira ticket key: MIS-1234, ABC-123, PHXERP-5677, or partial like ERP-5677
    else if (/^[A-Z]+-\d+$/i.test(trimmedQuery)) {
      searchType = 'jira-ticket';
      // Support both full key (PHXERP-5677) and partial key (ERP-5677)
      sql = `SELECT incident_id, symptoms, affected_area, severity FROM incidents
             WHERE UPPER(jira_ticket_key) = ? OR UPPER(jira_ticket_key) LIKE ?`;
      params = [trimmedQuery.toUpperCase(), `%${trimmedQuery.toUpperCase()}`];
    }
    // Email address: search reporter or assignee (would need assignee in DB)
    else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedQuery)) {
      searchType = 'email';
      sql = `SELECT incident_id, symptoms, affected_area, severity FROM incidents
             WHERE LOWER(reporter_contact) = ?`;
      params = [trimmedQuery.toLowerCase()];
    }
    // Keyword search: symptoms, description, area, reporter name
    else {
      searchType = 'keyword';
      const searchQuery = `%${trimmedQuery.toLowerCase()}%`;
      sql = `SELECT incident_id, symptoms, affected_area, severity FROM incidents
             WHERE (LOWER(symptoms) LIKE ?
             OR LOWER(impact_description) LIKE ?
             OR LOWER(affected_area) LIKE ?
             OR LOWER(reporter_name) LIKE ?
             OR LOWER(system) LIKE ?)`;
      params = [searchQuery, searchQuery, searchQuery, searchQuery, searchQuery];
    }

    // Add queue filter if provided
    if (queue && typeof queue === 'string') {
      sql += ' AND queue = ?';
      params.push(queue);
    }

    sql += ' ORDER BY created_at DESC LIMIT 20';

    const result = db.exec(sql, params);

    const incidents = [];
    if (result.length > 0 && result[0].values.length > 0) {
      const columns = result[0].columns;
      for (const row of result[0].values) {
        incidents.push({
          incidentId: row[0],
          symptoms: row[1],
          affectedArea: row[2],
          severity: row[3]
        });
      }
    }

    logger.info(`Smart search [${searchType}]: "${query}"${queue ? ` (queue: ${queue})` : ''} - found ${incidents.length} results`);

    res.json({
      success: true,
      incidents: incidents,
      searchType: searchType
    });
  } catch (error) {
    logger.error('Failed to search incidents', error);
    next(error);
  }
});

// Public endpoint - no authentication required
router.get('/:trackingId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { trackingId } = req.params;

    // Validate tracking ID format (INC-YYYYMMDD-###)
    const trackingIdPattern = /^INC-\d{8}-\d{3}$/;
    if (!trackingIdPattern.test(trackingId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid tracking ID format. Expected format: INC-YYYYMMDD-###'
      });
      return;
    }

    const incident = storageService.getIncident(trackingId);

    if (!incident) {
      res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
      return;
    }

    // Fetch Jira comments and attachments if ticket exists
    let jiraComments = [];
    let jiraAttachments = [];
    if (jiraService && incident.jiraTicketKey) {
      try {
        jiraComments = await jiraService.getIssueComments(incident.jiraTicketKey);
      } catch (error) {
        logger.warn(`Failed to fetch comments for ${incident.jiraTicketKey}`, error);
        // Continue without comments rather than failing the entire request
      }

      try {
        jiraAttachments = await jiraService.getIssueAttachments(incident.jiraTicketKey);
      } catch (error) {
        logger.warn(`Failed to fetch attachments for ${incident.jiraTicketKey}`, error);
        // Continue without attachments rather than failing the entire request
      }
    }

    // Filter sensitive data for public access
    const publicIncidentData: PublicIncidentData = {
      incidentId: incident.incidentId,
      queue: incident.queue,
      affectedArea: incident.affectedArea,
      system: incident.system,
      severity: incident.severity,
      symptoms: incident.symptoms,
      impactDescription: incident.impactDescription,
      startTime: incident.startTime,
      status: incident.status,
      createdAt: incident.createdAt,
      jiraTicketKey: incident.jiraTicketKey,
      jiraTicketUrl: incident.jiraTicketUrl,
      jiraStatus: incident.jiraStatus,
      jiraStatusUpdatedAt: incident.jiraStatusUpdatedAt,
      jiraAssignee: incident.jiraAssignee,
      jiraComments: jiraComments,
      jiraAttachments: jiraAttachments,
      attachmentPaths: incident.attachmentPaths || [],
      source: incident.source || 'local'
    };

    logger.info(`Public incident lookup: ${trackingId}`);

    res.json({
      success: true,
      incident: publicIncidentData
    });
  } catch (error) {
    logger.error('Failed to lookup incident', error);
    next(error);
  }
});

export default router;
