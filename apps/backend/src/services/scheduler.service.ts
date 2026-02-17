import cron from 'node-cron';
import { JiraStatusSyncService } from './jiraStatusSync.service';
import { logger } from '../utils/logger';

export class SchedulerService {
  private syncTask: cron.ScheduledTask | null = null;
  private lastSyncTime: Date | null = null;
  private syncInProgress: boolean = false;

  constructor(private jiraStatusSyncService: JiraStatusSyncService) {}

  start(): void {
    // Run every 10 minutes: '*/10 * * * *'
    // For testing, you can use '*/1 * * * *' for every minute
    const cronExpression = process.env.JIRA_SYNC_CRON || '*/10 * * * *';

    this.syncTask = cron.schedule(cronExpression, async () => {
      if (this.syncInProgress) {
        logger.warn('Jira status sync already in progress, skipping this run');
        return;
      }

      try {
        this.syncInProgress = true;
        logger.info('Starting scheduled Jira status sync');

        const result = await this.jiraStatusSyncService.syncAllStatuses();
        this.lastSyncTime = new Date();

        logger.info('Scheduled Jira status sync completed', result);
      } catch (error) {
        logger.error('Scheduled Jira status sync failed', error);
      } finally {
        this.syncInProgress = false;
      }
    });

    logger.info(`Jira status sync scheduler started (cron: ${cronExpression})`);

    // Run initial sync after 30 seconds
    setTimeout(async () => {
      try {
        logger.info('Running initial Jira status sync');
        const result = await this.jiraStatusSyncService.syncAllStatuses();
        this.lastSyncTime = new Date();
        logger.info('Initial Jira status sync completed', result);
      } catch (error) {
        logger.error('Initial Jira status sync failed', error);
      }
    }, 30000);
  }

  stop(): void {
    if (this.syncTask) {
      this.syncTask.stop();
      logger.info('Jira status sync scheduler stopped');
    }
  }

  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  async triggerManualSync(): Promise<{ updated: number; failed: number; skipped: number }> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    try {
      this.syncInProgress = true;
      logger.info('Manual Jira status sync triggered');

      const result = await this.jiraStatusSyncService.syncAllStatuses();
      this.lastSyncTime = new Date();

      return result;
    } finally {
      this.syncInProgress = false;
    }
  }
}
