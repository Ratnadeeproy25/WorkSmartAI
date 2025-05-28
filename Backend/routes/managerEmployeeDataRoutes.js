const express = require('express');
const router = express.Router();
const {
  getAssignedEmployeesList,
  getTeamAttendance,
  getPendingLeaveRequests,
  updateLeaveRequestStatus,
  getPendingReimbursementRequests,
  updateReimbursementRequestStatus,
  getTeamLeaveBalances,
  getTeamWellbeingData,
  getTeamWellbeingTrends,
  getAttendanceOverview
} = require('../controllers/managerEmployeeDataController');
const { protect, managerOnly } = require('../middlewares/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);
router.use(managerOnly);

// Employee management routes
router.get('/employees', getAssignedEmployeesList);

// Attendance routes
router.get('/attendance', getTeamAttendance);
router.get('/attendance/overview', getAttendanceOverview);

// Leave management routes
router.get('/leave/pending', getPendingLeaveRequests);
router.put('/leave/:requestId/status', updateLeaveRequestStatus);
router.get('/leave/balances', getTeamLeaveBalances);

// Reimbursement management routes
router.get('/reimbursement/pending', getPendingReimbursementRequests);
router.put('/reimbursement/:requestId/status', updateReimbursementRequestStatus);

// Wellbeing routes
router.get('/wellbeing', getTeamWellbeingData);
router.get('/wellbeing/trends', getTeamWellbeingTrends);

module.exports = router; 