const express = require('express');
const router = express.Router();
const {
  getAllWellbeingData,
  getWellbeingStatistics,
  getUserWellbeingDetails,
  getWellbeingTrends
} = require('../controllers/adminWellbeingController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// Apply auth middleware to all routes
router.use(protect);
router.use(adminOnly);

// @route   GET /api/admin/wellbeing
// @desc    Get all users' wellbeing data
// @access  Private (Admin only)
router.get('/', getAllWellbeingData);

// @route   GET /api/admin/wellbeing/stats
// @desc    Get wellbeing statistics for dashboard
// @access  Private (Admin only)
router.get('/stats', getWellbeingStatistics);

// @route   GET /api/admin/wellbeing/trends
// @desc    Get wellbeing trends over time
// @access  Private (Admin only)
router.get('/trends', getWellbeingTrends);

// @route   GET /api/admin/wellbeing/user/:userId
// @desc    Get specific user's detailed wellbeing data
// @access  Private (Admin only)
router.get('/user/:userId', getUserWellbeingDetails);

module.exports = router; 