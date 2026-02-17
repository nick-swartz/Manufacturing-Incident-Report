# Power Automate Quick Reference Card

## API Endpoint

**URL:** `https://your-domain.com/api/incidents/powerautomate`
**Method:** POST
**Content-Type:** application/json

## Request Body Template

```json
{
  "affectedArea": "Production Line 3",
  "system": "Manufacturing Execution System (MES)",
  "severity": "HIGH",
  "impactDescription": "Production line stopped due to system error. Unable to log work orders.",
  "symptoms": "System displays timeout error. Database connection lost. Users cannot access work order screens.",
  "startTime": "2026-02-10T14:30:00Z",
  "reporterName": "John Smith",
  "reporterContact": "john.smith@company.com"
}
```

## Valid Values

### Severity
- `CRITICAL` - System down, immediate action required
- `HIGH` - Major impact, urgent attention needed
- `MEDIUM` - Moderate impact, should be addressed soon
- `LOW` - Minor impact, can be scheduled

### System Options
- Manufacturing Execution System (MES)
- Enterprise Resource Planning (ERP)
- Warehouse Management System (WMS)
- Quality Management System (QMS)
- Production Line Control System
- SCADA/HMI
- Asset Management
- Inventory Management
- Supply Chain Management
- Production Planning
- Shop Floor Data Collection
- Equipment Monitoring
- Other

### Date Format
- **ISO 8601:** `YYYY-MM-DDTHH:mm:ssZ`
- **Example:** `2026-02-10T14:30:00Z`
- **PowerApps Formula:** `Text(DateAdd(Now(), 0), "yyyy-mm-ddThh:mm:ssZ")`

## Response Format

### Success Response (201)
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

### Error Response (400/500)
```json
{
  "success": false,
  "incidentId": "INC-20260210-001",
  "error": "Missing required fields: severity",
  "message": "Validation failed"
}
```

## Power Automate Flow Steps

1. **Trigger:** PowerApps (V2)
2. **Action:** HTTP POST to API
3. **Action:** Parse JSON response
4. **Action:** Condition (check success = true)
5. **Action:** Respond to PowerApp (success/failure)

## PowerApp Key Formulas

### Submit Button OnSelect
```powerapp
Set(
    varResponse,
    'YourFlowName'.Run(
        txtAffectedArea.Text,
        ddSystem.Selected.Value,
        rgSeverity.Selected.Value,
        txtImpactDescription.Text,
        txtSymptoms.Text,
        Text(dtStartDate.SelectedDate, "yyyy-mm-dd") & "T" & ddStartTime.Selected.Value & ":00Z",
        txtReporterName.Text,
        txtReporterContact.Text
    )
)
```

### Validation Check
```powerapp
If(
    IsBlank(txtAffectedArea.Text) ||
    Len(txtImpactDescription.Text) < 20 ||
    Len(txtSymptoms.Text) < 10,
    Set(varError, "Please fill all required fields"),
    /* Call flow */
)
```

## Validation Rules

| Field | Min Length | Max Length | Required |
|-------|-----------|------------|----------|
| affectedArea | 1 | - | Yes |
| system | 1 | - | Yes |
| severity | - | - | Yes (enum) |
| impactDescription | 20 | 1000 | Yes |
| symptoms | 10 | 2000 | Yes |
| startTime | - | - | Yes (ISO 8601) |
| reporterName | 1 | - | Yes |
| reporterContact | 1 | - | Yes |

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| 400 Bad Request | Missing required fields | Check all fields present |
| 500 Server Error | Jira/Teams integration failed | Check backend logs |
| Timeout | Backend not responding | Verify URL and network |
| Invalid date format | Wrong date string | Use ISO 8601 format |

## Testing Commands

### Test Backend Health
```bash
curl http://your-domain.com/health
```

### Test Power Automate Endpoint
```bash
curl -X POST http://your-domain.com/api/incidents/powerautomate \
  -H "Content-Type: application/json" \
  -d '{
    "affectedArea": "Test Area",
    "system": "Manufacturing Execution System (MES)",
    "severity": "LOW",
    "impactDescription": "This is a test incident for Power Automate integration testing.",
    "symptoms": "Testing the Power Automate endpoint functionality.",
    "startTime": "2026-02-10T10:00:00Z",
    "reporterName": "Test User",
    "reporterContact": "test@company.com"
  }'
```

## Useful Links

- **Power Automate Portal:** https://make.powerautomate.com
- **PowerApps Portal:** https://make.powerapps.com
- **Backend Health Check:** https://your-domain.com/health
- **Jira Dashboard:** https://yourcompany.atlassian.net
- **Teams Channel:** [Your Teams Channel Link]

## Support Contacts

- **Backend/API Issues:** IT Help Desk
- **Power Automate Issues:** Power Platform Admin
- **Jira Issues:** Jira Administrator
- **Teams Issues:** Microsoft 365 Admin

---

**Print this card and keep it handy!**
