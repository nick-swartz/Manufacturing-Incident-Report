import { Router, Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { StorageService } from '../services/storage.service';
import { JiraService } from '../services/jira.service';
import { JiraStatusSyncService } from '../services/jiraStatusSync.service';
import { SchedulerService } from '../services/scheduler.service';
import { AnalyticsFilters, Severity } from '@incident-system/shared';
import { logger } from '../utils/logger';
import { loadIntegrationConfig } from '../config/integrations';

const router = Router();

const config = loadIntegrationConfig();
const storageService = new StorageService();
const analyticsService = new AnalyticsService(storageService);
const jiraService = new JiraService(
  config.jira.url,
  config.jira.email,
  config.jira.apiToken,
  config.jira.projectKey
);
const jiraStatusSyncService = new JiraStatusSyncService(jiraService, storageService);
const schedulerService = new SchedulerService(jiraStatusSyncService);

// Export scheduler to be started by server
export const startScheduler = () => schedulerService.start();
export const stopScheduler = () => schedulerService.stop();

function parseFilters(req: Request): AnalyticsFilters {
  const filters: AnalyticsFilters = {};

  if (req.query.startDate) {
    filters.startDate = req.query.startDate as string;
  }

  if (req.query.endDate) {
    filters.endDate = req.query.endDate as string;
  }

  if (req.query.severity) {
    const severityParam = req.query.severity;
    if (typeof severityParam === 'string') {
      filters.severity = severityParam.split(',') as Severity[];
    } else if (Array.isArray(severityParam)) {
      filters.severity = severityParam as Severity[];
    }
  }

  if (req.query.system) {
    const systemParam = req.query.system;
    if (typeof systemParam === 'string') {
      filters.system = systemParam.split(',');
    } else if (Array.isArray(systemParam)) {
      filters.system = systemParam as string[];
    }
  }

  if (req.query.status) {
    const statusParam = req.query.status;
    if (typeof statusParam === 'string') {
      filters.status = statusParam.split(',') as ('pending' | 'submitted' | 'failed')[];
    } else if (Array.isArray(statusParam)) {
      filters.status = statusParam as ('pending' | 'submitted' | 'failed')[];
    }
  }

  if (req.query.searchQuery) {
    filters.searchQuery = req.query.searchQuery as string;
  }

  return filters;
}

router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = parseFilters(req);
    logger.info('Fetching summary metrics', filters);

    const summary = analyticsService.getSummaryMetrics(filters);
    res.json(summary);
  } catch (error) {
    logger.error('Failed to get summary metrics', error);
    next(error);
  }
});

router.get('/incidents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = parseFilters(req);
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    logger.info('Fetching incidents', { filters, page, limit });

    const incidents = analyticsService.getIncidents(filters, page, limit);
    res.json(incidents);
  } catch (error) {
    logger.error('Failed to get incidents', error);
    next(error);
  }
});

router.get('/timeline', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = parseFilters(req);
    const groupBy = (req.query.groupBy as 'day' | 'week' | 'month') || 'day';

    logger.info('Fetching timeline data', { filters, groupBy });

    const timeline = analyticsService.getTimelineData(filters, groupBy);
    res.json(timeline);
  } catch (error) {
    logger.error('Failed to get timeline data', error);
    next(error);
  }
});

router.get('/by-severity', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = parseFilters(req);
    logger.info('Fetching severity distribution', filters);

    const distribution = analyticsService.getSeverityDistribution(filters);
    res.json(distribution);
  } catch (error) {
    logger.error('Failed to get severity distribution', error);
    next(error);
  }
});

router.get('/by-system', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = parseFilters(req);
    logger.info('Fetching system distribution', filters);

    const distribution = analyticsService.getSystemDistribution(filters);
    res.json(distribution);
  } catch (error) {
    logger.error('Failed to get system distribution', error);
    next(error);
  }
});

router.post('/sync-jira-status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Manual Jira status sync triggered');

    const result = await schedulerService.triggerManualSync();
    res.json({
      success: true,
      message: 'Jira status sync completed',
      lastSyncTime: schedulerService.getLastSyncTime(),
      ...result
    });
  } catch (error: any) {
    if (error.message === 'Sync already in progress') {
      return res.status(409).json({
        success: false,
        message: 'Sync already in progress',
        error: error.message
      });
    }
    logger.error('Failed to sync Jira statuses', error);
    next(error);
  }
});

router.get('/sync-status', (req: Request, res: Response) => {
  res.json({
    lastSyncTime: schedulerService.getLastSyncTime(),
    syncInProgress: schedulerService.isSyncInProgress()
  });
});

export default router;
