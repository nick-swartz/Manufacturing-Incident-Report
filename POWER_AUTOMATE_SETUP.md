# Power Automate & PowerApp Integration Guide

Complete setup guide for integrating your Manufacturing Incident System with Power Automate and PowerApps.

## Overview

**Architecture:**
```
PowerApp Form → Power Automate Flow → Your Backend API → Jira + Teams
```

**What You'll Build:**
1. Power Automate Flow (cloud-based automation)
2. PowerApp (mobile-friendly form)
3. Teams notification with Jira integration

---

## Prerequisites

- [ ] Microsoft 365 account with Power Automate access
- [ ] PowerApps license (or Microsoft 365 E3/E5)
- [ ] Your backend deployed and accessible via URL
- [ ] Jira configured (already set up in your backend)
- [ ] Teams webhook configured (already set up in your backend)

---

## Part 1: Deploy Your Backend

### Option A: Deploy to Azure VM (Recommended)

1. **Create Azure VM:**
   ```bash
   # SSH into your Azure VM
   ssh your-user@your-vm-ip
   ```

2. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone your project:**
   ```bash
   cd /var/www
   git clone your-repo-url manufacturing-incident-system
   cd manufacturing-incident-system
   ```

4. **Install dependencies and build:**
   ```bash
   npm install
   npm run build
   ```

5. **Configure environment:**
   ```bash
   cp .env.example .env
   nano .env
   # Add your Jira and Teams credentials
   ```

6. **Install PM2 and start:**
   ```bash
   sudo npm install -g pm2
   pm2 start apps/backend/dist/server.js --name incident-api
   pm2 startup
   pm2 save
   ```

7. **Configure firewall:**
   ```bash
   sudo ufw allow 3001
   ```

8. **Test deployment:**
   ```bash
   curl http://your-vm-ip:3001/health
   ```

### Option B: Deploy to Local Server (For Testing)

1. **Start your backend:**
   ```bash
   npm run dev:backend
   ```

2. **Use ngrok for public URL:**
   ```bash
   # Install ngrok: https://ngrok.com/download
   ngrok http 3001
   ```

3. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`)

**Your API URL will be:** `https://your-domain.com/api/incidents/powerautomate`

---

## Part 2: Create Power Automate Flow

### Step 1: Create New Flow

