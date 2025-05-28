const ManagerAttendance = require('../models/managerAttendanceModel');
const Manager = require('../models/managerModel');
const Employee = require('../models/employeeModel');
const asyncHandler = require('express-async-handler');

// Performance optimization - index common manager IDs and dates
const managerAttendanceCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// Helper function to get cache key
const getCacheKey = (managerId, date) => `${managerId}_${date ? date.toISOString().split('T')[0] : 'today'}`;

// Helper function to check if check-in time is late based on manager's shift start time
const isCheckInLate = (checkInTime, shiftStartTime) => {
  // If no shift start time is defined, default to 9:00 AM
  if (!shiftStartTime) {
    shiftStartTime = "09:00";
  }
  
  // Parse shift start time (format: "HH:MM")
  const [shiftHours, shiftMinutes] = shiftStartTime.split(':').map(Number);
  
  // Create a date object with the same day as check-in but with shift start time
  const shiftStart = new Date(checkInTime);
  shiftStart.setHours(shiftHours, shiftMinutes, 0, 0);
  
  // Add a 10-minute grace period
  const graceTime = new Date(shiftStart);
  graceTime.setMinutes(graceTime.getMinutes() + 10);
  
  // Check if check-in time is after the grace period
  return checkInTime > graceTime;
};

// Helper function to check if user is within allowed work location
const isWithinWorkLocation = (userLocation, officeLocation, maxDistanceKm = 0.5) => {
  if (!officeLocation || !officeLocation.lat || !officeLocation.lng) {
    return true; // If no office location defined, don't restrict check-in
  }
  
  // Calculate distance using Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = (userLocation.lat - officeLocation.lat) * Math.PI / 180;
  const dLon = (userLocation.lng - officeLocation.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(officeLocation.lat * Math.PI / 180) * Math.cos(userLocation.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c;
  
  return distance <= maxDistanceKm;
};

// Helper function to find manager by ID
const findManagerById = async (managerId) => {
  // First try to find in Manager collection
  let manager = await Manager.findById(managerId);
  
  // If not found, try to find in Employee collection with manager role
  if (!manager) {
    manager = await Employee.findOne({ 
      _id: managerId,
      role: 'manager'
    });
  }
  
  return manager;
};

// @desc    Check in manager
// @route   POST /api/manager/attendance/check-in
// @access  Private (Manager)
const checkIn = asyncHandler(async (req, res) => {
  const { location } = req.body;
  
  // Ensure user object exists in request
  if (!req.user || !req.user._id) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please login again.',
    });
  }
  
  const managerId = req.user._id;

  // Get manager details to check shift time and office location
  const manager = await findManagerById(managerId);
  if (!manager) {
    return res.status(404).json({
      success: false,
      message: 'Manager not found. Please ensure your account exists and is active.',
    });
  }

  // Verify manager role if manager is from Employee collection
  if (manager.role && manager.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only managers can use this endpoint',
    });
  }

  // Check if user is within allowed work location - only if officeLocation is defined
  if (manager.officeLocation && manager.officeLocation.lat && manager.officeLocation.lng) {
    if (!isWithinWorkLocation(location, manager.officeLocation)) {
      return res.status(400).json({
        success: false,
        message: 'You are not at your designated work location',
      });
    }
  }

  // Format date to get only the date part (YYYY-MM-DD)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if manager already checked in today
  let attendance = await ManagerAttendance.findOne({
    managerId: managerId,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  if (attendance && attendance.checkIn) {
    return res.status(400).json({
      success: false,
      message: 'You have already checked in today',
    });
  }

  const checkInTime = new Date();
  
  // Determine status based on manager's shift start time
  // Use the manager's shiftTime if available, otherwise default
  const shiftStart = manager.shiftTime && manager.shiftTime.start ? manager.shiftTime.start : "09:00";
  const isLate = isCheckInLate(checkInTime, shiftStart);
  const status = isLate ? 'late' : 'present';

  // Create new attendance record
  attendance = new ManagerAttendance({
    managerId: managerId,
    date: today,
    checkIn: checkInTime,
    location,
    status,
  });

  await attendance.save();

  // Clear cache for this manager's today record
  managerAttendanceCache.delete(getCacheKey(managerId));

  res.status(201).json({
    success: true,
    data: attendance,
  });
});

