const express = require('express');
const router = express.Router();
const {
  getAllEmployees,
  createEmployee,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  toggleEmployeeStatus,
  getAllDepartments,
  generateEmployeeId,
  getEmployeeProfile,
  setEmployeeShiftTime,
  setEmployeeWorkLocation,
  updateContactInfo,
  updatePassword,
  updateProfilePicture,
  syncLeaveBalances,
  initializeAllLeaveBalances
} = require('../controllers/employeeController');

// Get all employees and create new employee
router.route('/')
  .get(getAllEmployees)
  .post(createEmployee);

// Get employee profile by email
router.get('/profile', getEmployeeProfile);

// Update contact information by email
router.patch('/profile/:email/contact', updateContactInfo);

// Update password by email
router.patch('/profile/:email/password', updatePassword);

// Update profile picture by email
router.patch('/profile/:email/picture', updateProfilePicture);

// Get unique departments
router.get('/departments', getAllDepartments);

// Generate new employee ID
router.get('/generate-id', generateEmployeeId);

// Get, update, and delete employee by ID
router.route('/:id')
  .get(getEmployeeById)
  .put(updateEmployee)
  .delete(deleteEmployee);

// Toggle employee status
router.patch('/:id/toggle-status', toggleEmployeeStatus);

// Set employee shift time
router.patch('/:id/shift-time', setEmployeeShiftTime);

// Set employee work location
router.patch('/:id/work-location', setEmployeeWorkLocation);

// Sync leave balances with actual leave history
router.patch('/:id/sync-leave-balances', syncLeaveBalances);

// Initialize leave balances for all employees
router.post('/initialize-leave-balances', initializeAllLeaveBalances);

module.exports = router; 