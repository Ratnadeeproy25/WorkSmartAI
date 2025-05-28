const express = require('express');
const router = express.Router();
const { protect, restrict } = require('../middlewares/authMiddleware');
const {
  getAllManagers,
  createManager,
  getManagerById,
  updateManager,
  deleteManager,
  toggleManagerStatus,
  getAllDepartments,
  generateManagerId,
  getManagerProfile,
  updateContactInfo,
  updatePassword,
  updateProfilePicture,
  initializeManagerLeaveBalances
} = require('../controllers/managerController');

const {
  getManagerPendingLeaves,
  managerLeaveAction,
  getLeaveHistory,
  getLeaveBalance,
  resetLeaveBalance
} = require('../controllers/leaveController');

const {
  getManagerPendingReimbursements,
  managerReimbursementAction,
  getReimbursementHistory
} = require('../controllers/reimbursementController');

// Manager basic routes
router.route('/')
  .get(getAllManagers)
  .post(createManager);

// Manager profile routes
router.get('/departments', getAllDepartments);
router.get('/generate-id', generateManagerId);
router.get('/profile', protect, getManagerProfile);

// Manager profile update routes
router.patch('/profile/:email/contact', protect, updateContactInfo);
router.patch('/profile/:email/password', protect, updatePassword);
router.patch('/profile/:email/picture', protect, updateProfilePicture);

// Manager-specific profile route (for wellbeing service)
router.get('/:managerId/profile', protect, getManagerById);

// Manager leave management
router.get('/leave/pending', protect, restrict('manager'), getManagerPendingLeaves);
router.put('/leave/:id/action', protect, restrict('manager'), managerLeaveAction);
router.get('/leave/history', protect, restrict('manager'), getLeaveHistory);
router.get('/leave/balance', protect, restrict('manager'), getLeaveBalance);
router.post('/leave/balance/reset', protect, restrict('manager'), resetLeaveBalance);
router.post('/leave/balance/initialize-all', protect, restrict('admin'), initializeManagerLeaveBalances);

// Manager reimbursement management
router.get('/reimbursement/pending', protect, restrict('manager'), getManagerPendingReimbursements);
router.put('/reimbursement/:id/action', protect, restrict('manager'), managerReimbursementAction);
router.get('/reimbursement/history', protect, restrict('manager'), getReimbursementHistory);

// Basic manager CRUD
router.route('/:id')
  .get(getManagerById)
  .put(updateManager)
  .delete(deleteManager);

router.patch('/:id/toggle-status', toggleManagerStatus);

module.exports = router; 