1. Go to [Power Automate](https://make.powerautomate.com)
2. Click **+ Create** → **Instant cloud flow**
3. Name: `Manufacturing Incident Submission`
4. Trigger: **PowerApps (V2)**
5. Click **Create**

### Step 2: Add Input Parameters

Click **+ New step** → **PowerApps (V2)** trigger → **Add an input**

Add these inputs (click "+ Add an input" for each):

| Input Name | Type | Required | Description |
|------------|------|----------|-------------|
| `affectedArea` | Text | Yes | Affected area/process |
| `system` | Text | Yes | System/application |
| `severity` | Text | Yes | CRITICAL, HIGH, MEDIUM, or LOW |
| `impactDescription` | Text | Yes | Impact description (20-1000 chars) |
| `symptoms` | Text | Yes | Symptoms (min 10 chars) |
| `startTime` | Text | Yes | ISO datetime (e.g., 2026-02-10T10:30:00Z) |
| `reporterName` | Text | Yes | Reporter's name |
| `reporterContact` | Text | Yes | Email or phone |

### Step 3: Add HTTP Action

1. Click **+ New step**
2. Search for **HTTP** and select it
3. Configure:

**Method:** `POST`

**URI:** `https://your-domain.com/api/incidents/powerautomate`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "affectedArea": @{triggerBody()['text']},
  "system": @{triggerBody()['text_1']},
  "severity": @{triggerBody()['text_2']},
  "impactDescription": @{triggerBody()['text_3']},
  "symptoms": @{triggerBody()['text_4']},
  "startTime": @{triggerBody()['text_5']},
  "reporterName": @{triggerBody()['text_6']},
  "reporterContact": @{triggerBody()['text_7']}
}
```

**Note:** The parameter names (text, text_1, etc.) are auto-generated. Click inside the body field and select each input from the **Dynamic content** menu.

**Advanced Settings:**
- **Authentication:** None (if your API is public)
- **Timeout:** PT2M (2 minutes)

### Step 4: Parse JSON Response

1. Click **+ New step**
2. Search for **Parse JSON**
3. Configure:

**Content:** Select `Body` from previous HTTP action

**Schema:**
```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean"
    },
    "incidentId": {
      "type": "string"
    },
    "jiraTicketKey": {
      "type": "string"
    },
    "jiraTicketUrl": {
      "type": "string"
    },
    "teamsPostStatus": {
      "type": "string"
    },
    "message": {
      "type": "string"
    }
  }
}
```

### Step 5: Add Condition (Success Check)

1. Click **+ New step** → **Condition**
2. Configure:
   - **Value:** `success` (from Parse JSON)
   - **Condition:** `is equal to`
   - **Value:** `true`

### Step 6: Handle Success (If Yes Branch)

1. In the **If yes** branch, click **Add an action**
2. Select **Respond to a PowerApp or flow**
3. Add these outputs:

| Output Name | Type | Value |
|-------------|------|-------|
| `Success` | Yes/No | Yes |
| `IncidentID` | Text | `incidentId` (from Parse JSON) |
| `JiraTicketKey` | Text | `jiraTicketKey` (from Parse JSON) |
| `JiraTicketURL` | Text | `jiraTicketUrl` (from Parse JSON) |
| `Message` | Text | `message` (from Parse JSON) |

### Step 7: Handle Failure (If No Branch)

1. In the **If no** branch, click **Add an action**
2. Select **Respond to a PowerApp or flow**
3. Add these outputs:

| Output Name | Type | Value |
|-------------|------|-------|
| `Success` | Yes/No | No |
| `Message` | Text | Failed to submit incident |

### Step 8: Save Flow

1. Click **Save** (top right)
2. Click **Test** → **Manually** → **Test**
3. You'll use this flow in PowerApps next

---

## Part 3: Create PowerApp

### Step 1: Create New App

1. Go to [PowerApps](https://make.powerapps.com)
2. Click **+ Create** → **Canvas app from blank**
3. Name: `Manufacturing Incident Reporter`
4. Format: **Phone** (for mobile) or **Tablet** (for desktop)
5. Click **Create**

### Step 2: Add Form Controls

Add these controls to your screen:

#### 1. Title Label
- **Control:** Label
- **Text:** "Manufacturing Incident Report"
- **Font:** Bold, Size 20
- **Position:** Top center

#### 2. Affected Area Input
- **Control:** Text input
- **Name:** `txtAffectedArea`
- **Placeholder:** "Enter affected area/process"
- **Label:** Add a label above: "Affected Area/Process *"

#### 3. System Dropdown
- **Control:** Dropdown
- **Name:** `ddSystem`
- **Items:**
```powerapp
[
  "Manufacturing Execution System (MES)",
  "Enterprise Resource Planning (ERP)",
  "Warehouse Management System (WMS)",
  "Quality Management System (QMS)",
  "Production Line Control System",
  "SCADA/HMI",
  "Asset Management",
  "Inventory Management",
  "Supply Chain Management",
  "Production Planning",
  "Shop Floor Data Collection",
  "Equipment Monitoring",
  "Other"
]
```

#### 4. Severity Radio Buttons
- **Control:** Radio (add 4 options)
- **Name:** `rgSeverity`
- **Items:**
```powerapp
["CRITICAL", "HIGH", "MEDIUM", "LOW"]
```
- **Default:** "MEDIUM"
- **Layout:** Vertical

#### 5. Impact Description Text Area
- **Control:** Text input (Multiline)
- **Name:** `txtImpactDescription`
- **Placeholder:** "Describe the impact (20-1000 characters)"
- **Max length:** 1000
- **Height:** 150

#### 6. Symptoms Text Area
- **Control:** Text input (Multiline)
- **Name:** `txtSymptoms`
- **Placeholder:** "Describe symptoms (minimum 10 characters)"
- **Max length:** 2000
- **Height:** 120

#### 7. Start Time Picker
- **Control:** Date picker
- **Name:** `dtStartDate`
- **Default:** Today()

Add a Time picker:
- **Control:** Dropdown
- **Name:** `ddStartTime`
- **Items:**
```powerapp
["00:00", "00:30", "01:00", "01:30", "02:00", "02:30", "03:00", "03:30",
 "04:00", "04:30", "05:00", "05:30", "06:00", "06:30", "07:00", "07:30",
 "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
 "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
 "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
 "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"]
