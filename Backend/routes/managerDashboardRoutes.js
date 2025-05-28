const express = require('express');
const router = express.Router();
const { protect, managerOnly } = require('../middlewares/authMiddleware');
const {
  getManagerDashboardData,
  getTeamMembers,
  getChartData
} = require('../controllers/managerDashboardController');

// Apply authentication and manager-only middleware to all routes
router.use(protect);
router.use(managerOnly);

// GET /api/manager/dashboard - Get complete dashboard data
router.get('/', getManagerDashboardData);

// GET /api/manager/dashboard/team-members - Get team members
router.get('/team-members', getTeamMembers);

// GET /api/manager/dashboard/charts - Get chart data
router.get('/charts', getChartData);

module.exports = router; 