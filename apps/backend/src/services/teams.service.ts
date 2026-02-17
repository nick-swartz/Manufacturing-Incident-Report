import axios from 'axios';
import { IncidentFormData, TeamsMessageCard, SEVERITY_COLORS } from '@incident-system/shared';
import { logger } from '../utils/logger';

export class TeamsService {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
    logger.info('Teams service initialized');
  }

  async postIncident(
    incident: IncidentFormData,
    incidentId: string,
    jiraUrl: string,
    jiraTicketKey?: string
  ): Promise<string> {
    try {
      // Check if webhook URL is a Power Automate flow
      const isPowerAutomate = this.webhookUrl.includes('logic.azure.com') ||
                             this.webhookUrl.includes('prod-') ||
                             this.webhookUrl.includes('powerautomate');

      if (isPowerAutomate) {
        // Send simplified payload for Power Automate (it handles the Adaptive Card)
        const payload = {
          incidentId,
          affectedArea: incident.affectedArea,
          system: incident.system,
          severity: incident.severity,
          impactDescription: incident.impactDescription,
          symptoms: incident.symptoms,
          startTime: incident.startTime.toISOString(),
          reporterName: incident.reporterName,
          reporterContact: incident.reporterContact,
          jiraTicketKey: jiraTicketKey || 'N/A',
          jiraTicketUrl: jiraUrl
        };

        logger.info('Posting to Teams via Power Automate', {
          incidentId,
          url: this.webhookUrl.substring(0, 100) + '...'
        });

        const response = await axios.post(this.webhookUrl, payload, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        logger.info(`Power Automate response: ${response.status}`, {
          incidentId,
          status: response.status,
          data: response.data
        });

        if (response.status === 200 || response.status === 202) {
          logger.info(`Teams message posted via Power Automate for incident: ${incidentId}`);
          return 'success';
        } else {
          throw new Error(`Unexpected response: ${response.status}`);
        }
      } else {
        // Use direct Teams webhook (original MessageCard format)
        const themeColor = SEVERITY_COLORS[incident.severity];

        const card: TeamsMessageCard = {
          '@type': 'MessageCard',
          '@context': 'https://schema.org/extensions',
          title: `🚨 New Manufacturing Incident: ${incidentId}`,
          text: `**Severity: ${incident.severity}**`,
          themeColor,
          sections: [
            {
              activityTitle: 'Incident Details',
              facts: [
                {
                  name: 'Incident ID',
                  value: incidentId
                },
                {
                  name: 'Affected Area',
                  value: incident.affectedArea
                },
                {
                  name: 'System',
                  value: incident.system
                },
                {
                  name: 'Severity',
                  value: incident.severity
                },
                {
                  name: 'Impact',
                  value: incident.impactDescription.substring(0, 200) + (incident.impactDescription.length > 200 ? '...' : '')
                },
                {
                  name: 'Symptoms',
                  value: incident.symptoms.substring(0, 200) + (incident.symptoms.length > 200 ? '...' : '')
                },
                {
                  name: 'Reporter',
                  value: `${incident.reporterName} (${incident.reporterContact})`
                },
                {
                  name: 'Started',
                  value: incident.startTime.toLocaleString()
                }
              ]
            }
          ],
          potentialAction: [
            {
              '@type': 'OpenUri',
              name: 'View in Jira',
              targets: [
                {
                  os: 'default',
                  uri: jiraUrl
                }
              ]
            }
          ]
        };

        logger.debug('Posting to Teams', { incidentId });

        const response = await axios.post(this.webhookUrl, card, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        if (response.status === 200 || response.data === '1') {
          logger.info(`Teams message posted for incident: ${incidentId}`);
          return 'success';
        } else {
          throw new Error(`Unexpected response: ${response.status}`);
        }
      }
    } catch (error: any) {
      logger.error('Failed to post to Teams', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: this.webhookUrl.substring(0, 100) + '...'
      });
      throw new Error(`Failed to post to Teams: ${error.message}`);
    }
  }
}
