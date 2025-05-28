const express = require('express');
const router = express.Router();
const { protect, restrict } = require('../middlewares/authMiddleware');
const {
  checkIn,
  checkOut,
  getAttendanceByDate,
  getAttendanceByRange,
  getTodayAttendance,
  getAttendanceStats,
  getTeamAttendance,
  getTeamAttendanceStats
} = require('../controllers/managerAttendanceController');

// Apply authentication middleware to all routes
router.use(protect);
// Only managers can access these routes
router.use(restrict('manager'));

// Manager's personal attendance routes
router.post('/check-in', checkIn);
router.put('/check-out', checkOut);
router.get('/today', getTodayAttendance);
router.get('/date/:date', getAttendanceByDate);
router.get('/range', getAttendanceByRange);
router.get('/stats', getAttendanceStats);

// Team attendance routes
router.get('/team', getTeamAttendance);
router.get('/team/stats', getTeamAttendanceStats);

module.exports = router; 