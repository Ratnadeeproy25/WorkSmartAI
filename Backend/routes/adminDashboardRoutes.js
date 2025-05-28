const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// Get dashboard overview metrics (total employees, attendance rate, pending requests)
router.get('/metrics', protect, adminOnly, adminDashboardController.getDashboardMetrics);

// Get performance data for charts (productivity and engagement)
router.get('/performance', protect, adminOnly, adminDashboardController.getPerformanceData);

// Get department distribution data
router.get('/departments', protect, adminOnly, adminDashboardController.getDepartmentData);

// Get attendance trends data
router.get('/attendance-trends', protect, adminOnly, adminDashboardController.getAttendanceTrends);

// Get organization wellbeing data
router.get('/wellbeing', protect, adminOnly, adminDashboardController.getWellbeingData);

module.exports = router; 