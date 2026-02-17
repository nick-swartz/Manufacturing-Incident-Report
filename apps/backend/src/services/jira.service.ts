import axios, { AxiosInstance } from 'axios';
import { IncidentFormData, JiraIssueResponse, Severity } from '@incident-system/shared';
import { logger } from '../utils/logger';
import fs from 'fs';
import FormData from 'form-data';

export class JiraService {
  private client: AxiosInstance;
  private serviceDeskClient: AxiosInstance;
  private projectKey: string;
  private jiraUrl: string;
  private serviceDeskId: string | null = null;

  constructor(url: string, email: string, apiToken: string, projectKey: string) {
    this.jiraUrl = url;
    this.projectKey = projectKey;

    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

    this.client = axios.create({
      baseURL: `${url}/rest/api/3`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    // Service Desk API client
    this.serviceDeskClient = axios.create({
      baseURL: `${url}/rest/servicedeskapi`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-ExperimentalApi': 'opt-in'
      },
      timeout: 30000
    });

    logger.info('Jira service initialized');
    this.initializeServiceDesk();
  }

  private async initializeServiceDesk(): Promise<void> {
    try {
      // Get the service desk ID for the project
      const response = await this.serviceDeskClient.get(`/servicedesk/projectKey:${this.projectKey}`);
      this.serviceDeskId = response.data.id;
      logger.info(`Service Desk ID: ${this.serviceDeskId}`);
    } catch (error: any) {
      logger.warn('Failed to get Service Desk ID, will use regular API', error.message);
    }
  }

  private mapSeverityToPriority(severity: Severity): string {
    const mapping: Record<Severity, string> = {
      [Severity.CRITICAL]: 'Highest',
      [Severity.HIGH]: 'High',
      [Severity.MEDIUM]: 'Medium',
      [Severity.LOW]: 'Low'
    };
    return mapping[severity] || 'Medium';
  }

  private buildDescription(incident: IncidentFormData, incidentId: string): any {
    return {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Incident Details' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Incident ID: ', marks: [{ type: 'strong' }] },
            { type: 'text', text: incidentId }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Affected Area: ', marks: [{ type: 'strong' }] },
            { type: 'text', text: incident.affectedArea }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'System: ', marks: [{ type: 'strong' }] },
            { type: 'text', text: incident.system }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Impact' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: incident.impactDescription }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Symptoms' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: incident.symptoms }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Reporter Information' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Name: ', marks: [{ type: 'strong' }] },
            { type: 'text', text: incident.reporterName }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Contact: ', marks: [{ type: 'strong' }] },
            { type: 'text', text: incident.reporterContact }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Incident Start Time: ', marks: [{ type: 'strong' }] },
            { type: 'text', text: incident.startTime.toLocaleString() }
          ]
        }
      ]
    };
  }

  async createIssue(incident: IncidentFormData, incidentId: string): Promise<JiraIssueResponse> {
    const summary = `[${incident.severity}] ${incident.affectedArea} - ${incident.system}`;

    // Try Service Desk API first if we have a service desk ID
    if (this.serviceDeskId) {
      try {
        return await this.createServiceDeskRequest(incident, incidentId, summary);
      } catch (error: any) {
        logger.warn('Service Desk API failed, falling back to regular API', error.message);
      }
    }

    // Fall back to regular Jira API
    try {
      const payload = {
        fields: {
          project: {
            key: this.projectKey
          },
          summary: summary.substring(0, 255),
          description: this.buildDescription(incident, incidentId),
          issuetype: {
            name: '[System] Service request'
          },
          customfield_10010: '188', // "Get technical help"
          labels: ['manufacturing', 'auto-generated', incident.severity.toLowerCase()]
        }
      };

      logger.debug('Creating Jira issue via regular API', {
        summary,
        reporterEmail: incident.reporterContact,
        payload: JSON.stringify(payload)
      });

      const response = await this.client.post<JiraIssueResponse>('/issue', payload);

      logger.info(`Jira issue created: ${response.data.key} (Reporter info in description)`);

      return response.data;
    } catch (error: any) {
      logger.error('Failed to create Jira issue', error.response?.data || error);
      throw new Error(`Failed to create Jira issue: ${error.response?.data?.errorMessages?.[0] || error.message}`);
    }
  }

  private async createServiceDeskRequest(
    incident: IncidentFormData,
    incidentId: string,
    summary: string
  ): Promise<JiraIssueResponse> {
    const payload = {
      serviceDeskId: this.serviceDeskId,
      requestTypeId: '188', // "Get technical help"
      requestFieldValues: {
        summary: summary.substring(0, 255),
        description: this.buildDescriptionText(incident, incidentId)
      },
      raiseOnBehalfOf: incident.reporterContact // Set the customer email
    };

    logger.debug('Creating Service Desk request', {
      summary,
      reporterEmail: incident.reporterContact,
      payload: JSON.stringify(payload)
    });

    const response = await this.serviceDeskClient.post('/request', payload);

    // Convert Service Desk response to match JiraIssueResponse format
    const issueKey = response.data.issueKey;

    logger.info(`Service Desk request created: ${issueKey} (Reporter: ${incident.reporterContact})`);

    return {
      id: response.data.issueId,
      key: issueKey,
      self: response.data._links?.self || `${this.jiraUrl}/rest/api/3/issue/${issueKey}`
    };
  }

  private buildDescriptionText(incident: IncidentFormData, incidentId: string): string {
    return `
**Incident Details**

Incident ID: ${incidentId}
Affected Area: ${incident.affectedArea}
System: ${incident.system}

**Impact**

${incident.impactDescription}

**Symptoms**

${incident.symptoms}

**Reporter Information**

Name: ${incident.reporterName}
Contact: ${incident.reporterContact}
Incident Start Time: ${incident.startTime.toLocaleString()}
    `.trim();
  }

  async addAttachment(issueKey: string, filePath: string): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));

      const auth = this.client.defaults.headers['Authorization'];

      await axios.post(
        `${this.jiraUrl}/rest/api/3/issue/${issueKey}/attachments`,
        formData,
        {
          headers: {
            'Authorization': auth,
            'X-Atlassian-Token': 'no-check',
            ...formData.getHeaders()
          },
          timeout: 60000
        }
      );

      logger.info(`Attachment added to Jira issue ${issueKey}: ${filePath}`);
    } catch (error: any) {
      logger.error(`Failed to add attachment to Jira issue ${issueKey}`, error.response?.data || error);
      throw new Error(`Failed to add attachment: ${error.message}`);
    }
  }

  getIssueUrl(issueKey: string): string {
    return `${this.jiraUrl}/browse/${issueKey}`;
  }

  async getIssueStatus(issueKey: string): Promise<{ status: string; statusCategory: string; assignee: string | null } | null> {
    try {
      const response = await this.client.get(`/issue/${issueKey}`, {
        params: {
          fields: 'status,assignee'
        }
      });

      const status = response.data.fields?.status;
      const assignee = response.data.fields?.assignee;

      if (status) {
        return {
          status: status.name || 'Unknown',
          statusCategory: status.statusCategory?.name || 'Unknown',
          assignee: assignee?.displayName || assignee?.emailAddress || null
        };
      }

      return null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.warn(`Jira issue not found: ${issueKey}`);
        return null;
      }
      logger.error(`Failed to get Jira issue status for ${issueKey}`, error.response?.data || error);
      throw new Error(`Failed to get Jira issue status: ${error.message}`);
    }
  }

  async getMultipleIssueStatuses(issueKeys: string[]): Promise<Map<string, { status: string; statusCategory: string; assignee: string | null }>> {
    const statusMap = new Map<string, { status: string; statusCategory: string; assignee: string | null }>();

    if (issueKeys.length === 0) {
      return statusMap;
    }

    try {
      // Fetch all issues in a single JQL query for efficiency
      const jql = `key IN (${issueKeys.map(k => `${k}`).join(',')})`;

      const response = await this.client.post('/search/jql', {
        jql,
        fields: ['key', 'status', 'assignee'],
        maxResults: 100
      });

      for (const issue of response.data.issues || []) {
        const status = issue.fields?.status;
        const assignee = issue.fields?.assignee;
        if (status) {
          statusMap.set(issue.key, {
            status: status.name || 'Unknown',
            statusCategory: status.statusCategory?.name || 'Unknown',
            assignee: assignee?.displayName || assignee?.emailAddress || null
          });
        }
      }

      logger.info(`Fetched statuses and assignees for ${statusMap.size} issues`);
      return statusMap;
    } catch (error: any) {
      logger.error('Failed to fetch multiple Jira issue statuses', error.response?.data || error);
      // Return empty map instead of throwing to allow graceful degradation
      return statusMap;
    }
  }
}
