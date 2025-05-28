const express = require('express');
const router = express.Router();
const { protect, managerOnly } = require('../middlewares/authMiddleware');
const {
  getManagerTasks,
  getTeamTasks,
  getTasksByStatus,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTeamMembers
} = require('../controllers/managerTaskController');

// Apply protection and manager-only middleware to all routes
router.use(protect);
router.use(managerOnly);

// GET /api/manager/tasks
router.route('/')
  .get(getManagerTasks)
  .post(createTask);

// GET /api/manager/tasks/team
router.get('/team', getTeamTasks);

// GET /api/manager/tasks/status/:status
router.get('/status/:status', getTasksByStatus);

// GET /api/manager/tasks/team-members
router.get('/team-members', getTeamMembers);

// GET, PUT, DELETE /api/manager/tasks/:id
router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

// PATCH /api/manager/tasks/:id/status
router.patch('/:id/status', updateTaskStatus);

module.exports = router; 