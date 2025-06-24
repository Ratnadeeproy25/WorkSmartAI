const express = require('express');
const router = express.Router();
const {
  getTaskRecommendations,
  getPriorityAnalysis,
  getWorkloadAnalysis,
  getTeamWorkloadAnalysis,
  predictTaskDuration,
  updateModelWithTaskData,
  getAIStatus,
  provideFeedback,
  getSmartSuggestions
} = require('../controllers/aiController');

// Middleware for authentication (assuming you have this implemented)
const { protect } = require('../middlewares/authMiddleware');

// Apply authentication middleware to all AI routes
router.use(protect);

/**
 * AI Task Recommendations Routes
 */

// @route   GET /api/ai/recommendations
// @desc    Get comprehensive AI-powered task recommendations
// @access  Private
router.get('/recommendations', getTaskRecommendations);

// @route   GET /api/ai/smart-suggestions
// @desc    Get smart task suggestions for daily planning
// @access  Private
router.get('/smart-suggestions', getSmartSuggestions);

/**
 * Priority Analysis Routes
 */

// @route   POST /api/ai/priority-analysis
// @desc    Get AI priority analysis for specific tasks
// @access  Private
router.post('/priority-analysis', getPriorityAnalysis);

/**
 * Workload Analysis Routes
 */

// @route   GET /api/ai/workload-analysis
// @desc    Get personal workload analysis
// @access  Private
router.get('/workload-analysis', getWorkloadAnalysis);

// @route   POST /api/ai/team-workload-analysis
// @desc    Get team workload analysis (managers only)
// @access  Private/Manager
router.post('/team-workload-analysis', getTeamWorkloadAnalysis);

/**
 * Machine Learning Prediction Routes
 */

// @route   POST /api/ai/predict-duration
// @desc    Predict task completion duration using ML
// @access  Private
router.post('/predict-duration', predictTaskDuration);

// @route   POST /api/ai/update-model
// @desc    Update ML models with completed task data
// @access  Private
router.post('/update-model', updateModelWithTaskData);

/**
 * System Status and Feedback Routes
 */

// @route   GET /api/ai/status
// @desc    Get AI system status and metrics
// @access  Private
router.get('/status', getAIStatus);

// @route   POST /api/ai/feedback
// @desc    Provide feedback on AI recommendations
// @access  Private
router.post('/feedback', provideFeedback);

module.exports = router; 