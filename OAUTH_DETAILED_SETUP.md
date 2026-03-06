# Detailed OAuth Setup with Screenshots Guide

## Prerequisites Check

Before starting, verify you have:
- [ ] Access to your company's Jira (e.g., `yourcompany.atlassian.net`)
- [ ] An Atlassian account (same one you use for Jira)
- [ ] Permission to create apps (if not, contact your Jira admin)

## Part 1: Create OAuth App in Atlassian Developer Console

### Step 1: Go to Atlassian Developer Console

1. Open your browser and go to: **https://developer.atlassian.com/console/myapps/**

2. Sign in with your Atlassian account
   - Use the same email you use for Jira
   - If you can't access this, contact your Jira administrator

### Step 2: Create New App

1. Click the **"Create"** button (top right)

2. Select **"OAuth 2.0 integration"**
   - NOT "Connect app" or "Forge app"
   - Choose OAuth 2.0 specifically

3. Fill in the form:
   ```
   App name: Manufacturing Incident System
   ```
   - You can use any name you prefer

4. Click **"Create"**

### Step 3: Configure OAuth Settings

#### A. Add Callback URL

1. In your new app, click the **"Authorization"** tab on the left

2. Scroll to **"OAuth 2.0 (3LO)"** section

3. Click **"Add"** next to Callback URL

4. Enter your callback URL:
   ```
   For Development:
   http://localhost:5173/auth/callback

   For Production (add later):
   https://your-domain.com/auth/callback
   ```

   ⚠️ **Important**:
   - Must be EXACT - no trailing slash
   - Use `http://` for localhost
   - Use `https://` for production

5. Click **"Save changes"**

#### B. Add Permissions (Scopes)

1. Still in the **"Authorization"** tab

2. Scroll to **"Permissions"** section

3. Click **"Add"** button

4. In the search box, find and add these scopes:
   - ✅ **View Jira issue data** (`read:jira-work`)
   - ✅ **Create and manage issues** (`write:jira-work`)
   - ✅ **View user profile information** (`read:jira-user`)
   - ✅ **Offline access** (`offline_access`)

   **What each scope does:**
   - `read:jira-work` - View incidents/issues
   - `write:jira-work` - Create new incidents
   - `read:jira-user` - Get user's name and email
   - `offline_access` - Keep user logged in (refresh tokens)

5. Click **"Save changes"**

### Step 4: Get Your Credentials

1. Click the **"Settings"** tab (left sidebar)

2. You'll see:
   ```
   Client ID: xxxxxxxxxxxxxxxxxxxxxxxx
   Secret: [Generate new secret button]
   ```

3. **Copy your Client ID**
   - This is a long string like: `BzVxMjkwNzM5ODQ3...`
   - Keep this safe, you'll need it for `.env`

4. Click **"Generate new secret"**
   - A secret will appear (shown only once!)
   - **Copy it immediately** - you can't view it again
   - If you lose it, you'll need to generate a new one