```

#### 8. Reporter Name Input
- **Control:** Text input
- **Name:** `txtReporterName`
- **Placeholder:** "Your full name"
- **Default:** User().FullName

#### 9. Reporter Contact Input
- **Control:** Text input
- **Name:** `txtReporterContact`
- **Placeholder:** "Email or phone"
- **Default:** User().Email

#### 10. Submit Button
- **Control:** Button
- **Name:** `btnSubmit`
- **Text:** "Submit Incident"
- **Color:** Red for critical incidents (dynamic)

### Step 3: Add Form Validation

Add a Label for error messages:
- **Name:** `lblError`
- **Visible:** `!IsBlank(varErrorMessage)`
- **Text:** `varErrorMessage`
- **Color:** Red

### Step 4: Configure Submit Button

**OnSelect formula:**
```powerapp
// Reset error message
Set(varErrorMessage, "");

// Validate fields
If(
    IsBlank(txtAffectedArea.Text) ||
    IsBlank(ddSystem.Selected.Value) ||
    IsBlank(txtImpactDescription.Text) ||
    Len(txtImpactDescription.Text) < 20 ||
    IsBlank(txtSymptoms.Text) ||
    Len(txtSymptoms.Text) < 10 ||
    IsBlank(txtReporterName.Text) ||
    IsBlank(txtReporterContact.Text),

    // Show validation error
    Set(varErrorMessage, "Please fill all required fields correctly"),

    // Validation passed - call Power Automate
    Set(varLoading, true);
    Set(
        varFlowResponse,
        'ManufacturingIncidentSubmission'.Run(
            txtAffectedArea.Text,
            ddSystem.Selected.Value,
            rgSeverity.Selected.Value,
            txtImpactDescription.Text,
            txtSymptoms.Text,
            Text(dtStartDate.SelectedDate, "yyyy-mm-dd") & "T" & ddStartTime.Selected.Value & ":00Z",
            txtReporterName.Text,
            txtReporterContact.Text
        )
    );
    Set(varLoading, false);

    // Check response
    If(
        varFlowResponse.success,
        Navigate(SuccessScreen),
        Set(varErrorMessage, varFlowResponse.message)
    )
)
```

**DisplayMode formula:**
```powerapp
If(varLoading, DisplayMode.Disabled, DisplayMode.Edit)
```

**Text formula (for dynamic button text):**
```powerapp
If(varLoading, "Submitting...", "Submit Incident")
```

### Step 5: Add Loading Spinner

Add a Spinner control:
- **Name:** `loadingSpinner`
- **Visible:** `varLoading`
- **Position:** Center of screen

### Step 6: Create Success Screen

1. Add a new screen: **Insert** → **New Screen** → **Blank**
2. Name: `SuccessScreen`

Add these controls:

#### Success Icon
- **Control:** Icon (Checkmark)
- **Color:** Green
- **Size:** 64

#### Success Message
- **Control:** Label
- **Text:** "Incident Submitted Successfully!"
- **Font:** Bold, Size 18

#### Incident Details
- **Control:** Label (add multiple)
```powerapp
"Incident ID: " & varFlowResponse.incidentid
"Jira Ticket: " & varFlowResponse.jiraticketkey
"Status: " & varFlowResponse.message
```

#### View in Jira Button
- **Control:** Button
- **Text:** "View in Jira"
- **OnSelect:**
```powerapp
Launch(varFlowResponse.jiraticketurl)
```

#### Submit Another Button
- **Control:** Button
- **Text:** "Submit Another Incident"
- **OnSelect:**
```powerapp
// Reset all fields
Reset(txtAffectedArea);
Reset(ddSystem);
Reset(rgSeverity);
Reset(txtImpactDescription);
Reset(txtSymptoms);
Reset(dtStartDate);
Reset(ddStartTime);
Reset(txtReporterName);
Reset(txtReporterContact);
Set(varErrorMessage, "");
Set(varFlowResponse, {});
Navigate(Screen1)
```

### Step 7: Connect Flow to PowerApp

1. Click **Action** → **Power Automate**
2. Find your flow: `Manufacturing Incident Submission`
3. Click to add it to your app
4. The flow will now be available in formulas

### Step 8: Test Your App

1. Click **Play** button (▶️) in top right
2. Fill in the form
3. Click **Submit Incident**
4. Verify:
   - ✅ Loading spinner appears
   - ✅ Flow executes successfully
   - ✅ Success screen shows incident details
   - ✅ Jira ticket was created
   - ✅ Teams notification posted

### Step 9: Publish App

1. Click **File** → **Save**
2. Click **Publish**
3. Click **Publish this version**
4. Click **Share**
5. Add users or groups who should access the app

---

## Part 4: Enhanced Teams Notifications (Optional)

Want richer Teams notifications? Add this after the HTTP action in your Power Automate flow:

### Add Adaptive Card to Teams

1. **Add action:** Post adaptive card in a chat or channel
2. **Configure:**
   - **Post as:** Flow bot
   - **Post in:** Channel
   - **Team:** [Select your team]
   - **Channel:** [Select incident channel]

**Adaptive Card JSON:**
```json
{
  "type": "AdaptiveCard",
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.4",
  "body": [
    {
      "type": "Container",
      "style": "@{if(equals(triggerBody()['text_2'], 'CRITICAL'), 'attention', 'default')}",
      "items": [
        {
          "type": "TextBlock",
          "text": "🚨 New Manufacturing Incident - @{triggerBody()['text_2']}",
          "weight": "bolder",
          "size": "large",
          "color": "@{if(equals(triggerBody()['text_2'], 'CRITICAL'), 'attention', 'default')}"
        }
      ]
    },
    {
      "type": "FactSet",
      "facts": [
        {
          "title": "Incident ID:",
          "value": "@{body('Parse_JSON')?['incidentId']}"
        },
        {
          "title": "Jira Ticket:",
          "value": "@{body('Parse_JSON')?['jiraTicketKey']}"
        },
        {
          "title": "System:",
          "value": "@{triggerBody()['text_1']}"
        },
        {
          "title": "Affected Area:",
          "value": "@{triggerBody()['text']}"
        },
        {
          "title": "Reporter:",
          "value": "@{triggerBody()['text_6']}"
        },
        {
          "title": "Contact:",
          "value": "@{triggerBody()['text_7']}"
        },
        {
          "title": "Start Time:",
          "value": "@{triggerBody()['text_5']}"
        }
      ]
    },
    {
      "type": "Container",
      "items": [
        {
          "type": "TextBlock",
          "text": "Impact:",
          "weight": "bolder"
        },
        {
          "type": "TextBlock",
          "text": "@{triggerBody()['text_3']}",
          "wrap": true
        }
      ]
    },
    {
      "type": "Container",
      "items": [
        {
          "type": "TextBlock",
          "text": "Symptoms:",
          "weight": "bolder"
        },
        {
          "type": "TextBlock",
          "text": "@{triggerBody()['text_4']}",
          "wrap": true
        }
      ]
    }
  ],
  "actions": [
    {
      "type": "Action.OpenUrl",
      "title": "View in Jira",
      "url": "@{body('Parse_JSON')?['jiraTicketUrl']}"
    }
  ]
}
```

**Benefits:**
- Better formatting
- Interactive buttons
- Color-coded by severity
- Direct link to Jira

---

## Part 5: Testing & Troubleshooting

### Test Checklist

- [ ] Backend API is running and accessible
- [ ] `/health` endpoint returns OK
- [ ] Power Automate flow runs successfully
- [ ] PowerApp submits without errors
- [ ] Jira ticket is created
- [ ] Teams notification appears
- [ ] Success screen shows correct data

### Common Issues

#### 1. Flow Fails: "Bad Request"
**Cause:** Invalid JSON format or missing fields

**Solution:**
- Check that all required fields are included
- Verify date format: `YYYY-MM-DDTHH:mm:ssZ`
- Check severity is one of: CRITICAL, HIGH, MEDIUM, LOW

#### 2. Flow Fails: "Connection Timeout"
**Cause:** Backend not accessible

**Solution:**
- Verify backend URL is correct
- Check firewall allows external connections
- Test with Postman first

#### 3. Jira Ticket Not Created
**Cause:** Jira credentials invalid

**Solution:**
- Check `.env` file has correct credentials
- Verify API token hasn't expired
- Check project key exists

#### 4. Teams Notification Missing
**Cause:** Webhook URL invalid

**Solution:**
- Verify webhook URL in `.env`
- Check webhook hasn't been deleted in Teams
- Test webhook with curl

#### 5. PowerApp: "Invalid Flow Response"
**Cause:** Flow not returning expected format

**Solution:**
- Check "Respond to PowerApp" action has all outputs
- Verify output names match exactly
- Test flow independently first

### Debug Mode

Enable detailed logging in Power Automate:

1. Open flow
2. Click **...** (menu) → **Settings**
3. Enable **Run diagnostics**
4. Run test
5. View **Run history** for detailed logs

---

## Part 6: Mobile App Deployment

### Make App Available on Mobile

1. **Publish app** (see step 9 above)
2. **Install Power Apps mobile**:
   - iOS: [App Store](https://apps.apple.com/app/power-apps/id1047318566)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=com.microsoft.msapps)
3. **Sign in** with your Microsoft 365 account
4. Your app will appear in the app list

### Mobile Optimizations

Add these to improve mobile experience:

**Location Detection:**
```powerapp
Set(varUserLocation, Location.Latitude & ", " & Location.Longitude)
```

**Photo Capture (future enhancement):**
```powerapp
// Add camera control for attaching photos
Camera1.Stream
```

---

## Part 7: Advanced Features (Optional)

### A. Auto-Populate Reporter Info

In PowerApp, set defaults:
```powerapp
// For reporter name
Default: User().FullName

