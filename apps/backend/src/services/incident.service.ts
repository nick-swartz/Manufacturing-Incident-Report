import { IncidentFormData, SubmissionResponse } from '@incident-system/shared';
import { StorageService } from './storage.service';
import { JiraService } from './jira.service';
import { TeamsService } from './teams.service';
import { generateIncidentId, generateUniqueId } from '../utils/idGenerator';
import { logger } from '../utils/logger';
import path from 'path';

export class IncidentService {
  constructor(
    private storageService: StorageService,
    private jiraService: JiraService,
    private teamsService: TeamsService
  ) {}

  async processIncident(
    formData: IncidentFormData,
    files?: Express.Multer.File[]
  ): Promise<SubmissionResponse> {
    const id = generateUniqueId();
    const incidentId = generateIncidentId();

    logger.info(`Processing incident: ${incidentId}`);

    try {
      this.storageService.createIncident(id, incidentId, formData);

      const attachmentPaths = files && files.length > 0
        ? this.storageService.moveFilesToIncidentDirectory(files, incidentId)
        : [];

      if (attachmentPaths.length > 0) {
        this.storageService.updateIncident(incidentId, { attachmentPaths });
      }

      let jiraTicketKey: string | undefined;
      let jiraTicketUrl: string | undefined;
      let teamsPostStatus: 'success' | 'failed' = 'failed';

      try {
        const jiraResponse = await this.jiraService.createIssue(formData, incidentId);
        jiraTicketKey = jiraResponse.key;
        jiraTicketUrl = this.jiraService.getIssueUrl(jiraResponse.key);

        logger.info(`Jira ticket created: ${jiraTicketKey}`);

        if (attachmentPaths.length > 0) {
          logger.info(`Uploading ${attachmentPaths.length} attachments to Jira`);
          for (const attachmentPath of attachmentPaths) {
            try {
              await this.jiraService.addAttachment(jiraResponse.key, attachmentPath);
            } catch (attachmentError) {
              logger.error(`Failed to upload attachment: ${attachmentPath}`, attachmentError);
            }
          }
        }

        this.storageService.updateIncident(incidentId, {
          jiraTicketKey,
          jiraTicketUrl
        });

        try {
          await this.teamsService.postIncident(formData, incidentId, jiraTicketUrl, jiraTicketKey);
          teamsPostStatus = 'success';
          this.storageService.updateIncident(incidentId, {
            teamsMessageUrl: 'posted'
          });
        } catch (teamsError) {
          logger.error('Teams post failed, but continuing', teamsError);
          teamsPostStatus = 'failed';
        }

        this.storageService.updateIncident(incidentId, {
          status: 'submitted'
        });

        const uploadedFiles = files?.map(f => f.originalname) || [];

        return {
          success: true,
          incidentId,
          jiraTicketKey,
          jiraTicketUrl,
          teamsPostStatus,
          uploadedFiles,
          message: teamsPostStatus === 'success'
            ? 'Incident submitted successfully'
            : 'Incident submitted to Jira, but Teams notification failed'
        };
      } catch (jiraError: any) {
        logger.error('Jira creation failed', jiraError);

        this.storageService.updateIncident(incidentId, {
          status: 'failed'
        });

        throw new Error(`Failed to create Jira ticket: ${jiraError.message}`);
      }
    } catch (error: any) {
      logger.error('Failed to process incident', error);

      return {
        success: false,
        incidentId,
        error: error.message,
        message: 'Failed to submit incident'
      };
    }
  }
}