5. Store both values securely (we'll add them to `.env` next)

## Part 2: Configure Your Application

### Step 5: Update Environment Variables

1. Open your project in VS Code

2. Find the `.env` file in the root directory
   - If it doesn't exist, create it

3. Add these lines (replacing with your actual values):

```bash
# ==========================================
# OAuth 2.0 Configuration
# ==========================================

# From Atlassian Developer Console → Settings tab
JIRA_OAUTH_CLIENT_ID=Oe0kYhGH9luC4qCnTlZt9PAeuLjBwSMc
JIRA_OAUTH_CLIENT_SECRET=ATOAifgWhE9_boL4OBRqiETHhP1FQNXubqxRqzcN7TLUZ_xMgWTBWuKfuvCerOOzkQPb5C2A06D9

# Must match the callback URL in Atlassian Developer Console
JIRA_OAUTH_REDIRECT_URI=http://localhost:5173/auth/callback

# Optional: Customize scopes (default is usually fine)
JIRA_OAUTH_SCOPES=read:jira-user read:jira-work write:jira-work offline_access

# ==========================================
# Your Existing Jira Configuration
# ==========================================

# Your company's Jira URL (keep this!)
JIRA_URL=https://pingit.atlassian.net/jira/servicedesk/projects/PHXMIS/queues/custom/173/
JIRA_PROJECT_KEY=INCIDENT

# Teams webhook (keep if you have it)
TEAMS_WEBHOOK_URL=your_teams_webhook_if_you_have_one

# ==========================================
# JWT Configuration
# ==========================================

# Generate a secure random string for production
# For now, you can use: dev-secret-change-in-production
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRY=7d
```

4. **Save the file**

### Step 6: Verify Your Configuration

Let's make sure everything is correct:

**Checklist:**
- [ ] `JIRA_OAUTH_CLIENT_ID` is filled in
- [ ] `JIRA_OAUTH_CLIENT_SECRET` is filled in
- [ ] `JIRA_OAUTH_REDIRECT_URI` is `http://localhost:5173/auth/callback`
- [ ] `JIRA_URL` points to your Jira instance
- [ ] The callback URL in `.env` matches what you entered in Atlassian Developer Console

## Part 3: Start the Application

### Step 7: Install Dependencies (if needed)

```bash
# In the project root
npm install
```

### Step 8: Start Backend Server

```bash
# Terminal 1
cd apps/backend
npm run dev
```

You should see:
```
✅ Database initialized
✅ Server running on port 3001
```

### Step 9: Start Frontend Server

```bash
# Terminal 2 (new terminal)
cd apps/frontend
npm run dev
```

You should see:
```
  VITE ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

## Part 4: Test OAuth Login

### Step 10: Test the Login Flow

1. Open your browser to: **http://localhost:5173/login**

2. You should see:
   - "Sign in to your account" header
   - Blue "Sign in with Atlassian" button
   - "Continue as Guest" option

3. Click **"Sign in with Atlassian"**

4. You'll be redirected to Atlassian's login page:
   - URL will be `https://auth.atlassian.com/authorize?...`
   - Enter your Atlassian credentials
   - Click "Continue" or "Sign in"

5. **First time only**: You'll see a consent screen:
   - "Manufacturing Incident System wants to access..."
   - Shows the permissions requested
   - Click **"Accept"** or **"Allow"**

6. You'll be automatically redirected back to your app:
   - URL: `http://localhost:5173/auth/callback?code=...`
   - You'll see "Completing sign in..." briefly
   - Then redirected to `/dashboard`

7. **Success!** You should now see:
   - Your name in the header
   - Full access to the dashboard
   - All incidents and analytics

### Step 11: Verify Everything Works

Try these to confirm:
- [ ] Header shows your name and "Logout" button
- [ ] Dashboard displays incidents
- [ ] You can submit a new incident (goes to `/`)
- [ ] Logout works and redirects to home

## Troubleshooting

### "Invalid redirect URI"

**Problem:** Error when redirected back from Atlassian

**Solution:**
1. Check `.env` file: `JIRA_OAUTH_REDIRECT_URI=http://localhost:5173/auth/callback`
2. Check Atlassian Developer Console → Authorization → Callback URL matches exactly
3. Restart backend server after changing `.env`

### "OAuth credentials not configured"

**Problem:** Can't click "Sign in with Atlassian"

**Solution:**
1. Verify `.env` has both `JIRA_OAUTH_CLIENT_ID` and `JIRA_OAUTH_CLIENT_SECRET`
2. Make sure there are no spaces or quotes around the values
3. Restart backend server

### "Failed to exchange authorization code"

**Problem:** Error after being redirected back

**Solution:**
1. Try again - codes expire quickly
2. Clear browser cache
3. Check backend logs for detailed error
4. Verify your secret is correct (regenerate if needed)

### Can't access Atlassian Developer Console

**Problem:** Don't have permission to create apps

**Solution:**
1. Ask your **Jira Administrator** to either:
   - Give you access to create apps, OR
   - Create the OAuth app for you and share the credentials

2. Email template you can use:
   ```
   Hi [Jira Admin],

   I'm setting up OAuth authentication for our Manufacturing Incident
   Management System. Could you please either:

   1. Grant me access to create an OAuth app in the Atlassian Developer
      Console, or
   2. Create an OAuth 2.0 integration app for me with:
      - Name: Manufacturing Incident System
      - Callback URL: http://localhost:5173/auth/callback
      - Scopes: read:jira-user, read:jira-work, write:jira-work, offline_access

   Then share the Client ID and Secret with me.

   Thanks!
   ```

### "Cannot reach localhost:5173"

**Problem:** Frontend won't start

**Solution:**
```bash
# Stop any existing process on port 5173
# Then restart:
cd apps/frontend
npm run dev
```

### Still having issues?

Check the backend logs in Terminal 1 for detailed error messages. Most issues will show:
- What went wrong
- Which configuration is missing
- Suggestions for fixing it

## Production Deployment

When you're ready to deploy to production:

### 1. Update Atlassian Developer Console
- Add production callback URL: `https://yourdomain.com/auth/callback`

### 2. Update Production Environment Variables
```bash
JIRA_OAUTH_REDIRECT_URI=https://yourdomain.com/auth/callback
JWT_SECRET=<generate-secure-random-string>
```

Generate secure JWT secret:
```bash
openssl rand -base64 32
```

### 3. Enable HTTPS
- OAuth requires HTTPS in production
- Use services like Vercel, Netlify, or your hosting provider's SSL

---

## Summary

**What you created:**
- ✅ OAuth 2.0 app in Atlassian Developer Console
- ✅ Client ID and Secret
- ✅ Configured callback URL
- ✅ Added necessary permissions

**What you configured:**
- ✅ `.env` file with OAuth credentials
- ✅ Backend and frontend servers running
- ✅ OAuth login working

**Users can now:**
- 🎉 Click one button to sign in
- 🔐 No API tokens to manage
- ⚡ Instant authentication
- 🔄 Automatic token refresh

Need help? Check the error messages in your terminal - they usually tell you exactly what's wrong!
