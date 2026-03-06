# OAuth 2.0 Quick Start Guide

## Quick Setup (5 minutes)

### 1. Register OAuth App in Atlassian

1. Go to https://developer.atlassian.com/console/myapps/
2. Click **Create** → **OAuth 2.0 integration**
3. Name it `Manufacturing Incident System`
4. Click **Create**

### 2. Configure OAuth

1. Go to **Authorization** tab
2. Add callback URL: `http://localhost:5173/auth/callback`
3. Add these permissions:
   - View Jira issue data (read:jira-work)
   - Create and manage issues (write:jira-work)
   - View user profile (read:jira-user)
   - Offline access (offline_access)
4. Click **Save**

### 3. Get Credentials

1. Go to **Settings** tab
2. Copy your **Client ID**
3. Click **Generate new secret** and copy it

### 4. Update Environment Variables

Edit your `.env` file:

```bash
# Add these OAuth variables
JIRA_OAUTH_CLIENT_ID=your_client_id_here
JIRA_OAUTH_CLIENT_SECRET=your_secret_here
JIRA_OAUTH_REDIRECT_URI=http://localhost:5173/auth/callback

# Keep your existing Jira URL for API calls
JIRA_URL=https://your-domain.atlassian.net
```

### 5. Start the App

```bash
# Terminal 1: Start backend
cd apps/backend
npm run dev

# Terminal 2: Start frontend
cd apps/frontend
npm run dev
```

### 6. Test Login

1. Open http://localhost:5173/login
2. Click **Sign in with Atlassian**
3. Log in with your Atlassian credentials
4. Approve access
5. You'll be redirected back and logged in!

## What Changed?

### Before (API Token):
- Users had to manually create API tokens
- Tokens had to be copied and pasted
- Required explaining token creation process

### Now (OAuth 2.0):
- ✨ Users just click "Sign in with Atlassian"
- 🔐 They log in on Atlassian's secure page
- ⚡ Instantly authenticated - no token management
- 🔄 Tokens automatically refresh when expired

## User Experience

### For Supervisors/Engineers:
1. Click "Sign in with Atlassian"
2. Enter Atlassian credentials (or already logged in)
3. Click "Accept" to grant access
4. Automatically redirected to dashboard

### For Floor Workers:
- Click "Continue as Guest"
- Submit incidents without logging in
- Get tracking ID to check status later

## Need More Help?

See the full [OAUTH_SETUP.md](./OAUTH_SETUP.md) guide for:
- Detailed configuration steps
- Troubleshooting common issues
- Security best practices
- Production deployment guide

## Troubleshooting

**"Invalid redirect URI"**
→ Make sure the callback URL in `.env` matches exactly what's in Atlassian Developer Console

**"OAuth credentials not configured"**
→ Check that `JIRA_OAUTH_CLIENT_ID` and `JIRA_OAUTH_CLIENT_SECRET` are in your `.env` file

**Still seeing API token login**
→ Clear your browser cache or use incognito mode

---

That's it! Your OAuth authentication is ready to use. 🎉
