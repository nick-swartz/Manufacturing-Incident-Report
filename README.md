# Manufacturing Incident Intake and Triage System

A proof-of-concept web application that replaces informal Teams-based incident reporting with a structured intake process. The system captures incident details via a web form, automatically creates Jira tickets, and posts summaries to Microsoft Teams.

## Overview

This system provides:

- **Web-based incident form** with validation and file uploads
- **PowerApp & Power Automate integration** for mobile incident reporting
- **Automatic Jira ticket creation** with attachments
- **Microsoft Teams notifications** via incoming webhooks
- **SQLite database** for incident tracking
- **Full type safety** with TypeScript across frontend and backend

### Deployment Options

**Option 1: Web Form (Already Implemented)**
- React-based web application
- Desktop and mobile responsive
- File upload support

**Option 2: PowerApp Integration (New!)**
- Native mobile experience
- Power Automate workflow integration
- Simplified deployment via Microsoft 365
- See [Power Automate Setup Guide](./POWER_AUTOMATE_SETUP.md) for details

## Architecture

```
manufacturing-incident-system/
├── apps/
│   ├── frontend/          # React 18 + Vite + TypeScript + Tailwind
│   └── backend/           # Node.js + Express + TypeScript
└── packages/
    └── shared/            # Shared types and constants
```

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Hook Form + Zod for validation
- React Router for navigation

**Backend:**
- Node.js + Express
- TypeScript
- SQLite (better-sqlite3)
- Multer for file uploads
- Axios for external API calls

**Integrations:**
- Jira REST API v3
- Microsoft Teams Incoming Webhooks

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Jira account with API access
- Microsoft Teams channel with incoming webhook configured

### Installation

1. Clone or navigate to the project directory:
   ```bash
   cd manufacturing-incident-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` with your configuration:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # Jira Configuration
   JIRA_URL=https://yourcompany.atlassian.net
   JIRA_EMAIL=your-email@company.com
   JIRA_API_TOKEN=your-jira-api-token-here
   JIRA_PROJECT_KEY=INC

   # Microsoft Teams Configuration
   TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/your-webhook-url-here

   # File Storage
   UPLOAD_DIR=./uploads
   DATABASE_PATH=./data/incidents.db

   # Frontend Configuration
   VITE_API_URL=http://localhost:3001/api
   ```

### Getting Jira API Token

1. Log in to your Atlassian account
2. Go to [https://id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
3. Click "Create API token"
4. Give it a label (e.g., "Manufacturing Incident System")
5. Copy the token and paste it in your `.env` file

### Getting Teams Webhook URL

1. Open Microsoft Teams and navigate to your target channel
2. Click the three dots (...) next to the channel name
3. Select "Connectors" or "Workflows"
4. Search for "Incoming Webhook"
5. Click "Add" or "Configure"
6. Give it a name (e.g., "Manufacturing Incidents")
7. Copy the webhook URL and paste it in your `.env` file

### Running in Development

Start both frontend and backend concurrently:

```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

The application will be available at:
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:3001](http://localhost:3001)
- Health check: [http://localhost:3001/health](http://localhost:3001/health)

## Usage

### Submitting an Incident

1. Open the web form at [http://localhost:5173](http://localhost:5173)
2. Fill in all required fields:
   - Affected area/process
   - System/application
   - Severity level (Critical/High/Medium/Low)
   - Impact description (20-1000 characters)
   - Symptoms (minimum 10 characters)
   - Incident start time
   - Reporter name and contact
3. Optionally attach files (max 5 files, 10MB each)
4. Click "Submit Incident"
5. View confirmation page with incident ID and Jira ticket link

### Incident Workflow

1. **Form Submission** → User fills out web form
2. **Database Save** → Incident saved to SQLite with pending status
3. **File Storage** → Attachments moved to incident directory
4. **Jira Creation** → Issue created in Jira project
5. **Attachment Upload** → Files uploaded to Jira ticket
6. **Teams Notification** → Message posted to Teams channel
7. **Status Update** → Incident marked as submitted in database
8. **Confirmation** → User sees success page with links

## API Endpoints

### POST /api/incidents

Submit a new incident report (web form with file uploads).

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `affectedArea` (string, required)
  - `system` (string, required)
  - `severity` (enum: CRITICAL|HIGH|MEDIUM|LOW, required)
  - `impactDescription` (string, 20-1000 chars, required)
  - `symptoms` (string, min 10 chars, required)
  - `startTime` (ISO datetime string, required)
  - `reporterName` (string, required)
  - `reporterContact` (string, required)
  - `files` (file array, optional, max 5 files)

**Response:**
```json
{
  "success": true,
  "incidentId": "INC-20260206-001",
  "jiraTicketKey": "INC-123",
  "jiraTicketUrl": "https://yourcompany.atlassian.net/browse/INC-123",
  "teamsPostStatus": "success",
  "uploadedFiles": ["photo.jpg", "log.txt"],
  "message": "Incident submitted successfully"
}
```

### POST /api/incidents/powerautomate

Submit a new incident report via Power Automate (JSON only, no file uploads).

**Request:**
- Content-Type: `application/json`
- Body:
```json
{
  "affectedArea": "Production Line 3",
  "system": "Manufacturing Execution System (MES)",
  "severity": "HIGH",
  "impactDescription": "Production line stopped due to system error. Unable to log work orders.",
  "symptoms": "System displays timeout error. Database connection lost.",
  "startTime": "2026-02-10T14:30:00Z",
  "reporterName": "John Smith",
  "reporterContact": "john.smith@company.com"
}
```

**Response:**
```json
{
  "success": true,
  "incidentId": "INC-20260210-001",
  "jiraTicketKey": "INC-123",
  "jiraTicketUrl": "https://yourcompany.atlassian.net/browse/INC-123",
  "teamsPostStatus": "success",
  "uploadedFiles": [],
  "message": "Incident submitted successfully"
}
```

**See also:** [Power Automate Setup Guide](./POWER_AUTOMATE_SETUP.md) for integration details.

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-06T12:00:00.000Z",
  "service": "manufacturing-incident-system"
}
```

## Building for Production

1. Build both frontend and backend:
   ```bash
   npm run build
   ```

2. The frontend build will be in `apps/frontend/dist`
3. The backend build will be in `apps/backend/dist`

4. Start the production server:
   ```bash
   npm start
   ```

## Deployment

### Option 1: Single Server Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Update backend to serve frontend (add to `apps/backend/src/server.ts`):
   ```typescript
   import path from 'path';

   // Serve static files
   app.use(express.static(path.join(__dirname, '../../frontend/dist')));

   // Catch-all route for SPA
   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
   });
   ```

3. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start apps/backend/dist/server.js --name manufacturing-incidents
   pm2 startup
   pm2 save
   ```

