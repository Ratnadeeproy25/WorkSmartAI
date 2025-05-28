const express = require('express');
const router = express.Router();
const { protect, restrict } = require('../middlewares/authMiddleware');
const {
  requestManagerLeave,
  getManagerLeaveRequests,
  adminManagerLeaveAction,
  getManagerLeaveById,
  cancelManagerLeave,
  getAdminPendingManagerLeaves,
  getManagerLeaveHistory,
} = require('../controllers/managerLeaveController');

// Manager leave routes
router.post('/request', protect, restrict('manager'), requestManagerLeave);
router.get('/', protect, restrict('manager'), getManagerLeaveRequests);
router.get('/history', protect, restrict('manager'), getManagerLeaveHistory);
router.get('/:id', protect, getManagerLeaveById);
router.delete('/:id', protect, restrict('manager'), cancelManagerLeave);

// Admin routes for manager leave
router.get('/admin/pending', protect, restrict('admin'), getAdminPendingManagerLeaves);
router.put('/:id/admin-action', protect, restrict('admin'), adminManagerLeaveAction);

module.exports = router; 