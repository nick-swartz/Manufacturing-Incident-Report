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
      queue: getColumnValue('queue') as 'manufacturing' | 'erp-support',
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
      createdAt: new Date(getColumnValue('created_at') as string),
      source: (getColumnValue('source') as 'local' | 'jira-queue') || 'local'
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
      const fileName = path.basename(file.path);
      const newPath = path.join(incidentDir, fileName);
      fs.renameSync(file.path, newPath);

      // Store relative path for URL access (e.g., "uploads/INC-20260302-451/image.jpg")
      const relativePath = `uploads/${incidentId}/${fileName}`;
      movedPaths.push(relativePath);
      logger.debug(`Moved file to: ${newPath}, stored as: ${relativePath}`);
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

  // Comment operations
  addComment(
    incidentId: string,
    authorName: string,
    authorEmail: string,
    commentText: string,
    jiraCommentId?: string,
    source: 'local' | 'jira' = 'local'
  ): number {
    const db = getDb();

    db.run(
      `INSERT INTO comments (incident_id, author_name, author_email, comment_text, jira_comment_id, source)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [incidentId, authorName, authorEmail, commentText, jiraCommentId || null, source]
    );

    saveDatabase();
    logger.info(`Comment added to incident ${incidentId} by ${authorName}`);

    // Get the last inserted row ID
    const result = db.exec('SELECT last_insert_rowid() as id');
    return result[0].values[0][0] as number;
  }

  getComments(incidentId: string): Array<{
    id: number;
    incidentId: string;
    authorName: string;
    authorEmail: string;
    commentText: string;
    createdAt: string;
    jiraCommentId: string | null;
    source: 'local' | 'jira';
  }> {
    const db = getDb();
    const result = db.exec(
      `SELECT * FROM comments WHERE incident_id = ? ORDER BY created_at DESC`,
      [incidentId]
    );

    if (result.length === 0 || result[0].values.length === 0) return [];

    const columns = result[0].columns;
    const comments: Array<{
      id: number;
      incidentId: string;
      authorName: string;
      authorEmail: string;
      commentText: string;
      createdAt: string;
      jiraCommentId: string | null;
      source: 'local' | 'jira';
    }> = [];

    for (const row of result[0].values) {
      const getColumnValue = (name: string): any => {
        const index = columns.indexOf(name);
        return index >= 0 ? row[index] : null;
      };

      comments.push({
        id: getColumnValue('id') as number,
        incidentId: getColumnValue('incident_id') as string,
        authorName: getColumnValue('author_name') as string,
        authorEmail: getColumnValue('author_email') as string,
        commentText: getColumnValue('comment_text') as string,
        createdAt: getColumnValue('created_at') as string,
        jiraCommentId: getColumnValue('jira_comment_id') as string | null,
        source: getColumnValue('source') as 'local' | 'jira'
      });
    }

    return comments;
  }

  updateCommentWithJiraId(commentId: number, jiraCommentId: string): void {
    const db = getDb();

    db.run(
      `UPDATE comments SET jira_comment_id = ? WHERE id = ?`,
      [jiraCommentId, commentId]
    );

    saveDatabase();
    logger.info(`Updated comment ${commentId} with Jira ID ${jiraCommentId}`);
  }

  commentExistsByJiraId(jiraCommentId: string): boolean {
    const db = getDb();
    const result = db.exec(
      `SELECT COUNT(*) as count FROM comments WHERE jira_comment_id = ?`,
      [jiraCommentId]
    );

    if (result.length === 0 || result[0].values.length === 0) return false;

    return (result[0].values[0][0] as number) > 0;
  }

  incidentExistsByJiraKey(jiraKey: string): boolean {
    const db = getDb();
    const result = db.exec(
      `SELECT COUNT(*) as count FROM incidents WHERE jira_ticket_key = ?`,
      [jiraKey]
    );

    if (result.length === 0 || result[0].values.length === 0) return false;

    return (result[0].values[0][0] as number) > 0;
  }

  incidentExistsById(incidentId: string): boolean {
    const db = getDb();
    const result = db.exec(
      `SELECT COUNT(*) as count FROM incidents WHERE incident_id = ?`,
      [incidentId]
    );

    if (result.length === 0 || result[0].values.length === 0) return false;

    return (result[0].values[0][0] as number) > 0;
  }

  clearSyncedJiraTickets(projectKey?: string): number {
    const db = getDb();

    let sql = `DELETE FROM incidents WHERE source = 'jira-queue'`;
    const params: string[] = [];

    if (projectKey) {
      sql += ` AND jira_ticket_key LIKE ?`;
      params.push(`${projectKey}-%`);
    }

    db.run(sql, params);

    // Get count of deleted rows
    const result = db.exec(`SELECT changes() as count`);
    const deletedCount = result[0].values[0][0] as number;

    saveDatabase();
    logger.info(`Cleared ${deletedCount} synced Jira tickets${projectKey ? ` from project ${projectKey}` : ''}`);

    return deletedCount;
  }

  private categorizeJiraTicket(summary: string, description: string): string {
    const summaryLower = summary.toLowerCase();
    const descriptionLower = description.toLowerCase();
    const combined = `${summaryLower} ${descriptionLower}`;

    // System Errors (check first to avoid false categorization)
    if (combined.includes('error') || combined.includes('server') ||
        combined.includes('system error') || combined.includes('500') ||
        combined.includes('404') || combined.includes('timeout')) {
      return 'System Errors / Technical';
    }

    // EQ Configurator / Ordering System (consolidated: orders, pricing, inventory, configurator)
    if (combined.includes('eq') || combined.includes('configurator') ||
        combined.includes('dropdown') || combined.includes('not available in') ||
        combined.includes('missing from eq') || combined.includes('eq ordering') ||
        combined.includes('place order') || combined.includes('configure') ||
        combined.includes('unavailable') || combined.includes('not available') ||
        combined.includes('order') || combined.includes('co ') ||
        combined.includes('cancel') || combined.includes('release') ||
        combined.includes('unlock') || summaryLower.startsWith('order ') ||
        combined.includes('price') || combined.includes('pricing') ||
        combined.includes('discount') || combined.includes('cost') ||
        combined.includes('inventory') || combined.includes('stock') ||
        combined.includes('atp') || combined.includes('sold out') ||
        combined.includes('on hand') || combined.includes('missing')) {
      return 'EQ Configurator / Ordering';
    }

    // M3 ERP System (consolidated: M3, CRM, Data/Reporting, screens, access)
    if (combined.includes('m3') || combined.includes('infor') ||
        combined.includes('ois') || combined.includes('mms') ||
        combined.includes('pms') || combined.includes('crs') ||
        combined.includes('crm') || combined.includes('customer') ||
        combined.includes('account') || combined.includes('credit hold') ||
        combined.includes('data') || combined.includes('report') ||
        combined.includes('export') || combined.includes('publisher') ||
        combined.includes('screen') || combined.includes('access') ||
        combined.includes('permission')) {
      return 'M3 ERP System';
    }

    // Default / Other - catches anything that doesn't match above categories
    return 'Other';
  }

  createIncidentFromJira(
    id: string,
    incidentId: string,
    jiraTicket: {
      key: string;
      summary: string;
      description: string;
      status: string;
      assignee: string | null;
      reporter: string;
      reporterEmail: string;
      created: string;
      priority: string;
    },
    queue: 'manufacturing' | 'erp-support'
  ): void {
    const db = getDb();

    // Map Jira priority to our severity
    const severityMap: Record<string, string> = {
      'Highest': 'CRITICAL',
      'High': 'HIGH',
      'Medium': 'MEDIUM',
      'Low': 'LOW'
    };
    const severity = severityMap[jiraTicket.priority] || 'MEDIUM';

    // Intelligently categorize the ticket based on content
    const affectedArea = this.categorizeJiraTicket(jiraTicket.summary, jiraTicket.description);

    db.run(
      `INSERT INTO incidents (
        id, incident_id, queue, affected_area, system, severity,
        impact_description, symptoms, start_time, reporter_name,
        reporter_contact, attachment_paths, status, submitted_by_user_id,
        submitted_as_guest, jira_ticket_key, jira_ticket_url, jira_status,
        jira_assignee, source, created_at, jira_key_normalized
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        incidentId,
        queue,
        affectedArea, // Use intelligent categorization
        jiraTicket.summary.substring(0, 100), // system (use summary)
        severity,
        jiraTicket.description || 'See Jira ticket for details',
        jiraTicket.summary,
        jiraTicket.created,
        jiraTicket.reporter,
        jiraTicket.reporterEmail || jiraTicket.reporter,
        JSON.stringify([]),
        'submitted',
        null,
        1, // submitted_as_guest
        jiraTicket.key,
        `${this.getJiraUrl()}/browse/${jiraTicket.key}`,
        jiraTicket.status,
        jiraTicket.assignee,
        'jira-queue',
        jiraTicket.created,
        jiraTicket.key.toUpperCase()
      ]
    );

    saveDatabase();
    logger.info(`Created incident from Jira ticket: ${jiraTicket.key} -> ${incidentId} [${affectedArea}]`);
  }

  private getJiraUrl(): string {
    // Get Jira URL from environment or default
    return process.env.JIRA_URL || 'https://jira.company.com';
  }
}
