const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const {
  checkIn,
  checkOut,
  getAttendanceByDate,
  getAttendanceByRange,
  getTodayAttendance,
  getAttendanceStats,
  getAllAttendanceRecords,
  getAttendanceAnalytics,
  getDepartmentAttendanceStats,
  getAttendanceTrends,
  getMonthlyAttendanceStats,
  getAttendanceDistribution,
  endDay
} = require('../controllers/attendanceController');

// Employee routes
router.post('/check-in', protect, checkIn);
router.put('/check-out', protect, checkOut);
router.get('/today', protect, getTodayAttendance);
router.get('/date/:date', protect, getAttendanceByDate);
router.get('/range', protect, getAttendanceByRange);
router.get('/stats', protect, getAttendanceStats);

// Admin routes for attendance records and analytics
router.get('/all', protect, adminOnly, getAllAttendanceRecords);
router.post('/end-day', protect, adminOnly, endDay);

// Analytics routes (Admin only)
router.get('/analytics', protect, adminOnly, getAttendanceAnalytics);
router.get('/analytics/departments', protect, adminOnly, getDepartmentAttendanceStats);
router.get('/analytics/trends', protect, adminOnly, getAttendanceTrends);
router.get('/analytics/monthly', protect, adminOnly, getMonthlyAttendanceStats);
router.get('/analytics/distribution', protect, adminOnly, getAttendanceDistribution);

module.exports = router; 