# Quick Start Guide

## Initial Setup (5 minutes)

### 1. Install Dependencies

```bash
cd manufacturing-incident-system
npm install
```

### 2. Configure Environment Variables

The `.env` file has been created with placeholder values. You need to update these with your actual credentials:

**Required Changes:**

1. **Jira Configuration:**
   - `JIRA_URL`: Your Jira instance URL (e.g., `https://yourcompany.atlassian.net`)
   - `JIRA_EMAIL`: Your Jira account email
   - `JIRA_API_TOKEN`: Generate from [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
   - `JIRA_PROJECT_KEY`: Your project key (e.g., `INC`)

2. **Teams Configuration:**
   - `TEAMS_WEBHOOK_URL`: Create an incoming webhook in your Teams channel
     1. Open Teams → Go to your channel
     2. Click ⋯ (More options) → Connectors/Workflows
     3. Add "Incoming Webhook"
     4. Copy the webhook URL

**Optional:** You can leave other values as-is for development.

### 3. Start Development Server

```bash
npm run dev
```

This starts both the frontend (port 5173) and backend (port 3001) concurrently.

**Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

## Testing the System

### 1. Test Backend Health

```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "manufacturing-incident-system"
}
```

### 2. Submit a Test Incident

1. Open http://localhost:5173 in your browser
2. Fill out the form:
   - Affected Area: "Test Area"
   - System: Select any option
   - Severity: Select a level
   - Impact Description: Enter at least 20 characters
   - Symptoms: Enter at least 10 characters
   - Start Time: Select date/time
   - Reporter Name: Your name
   - Contact: Your email or phone
3. Optionally add file attachments
4. Click "Submit Incident"

### 3. Verify Results

After submission, you should see:
- ✅ Confirmation page with incident ID
- ✅ Jira ticket created (click link to view)
- ✅ Teams message posted to your channel

## Common Issues

### Issue: "Missing required Jira configuration"

**Solution:** Ensure all Jira environment variables are set in `.env`

### Issue: "Failed to create Jira issue: Unauthorized"

**Solution:**
- Verify your `JIRA_EMAIL` is correct
- Regenerate your `JIRA_API_TOKEN`
- Ensure your Jira user has permission to create issues

### Issue: "Failed to post to Teams"

**Solution:**
- Verify your `TEAMS_WEBHOOK_URL` is correct
- Check that the webhook hasn't been deleted in Teams
- Note: If Teams fails, the incident is still submitted to Jira

### Issue: Port 3001 or 5173 already in use

**Solution:** Change the port in `.env`:
```env
PORT=3002  # Or any available port
```

For frontend, update in `apps/frontend/vite.config.ts`.

## Project Structure

```
manufacturing-incident-system/
├── apps/
│   ├── frontend/     # React web app (port 5173)
│   └── backend/      # Express API (port 3001)
└── packages/
    └── shared/       # Shared TypeScript types
```

## Development Workflow

### Run Frontend Only
```bash
npm run dev:frontend
```

### Run Backend Only
```bash
npm run dev:backend
```

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

## Next Steps

1. **Customize System Options**: Edit `packages/shared/src/constants/systems.ts` to add your systems
2. **Customize Form Fields**: Modify `apps/frontend/src/components/IncidentForm/index.tsx`
3. **Add Business Logic**: Extend services in `apps/backend/src/services/`
4. **Integrate with Skills Database**: Add skills mapping service
5. **Add Historical Incident View**: Create incident list and detail pages

## Resources

- Full documentation: See `README.md`
- Backend API: `apps/backend/src/routes/incidents.ts`
- Frontend form: `apps/frontend/src/components/IncidentForm/index.tsx`
- Shared types: `packages/shared/src/types/`

## Support

For detailed configuration and deployment instructions, refer to `README.md`.

---

**Ready to go?** Just run `npm run dev` and open http://localhost:5173