// For reporter contact
Default: User().Email
```

### B. Save Draft Locally

Add "Save Draft" button:
```powerapp
OnSelect: SaveData(txtAffectedArea.Text, "DraftAffectedArea")
```

Load on app start:
```powerapp
OnStart: Set(txtAffectedArea.Text, LoadData("DraftAffectedArea"))
```

### C. Offline Mode

Enable offline submission (queues when offline):
```powerapp
If(
    Connection.Connected,
    'Flow'.Run(...),
    SaveData({...}, "PendingIncidents")
)
```

### D. Push Notifications

Add push notification when Jira ticket updated:
1. Use **Power Automate** trigger: "When a Jira issue is updated"
2. Action: **Send push notification (PowerApps)**

---

## Security Considerations

### 1. Secure Your Backend

**Add authentication to your API:**

```typescript
// In server.ts
import { authenticate } from './middleware/auth';

app.use('/api/incidents/powerautomate', authenticate);
```

**Then in Power Automate:**
- Add `Authorization: Bearer YOUR_TOKEN` header

### 2. Restrict PowerApp Access

1. Go to PowerApps → Your app → **Share**
2. Only add authorized users/groups
3. Uncheck "Everyone in organization"

### 3. Secure Flow

1. Open flow → **...** → **Settings**
2. **Run only users** → Select users
3. Save

---

## Monitoring & Analytics

### Track Usage

1. Go to **Power Automate** → Your flow → **Analytics**
2. View:
   - Total runs
   - Success rate
   - Average duration
   - Failure reasons

### PowerApp Analytics

1. Go to **PowerApps** → Your app → **Analytics**
2. View:
   - Daily active users
   - Session duration
   - Screen views

---

## Cost Estimate

| Service | Cost | Notes |
|---------|------|-------|
| Power Automate Premium | $15/user/month | Required for HTTP connector |
| PowerApps per app | $5/user/month | Or included in M365 E3/E5 |
| Azure VM (B2s) | ~$30/month | For backend hosting |
| **Total** | **~$50-100/month** | For 5-10 users |

### Cost Optimization

- Use Microsoft 365 E3/E5 (includes Power Platform)
- Deploy backend to existing server
- Use Azure App Service free tier for testing

---

## Next Steps

1. ✅ Deploy backend to accessible URL
2. ✅ Create Power Automate flow
3. ✅ Build PowerApp
4. ✅ Test end-to-end
5. ✅ Share with pilot users
6. ✅ Gather feedback
7. ✅ Iterate and improve

---

## Support

**Backend Issues:**
- Check server logs: `pm2 logs incident-api`
- Check health endpoint: `curl http://your-server/health`

**Power Automate Issues:**
- View run history in flow
- Check error messages in details

**PowerApp Issues:**
- Use Monitor tool: **Tools** → **Monitor**
- Check formula errors in Studio

---

## Additional Resources

- [Power Automate Documentation](https://docs.microsoft.com/power-automate/)
- [PowerApps Documentation](https://docs.microsoft.com/powerapps/)
- [Adaptive Cards Designer](https://adaptivecards.io/designer/)
- [Your Backend API Docs](./README.md)

---

**Version:** 1.0
**Last Updated:** 2026-02-10
**Maintainer:** Manufacturing IT Team
