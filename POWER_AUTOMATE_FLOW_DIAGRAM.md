# Power Automate Flow Diagram

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Manufacturing Incident System                    │
│                      Power Automate Integration                      │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Mobile     │
│   Device     │◄─── User opens PowerApp on phone/tablet
│   (PowerApp) │
└──────┬───────┘
       │
       │ 1. User fills form:
       │    - Affected Area
       │    - System
       │    - Severity
       │    - Impact Description
       │    - Symptoms
       │    - Start Time
       │    - Reporter Info
       │
       ▼
┌──────────────────────────────────────┐
│   PowerApp Form Validation           │
│                                      │
│   ✓ Required fields filled           │
│   ✓ Description > 20 chars           │
│   ✓ Symptoms > 10 chars              │
│   ✓ Date format correct              │
└──────┬───────────────────────────────┘
       │
       │ 2. Click "Submit"
       │
       ▼
┌──────────────────────────────────────┐
│   Power Automate Cloud Flow         │
│   (Manufacturing Incident            │
│   Submission)                        │
│                                      │
│   Trigger: PowerApps (V2)            │
└──────┬───────────────────────────────┘
       │
       │ 3. HTTP POST Request
       │    Method: POST
       │    URL: /api/incidents/powerautomate
       │    Body: JSON with all fields
       │
       ▼
┌──────────────────────────────────────┐
│   Your Backend API                   │
│   (Node.js + Express)                │
│                                      │
│   Endpoint:                          │
│   POST /api/incidents/powerautomate  │
└──────┬───────────────────────────────┘
       │
       │ 4. Validate Request
       │    ✓ Check required fields
       │    ✓ Validate data types
       │
       ▼
