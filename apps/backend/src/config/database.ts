import initSqlJs, { Database } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

const DATABASE_PATH = process.env.DATABASE_PATH || './data/incidents.db';

let db: Database;

async function initializeDatabase(): Promise<Database> {
  const dbDir = path.dirname(DATABASE_PATH);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    logger.info(`Created database directory: ${dbDir}`);
  }

  const SQL = await initSqlJs();

  let existingDb: Buffer | undefined;
  if (fs.existsSync(DATABASE_PATH)) {
    existingDb = fs.readFileSync(DATABASE_PATH);
  }

  db = existingDb ? new SQL.Database(existingDb) : new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      incident_id TEXT UNIQUE NOT NULL,
      affected_area TEXT NOT NULL,
      system TEXT NOT NULL,
      severity TEXT NOT NULL,
      impact_description TEXT NOT NULL,
      symptoms TEXT NOT NULL,
      start_time DATETIME NOT NULL,
      reporter_name TEXT NOT NULL,
      reporter_contact TEXT NOT NULL,
      jira_ticket_key TEXT,
      jira_ticket_url TEXT,
      jira_status TEXT,
      jira_status_updated_at DATETIME,
      teams_message_url TEXT,
      attachment_paths TEXT,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      submitted_by_user_id TEXT,
      submitted_as_guest INTEGER DEFAULT 1
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      jira_email TEXT,
      jira_credentials_encrypted TEXT,
      oauth_access_token TEXT,
      oauth_refresh_token TEXT,
      oauth_token_expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME
    );
  `);

  // Migration: Add jira_status columns if they don't exist
  try {
    db.run(`ALTER TABLE incidents ADD COLUMN jira_status TEXT;`);
    logger.info('Added jira_status column to incidents table');
  } catch (e) {
    // Column already exists, ignore
  }

  try {
    db.run(`ALTER TABLE incidents ADD COLUMN jira_status_updated_at DATETIME;`);
    logger.info('Added jira_status_updated_at column to incidents table');
  } catch (e) {
    // Column already exists, ignore
  }

  try {
    db.run(`ALTER TABLE incidents ADD COLUMN jira_assignee TEXT;`);
    logger.info('Added jira_assignee column to incidents table');
  } catch (e) {
    // Column already exists, ignore
  }

  try {
    db.run(`ALTER TABLE incidents ADD COLUMN submitted_by_user_id TEXT;`);
    logger.info('Added submitted_by_user_id column to incidents table');
  } catch (e) {
    // Column already exists, ignore
  }

  try {
    db.run(`ALTER TABLE incidents ADD COLUMN submitted_as_guest INTEGER DEFAULT 1;`);
    logger.info('Added submitted_as_guest column to incidents table');
  } catch (e) {
    // Column already exists, ignore
  }

  try {
    db.run(`ALTER TABLE incidents ADD COLUMN queue TEXT DEFAULT 'manufacturing';`);
    logger.info('Added queue column to incidents table');
  } catch (e) {
    // Column already exists, ignore
  }

  // OAuth columns for users table
  try {
    db.run(`ALTER TABLE users ADD COLUMN oauth_access_token TEXT;`);
    logger.info('Added oauth_access_token column to users table');
  } catch (e) {
    // Column already exists, ignore
  }

  try {
    db.run(`ALTER TABLE users ADD COLUMN oauth_refresh_token TEXT;`);
    logger.info('Added oauth_refresh_token column to users table');
  } catch (e) {
    // Column already exists, ignore
  }

  try {
    db.run(`ALTER TABLE users ADD COLUMN oauth_token_expires_at DATETIME;`);
    logger.info('Added oauth_token_expires_at column to users table');
  } catch (e) {
    // Column already exists, ignore
  }

  // Add source field to incidents table
  try {
    db.run(`ALTER TABLE incidents ADD COLUMN source TEXT DEFAULT 'local';`);
    logger.info('Added source column to incidents table');
  } catch (e) {
    // Column already exists, ignore
  }

  // Add jira_key_normalized for faster lookups
  try {
    db.run(`ALTER TABLE incidents ADD COLUMN jira_key_normalized TEXT;`);
    logger.info('Added jira_key_normalized column to incidents table');
  } catch (e) {
    // Column already exists, ignore
  }

  // Migration: Convert absolute attachment paths to relative paths
  try {
    const result = db.exec(`SELECT incident_id, attachment_paths FROM incidents WHERE attachment_paths IS NOT NULL AND attachment_paths != '[]'`);
    if (result.length > 0 && result[0].values.length > 0) {
      let migratedCount = 0;
      for (const row of result[0].values) {
        const incidentId = row[0] as string;
        const attachmentPathsJson = row[1] as string;

        try {
          const paths = JSON.parse(attachmentPathsJson);
          let needsUpdate = false;
          const updatedPaths = paths.map((p: string) => {
            // If path is absolute (starts with / or contains full path), convert to relative
            if (p.startsWith('/') || !p.startsWith('uploads/')) {
              needsUpdate = true;
              // Extract just the filename
              const parts = p.split('/');
              const fileName = parts[parts.length - 1];
              return `uploads/${incidentId}/${fileName}`;
            }
            return p;
          });

          if (needsUpdate) {
            db.run(
              `UPDATE incidents SET attachment_paths = ? WHERE incident_id = ?`,
              [JSON.stringify(updatedPaths), incidentId]
            );
            migratedCount++;
          }
        } catch (e) {
          logger.warn(`Failed to migrate attachment paths for incident ${incidentId}`, e);
        }
      }
      if (migratedCount > 0) {
        logger.info(`Migrated attachment paths for ${migratedCount} incidents`);
        saveDatabase();
      }
    }
  } catch (e) {
    logger.warn('Failed to run attachment paths migration', e);
  }

  // Comments table
  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_email TEXT NOT NULL,
      comment_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      jira_comment_id TEXT,
      source TEXT DEFAULT 'local',
      FOREIGN KEY (incident_id) REFERENCES incidents(incident_id)
    );
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_incident_id ON incidents(incident_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON incidents(created_at);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_system ON incidents(system);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_severity ON incidents(severity);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_queue ON incidents(queue);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_comments_incident_id ON comments(incident_id);`);

  saveDatabase();

  logger.info('Database initialized successfully');

  return db;
}

export function saveDatabase(): void {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DATABASE_PATH, data);
}

export function getDb(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export { initializeDatabase };
