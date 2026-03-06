import { getDb, saveDatabase } from '../config/database';
import { IncidentFormData, IncidentRecord, User } from '@incident-system/shared';
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
    formData: IncidentFormData,
    userId?: string
  ): void {
    const db = getDb();

    db.run(
      `INSERT INTO incidents (
        id, incident_id, queue, affected_area, system, severity,
        impact_description, symptoms, start_time, reporter_name,
        reporter_contact, attachment_paths, status, submitted_by_user_id, submitted_as_guest
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        incidentId,
        formData.queue,
        formData.affectedArea,
        formData.system,
        formData.severity,
        formData.impactDescription,
        formData.symptoms,
        formData.startTime.toISOString(),
        formData.reporterName,
        formData.reporterContact,
        JSON.stringify([]),
        'pending',
        userId || null,
        userId ? 0 : 1
      ]
    );

    saveDatabase();
    logger.info(`Incident created in database: ${incidentId}`, { userId, isGuest: !userId });
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
      jiraStatus: getColumnValue('jira_status') as string | null,
      jiraStatusUpdatedAt: getColumnValue('jira_status_updated_at') as string | null,
      jiraAssignee: getColumnValue('jira_assignee') as string | null,
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

  // User operations
  createUser(
    id: string,
    email: string,
    name: string,
    role: 'admin' | 'analyst' | 'reporter',
    jiraEmail?: string
  ): User {
    const db = getDb();

    db.run(
      `INSERT INTO users (id, email, name, role, jira_email, created_at, last_login_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        email,
        name,
        role,
        jiraEmail || null,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );

    saveDatabase();
    logger.info(`User created: ${email} (${role})`);

    return {
      id,
      email,
      name,
      role,
      jiraEmail,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
  }

  getUserById(userId: string): User | null {
    const db = getDb();
    const result = db.exec(
      `SELECT * FROM users WHERE id = ?`,
      [userId]
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
      email: getColumnValue('email') as string,
      name: getColumnValue('name') as string,
      role: getColumnValue('role') as any,
      jiraEmail: getColumnValue('jira_email') as string | undefined,
      createdAt: getColumnValue('created_at') as string,
      lastLoginAt: getColumnValue('last_login_at') as string | undefined
    };
  }

  getUserByEmail(email: string): User | null {
    const db = getDb();
    const result = db.exec(
      `SELECT * FROM users WHERE email = ?`,
      [email]
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
      email: getColumnValue('email') as string,
      name: getColumnValue('name') as string,
      role: getColumnValue('role') as any,
      jiraEmail: getColumnValue('jira_email') as string | undefined,
      createdAt: getColumnValue('created_at') as string,
      lastLoginAt: getColumnValue('last_login_at') as string | undefined
    };
  }

  updateLastLogin(userId: string): void {
    const db = getDb();

    db.run(
      `UPDATE users SET last_login_at = ? WHERE id = ?`,
      [new Date().toISOString(), userId]
    );

    saveDatabase();
  }

  updateUserOAuthTokens(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date
  ): void {
    const db = getDb();

    db.run(
      `UPDATE users SET
        oauth_access_token = ?,
        oauth_refresh_token = ?,
        oauth_token_expires_at = ?,
        last_login_at = ?
      WHERE id = ?`,
      [
        accessToken,
        refreshToken,
        expiresAt.toISOString(),
        new Date().toISOString(),
        userId
      ]
    );

    saveDatabase();
    logger.info(`Updated OAuth tokens for user ${userId}`);
  }

  createUserWithOAuth(
    id: string,
    email: string,
    name: string,
    role: 'admin' | 'analyst' | 'reporter',
    accessToken: string,
    refreshToken: string,
    expiresAt: Date
  ): User {
    const db = getDb();

    db.run(
      `INSERT INTO users (
        id, email, name, role, jira_email,
        oauth_access_token, oauth_refresh_token, oauth_token_expires_at,
        created_at, last_login_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        email,
        name,
        role,
        email,
        accessToken,
        refreshToken,
        expiresAt.toISOString(),
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );

    saveDatabase();
    logger.info(`User created with OAuth: ${email} (${role})`);

    return {
      id,
      email,
      name,
      role,
      jiraEmail: email,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
  }

  listUsers(): User[] {
    const db = getDb();
    const result = db.exec(`SELECT * FROM users ORDER BY created_at DESC`);

    if (result.length === 0 || result[0].values.length === 0) return [];

    const columns = result[0].columns;
    const users: User[] = [];

    for (const row of result[0].values) {
      const getColumnValue = (name: string): any => {
        const index = columns.indexOf(name);
        return index >= 0 ? row[index] : null;
      };

      users.push({
        id: getColumnValue('id') as string,
        email: getColumnValue('email') as string,
        name: getColumnValue('name') as string,
        role: getColumnValue('role') as any,
        jiraEmail: getColumnValue('jira_email') as string | undefined,
        createdAt: getColumnValue('created_at') as string,
        lastLoginAt: getColumnValue('last_login_at') as string | undefined
      });
    }

    return users;
  }
}
