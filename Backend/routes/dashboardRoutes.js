const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');

// Get dashboard data
router.get('/:employeeId', protect, dashboardController.getDashboardData);

// Get task statistics
router.get('/:employeeId/task-statistics', protect, dashboardController.getTaskStatistics);

module.exports = router; 