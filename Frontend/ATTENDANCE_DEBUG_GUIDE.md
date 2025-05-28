# Attendance Data Loading Issues - Debug Guide

## Issue: "Failed to load attendance data"

This guide helps diagnose and fix attendance data loading problems in the employee attendance page.

## Quick Fix Steps

1. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for console logs starting with 📊, 🔄, ✅, or ❌
   - These will show exactly what's happening during data loading

2. **Use Debug Tool**
   - Look for yellow bug icon (🐛) in bottom-left corner of attendance page
   - Click it to open the debug tool
   - Run tests in this order:
     - **Auth** - Check authentication status
     - **Today** - Test today's attendance API
     - **Stats** - Test attendance statistics API  
     - **Leave** - Test leave dates API

3. **Common Issues & Solutions**

### Authentication Issues
**Symptoms:** 401 errors, "Session expired" messages
**Fix:**
```javascript
// Clear and refresh session
localStorage.removeItem('employeeUserData');
localStorage.removeItem('employeeToken');
// Re-login through the login page
```

### Network/Connection Issues
**Symptoms:** "Network Error", "Unable to connect to server"
**Fix:**
- Check if backend server is running on port 5000
- Verify API base URL in `Frontend/src/services/api.ts`
- Check CORS settings in backend

### Cache Issues
**Symptoms:** Stale data, inconsistent behavior
**Fix:**
```javascript
// Clear attendance cache
import attendanceService from '../../../services/attendanceService';
attendanceService.clearUserCache();
```

### Permission Issues
**Symptoms:** 403 errors, "Access denied"
**Fix:**
- Verify user has employee role
- Check if user is assigned to correct department
- Ensure attendance routes allow employee access

## Debugging Steps

### 1. Authentication Check
```javascript
// Check in browser console
localStorage.getItem('employeeUserData')
localStorage.getItem('employeeToken')
```

### 2. API Test
```javascript
// Test attendance API manually
fetch('http://localhost:5000/api/attendance/today', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('employeeToken')}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err))
```

### 3. Backend Check
```bash
# Check if server is running
netstat -an | findstr :5000

# Check backend logs
cd Backend
npm run dev
```

## Enhanced Error Messages

The system now provides specific error messages:

- **Session expired** → Re-login required
- **Access denied** → Permission issue
- **Network Error** → Connection problem
- **Request timeout** → Server performance issue
- **Invalid session data** → Corrupted localStorage

## Recovery Actions

### Auto-Retry
- Click the "Retry" button in error message
- System will automatically retry the failed request

### Session Refresh
- Click "Refresh Session" button
- Forces reload of user data from localStorage

### Manual Reset
```javascript
// Complete reset in browser console
localStorage.clear();
location.reload();
```

## Logs Analysis

### Success Pattern
```
📊 Loading attendance data for employee...
👤 Loading data for employee: John Doe (EMP001)
🔄 Fetching today's attendance...
📅 Today's attendance data: {...}
✅ Check-in time set: 09:00:00
📋 Loaded 5 leave dates
📊 Loaded stats - Weekly hours: 7 entries
✅ Attendance data loading completed successfully
```

### Error Pattern
```
📊 Loading attendance data for employee...
❌ Error loading attendance data: Network Error
❌ API returned unsuccessful response: Authentication failed
```

## Backend Verification

### Check Attendance Routes
```javascript
// File: Backend/routes/attendanceRoutes.js
router.get('/today', protect, getTodayAttendance);
```

### Check Controller
```javascript
// File: Backend/controllers/attendanceController.js
const getTodayAttendance = asyncHandler(async (req, res) => {
  // Should have proper error handling
});
```

### Database Connection
```bash
# Check MongoDB connection
mongosh
use hrms
db.attendances.find().limit(5)
```

## Production Deployment

When deploying to production:

1. **Remove Debug Tool**
   - Remove `<AttendanceDebugTool />` from AttendancePage.tsx
   - Remove debug console.log statements

2. **Update API URL**
   - Change baseURL in `Frontend/src/services/api.ts`
   - Point to production backend URL

3. **Environment Variables**
   - Set proper CORS origins
   - Configure production database URL

## Contact Support

If issues persist after following this guide:
1. Export debug logs from the debug tool
2. Include browser console output
3. Note specific error messages and user actions
4. Check network tab in developer tools for failed requests 