### Option 2: Separate Deployments

Deploy frontend and backend separately:

**Frontend:**
- Deploy to Vercel, Netlify, or static hosting
- Set `VITE_API_URL` to backend URL

**Backend:**
- Deploy to your server, AWS, Heroku, etc.
- Ensure CORS is configured for frontend origin

## Project Structure

```
manufacturing-incident-system/
├── package.json                    # Root workspace config
├── .env.example                    # Environment template
├── .env                           # Actual configuration (gitignored)
├── .gitignore
├── README.md
├── tsconfig.json
│
├── packages/
│   └── shared/                    # Shared types and constants
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── types/
│           │   ├── incident.ts           # Core data types
│           │   ├── integration.ts        # Jira/Teams types
│           │   └── index.ts
│           └── constants/
│               ├── severity.ts           # Severity enum
│               └── systems.ts            # System options
│
├── apps/
│   ├── frontend/                  # React application
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx                  # Entry point
│   │       ├── App.tsx                   # Root component
│   │       ├── api/
│   │       │   └── incidents.ts          # API client
│   │       ├── components/
│   │       │   ├── IncidentForm/
│   │       │   │   ├── index.tsx         # Main form
│   │       │   │   └── FileUpload.tsx    # File upload
│   │       │   ├── ConfirmationPage/
│   │       │   │   └── index.tsx         # Success page
│   │       │   └── common/
│   │       │       ├── Button.tsx
│   │       │       ├── Input.tsx
│   │       │       ├── Select.tsx
│   │       │       └── TextArea.tsx
│   │       ├── hooks/
│   │       ├── schemas/
│   │       │   └── incidentSchema.ts     # Zod validation
│   │       └── styles/
│   │           └── index.css             # Tailwind styles
│   │
│   └── backend/                   # Express API
│       ├── package.json
│       ├── tsconfig.json
│       ├── uploads/                      # File storage
│       ├── data/
│       │   └── incidents.db              # SQLite database
│       └── src/
│           ├── server.ts                 # Entry point
│           ├── routes/
│           │   └── incidents.ts          # API routes
│           ├── services/
│           │   ├── incident.service.ts   # Orchestration
│           │   ├── teams.service.ts      # Teams integration
│           │   ├── jira.service.ts       # Jira integration
│           │   └── storage.service.ts    # Database + files
│           ├── middleware/
│           │   ├── errorHandler.ts       # Error handling
│           │   ├── validation.ts         # Request validation
│           │   └── upload.ts             # Multer config
│           ├── utils/
│           │   ├── idGenerator.ts        # ID generation
│           │   └── logger.ts             # Logging
│           └── config/
│               ├── database.ts           # SQLite setup
│               └── integrations.ts       # Integration config
```

## Database Schema

```sql
CREATE TABLE incidents (
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
  teams_message_url TEXT,
  attachment_paths TEXT,
  status TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Troubleshooting

### Jira Authentication Fails

- Verify `JIRA_EMAIL` is correct
- Ensure API token is valid (not expired)
- Check that user has permission to create issues in the project
- Verify `JIRA_PROJECT_KEY` exists

### Teams Webhook Fails

- Verify webhook URL is correct and active
- Check that the webhook hasn't been deleted in Teams
- Ensure message format is valid
- Teams webhooks have rate limits - check if you're exceeding them

### File Upload Errors

- Check file size (max 10MB per file)
- Verify file type is allowed (images, PDF, text only)
- Ensure `UPLOAD_DIR` has write permissions
- Check disk space

### Database Errors

- Ensure `data/` directory exists
- Check file permissions on database file
- Verify SQLite is properly installed

## Future Enhancements

### Skills Mapping Integration
- Add endpoint to query skills database
- Automatically suggest subject matter experts
- Add experts as Jira watchers

### Documentation Search
- Integrate with Confluence or SharePoint
- Display related documentation on confirmation page
- Non-blocking search to avoid delays

### Historical Incident Lookup
- Add `GET /api/incidents` endpoint
- Build incident history dashboard
- Add analytics and reporting

### Advanced Features
- Email notifications
- Incident status updates
- SLA tracking
- Mobile-responsive design improvements

## Support

For issues or questions:
1. Check this README for configuration help
2. Review error logs in console
3. Verify environment variables are set correctly
4. Contact your system administrator

## License

Internal use only - Manufacturing Incident System POC

---

**Version:** 1.0.0
**Last Updated:** 2026-02-06
