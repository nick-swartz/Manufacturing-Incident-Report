# System Verification Checklist

Use this checklist to verify the Manufacturing Incident System is working correctly.

## ✅ Pre-Flight Checklist

### 1. Dependencies Installed
```bash
cd manufacturing-incident-system
npm install
```
- [ ] No errors during installation
- [ ] node_modules folder created

### 2. Environment Configuration
Check `.env` file has these values updated:
- [ ] `JIRA_URL` - Your Jira instance URL
- [ ] `JIRA_EMAIL` - Your email address
- [ ] `JIRA_API_TOKEN` - Valid API token from Atlassian
- [ ] `JIRA_PROJECT_KEY` - Valid project key (e.g., "INC")
- [ ] `TEAMS_WEBHOOK_URL` - Valid webhook URL from Teams

### 3. Server Start
```bash
npm run dev
```
- [ ] Backend starts on port 3001 (check terminal output)
- [ ] Frontend starts on port 5173 (check terminal output)
- [ ] No errors in terminal
- [ ] Database initialized message appears

## 🧪 Functional Testing

### Test 1: Backend Health Check
```bash
curl http://localhost:3001/health
```

**Expected Result:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-06T...",
  "service": "manufacturing-incident-system"
}
```

- [ ] Health endpoint responds with 200 OK
- [ ] JSON contains correct status

### Test 2: Frontend Loads
Open browser to: http://localhost:5173

**Expected Result:**
- [ ] Page loads without errors
- [ ] Form title displays: "Manufacturing Incident Report"
- [ ] All form fields visible
- [ ] No console errors (press F12 to check)

### Test 3: Form Validation

Try submitting empty form:
- [ ] Validation errors appear for all required fields
- [ ] Errors displayed in red text below each field
- [ ] Form does not submit

Try invalid data:
- [ ] Impact description < 20 chars → Shows error
- [ ] Symptoms < 10 chars → Shows error
- [ ] Invalid email/phone in contact → Shows error

### Test 4: File Upload

Test file upload component:
- [ ] Can click to browse files
- [ ] Can drag and drop files
- [ ] Image files show preview thumbnail
- [ ] Can remove individual files
- [ ] Uploading 6 files → Shows error (max 5)
- [ ] Uploading file > 10MB → Shows error

**Test with these file types:**
- [ ] JPEG image (should work)
- [ ] PNG image (should work)
- [ ] PDF (should work)
- [ ] .txt file (should work)
- [ ] .exe file (should fail - not allowed)

### Test 5: Complete Submission

Fill out form completely:
1. Affected Area: "Test Manufacturing Line"
2. System: "MES (Manufacturing Execution System)"
3. Severity: "HIGH"
4. Impact Description: "Production line stopped due to sensor failure affecting quality control process"
5. Symptoms: "Sensor readings showing inconsistent values"
6. Start Time: (select current date/time)
7. Reporter Name: "Test User"
8. Reporter Contact: "test@company.com"
9. Attach: 1-2 test files (optional)

Click "Submit Incident"

**During Submission:**
- [ ] Button shows "Submitting..." with spinner
- [ ] Button is disabled during submission
- [ ] No errors in browser console

**After Submission:**
- [ ] Redirected to confirmation page
- [ ] Green success checkmark displayed
- [ ] Incident ID shown (format: INC-YYYYMMDD-NNN)
- [ ] Jira ticket number shown
- [ ] "View in Jira" link is clickable

### Test 6: Jira Integration

From confirmation page, click "View in Jira" link:

**Expected in Jira:**
- [ ] Issue opens in new tab
- [ ] Issue type is "Bug" or configured type
- [ ] Summary includes severity and affected area
- [ ] Description contains all incident details:
  - [ ] Incident ID
  - [ ] Affected Area
  - [ ] System
  - [ ] Impact description
  - [ ] Symptoms
  - [ ] Reporter information
  - [ ] Start time
- [ ] Priority matches severity (HIGH → High Priority)
- [ ] Labels include "manufacturing" and "auto-generated"
- [ ] Attachments uploaded (if files were added)

### Test 7: Teams Integration

Check your configured Teams channel:

**Expected Teams Message:**
- [ ] New message appears in channel
- [ ] Title shows "🚨 New Manufacturing Incident: INC-..."
- [ ] Severity displayed prominently
- [ ] Color bar matches severity (Critical=red, High=orange, etc.)
- [ ] All incident details shown in card
- [ ] "View in Jira" button present
- [ ] Clicking button opens Jira ticket

### Test 8: Database Verification

Check database was created:
```bash
ls -la apps/backend/data/
```
- [ ] `incidents.db` file exists

Check files were stored:
```bash
ls -la apps/backend/uploads/INC-*
```
- [ ] Directory created for your incident
- [ ] Files copied to incident directory

### Test 9: Error Handling

Test with invalid Jira credentials:
1. Stop server
2. Change `JIRA_API_TOKEN` to invalid value in `.env`
3. Restart server: `npm run dev`
4. Submit test incident

**Expected:**
- [ ] Submission fails with clear error message
- [ ] Error message mentions Jira authentication
- [ ] Form stays on page (doesn't navigate away)
- [ ] Error is logged in backend terminal

Restore valid credentials and restart.

Test with invalid Teams webhook:
1. Stop server
2. Change `TEAMS_WEBHOOK_URL` to invalid value
3. Restart and submit incident

**Expected:**
- [ ] Incident still submits successfully
- [ ] Jira ticket still created
- [ ] Confirmation page shows Teams post failed
- [ ] Warning logged in backend terminal

### Test 10: Multiple Submissions

Submit 3 different incidents with varying severities:

**Incident 1:** CRITICAL severity
**Incident 2:** LOW severity
**Incident 3:** MEDIUM severity with 3 file attachments

For each submission verify:
- [ ] Unique incident ID generated
- [ ] Separate Jira ticket created
- [ ] Separate Teams message posted
- [ ] Files stored in separate directories

## 🔍 Code Quality Checks

### TypeScript Compilation
```bash
npm run build
```
- [ ] Frontend builds without errors
- [ ] Backend builds without errors
- [ ] Build output in `dist` folders

### File Structure
Verify all expected files exist:
```bash
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | wc -l
```
- [ ] Should show ~30+ TypeScript files

## 📊 Performance Checks

### Response Times
Using browser DevTools (F12 → Network tab):

**Form Submission:**
- [ ] API request completes in < 30 seconds
- [ ] Most time spent on external API calls (Jira/Teams)

**Page Load:**
- [ ] Initial page load < 2 seconds
- [ ] No unnecessary re-renders

### Resource Usage
Check while server is running:
- [ ] No memory leaks (stable memory usage)
- [ ] CPU usage reasonable (< 50% at idle)
- [ ] No continuous logging/errors

## 🚨 Security Checks

- [ ] `.env` file in `.gitignore` (credentials not committed)
- [ ] File upload types restricted to safe types
- [ ] File size limits enforced
- [ ] SQL injection protection (parameterized queries)
- [ ] CORS configured appropriately
- [ ] Error messages don't expose sensitive info

## 📱 Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Edge (primary)
- [ ] Firefox
- [ ] Safari (if available)

Test responsive design:
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

DevTools → Toggle device toolbar to test

## ✅ Final Verification

All systems operational:
- [ ] Backend API responding
- [ ] Frontend form working
- [ ] Form validation working
- [ ] File uploads working
- [ ] Jira integration working
- [ ] Teams integration working
- [ ] Database storing data
- [ ] Error handling working
- [ ] Confirmation page working

## 🎯 Acceptance Criteria

From original plan - all should be checked:
- [ ] User can access form at web URL
- [ ] All form fields validate correctly
- [ ] File uploads work with preview
- [ ] Submission creates Jira ticket with correct fields
- [ ] Jira attachments uploaded successfully
- [ ] Teams message posts with correct formatting
- [ ] Confirmation page displays all links
- [ ] Jira link opens correct ticket
- [ ] Error messages are user-friendly
- [ ] Responsive design works on mobile
- [ ] README provides clear setup instructions
- [ ] Environment variables documented

## 🐛 Known Issues to Watch For

Common issues and solutions:

**Issue: Port already in use**
- Solution: Change PORT in `.env` or kill process on port 3001/5173

**Issue: Database locked**
- Solution: Ensure only one backend instance running

**Issue: Multer deprecated warning**
- Note: This is expected, we're using multer 1.x (stable)

**Issue: CORS errors**
- Solution: Verify frontend proxy config in `vite.config.ts`

## 📝 Test Results Log

Record your test results:

| Test | Date | Result | Notes |
|------|------|--------|-------|
| Backend Health | | ⬜ | |
| Frontend Load | | ⬜ | |
| Form Validation | | ⬜ | |
| File Upload | | ⬜ | |
| Full Submission | | ⬜ | |
| Jira Integration | | ⬜ | |
| Teams Integration | | ⬜ | |
| Database Storage | | ⬜ | |
| Error Handling | | ⬜ | |

---

**Once all checks pass, the system is ready for production configuration and deployment!**
