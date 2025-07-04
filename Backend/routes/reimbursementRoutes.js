const express = require('express');
const router = express.Router();
const { protect, restrict } = require('../middlewares/authMiddleware');
const {
  requestReimbursement,
  getReimbursementRequests,
  getManagerPendingReimbursements,
  getAdminPendingReimbursements,
  managerReimbursementAction,
  adminReimbursementAction,
  getReimbursementById,
  cancelReimbursement,
  getReimbursementSummary,
  getReimbursementHistory,
  uploadReceipt
} = require('../controllers/reimbursementController');
const multer = require('multer');
const path = require('path');

// Configure multer storage
const storage = multer.memoryStorage(); // Use memory storage for serverless

// File filter for receipt uploads
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Employee and Manager routes - both can submit requests
// Make receipts optional by using multer middleware conditionally
router.post('/request', protect, restrict('employee', 'manager'), (req, res, next) => {
  // Only apply multer if files are being uploaded
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    return upload.array('receipts', 5)(req, res, next);
  }
  next();
}, requestReimbursement);
router.get('/', protect, getReimbursementRequests);
router.get('/summary', protect, restrict('employee', 'manager'), getReimbursementSummary);
router.get('/history', protect, getReimbursementHistory);
router.get('/:id', protect, getReimbursementById);
router.delete('/:id', protect, restrict('employee', 'manager'), cancelReimbursement);
router.post('/upload', protect, restrict('employee', 'manager'), upload.single('receipt'), uploadReceipt);

// Manager routes
router.get('/manager/pending', protect, restrict('manager'), getManagerPendingReimbursements);
router.put('/:id/manager-action', protect, restrict('manager'), managerReimbursementAction);

// Admin routes
router.get('/admin/pending', protect, restrict('admin'), getAdminPendingReimbursements);
router.put('/:id/admin-action', protect, restrict('admin'), adminReimbursementAction);

module.exports = router;