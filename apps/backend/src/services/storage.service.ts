import { getDb, saveDatabase } from '../config/database';
import { IncidentFormData, IncidentRecord } from '@incident-system/shared';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

export class StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
  }

  createIncident(
    id: string,
    incidentId: string,
    formData: IncidentFormData
  ): void {
    const db = getDb();

    db.run(
      `INSERT INTO incidents (
        id, incident_id, affected_area, system, severity,
        impact_description, symptoms, start_time, reporter_name,
        reporter_contact, attachment_paths, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        incidentId,
        formData.affectedArea,
        formData.system,
        formData.severity,
        formData.impactDescription,
        formData.symptoms,
        formData.startTime.toISOString(),
        formData.reporterName,
        formData.reporterContact,
        JSON.stringify([]),
        'pending'
      ]
    );

    saveDatabase();
    logger.info(`Incident created in database: ${incidentId}`);
  }

  updateIncident(
    incidentId: string,
    updates: {
      jiraTicketKey?: string;
      jiraTicketUrl?: string;
      jiraStatus?: string;
      jiraAssignee?: string;
      teamsMessageUrl?: string;
      attachmentPaths?: string[];
      status?: string;
    }
  ): void {
    const db = getDb();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.jiraTicketKey !== undefined) {
      fields.push('jira_ticket_key = ?');
      values.push(updates.jiraTicketKey);
    }

    if (updates.jiraTicketUrl !== undefined) {
      fields.push('jira_ticket_url = ?');
      values.push(updates.jiraTicketUrl);
    }

    if (updates.jiraStatus !== undefined) {
      fields.push('jira_status = ?');
      values.push(updates.jiraStatus);
      fields.push('jira_status_updated_at = ?');
      values.push(new Date().toISOString());
    }

    if (updates.jiraAssignee !== undefined) {
      fields.push('jira_assignee = ?');
      values.push(updates.jiraAssignee);
    }

    if (updates.teamsMessageUrl !== undefined) {
      fields.push('teams_message_url = ?');
      values.push(updates.teamsMessageUrl);
    }

    if (updates.attachmentPaths !== undefined) {
      fields.push('attachment_paths = ?');
      values.push(JSON.stringify(updates.attachmentPaths));
    }

    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }

    if (fields.length === 0) return;

    values.push(incidentId);

    db.run(
      `UPDATE incidents SET ${fields.join(', ')} WHERE incident_id = ?`,
      values
    );

    saveDatabase();
    logger.info(`Incident updated: ${incidentId}`, updates);
  }

  getAllIncidentsWithJiraTickets(): Array<{ incidentId: string; jiraTicketKey: string }> {
    const db = getDb();
    const result = db.exec(
      `SELECT incident_id, jira_ticket_key FROM incidents WHERE jira_ticket_key IS NOT NULL`
    );

    if (result.length === 0 || result[0].values.length === 0) return [];

    const columns = result[0].columns;
    const incidents: Array<{ incidentId: string; jiraTicketKey: string }> = [];

    for (const row of result[0].values) {
      const getColumnValue = (name: string): any => {
        const index = columns.indexOf(name);
        return index >= 0 ? row[index] : null;
      };

      incidents.push({
        incidentId: getColumnValue('incident_id') as string,
        jiraTicketKey: getColumnValue('jira_ticket_key') as string
      });
    }

    return incidents;
  }

  getIncident(incidentId: string): IncidentRecord | null {
    const db = getDb();
    const result = db.exec(
      `SELECT * FROM incidents WHERE incident_id = ?`,
      [incidentId]
    );

    if (result.length === 0 || result[0].values.length === 0) return null;

    const row = result[0].values[0];
    const columns = result[0].columns;

    const getColumnValue = (name: string): any => {
      const index = columns.indexOf(name);
      return index >= 0 ? row[index] : null;
    };

    return {
      id: getColumnValue('id') as string,
      incidentId: getColumnValue('incident_id') as string,
      affectedArea: getColumnValue('affected_area') as string,
      system: getColumnValue('system') as string,
      severity: getColumnValue('severity') as any,
      impactDescription: getColumnValue('impact_description') as string,
      symptoms: getColumnValue('symptoms') as string,
      startTime: new Date(getColumnValue('start_time') as string),
      reporterName: getColumnValue('reporter_name') as string,
      reporterContact: getColumnValue('reporter_contact') as string,
      jiraTicketKey: getColumnValue('jira_ticket_key') as string | null,
      jiraTicketUrl: getColumnValue('jira_ticket_url') as string | null,
      teamsMessageUrl: getColumnValue('teams_message_url') as string | null,
      attachmentPaths: JSON.parse((getColumnValue('attachment_paths') as string) || '[]'),
      status: getColumnValue('status') as any,
      createdAt: new Date(getColumnValue('created_at') as string)
    };
  }

  moveFilesToIncidentDirectory(files: Express.Multer.File[], incidentId: string): string[] {
    if (!files || files.length === 0) return [];

    const incidentDir = path.join(this.uploadDir, incidentId);

    if (!fs.existsSync(incidentDir)) {
      fs.mkdirSync(incidentDir, { recursive: true });
    }

    const movedPaths: string[] = [];

    for (const file of files) {
      const newPath = path.join(incidentDir, path.basename(file.path));
      fs.renameSync(file.path, newPath);
      movedPaths.push(newPath);
      logger.debug(`Moved file to: ${newPath}`);
    }

    return movedPaths;
  }
}
