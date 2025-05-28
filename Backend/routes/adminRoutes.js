const express = require('express');
const router = express.Router();
const { protect, restrict } = require('../middlewares/authMiddleware');
const {
  getAllAdmins,
  createAdmin,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  toggleAdminStatus
} = require('../controllers/adminController');

const {
  getAdminPendingLeaves,
  adminLeaveAction,
  getLeaveHistory,
  getAdminPendingRequests,
  getAdminAllRequests,
  adminBulkAction,
  getAdminStats
} = require('../controllers/leaveController');

const {
  getAdminPendingReimbursements,
  adminReimbursementAction,
  getReimbursementHistory
} = require('../controllers/reimbursementController');

// Admin basic routes
router.route('/')
  .get(getAllAdmins)
  .post(createAdmin);

// Admin leave management (individual)
router.get('/leave/pending', protect, restrict('admin'), getAdminPendingLeaves);
router.put('/leave/:id/action', protect, restrict('admin'), adminLeaveAction);
router.get('/leave/history', protect, restrict('admin'), getLeaveHistory);

// Admin reimbursement management (individual)
router.get('/reimbursement/pending', protect, restrict('admin'), getAdminPendingReimbursements);
router.put('/reimbursement/:id/action', protect, restrict('admin'), adminReimbursementAction);
router.get('/reimbursement/history', protect, restrict('admin'), getReimbursementHistory);

// Admin leave-reimbursement combined management
router.get('/leave-reimbursement/pending', protect, restrict('admin'), getAdminPendingRequests);
router.get('/leave-reimbursement/all', protect, restrict('admin'), getAdminAllRequests);
router.post('/leave-reimbursement/bulk-action', protect, restrict('admin'), adminBulkAction);
router.get('/leave-reimbursement/stats', protect, restrict('admin'), getAdminStats);

// Basic admin CRUD
router.route('/:id')
  .get(getAdminById)
  .put(updateAdmin)
  .delete(deleteAdmin);

router.patch('/:id/toggle-status', toggleAdminStatus);

module.exports = router; 