┌──────────────────────────────────────┐
│   Generate Incident ID               │
│   (INC-YYYYMMDD-###)                 │
└──────┬───────────────────────────────┘
       │
       │ 5. Save to Database
       │
       ▼
┌──────────────────────────────────────┐
│   SQLite Database                    │
│   (incidents.db)                     │
│                                      │
│   Status: pending                    │
└──────┬───────────────────────────────┘
       │
       │ 6. Create Jira Ticket
       │
       ▼
┌──────────────────────────────────────┐
│   Jira REST API v3                   │
│   (Atlassian Cloud)                  │
│                                      │
│   POST /rest/api/3/issue             │
│                                      │
│   Creates ticket with:               │
│   - Summary                          │
│   - Description (ADF format)         │
│   - Priority (mapped from severity)  │
│   - Labels                           │
└──────┬───────────────────────────────┘
       │
       │ 7. Jira returns ticket key
       │    (e.g., INC-123)
       │
       ▼
┌──────────────────────────────────────┐
│   Post to Microsoft Teams            │
│   (Incoming Webhook)                 │
│                                      │
│   Adaptive Card with:                │
│   - Incident summary                 │
│   - Severity (color-coded)           │
│   - Jira link button                 │
│   - All incident details             │
└──────┬───────────────────────────────┘
       │
       │ 8. Update Database
       │    Status: submitted
       │    Jira Key: INC-123
       │
       ▼
┌──────────────────────────────────────┐
│   Return Response to Power Automate │
│                                      │
│   {                                  │
│     "success": true,                 │
│     "incidentId": "INC-20260210-001",│
│     "jiraTicketKey": "INC-123",      │
│     "jiraTicketUrl": "https://...",  │
│     "teamsPostStatus": "success"     │
│   }                                  │
└──────┬───────────────────────────────┘
       │
       │ 9. Parse JSON Response
       │
       ▼
┌──────────────────────────────────────┐
│   Power Automate - Condition         │
│                                      │
│   IF success = true THEN             │
│      Return success data             │
│   ELSE                               │
│      Return error message            │
└──────┬───────────────────────────────┘
       │
       │ 10. Send response to PowerApp
       │
       ▼
┌──────────────────────────────────────┐
│   PowerApp - Success Screen          │
│                                      │
│   Displays:                          │
│   ✓ Incident ID                      │
│   ✓ Jira Ticket Number               │
│   ✓ Link to view in Jira             │
│   ✓ Success message                  │
└──────┬───────────────────────────────┘
       │
       │ 11. User can:
       │     - View in Jira (opens browser)
       │     - Submit another incident
       │     - View Teams notification
       │
       ▼
┌──────────────────────────────────────┐
│   ✅ Process Complete                 │
│                                      │
│   - Incident logged in database      │
│   - Jira ticket created              │
│   - Team notified via Teams          │
│   - User receives confirmation       │
└──────────────────────────────────────┘
```

## Error Handling Flow

```
┌──────────────────────────────────────┐
│   Error Occurs at Any Step          │
└──────┬───────────────────────────────┘
       │
       ├─► Database Error
       │   └─► Return 500, incident saved locally
       │
       ├─► Jira API Error
       │   └─► Log error, mark incident as failed
       │   └─► Return error to PowerApp
       │
       ├─► Teams Webhook Error
       │   └─► Continue (non-critical)
       │   └─► Mark teamsPostStatus as "failed"
       │   └─► Return success with warning
       │
       └─► Power Automate Error
           └─► Display error in PowerApp
           └─► Allow user to retry
```

## Data Flow Diagram

```
PowerApp                Backend                 Integrations
────────                ───────                 ────────────

[ Form ]
   │
   │ FormData
   ├──────────────────►[ API ]
   │                      │
   │                      │ Validate
   │                      ├────────────────────►[ Database ]
   │                      │                     Save incident
   │                      │
   │                      │ Create Issue
   │                      ├────────────────────►[ Jira API ]
   │                      │◄────────────────────  Return key
   │                      │
   │                      │ Post Message
   │                      ├────────────────────►[ Teams ]
   │                      │                     Send webhook
   │                      │
   │                      │ Update Status
   │                      ├────────────────────►[ Database ]
   │                      │                     Mark submitted
   │                      │
   │ Response             │
   │◄────────────────────┤
   │
[ Success Screen ]
```

## Timeline (Typical Flow)

```
Time    Action                          Duration
────    ──────                          ────────
0ms     User clicks Submit              -
50ms    PowerApp validation             50ms
100ms   Power Automate triggered        50ms
150ms   HTTP request sent               50ms
200ms   Backend receives request        50ms
250ms   Database save                   50ms
300ms   Jira API call initiated         50ms
2000ms  Jira ticket created             1700ms
2100ms  Teams webhook posted            100ms
2150ms  Database updated                50ms
2200ms  Response sent to PA             50ms
2300ms  PowerApp receives response      100ms
2350ms  Success screen displayed        50ms
────────────────────────────────────────────────
Total:  ~2.3 seconds
```

## Component Responsibilities

```
┌──────────────────────────────────────────────────────────┐
│ PowerApp                                                 │
├──────────────────────────────────────────────────────────┤
│ ✓ User interface                                         │
│ ✓ Client-side validation                                 │
│ ✓ Form data collection                                   │
│ ✓ Display results                                        │
│ ✗ Does NOT handle API calls directly                     │
│ ✗ Does NOT integrate with Jira/Teams                     │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Power Automate                                           │
├──────────────────────────────────────────────────────────┤
│ ✓ Receives data from PowerApp                            │
│ ✓ Makes HTTP requests to backend                         │
│ ✓ Parses responses                                       │
│ ✓ Returns structured data to PowerApp                    │
│ ✓ Can add additional logic (notifications, etc.)         │
│ ✗ Does NOT handle business logic                         │
│ ✗ Does NOT connect to Jira/Teams directly               │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Backend API                                              │
├──────────────────────────────────────────────────────────┤
│ ✓ Server-side validation                                 │
│ ✓ Business logic orchestration                           │
│ ✓ Database operations                                    │
│ ✓ Jira integration                                       │
│ ✓ Teams integration                                      │
│ ✓ Error handling and logging                             │
│ ✓ ID generation                                          │
│ ✗ Does NOT handle UI concerns                            │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Database (SQLite)                                        │
├──────────────────────────────────────────────────────────┤
│ ✓ Persist incident data                                  │
│ ✓ Track status                                           │
│ ✓ Store Jira ticket references                           │
│ ✓ Maintain audit trail                                   │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Jira                                                     │
├──────────────────────────────────────────────────────────┤
│ ✓ Create and manage tickets                              │
│ ✓ Store attachments                                      │
│ ✓ Track incident lifecycle                               │
│ ✓ Assign to teams                                        │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Microsoft Teams                                          │
├──────────────────────────────────────────────────────────┤
│ ✓ Receive webhook notifications                          │
│ ✓ Display adaptive cards                                 │
│ ✓ Notify team members                                    │
│ ✓ Provide link to Jira                                   │
└──────────────────────────────────────────────────────────┘
```

## Security Flow

```
┌──────────────┐
│   User       │
│  (PowerApp)  │
└──────┬───────┘
       │
       │ 1. Authenticated via
       │    Microsoft 365
       │
       ▼
┌──────────────────────┐
│  Power Automate      │
│  (Flow Permissions)  │
└──────┬───────────────┘
       │
       │ 2. Flow runs with
       │    flow owner's permissions
       │
       ▼
┌──────────────────────┐
│  Backend API         │
│  (Optional Auth)     │
└──────┬───────────────┘
       │
       ├──► 3a. Jira API
       │    (API Token Auth)
       │
       └──► 3b. Teams Webhook
            (Webhook URL - keep secret)

Security Layers:
1. PowerApp access controlled by sharing
2. Power Automate flow restricted to authorized users
3. Backend API can require authentication (optional)
4. Jira API uses secure token authentication
5. Teams webhook URL must be kept confidential
```

## Scaling Considerations

```
Current Architecture (Single Server)
────────────────────────────────────
PowerApp → Power Automate → Single Backend → Jira + Teams

Pros:
✓ Simple to deploy
✓ Easy to maintain
✓ Low cost

Cons:
✗ Single point of failure
✗ Limited concurrent users
✗ Manual scaling


Future Architecture (Scaled)
─────────────────────────────
PowerApp → Power Automate → Load Balancer
                               │
                               ├─► Backend 1 → Jira
                               ├─► Backend 2 → Teams
                               └─► Backend 3 → Database

Pros:
✓ High availability
✓ Handles many concurrent users
✓ Auto-scaling possible

Cons:
✗ More complex setup
✗ Higher cost
✗ Requires cloud infrastructure
```

---

**Reference:** See `POWER_AUTOMATE_SETUP.md` for detailed implementation steps.
