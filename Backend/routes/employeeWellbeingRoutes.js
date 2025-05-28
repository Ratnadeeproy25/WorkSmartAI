const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const employeeWellbeingController = require('../controllers/employeeWellbeingController');

// All routes are protected with authMiddleware
router.use(protect);

// Get employee wellbeing data
router.get('/', employeeWellbeingController.getWellbeingData);

// Get wellbeing history
router.get('/history', employeeWellbeingController.getWellbeingHistory);

// Get wellbeing insights
router.get('/insights', employeeWellbeingController.getWellbeingInsights);

// Get wellbeing tips
router.get('/tips', employeeWellbeingController.getWellbeingTips);

// Update wellbeing metrics
router.patch('/metrics', employeeWellbeingController.updateWellbeingMetrics);

// Record mood
router.post('/mood', employeeWellbeingController.recordMood);

// Record activity
router.post('/activity', employeeWellbeingController.recordActivity);

// Record break
router.post('/break', employeeWellbeingController.recordBreak);

// Update reminder settings
router.patch('/reminder-settings', employeeWellbeingController.updateReminderSettings);

module.exports = router; 