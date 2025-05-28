const express = require('express');
const router = express.Router();
const { protect, restrict } = require('../middlewares/authMiddleware');
const {
  requestLeave,
  getLeaveRequests,
  getManagerPendingLeaves,
  getAdminPendingLeaves,
  managerLeaveAction,
  adminLeaveAction,
  getLeaveById,
  cancelLeave,
  getLeaveBalance,
  resetLeaveBalance,
  getLeaveHistory
} = require('../controllers/leaveController');

// Employee and Manager routes - both can submit requests
router.post('/request', protect, restrict('employee', 'manager'), requestLeave);
router.get('/', protect, getLeaveRequests);
router.get('/balance', protect, restrict('employee', 'manager'), getLeaveBalance);
router.post('/balance/reset', protect, restrict('employee', 'manager'), resetLeaveBalance);
router.get('/history', protect, getLeaveHistory);
router.get('/:id', protect, getLeaveById);
router.delete('/:id', protect, restrict('employee', 'manager'), cancelLeave);

// Manager routes
router.get('/manager/pending', protect, restrict('manager'), getManagerPendingLeaves);
router.put('/:id/manager-action', protect, restrict('manager'), managerLeaveAction);

// Admin routes
router.get('/admin/pending', protect, restrict('admin'), getAdminPendingLeaves);
router.put('/:id/admin-action', protect, restrict('admin'), adminLeaveAction);

module.exports = router; 