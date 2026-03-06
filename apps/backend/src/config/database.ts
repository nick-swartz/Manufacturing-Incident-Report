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

  db.run(`CREATE INDEX IF NOT EXISTS idx_incident_id ON incidents(incident_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON incidents(created_at);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_system ON incidents(system);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_severity ON incidents(severity);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_queue ON incidents(queue);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);`);

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
