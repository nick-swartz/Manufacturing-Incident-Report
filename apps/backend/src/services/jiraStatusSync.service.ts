import { JiraService } from './jira.service';
import { StorageService } from './storage.service';
import { logger } from '../utils/logger';

export class JiraStatusSyncService {
  constructor(
    private jiraService: JiraService,
    private storageService: StorageService
  ) {}

  async syncAllStatuses(): Promise<{ updated: number; failed: number; skipped: number }> {
    logger.info('Starting Jira status sync...');

    const incidents = this.storageService.getAllIncidentsWithJiraTickets();

    if (incidents.length === 0) {
      logger.info('No incidents with Jira tickets found');
      return { updated: 0, failed: 0, skipped: 0 };
    }

    logger.info(`Found ${incidents.length} incidents with Jira tickets`);

    const issueKeys = incidents.map(i => i.jiraTicketKey);
    const statusMap = await this.jiraService.getMultipleIssueStatuses(issueKeys);

    let updated = 0;
    let failed = 0;
    let skipped = 0;

    for (const incident of incidents) {
      try {
        const statusInfo = statusMap.get(incident.jiraTicketKey);

        if (statusInfo) {
          this.storageService.updateIncident(incident.incidentId, {
            jiraStatus: statusInfo.status,
            jiraAssignee: statusInfo.assignee
          });
          updated++;
          logger.debug(`Updated ${incident.jiraTicketKey}: status=${statusInfo.status}, assignee=${statusInfo.assignee || 'Unassigned'}`);
        } else {
          skipped++;
          logger.warn(`No status found for ${incident.jiraTicketKey}`);
        }
      } catch (error: any) {
        failed++;
        logger.error(`Failed to update status for ${incident.incidentId}`, error);
      }
    }

    logger.info(`Jira status sync completed: ${updated} updated, ${failed} failed, ${skipped} skipped`);

    return { updated, failed, skipped };
  }

  async syncSingleStatus(incidentId: string, jiraTicketKey: string): Promise<boolean> {
    try {
      const statusInfo = await this.jiraService.getIssueStatus(jiraTicketKey);

      if (statusInfo) {
        this.storageService.updateIncident(incidentId, {
          jiraStatus: statusInfo.status,
          jiraAssignee: statusInfo.assignee
        });
        logger.info(`Updated ${jiraTicketKey}: status=${statusInfo.status}, assignee=${statusInfo.assignee || 'Unassigned'}`);
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error(`Failed to sync status for ${jiraTicketKey}`, error);
      return false;
    }
  }
}
