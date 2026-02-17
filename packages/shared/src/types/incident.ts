import { Severity } from '../constants/severity';

export interface IncidentFormData {
  affectedArea: string;
  system: string;
  severity: Severity;
  impactDescription: string;
  symptoms: string;
  startTime: Date;
  reporterName: string;
  reporterContact: string;
}

export interface IncidentRecord extends IncidentFormData {
  id: string;
  incidentId: string;
  jiraTicketKey: string | null;
  jiraTicketUrl: string | null;
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