// @desc    Check out manager
// @route   PUT /api/manager/attendance/check-out
// @access  Private (Manager)
const checkOut = asyncHandler(async (req, res) => {
  const { location } = req.body;
  
  // Ensure user object exists in request
  if (!req.user || !req.user._id) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please login again.',
    });
  }
  
  const managerId = req.user._id;

  // Verify manager role
  const manager = await findManagerById(managerId);
  if (!manager) {
    return res.status(404).json({
      success: false,
      message: 'Manager not found. Please ensure your account exists and is active.',
    });
  }
  
  // Verify manager role if manager is from Employee collection
  if (manager.role && manager.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only managers can use this endpoint',
    });
  }

  // Format date to get only the date part (YYYY-MM-DD)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find today's attendance record
  const attendance = await ManagerAttendance.findOne({
    managerId: managerId,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  if (!attendance) {
    return res.status(404).json({
      success: false,
      message: 'No check-in record found for today',
    });
  }

  if (attendance.checkOut) {
    return res.status(400).json({
      success: false,
      message: 'You have already checked out today',
    });
  }

  // Update check-out time and location
  attendance.checkOut = new Date();
  
  // Ensure that location object is properly initialized
  if (!attendance.location) {
    attendance.location = {};
  }
  
  // Add check-out location
  attendance.location.checkOutLocation = {
    lat: location.lat,
    lng: location.lng,
  };

  // Calculate work hours based on check-in and check-out times
  if (attendance.checkIn) {
    const checkInTime = new Date(attendance.checkIn).getTime();
    const checkOutTime = new Date(attendance.checkOut).getTime();
    attendance.workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60); // Convert to hours
  }

  await attendance.save();

  // Clear cache for this manager's today record
  managerAttendanceCache.delete(getCacheKey(managerId));

  res.status(200).json({
    success: true,
    data: attendance,
  });
});

// @desc    Get manager's attendance for a specific date
// @route   GET /api/manager/attendance/date/:date
// @access  Private (Manager)
const getAttendanceByDate = asyncHandler(async (req, res) => {
  // Ensure user object exists in request
  if (!req.user || !req.user._id) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please login again.',
    });
  }
  
  const managerId = req.user._id;
  const dateParam = req.params.date;

  // Verify manager role
  const manager = await findManagerById(managerId);
  if (!manager) {
    return res.status(404).json({
      success: false,
      message: 'Manager not found. Please ensure your account exists and is active.',
    });
  }
  
  // Verify manager role if manager is from Employee collection
  if (manager.role && manager.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only managers can use this endpoint',
    });
  }

  // Parse the date parameter
  const date = new Date(dateParam);
  date.setHours(0, 0, 0, 0);

  // Check cache first
  const cacheKey = getCacheKey(managerId, date);
  const cachedAttendance = managerAttendanceCache.get(cacheKey);
  
  if (cachedAttendance && cachedAttendance.timestamp > Date.now() - CACHE_TTL) {
    return res.status(200).json({
      success: true,
      data: cachedAttendance.data,
    });
  }

  const attendance = await ManagerAttendance.findOne({
    managerId: managerId,
    date: {
      $gte: date,
      $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  if (!attendance) {
    return res.status(404).json({
      success: false,
      message: 'No attendance record found for the specified date',
    });
  }

  // Update cache
  managerAttendanceCache.set(cacheKey, {
    timestamp: Date.now(),
    data: attendance
  });

  res.status(200).json({
    success: true,
    data: attendance,
  });
});

// @desc    Get manager's attendance for a date range
// @route   GET /api/manager/attendance/range
// @access  Private (Manager)
const getAttendanceByRange = asyncHandler(async (req, res) => {
  // Ensure user object exists in request
  if (!req.user || !req.user._id) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please login again.',
    });
  }
  
  const managerId = req.user._id;
  const { startDate, endDate } = req.query;

  // Verify manager role
  const manager = await findManagerById(managerId);
  if (!manager) {
    return res.status(404).json({
      success: false,
      message: 'Manager not found. Please ensure your account exists and is active.',
    });
  }
  
  // Verify manager role if manager is from Employee collection
  if (manager.role && manager.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only managers can use this endpoint',
    });
  }

  // Validate date parameters
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Please provide start and end dates',
    });
  }

  // Parse date parameters
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // Get attendance records for the date range
  const attendanceRecords = await ManagerAttendance.find({
    managerId: managerId,
    date: {
      $gte: start,
      $lte: end,
    },
  }).sort({ date: 1 });

  res.status(200).json({
    success: true,
    data: attendanceRecords,
  });
});

