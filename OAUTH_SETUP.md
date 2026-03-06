# OAuth 2.0 Authentication Setup Guide

This guide walks you through setting up OAuth 2.0 authentication with Atlassian for the Manufacturing Incident Management System.

## Overview

The application uses **OAuth 2.0 (3-legged OAuth)** to authenticate users via their Atlassian accounts. This provides a secure, user-friendly login experience without requiring API token management.

## Prerequisites

- An Atlassian account with admin access
- Access to the [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)

## Step 1: Create an OAuth 2.0 App in Atlassian

1. Go to the [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)

2. Click **"Create"** → **"OAuth 2.0 integration"**

3. Fill in the app details:
   - **App name**: `Manufacturing Incident System` (or your preferred name)
   - **Description**: Application for managing manufacturing incidents

4. Click **"Create"**

## Step 2: Configure OAuth Settings

1. In your app's settings, navigate to **"Authorization"** tab

2. Under **"OAuth 2.0 (3LO)"**, click **"Configure"**

3. Add **Callback URL**:
   - For development: `http://localhost:5173/auth/callback`
   - For production: `https://yourdomain.com/auth/callback`

   You can add multiple callback URLs for different environments.

4. Configure **Permissions**:
   Click **"Add"** under Permissions and select:
   - `View Jira issue data` (read:jira-work)
   - `Create and manage issues` (write:jira-work)
   - `View user profile information` (read:jira-user)
   - `Offline access` (offline_access) - Required for refresh tokens

5. **Save** your changes

## Step 3: Get OAuth Credentials

1. In the **"Settings"** tab, you'll find:
   - **Client ID** - A public identifier for your app
   - **Secret** - Click **"Generate new secret"** to create one

2. **Copy both values** - you'll need them for environment variables

   ⚠️ **Important**: The secret is only shown once. Store it securely!

## Step 4: Configure Environment Variables

Create or update your `.env` file in the project root:

```bash
# OAuth 2.0 Configuration
JIRA_OAUTH_CLIENT_ID=your_client_id_here
JIRA_OAUTH_CLIENT_SECRET=your_client_secret_here

# Development
JIRA_OAUTH_REDIRECT_URI=http://localhost:5173/auth/callback

# Production (uncomment and update when deploying)
# JIRA_OAUTH_REDIRECT_URI=https://yourdomain.com/auth/callback

# Optional: Customize scopes (default is usually sufficient)
# JIRA_OAUTH_SCOPES=read:jira-user read:jira-work write:jira-work offline_access

# JWT Configuration (keep existing or generate new)
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRY=7d
```

### Environment Variable Descriptions:

| Variable | Description | Required |
|----------|-------------|----------|
| `JIRA_OAUTH_CLIENT_ID` | OAuth 2.0 Client ID from Atlassian | Yes |
| `JIRA_OAUTH_CLIENT_SECRET` | OAuth 2.0 Client Secret from Atlassian | Yes |
| `JIRA_OAUTH_REDIRECT_URI` | Callback URL (must match Atlassian config) | Yes |
| `JIRA_OAUTH_SCOPES` | Space-separated OAuth scopes | No (has default) |
| `JWT_SECRET` | Secret for signing JWT tokens | Yes |
| `JWT_EXPIRY` | JWT expiration time (e.g., 7d, 24h) | No (default: 7d) |

## Step 5: Start the Application

1. Install dependencies (if not already done):
   ```bash
   npm install
   ```

2. Start the backend:
   ```bash
   cd apps/backend
   npm run dev
   ```

3. Start the frontend (in a new terminal):
   ```bash
   cd apps/frontend
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

## How OAuth Login Works

### User Experience:

1. User clicks **"Sign in with Atlassian"**
2. Redirected to Atlassian's secure login page
3. User logs in with their Atlassian credentials
4. User approves access (first time only)
5. Redirected back to the app, automatically logged in
6. Can now access the dashboard and all features

### Technical Flow:

```
┌─────────┐         ┌─────────────┐         ┌────────────┐
│  User   │         │  Your App   │         │ Atlassian  │
└────┬────┘         └──────┬──────┘         └─────┬──────┘
     │                     │                      │
     │  1. Click Login     │                      │
     ├────────────────────>│                      │
     │                     │                      │
     │  2. Redirect to     │                      │
     │     Atlassian       │                      │
     ├─────────────────────┼─────────────────────>│
     │                     │                      │
     │  3. Enter           │                      │
     │     Credentials     │                      │
     │<────────────────────┼──────────────────────┤
     │                     │                      │
     │  4. Redirect back   │                      │
     │     with code       │                      │
     ├────────────────────>│                      │
     │                     │                      │
     │                     │  5. Exchange code    │
     │                     │     for tokens       │
     │                     ├─────────────────────>│
     │                     │                      │
     │                     │  6. Return tokens    │
     │                     │<─────────────────────┤
     │                     │                      │
     │  7. Login complete  │                      │
     │     (JWT issued)    │                      │
     │<────────────────────┤                      │
```

## Troubleshooting

### "Invalid redirect URI" error

- Ensure the callback URL in `.env` **exactly matches** the one configured in Atlassian Developer Console
- Check for trailing slashes - they must match
- Verify you're using the correct protocol (http vs https)

### "Missing OAuth credentials" error

- Check that all environment variables are set in `.env`
- Restart the backend server after updating `.env`
- Verify the client secret is correct (regenerate if needed)

### "Failed to exchange authorization code" error

- The authorization code may have expired (codes are single-use and short-lived)
- Check that your system clock is accurate
- Ensure PKCE code verifier is being stored and retrieved correctly

### Users see "Access denied" after login

- Check OAuth scopes in Atlassian Developer Console
- Ensure the app has the required permissions
- User may need to re-authorize the app after permission changes

## Security Best Practices

1. **Keep secrets secure**: Never commit `.env` files to version control
2. **Use HTTPS in production**: OAuth requires HTTPS for callback URLs
3. **Rotate secrets regularly**: Generate new client secrets periodically
4. **Monitor access**: Review OAuth app access logs in Atlassian Developer Console
5. **Limit permissions**: Only request OAuth scopes you actually need

## Production Deployment

When deploying to production:

1. Update `JIRA_OAUTH_REDIRECT_URI` to your production URL
2. Add the production callback URL in Atlassian Developer Console
3. Generate a strong `JWT_SECRET` (use `openssl rand -base64 32`)
4. Use environment variables (not `.env` files) in production
5. Enable HTTPS on your domain

## Support

For issues related to:
- **OAuth configuration**: Check [Atlassian OAuth 2.0 documentation](https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/)
- **Application errors**: Check backend logs for detailed error messages
- **Atlassian API**: Visit [Atlassian Developer Community](https://community.developer.atlassian.com/)

## Migration from API Token Auth

If you were previously using API token authentication:

1. Existing users will need to log in again using OAuth
2. Old API token data will remain in the database but won't be used
3. User accounts will be matched by email address
4. No data migration is required - user associations are preserved

---

**Last updated**: March 2026
