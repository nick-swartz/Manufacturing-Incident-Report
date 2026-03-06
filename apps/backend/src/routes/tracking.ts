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

// Search endpoint - search by symptoms or description
router.get('/search/:query', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { query } = req.params;

    if (!query || query.trim().length < 3) {
      res.status(400).json({
        success: false,
        error: 'Search query must be at least 3 characters'
      });
      return;
    }

    const db = require('../config/database').getDb();
    const searchQuery = `%${query.toLowerCase()}%`;

    const result = db.exec(
      `SELECT incident_id, symptoms, affected_area, severity FROM incidents
       WHERE LOWER(symptoms) LIKE ?
       OR LOWER(impact_description) LIKE ?
       OR LOWER(affected_area) LIKE ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [searchQuery, searchQuery, searchQuery]
    );

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

    logger.info(`Public incident search: "${query}" - found ${incidents.length} results`);

    res.json({
      success: true,
      incidents: incidents
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

    // Fetch Jira comments if ticket exists
    let jiraComments = [];
    if (jiraService && incident.jiraTicketKey) {
      try {
        jiraComments = await jiraService.getIssueComments(incident.jiraTicketKey);
      } catch (error) {
        logger.warn(`Failed to fetch comments for ${incident.jiraTicketKey}`, error);
        // Continue without comments rather than failing the entire request
      }
    }

    // Filter sensitive data for public access
    const publicIncidentData: PublicIncidentData = {
      incidentId: incident.incidentId,
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
      jiraComments: jiraComments
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