// @desc    Get manager's attendance for today
// @route   GET /api/manager/attendance/today
// @access  Private (Manager)
const getTodayAttendance = asyncHandler(async (req, res) => {
  // Ensure user object exists in request
  if (!req.user || !req.user._id) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please login again.',
    });
  }
  
  const managerId = req.user._id;

  // Verify manager role
  const manager = await findManagerById(managerId);
  if (!manager) {
    return res.status(404).json({
      success: false,
      message: 'Manager not found. Please ensure your account exists and is active.',
    });
  }
  
  // Verify manager role if manager is from Employee collection
  if (manager.role && manager.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only managers can use this endpoint',
    });
  }

  // Format date to get only the date part (YYYY-MM-DD)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check cache first
  const cacheKey = getCacheKey(managerId);
  const cachedAttendance = managerAttendanceCache.get(cacheKey);
  
  if (cachedAttendance && cachedAttendance.timestamp > Date.now() - CACHE_TTL) {
    return res.status(200).json({
      success: true,
      data: cachedAttendance.data,
    });
  }

  // Get today's attendance record
  const attendance = await ManagerAttendance.findOne({
    managerId: managerId,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  // Update cache
  managerAttendanceCache.set(cacheKey, {
    timestamp: Date.now(),
    data: attendance || null
  });

  res.status(200).json({
    success: true,
    data: attendance || null,
  });
});

// @desc    Get manager's attendance statistics
// @route   GET /api/manager/attendance/stats
// @access  Private (Manager)
const getAttendanceStats = asyncHandler(async (req, res) => {
  // Ensure user object exists in request
  if (!req.user || !req.user._id) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please login again.',
    });
  }
  
  const managerId = req.user._id;
  const { month, year } = req.query;

  // Verify manager role
  const manager = await findManagerById(managerId);
  if (!manager) {
    return res.status(404).json({
      success: false,
      message: 'Manager not found. Please ensure your account exists and is active.',
    });
  }
  
  // Verify manager role if manager is from Employee collection
  if (manager.role && manager.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only managers can use this endpoint',
    });
  }

  // Get current date info if not provided
  const currentDate = new Date();
  const currentMonth = month ? parseInt(month) : currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  const currentYear = year ? parseInt(year) : currentDate.getFullYear();

  // Check cache
  const cacheKey = `stats_${managerId}_${currentMonth}_${currentYear}`;
  const cachedStats = managerAttendanceCache.get(cacheKey);
  
  if (cachedStats && cachedStats.timestamp > Date.now() - CACHE_TTL) {
    return res.status(200).json({
      success: true,
      data: cachedStats.data,
    });
  }

  // Calculate start and end dates for the month
  const startDate = new Date(currentYear, currentMonth - 1, 1);
  const endDate = new Date(currentYear, currentMonth, 0);

  // Get all attendance records for the month
  const attendanceRecords = await ManagerAttendance.find({
    managerId: managerId,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ date: 1 });

  // Calculate statistics
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter((record) => record.status === 'present').length;
  const lateDays = attendanceRecords.filter((record) => record.status === 'late').length;
  const absentDays = attendanceRecords.filter((record) => record.status === 'absent').length;
  const leaveDays = attendanceRecords.filter((record) => record.status === 'leave').length;

  // Calculate total and average work hours
  let totalWorkHours = 0;
  attendanceRecords.forEach((record) => {
    totalWorkHours += record.workHours || 0;
  });
  const averageHours = totalDays > 0 ? totalWorkHours / totalDays : 0;

  // Calculate on-time and late percentages
  const onTimePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
  const latePercentage = totalDays > 0 ? (lateDays / totalDays) * 100 : 0;

  // Generate weekly hours data
  const weeklyHours = [];
  
  // Create a map of date to hours worked
  const dateToHoursMap = {};
  attendanceRecords.forEach(record => {
    const date = new Date(record.date).toISOString().split('T')[0];
    dateToHoursMap[date] = record.workHours || 0;
  });

  // Generate data for the last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = date.toISOString().split('T')[0];
    
    weeklyHours.push({
      day,
      date: dateStr,
      hours: dateToHoursMap[dateStr] || 0
    });
  }

  const stats = {
    totalDays,
    presentDays,
    lateDays,
    absentDays,
    leaveDays,
    totalWorkHours,
    averageHours,
    onTimePercentage,
    latePercentage,
    weeklyHours,
  };

  // Update cache
  managerAttendanceCache.set(cacheKey, {
    timestamp: Date.now(),
    data: stats
  });

  res.status(200).json({
    success: true,
    data: stats,
  });
});

