const express = require('express');
const router = express.Router();
const { 
  getManagerWellbeingData,
  recordManagerMood,
  startManagerBreak,
  endManagerBreak,
  recordManagerActivity,
  updateManagerReminderSettings,
  getManagerWellbeingHistory,
  getManagerWellbeingInsights,
  updateManagerWellbeingMetrics,
  getManagerStressLevels,
  getMoodHistory,
  getBreakHistory,
  getReminderSettings,
  getWellbeingMetrics
} = require('../controllers/managerWellbeingController');
const { protect, managerOnly } = require('../middlewares/authMiddleware');

// Apply auth middleware to all routes
router.use(protect);
router.use(managerOnly);

// Wellbeing data routes
router.get('/', getManagerWellbeingData);
router.get('/history', getManagerWellbeingHistory);
router.get('/insights', getManagerWellbeingInsights);
router.patch('/metrics', updateManagerWellbeingMetrics);

// Stress level routes
router.get('/stress-levels', getManagerStressLevels);

// Mood routes
router.post('/mood', recordManagerMood);
router.get('/mood-history', getMoodHistory);

// Break routes
router.post('/breaks/start', startManagerBreak);
router.post('/breaks/:breakId/end', endManagerBreak);
router.get('/break-history', getBreakHistory);

// Activity routes
router.post('/activity', recordManagerActivity);

// Reminder settings routes
router.get('/reminder-settings', getReminderSettings);
router.put('/reminder-settings', updateManagerReminderSettings);

// Wellbeing metrics routes
router.get('/wellbeing-metrics', getWellbeingMetrics);

module.exports = router;
 