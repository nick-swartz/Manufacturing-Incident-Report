import { Severity } from '../constants/severity';

export type Queue = 'manufacturing' | 'erp-support';

export interface IncidentFormData {
  queue: Queue;
  affectedArea: string;
  system: string;
  severity: Severity;
  impactDescription: string;
  symptoms: string;
  startTime: Date;
  reporterName: string;
  reporterContact: string;
  assigneeEmail?: string;
}

export interface IncidentRecord extends IncidentFormData {
  id: string;
  incidentId: string;
  jiraTicketKey: string | null;
  jiraTicketUrl: string | null;
  jiraStatus?: string | null;
  jiraStatusUpdatedAt?: string | null;
  jiraAssignee?: string | null;
  teamsMessageUrl: string | null;
  attachmentPaths: string[];
  status: 'pending' | 'submitted' | 'failed';
  createdAt: Date;
}

export interface SubmissionResponse {
  success: boolean;
  incidentId: string;
  jiraTicketKey?: string;
  jiraTicketUrl?: string;
  teamsPostStatus?: 'success' | 'failed';
  uploadedFiles?: string[];
  error?: string;
  message: string;
}

export interface JiraComment {
  id: string;
  author: string;
  authorDisplayName: string;
  body: string;
  created: string;
  updated: string;
}

export interface PublicIncidentData {
  incidentId: string;
  affectedArea: string;
  system: string;
  severity: Severity;
  symptoms: string;
  impactDescription: string;
  startTime: Date;
  status: 'pending' | 'submitted' | 'failed';
  createdAt: Date;
  jiraTicketKey: string | null;
  jiraTicketUrl: string | null;
  jiraStatus?: string | null;
  jiraStatusUpdatedAt?: string | null;
  jiraAssignee?: string | null;
  jiraComments?: JiraComment[];
}

export interface TrackingLookupResponse {
  success: boolean;
  incident?: PublicIncidentData;
  error?: string;
}