// @desc    Get team attendance overview (for manager's team)
// @route   GET /api/manager/attendance/team
// @access  Private (Manager)
const getTeamAttendance = asyncHandler(async (req, res) => {
  // Ensure user object exists in request
  if (!req.user || !req.user._id) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please login again.',
    });
  }
  
  const managerId = req.user._id;
  
  // Verify manager role
  const manager = await findManagerById(managerId);
  if (!manager) {
    return res.status(404).json({
      success: false,
      message: 'Manager not found. Please ensure your account exists and is active.',
    });
  }
  
  // Verify manager role if manager is from Employee collection
  if (manager.role && manager.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only managers can use this endpoint',
    });
  }
  
  // Get date filter (default to today)
  const dateParam = req.query.date;
  const date = dateParam ? new Date(dateParam) : new Date();
  date.setHours(0, 0, 0, 0);
  
  // Get all employees managed by this manager
  const teamMembers = await Employee.find({
    managerId: managerId
  }).select('_id name department position');
  
  if (!teamMembers.length) {
    return res.status(200).json({
      success: true,
      data: {
        date: date.toISOString().split('T')[0],
        teamSize: 0,
        records: []
      }
    });
  }
  
  // Get team member IDs
  const teamMemberIds = teamMembers.map(member => member._id);
  
  // Get attendance records for all team members for the specified date
  const attendanceRecords = await Attendance.find({
    employeeId: { $in: teamMemberIds },
    date: {
      $gte: date,
      $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
    },
  });
  
  // Create a map of employee IDs to attendance records
  const attendanceMap = {};
  attendanceRecords.forEach(record => {
    attendanceMap[record.employeeId.toString()] = record;
  });
  
  // Build team attendance summary
  const teamSummary = teamMembers.map(member => {
    const attendance = attendanceMap[member._id.toString()];
    
    return {
      employeeId: member._id,
      name: member.name,
      department: member.department,
      position: member.position,
      status: attendance ? attendance.status : 'absent',
      checkInTime: attendance ? attendance.checkIn : null,
      checkOutTime: attendance ? attendance.checkOut : null,
      workHours: attendance ? attendance.workHours : 0
    };
  });
  
  // Count status types
  const presentCount = teamSummary.filter(item => item.status === 'present').length;
  const lateCount = teamSummary.filter(item => item.status === 'late').length;
  const absentCount = teamSummary.filter(item => item.status === 'absent').length;
  const leaveCount = teamSummary.filter(item => item.status === 'leave').length;
  
  res.status(200).json({
    success: true,
    data: {
      date: date.toISOString().split('T')[0],
      teamSize: teamMembers.length,
      summary: {
        presentCount,
        lateCount,
        absentCount,
        leaveCount,
        presentPercentage: (presentCount / teamMembers.length) * 100,
        latePercentage: (lateCount / teamMembers.length) * 100,
        absentPercentage: (absentCount / teamMembers.length) * 100,
        leavePercentage: (leaveCount / teamMembers.length) * 100,
      },
      records: teamSummary
    }
  });
});

