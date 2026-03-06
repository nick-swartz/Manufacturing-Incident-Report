import express, { Router, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { upload } from '../middleware/upload';
import { validateIncidentData } from '../middleware/validation';
import { optionalAuth } from '../middleware/auth.middleware';
import { IncidentService } from '../services/incident.service';
import { StorageService } from '../services/storage.service';
import { JiraService } from '../services/jira.service';
import { TeamsService } from '../services/teams.service';
import { loadIntegrationConfig } from '../config/integrations';
import { IncidentFormData, Severity } from '@incident-system/shared';
import { logger } from '../utils/logger';

// Load environment variables from project root (2 levels up from apps/backend/)
const envPath = path.resolve(process.cwd(), '../../.env');
console.log('Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('Failed to load .env:', result.error);
} else {
  console.log('✅ .env loaded successfully');
}

const router = Router();

const config = loadIntegrationConfig();
const storageService = new StorageService();
const jiraService = new JiraService(
  config.jira.url,
  config.jira.email,
  config.jira.apiToken,
  config.jira.projectKey
);
const teamsService = new TeamsService(config.teams.webhookUrl);
const incidentService = new IncidentService(storageService, jiraService, teamsService);

// Original endpoint with file upload support (for web form)
router.post(
  '/',
  optionalAuth,
  upload.array('files', 5),
  validateIncidentData,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];

      const formData: IncidentFormData = {
        queue: req.body.queue || 'manufacturing',
        affectedArea: req.body.affectedArea,
        system: req.body.system,
        severity: req.body.severity as Severity,
        impactDescription: req.body.impactDescription,
        symptoms: req.body.symptoms,
        startTime: new Date(req.body.startTime),
        reporterName: req.body.reporterName,
        reporterContact: req.body.reporterContact,
        assigneeEmail: req.body.assigneeEmail || undefined
      };

      logger.info('Received incident submission', {
        severity: formData.severity,
        system: formData.system,
        filesCount: files?.length || 0,
        userId: req.user?.userId,
        isGuest: !req.user,
        assigneeEmail: formData.assigneeEmail || 'none'
      });

      const result = await incidentService.processIncident(formData, files, req.user?.userId);

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      next(error);
    }
  }
);

// Power Automate-friendly JSON endpoint (no file uploads)
router.post(
  '/powerautomate',
  optionalAuth,
  express.json(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Received Power Automate incident submission', {
        severity: req.body.severity,
        system: req.body.system,
        userId: req.user?.userId,
        isGuest: !req.user
      });

      // Validate required fields
      const requiredFields = [
        'affectedArea',
        'system',
        'severity',
        'impactDescription',
        'symptoms',
        'startTime',
        'reporterName',
        'reporterContact'
      ];

      const missingFields = requiredFields.filter(field => !req.body[field]);
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
          message: 'Validation failed'
        });
      }

      const formData: IncidentFormData = {
        queue: req.body.queue || 'manufacturing',
        affectedArea: req.body.affectedArea,
        system: req.body.system,
        severity: req.body.severity as Severity,
        impactDescription: req.body.impactDescription,
        symptoms: req.body.symptoms,
        startTime: new Date(req.body.startTime),
        reporterName: req.body.reporterName,
        reporterContact: req.body.reporterContact,
        assigneeEmail: req.body.assigneeEmail || undefined
      };

      const result = await incidentService.processIncident(formData, undefined, req.user?.userId);

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      next(error);
    }
  }
);

// Get available assignees (users from DB + Jira users)
router.get('/assignees', async (req: Request, res: Response) => {
  try {
    const assignees = await incidentService.getAvailableAssignees();
    res.json({ success: true, assignees });
  } catch (error: any) {
    logger.error('Failed to fetch assignees', error);
    res.status(500).json({ success: false, error: 'Failed to fetch assignees' });
  }
});

export default router;
