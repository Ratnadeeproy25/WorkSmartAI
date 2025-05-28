const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getTasks,
  getTaskById,
  updateTaskStatus,
  updateTaskProgress,
  updateTaskTime
} = require('../controllers/taskController');

// Route: /api/tasks
router.route('/')
  .get(protect, getTasks);

// Route: /api/tasks/:id
router.route('/:id')
  .get(protect, getTaskById);

// Route: /api/tasks/:id/status
router.route('/:id/status')
  .patch(protect, updateTaskStatus);

// Route: /api/tasks/:id/progress
router.route('/:id/progress')
  .patch(protect, updateTaskProgress);

// Route: /api/tasks/:id/time
router.route('/:id/time')
  .patch(protect, updateTaskTime);

module.exports = router; 