// @desc    Get team attendance statistics for a period
// @route   GET /api/manager/attendance/team/stats
// @access  Private (Manager)
const getTeamAttendanceStats = asyncHandler(async (req, res) => {
  // Ensure user object exists in request
  if (!req.user || !req.user._id) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please login again.',
    });
  }
  
  const managerId = req.user._id;
  const { month, year } = req.query;
  
  // Verify manager role
  const manager = await findManagerById(managerId);
  if (!manager) {
    return res.status(404).json({
      success: false,
      message: 'Manager not found. Please ensure your account exists and is active.',
    });
  }
  
  // Verify manager role if manager is from Employee collection
  if (manager.role && manager.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only managers can use this endpoint',
    });
  }
  
  // Get current date info if not provided
  const currentDate = new Date();
  const currentMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
  const currentYear = year ? parseInt(year) : currentDate.getFullYear();
  
  // Check cache
  const cacheKey = `team_stats_${managerId}_${currentMonth}_${currentYear}`;
  const cachedStats = managerAttendanceCache.get(cacheKey);
  
  if (cachedStats && cachedStats.timestamp > Date.now() - CACHE_TTL) {
    return res.status(200).json({
      success: true,
      data: cachedStats.data,
    });
  }
  
  // Get all employees managed by this manager
  const teamMembers = await Employee.find({
    managerId: managerId
  }).select('_id name department position');
  
  if (!teamMembers.length) {
    return res.status(200).json({
      success: true,
      data: {
        month: currentMonth,
        year: currentYear,
        teamSize: 0,
        departmentStats: [],
        employeeStats: []
      }
    });
  }
  
  // Get team member IDs
  const teamMemberIds = teamMembers.map(member => member._id);
  
  // Calculate start and end dates for the month
  const startDate = new Date(currentYear, currentMonth - 1, 1);
  const endDate = new Date(currentYear, currentMonth, 0);
  
  // Get attendance records for all team members for the specified month
  const attendanceRecords = await Attendance.find({
    employeeId: { $in: teamMemberIds },
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  });
  
  // Create a map of employee IDs to attendance records
  const attendanceMap = {};
  attendanceRecords.forEach(record => {
    const empId = record.employeeId.toString();
    if (!attendanceMap[empId]) {
      attendanceMap[empId] = [];
    }
    attendanceMap[empId].push(record);
  });
  
  // Calculate stats for each employee
  const employeeStats = teamMembers.map(member => {
    const records = attendanceMap[member._id.toString()] || [];
    const presentDays = records.filter(r => r.status === 'present').length;
    const lateDays = records.filter(r => r.status === 'late').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const leaveDays = records.filter(r => r.status === 'leave').length;
    
    // Calculate total work hours
    let totalWorkHours = 0;
    records.forEach(record => {
      totalWorkHours += record.workHours || 0;
    });
    
    return {
      employeeId: member._id,
      name: member.name,
      department: member.department,
      position: member.position,
      presentDays,
      lateDays,
      absentDays,
      leaveDays,
      totalWorkHours,
      averageHoursPerDay: records.length > 0 ? totalWorkHours / records.length : 0,
      attendancePercentage: endDate.getDate() > 0 ? 
        ((presentDays + lateDays + leaveDays) / endDate.getDate()) * 100 : 0
    };
  });
  
  // Group by department for department stats
  const departmentMap = {};
  employeeStats.forEach(stat => {
    const dept = stat.department || 'Unassigned';
    if (!departmentMap[dept]) {
      departmentMap[dept] = {
        department: dept,
        employeeCount: 0,
        presentDays: 0,
        lateDays: 0,
        absentDays: 0,
        leaveDays: 0,
        totalWorkHours: 0
      };
    }
    
    departmentMap[dept].employeeCount++;
    departmentMap[dept].presentDays += stat.presentDays;
    departmentMap[dept].lateDays += stat.lateDays;
    departmentMap[dept].absentDays += stat.absentDays;
    departmentMap[dept].leaveDays += stat.leaveDays;
    departmentMap[dept].totalWorkHours += stat.totalWorkHours;
  });
  
  const departmentStats = Object.values(departmentMap).map(dept => ({
    ...dept,
    averageAttendance: dept.employeeCount > 0 ? 
      ((dept.presentDays + dept.lateDays) / 
      (dept.employeeCount * endDate.getDate())) * 100 : 0
  }));
  
  const stats = {
    month: currentMonth,
    year: currentYear,
    teamSize: teamMembers.length,
    departmentStats,
    employeeStats
  };
  
  // Update cache
  managerAttendanceCache.set(cacheKey, {
    timestamp: Date.now(),
    data: stats
  });
  
  res.status(200).json({
    success: true,
    data: stats
  });
});

module.exports = {
  checkIn,
  checkOut,
  getAttendanceByDate,
  getAttendanceByRange,
  getTodayAttendance,
  getAttendanceStats,
  getTeamAttendance,
  getTeamAttendanceStats
}; 