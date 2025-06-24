const Attendance = require('../models/attendanceModel');
const Employee = require('../models/employeeModel');
const asyncHandler = require('express-async-handler');

// Performance optimization - index common employee IDs and dates
const attendanceCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// Helper function to get cache key
const getCacheKey = (employeeId, date) => `${employeeId}_${date ? date.toISOString().split('T')[0] : 'today'}`;

// Helper function to check if check-in time is late based on employee's shift start time
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

// @desc    Check in employee
// @route   POST /api/attendance/check-in
// @access  Private (Employee)
const checkIn = asyncHandler(async (req, res) => {
  const { location } = req.body;
  
  // Validate request body
  if (!location) {
    return res.status(400).json({
      success: false,
      message: 'Location data is required for check-in',
    });
  }

  // Validate location data structure
  if (!location.lat || !location.lng || isNaN(location.lat) || isNaN(location.lng)) {
    return res.status(400).json({
      success: false,
      message: 'Valid latitude and longitude are required for check-in',
    });
  }

  const employeeId = req.user._id;

  // Validate user exists in request
  if (!employeeId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please login again.',
    });
  }

  // Get employee details to check shift time and office location
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found',
    });
  }

  // Check if user is within allowed work location - only if officeLocation is defined
  if (employee.officeLocation && employee.officeLocation.lat && employee.officeLocation.lng) {
    if (!isWithinWorkLocation(location, employee.officeLocation)) {
      return res.status(400).json({
        success: false,
        message: 'You are not at your designated work location',
      });
    }
  }

  // Format date to get only the date part (YYYY-MM-DD)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // Check if employee already checked in today
    let attendance = await Attendance.findOne({
      employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (attendance && attendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in today',
        data: {
          checkInTime: attendance.checkIn,
          status: attendance.status
        }
      });
    }

    const checkInTime = new Date();
    
    // Determine status based on employee's shift start time
    // Use the employee's shiftTime if available, otherwise default
    const shiftStart = employee.shiftTime && employee.shiftTime.start ? employee.shiftTime.start : "09:00";
    const isLate = isCheckInLate(checkInTime, shiftStart);
    const status = isLate ? 'late' : 'present';

    // Create new attendance record
    attendance = new Attendance({
      employeeId,
      date: today,
      checkIn: checkInTime,
      location,
      status,
    });

    await attendance.save();

    // Clear cache for this employee's today record
    attendanceCache.delete(getCacheKey(employeeId));

    res.status(201).json({
      success: true,
      data: attendance,
      message: 'Successfully checked in'
    });
  } catch (error) {
    console.error('Error during check-in:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during check-in',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Check out employee
// @route   PUT /api/attendance/check-out
// @access  Private (Employee)
const checkOut = asyncHandler(async (req, res) => {
  const { location } = req.body;
  const employeeId = req.user._id;

  // Format date to get only the date part (YYYY-MM-DD)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find today's attendance record
  const attendance = await Attendance.findOne({
    employeeId,
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

  // Clear cache for this employee's today record
  attendanceCache.delete(getCacheKey(employeeId));

  res.status(200).json({
    success: true,
    data: attendance,
  });
});

// @desc    Get employee's attendance for a specific date
// @route   GET /api/attendance/date/:date
// @access  Private (Employee)
const getAttendanceByDate = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const dateParam = req.params.date;

  // Parse the date parameter
  const date = new Date(dateParam);
  date.setHours(0, 0, 0, 0);

  // Check cache first
  const cacheKey = getCacheKey(employeeId, date);
  const cachedAttendance = attendanceCache.get(cacheKey);
  
  if (cachedAttendance && cachedAttendance.timestamp > Date.now() - CACHE_TTL) {
    return res.status(200).json({
      success: true,
      data: cachedAttendance.data,
    });
  }

  const attendance = await Attendance.findOne({
    employeeId,
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
  attendanceCache.set(cacheKey, {
    timestamp: Date.now(),
    data: attendance
  });

  res.status(200).json({
    success: true,
    data: attendance,
  });
});

// @desc    Get employee's attendance for a date range
// @route   GET /api/attendance/range
// @access  Private (Employee)
const getAttendanceByRange = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const { startDate, endDate } = req.query;

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
  const attendanceRecords = await Attendance.find({
    employeeId,
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

// @desc    Get employee's attendance for today
// @route   GET /api/attendance/today
// @access  Private (Employee)
const getTodayAttendance = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;

  // Format date to get only the date part (YYYY-MM-DD)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check cache first
  const cacheKey = getCacheKey(employeeId);
  const cachedAttendance = attendanceCache.get(cacheKey);
  
  if (cachedAttendance && cachedAttendance.timestamp > Date.now() - CACHE_TTL) {
    return res.status(200).json({
      success: true,
      data: cachedAttendance.data,
    });
  }

  // Get today's attendance record
  const attendance = await Attendance.findOne({
    employeeId,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  // Update cache
  attendanceCache.set(cacheKey, {
    timestamp: Date.now(),
    data: attendance || null
  });

  res.status(200).json({
    success: true,
    data: attendance || null,
  });
});

// @desc    Get employee's attendance statistics
// @route   GET /api/attendance/stats
// @access  Private (Employee)
const getAttendanceStats = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const { month, year } = req.query;

  // Get current date info if not provided
  const currentDate = new Date();
  const currentMonth = month ? parseInt(month) : currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  const currentYear = year ? parseInt(year) : currentDate.getFullYear();

  // Check cache
  const cacheKey = `stats_${employeeId}_${currentMonth}_${currentYear}`;
  const cachedStats = attendanceCache.get(cacheKey);
  
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
  const attendanceRecords = await Attendance.find({
    employeeId,
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
  attendanceCache.set(cacheKey, {
    timestamp: Date.now(),
    data: stats
  });

  res.status(200).json({
    success: true,
    data: stats,
  });
});

// @desc    Get all users' attendance records (Admin)
// @route   GET /api/attendance/all
// @access  Private (Admin)
const getAllAttendanceRecords = asyncHandler(async (req, res) => {
  const { date, startDate, endDate, department, status, search, role, page = 1, limit = 20 } = req.query;
  let attendanceQuery = {};

  // Date filter - handle both single date and date range
  if (startDate && endDate) {
    // Date range filtering
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    attendanceQuery.date = { $gte: start, $lte: end };
  } else if (startDate) {
    // Only start date provided
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    attendanceQuery.date = { $gte: start, $lte: end };
  } else if (endDate) {
    // Only end date provided
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    attendanceQuery.date = { $lte: end };
  } else if (date) {
    // Single date filtering (backwards compatibility)
    const queryDate = new Date(date);
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));
    attendanceQuery.date = { $gte: startOfDay, $lte: endOfDay };
  } else {
    // Default to today
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    attendanceQuery.date = { $gte: startOfDay, $lte: endOfDay };
  }

  // Status filter
  if (status && status !== 'all') {
    attendanceQuery.status = status;
  }

  let attendanceRecords = [];

  try {
    if (role === 'manager') {
      // Get manager attendance records from ManagerAttendance model
      const ManagerAttendance = require('../models/managerAttendanceModel');
      
      const managerAttendanceRecords = await ManagerAttendance.find(attendanceQuery)
        .populate({
          path: 'managerId',
          select: 'id name department position profilePicture',
        })
        .sort({ date: -1, checkIn: -1 });

      // Also get managers from Employee collection with role 'manager'
      const employeeManagerRecords = await Attendance.find(attendanceQuery)
        .populate({
          path: 'employeeId',
          select: 'id name department position role profilePicture',
          match: { role: 'manager' }
        })
        .sort({ date: -1, checkIn: -1 });

      // Filter out records where employeeId is null (didn't match role filter)
      const validEmployeeManagerRecords = employeeManagerRecords.filter(record => record.employeeId);

      // Combine and format both types of manager records
      const formattedManagerRecords = managerAttendanceRecords.map(record => ({
        _id: record._id,
        employeeId: record.managerId,
        date: record.date,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        status: record.status,
        workHours: record.workHours,
        location: record.location
      }));

      attendanceRecords = [...formattedManagerRecords, ...validEmployeeManagerRecords];
    } else if (role === 'employee') {
      // Get employee attendance records (excluding managers)
      attendanceRecords = await Attendance.find(attendanceQuery)
        .populate({
          path: 'employeeId',
          select: 'id name department position role profilePicture',
        })
        .sort({ date: -1, checkIn: -1 });

      // Filter to only include employees (not managers)
      attendanceRecords = attendanceRecords.filter(record =>
        record.employeeId && record.employeeId.role === 'employee'
      );
    } else {
      // Get all attendance records (both employees and managers)
      const ManagerAttendance = require('../models/managerAttendanceModel');
      
      // Get employee attendance
      const employeeRecords = await Attendance.find(attendanceQuery)
        .populate({
          path: 'employeeId',
          select: 'id name department position role profilePicture',
        })
        .sort({ date: -1, checkIn: -1 });

      // Get manager attendance from ManagerAttendance model
      const managerAttendanceRecords = await ManagerAttendance.find(attendanceQuery)
        .populate({
          path: 'managerId',
          select: 'id name department position profilePicture',
        })
        .sort({ date: -1, checkIn: -1 });

      // Format manager records to match employee record structure
      const formattedManagerRecords = managerAttendanceRecords.map(record => ({
        _id: record._id,
        employeeId: record.managerId,
        date: record.date,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        status: record.status,
        workHours: record.workHours,
        location: record.location
      }));

      attendanceRecords = [...employeeRecords, ...formattedManagerRecords];
    }

    // Filter by department if specified
    if (department && department !== 'all') {
      attendanceRecords = attendanceRecords.filter(record =>
        record.employeeId && record.employeeId.department === department
      );
    }

    // Filter by search term
    if (search) {
      const searchTerm = search.toLowerCase();
      attendanceRecords = attendanceRecords.filter(record =>
        record.employeeId && (
          record.employeeId.name.toLowerCase().includes(searchTerm) ||
          record.employeeId.department.toLowerCase().includes(searchTerm) ||
          record.employeeId.position.toLowerCase().includes(searchTerm)
        )
      );
    }

    // Pagination
    const totalRecords = attendanceRecords.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedRecords = attendanceRecords.slice(startIndex, endIndex);

    // Calculate statistics
    const stats = attendanceRecords.reduce(
      (acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        return acc;
      },
      { present: 0, absent: 0, late: 0, leave: 0 }
    );

    res.status(200).json({
      success: true,
      data: paginatedRecords,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalRecords,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      stats,
    });
  } catch (error) {
    console.error('Error getting all attendance records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance records',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get comprehensive attendance analytics
// @route   GET /api/attendance/analytics
// @access  Private (Admin)
const getAttendanceAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate, department, role } = req.query;
  
  // Set default date range (last 30 days if not provided)
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  try {
    let attendanceQuery = {
      date: { $gte: start, $lte: end }
    };

    let attendanceRecords = [];

    if (role === 'manager') {
      // Get manager attendance records
      const ManagerAttendance = require('../models/managerAttendanceModel');
      const managerRecords = await ManagerAttendance.find(attendanceQuery)
        .populate({
          path: 'managerId',
          select: 'id name department position profilePicture',
        });

      // Also get managers from Employee collection
      const employeeManagerRecords = await Attendance.find(attendanceQuery)
        .populate({
          path: 'employeeId',
          select: 'id name department position role profilePicture',
          match: { role: 'manager' }
        });

      const validEmployeeManagerRecords = employeeManagerRecords.filter(record => record.employeeId);

      // Format manager records
      const formattedManagerRecords = managerRecords.map(record => ({
        _id: record._id,
        employeeId: record.managerId,
        date: record.date,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        status: record.status,
        workHours: record.workHours,
        location: record.location
      }));

      attendanceRecords = [...formattedManagerRecords, ...validEmployeeManagerRecords];
    } else if (role === 'employee') {
      // Get employee attendance records (excluding managers)
      attendanceRecords = await Attendance.find(attendanceQuery)
        .populate({
          path: 'employeeId',
          select: 'id name department position role profilePicture',
        });

      attendanceRecords = attendanceRecords.filter(record =>
        record.employeeId && record.employeeId.role === 'employee'
      );
    } else {
      // Get all attendance records
      const ManagerAttendance = require('../models/managerAttendanceModel');
      
      const employeeRecords = await Attendance.find(attendanceQuery)
        .populate({
          path: 'employeeId',
          select: 'id name department position role profilePicture',
        });

      const managerRecords = await ManagerAttendance.find(attendanceQuery)
        .populate({
          path: 'managerId',
          select: 'id name department position profilePicture',
        });

      const formattedManagerRecords = managerRecords.map(record => ({
        _id: record._id,
        employeeId: record.managerId,
        date: record.date,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        status: record.status,
        workHours: record.workHours,
        location: record.location
      }));

      attendanceRecords = [...employeeRecords, ...formattedManagerRecords];
    }

    // Filter by department if specified
    if (department && department !== 'all') {
      attendanceRecords = attendanceRecords.filter(record =>
        record.employeeId && record.employeeId.department === department
      );
    }

    // Calculate comprehensive analytics
    const analytics = {
      totalRecords: attendanceRecords.length,
      dateRange: { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] },
      overallStats: calculateOverallStats(attendanceRecords),
      dailyTrends: calculateDailyTrends(attendanceRecords, start, end),
      departmentStats: calculateDepartmentStats(attendanceRecords),
      statusDistribution: calculateStatusDistribution(attendanceRecords),
      monthlyTrends: calculateMonthlyTrends(attendanceRecords),
      weeklyPatterns: calculateWeeklyPatterns(attendanceRecords)
    };

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Error getting attendance analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get department-wise attendance statistics
// @route   GET /api/attendance/analytics/departments
// @access  Private (Admin)
const getDepartmentAttendanceStats = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  
  // Get current date info if not provided
  const currentDate = new Date();
  const currentMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
  const currentYear = year ? parseInt(year) : currentDate.getFullYear();

  // Calculate start and end dates for the month
  const startDate = new Date(currentYear, currentMonth - 1, 1);
  const endDate = new Date(currentYear, currentMonth, 0);

  try {
    // Get all attendance records for the month
    const employeeRecords = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate({
      path: 'employeeId',
      select: 'name department position role'
    });

    // Get manager records
    const ManagerAttendance = require('../models/managerAttendanceModel');
    const managerRecords = await ManagerAttendance.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate({
      path: 'managerId',
      select: 'name department position'
    });

    // Combine and format records
    const allRecords = [
      ...employeeRecords.filter(r => r.employeeId),
      ...managerRecords.map(record => ({
        ...record.toObject(),
        employeeId: record.managerId
      })).filter(r => r.employeeId)
    ];

    // Group by department
    const departmentStats = {};
    
    allRecords.forEach(record => {
      const dept = record.employeeId.department || 'Unassigned';
      
      if (!departmentStats[dept]) {
        departmentStats[dept] = {
          department: dept,
          totalEmployees: new Set(),
          present: 0,
          late: 0,
          absent: 0,
          leave: 0,
          totalWorkHours: 0
        };
      }
      
      departmentStats[dept].totalEmployees.add(record.employeeId._id.toString());
      departmentStats[dept][record.status]++;
      departmentStats[dept].totalWorkHours += record.workHours || 0;
    });

    // Format response
    const formattedStats = Object.values(departmentStats).map(dept => ({
      department: dept.department,
      totalEmployees: dept.totalEmployees.size,
      attendanceRate: dept.totalEmployees.size > 0 ? 
        ((dept.present + dept.late) / (dept.present + dept.late + dept.absent + dept.leave)) * 100 : 0,
      present: dept.present,
      late: dept.late,
      absent: dept.absent,
      leave: dept.leave,
      averageWorkHours: dept.totalEmployees.size > 0 ? dept.totalWorkHours / dept.totalEmployees.size : 0
    }));

    res.status(200).json({
      success: true,
      data: {
        month: currentMonth,
        year: currentYear,
        departments: formattedStats
      }
    });
  } catch (error) {
    console.error('Error getting department attendance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching department attendance statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get attendance trends over time
// @route   GET /api/attendance/analytics/trends
// @access  Private (Admin)
const getAttendanceTrends = asyncHandler(async (req, res) => {
  const { period = 'week', startDate, endDate } = req.query;
  
  let start, end, labels, groupBy;
  
  if (period === 'week') {
    // Last 7 days
    end = new Date();
    start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
    labels = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(end.getTime() - i * 24 * 60 * 60 * 1000);
      labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
    }
    groupBy = 'day';
  } else if (period === 'month') {
    // Last 4 weeks
    end = new Date();
    start = new Date(end.getTime() - 27 * 24 * 60 * 60 * 1000);
    labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    groupBy = 'week';
  } else {
    // Custom date range
    start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    end = endDate ? new Date(endDate) : new Date();
    labels = [];
    groupBy = 'day';
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  try {
    // Get all attendance records for the period
    const employeeRecords = await Attendance.find({
      date: { $gte: start, $lte: end }
    }).populate({
      path: 'employeeId',
      select: 'name department'
    });

    const ManagerAttendance = require('../models/managerAttendanceModel');
    const managerRecords = await ManagerAttendance.find({
      date: { $gte: start, $lte: end }
    }).populate({
      path: 'managerId',
      select: 'name department'
    });

    const allRecords = [
      ...employeeRecords.filter(r => r.employeeId),
      ...managerRecords.map(record => ({
        ...record.toObject(),
        employeeId: record.managerId
      })).filter(r => r.employeeId)
    ];

    // Group data by time period
    const trendsData = {
      labels,
      datasets: [
        {
          label: 'Present',
          data: [],
          borderColor: '#10B981',
          tension: 0.4
        },
        {
          label: 'Late',
          data: [],
          borderColor: '#F59E0B',
          tension: 0.4
        },
        {
          label: 'Absent',
          data: [],
          borderColor: '#EF4444',
          tension: 0.4
        }
      ]
    };

    if (groupBy === 'day') {
      for (let i = 0; i < labels.length; i++) {
        const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayRecords = allRecords.filter(r => 
          r.date.toISOString().split('T')[0] === dateStr
        );
        
        trendsData.datasets[0].data.push(dayRecords.filter(r => r.status === 'present').length);
        trendsData.datasets[1].data.push(dayRecords.filter(r => r.status === 'late').length);
        trendsData.datasets[2].data.push(dayRecords.filter(r => r.status === 'absent').length);
      }
    }

    res.status(200).json({
      success: true,
      data: trendsData
    });
  } catch (error) {
    console.error('Error getting attendance trends:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance trends',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get monthly attendance statistics
// @route   GET /api/attendance/analytics/monthly
// @access  Private (Admin)
const getMonthlyAttendanceStats = asyncHandler(async (req, res) => {
  const { year } = req.query;
  const currentYear = year ? parseInt(year) : new Date().getFullYear();

  try {
    const monthlyStats = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let month = 0; month < 12; month++) {
      const startDate = new Date(currentYear, month, 1);
      const endDate = new Date(currentYear, month + 1, 0);

      // Get attendance records for this month
      const employeeRecords = await Attendance.find({
        date: { $gte: startDate, $lte: endDate }
      });

      const ManagerAttendance = require('../models/managerAttendanceModel');
      const managerRecords = await ManagerAttendance.find({
        date: { $gte: startDate, $lte: endDate }
      });

      const allRecords = [...employeeRecords, ...managerRecords];
      
      const presentCount = allRecords.filter(r => r.status === 'present').length;
      const lateCount = allRecords.filter(r => r.status === 'late').length;
      const absentCount = allRecords.filter(r => r.status === 'absent').length;
      const leaveCount = allRecords.filter(r => r.status === 'leave').length;
      
      const totalRecords = allRecords.length;
      const attendanceRate = totalRecords > 0 ? ((presentCount + lateCount) / totalRecords) * 100 : 0;

      monthlyStats.push({
        month: months[month],
        monthNumber: month + 1,
        attendanceRate: Math.round(attendanceRate),
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        leave: leaveCount,
        total: totalRecords
      });
    }

    res.status(200).json({
      success: true,
      data: {
        year: currentYear,
        months: monthlyStats,
        chartData: {
          labels: months,
          datasets: [{
            label: 'Attendance Rate',
            data: monthlyStats.map(m => m.attendanceRate),
            borderColor: '#3b82f6',
            tension: 0.4,
            fill: true,
            backgroundColor: 'rgba(59, 130, 246, 0.1)'
          }]
        }
      }
    });
  } catch (error) {
    console.error('Error getting monthly attendance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly attendance statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get attendance status distribution
// @route   GET /api/attendance/analytics/distribution
// @access  Private (Admin)
const getAttendanceDistribution = asyncHandler(async (req, res) => {
  const { startDate, endDate, department } = req.query;
  
  // Set default date range (current month if not provided)
  const currentDate = new Date();
  const start = startDate ? new Date(startDate) : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const end = endDate ? new Date(endDate) : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  try {
    let attendanceQuery = {
      date: { $gte: start, $lte: end }
    };

    // Get all attendance records
    const employeeRecords = await Attendance.find(attendanceQuery)
      .populate({
        path: 'employeeId',
        select: 'name department'
      });

    const ManagerAttendance = require('../models/managerAttendanceModel');
    const managerRecords = await ManagerAttendance.find(attendanceQuery)
      .populate({
        path: 'managerId',
        select: 'name department'
      });

    let allRecords = [
      ...employeeRecords.filter(r => r.employeeId),
      ...managerRecords.map(record => ({
        ...record.toObject(),
        employeeId: record.managerId
      })).filter(r => r.employeeId)
    ];

    // Filter by department if specified
    if (department && department !== 'all') {
      allRecords = allRecords.filter(record =>
        record.employeeId && record.employeeId.department === department
      );
    }

    // Calculate distribution
    const distribution = {
      present: allRecords.filter(r => r.status === 'present').length,
      late: allRecords.filter(r => r.status === 'late').length,
      absent: allRecords.filter(r => r.status === 'absent').length,
      leave: allRecords.filter(r => r.status === 'leave').length
    };

    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);

    // Calculate percentages
    const percentages = {};
    Object.keys(distribution).forEach(status => {
      percentages[status] = total > 0 ? Math.round((distribution[status] / total) * 100) : 0;
    });

    res.status(200).json({
      success: true,
      data: {
        distribution,
        percentages,
        total,
        chartData: {
          labels: ['Present', 'Late', 'Absent', 'On Leave'],
          datasets: [{
            data: [distribution.present, distribution.late, distribution.absent, distribution.leave],
            backgroundColor: [
              '#10b981',
              '#f59e0b',
              '#ef4444',
              '#3b82f6'
            ]
          }]
        }
      }
    });
  } catch (error) {
    console.error('Error getting attendance distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance distribution',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper functions for analytics calculations
function calculateOverallStats(records) {
  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const late = records.filter(r => r.status === 'late').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const leave = records.filter(r => r.status === 'leave').length;

  return {
    total,
    present,
    late,
    absent,
    leave,
    attendanceRate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
    punctualityRate: total > 0 ? Math.round((present / total) * 100) : 0
  };
}

function calculateDailyTrends(records, startDate, endDate) {
  const trends = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayRecords = records.filter(r => 
      r.date.toISOString().split('T')[0] === dateStr
    );
    
    trends.push({
      date: dateStr,
      day: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
      present: dayRecords.filter(r => r.status === 'present').length,
      late: dayRecords.filter(r => r.status === 'late').length,
      absent: dayRecords.filter(r => r.status === 'absent').length,
      leave: dayRecords.filter(r => r.status === 'leave').length
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return trends;
}

function calculateDepartmentStats(records) {
  const deptStats = {};
  
  records.forEach(record => {
    if (!record.employeeId) return;
    
    const dept = record.employeeId.department || 'Unassigned';
    
    if (!deptStats[dept]) {
      deptStats[dept] = {
        department: dept,
        employees: new Set(),
        present: 0,
        late: 0,
        absent: 0,
        leave: 0
      };
    }
    
    deptStats[dept].employees.add(record.employeeId._id.toString());
    deptStats[dept][record.status]++;
  });
  
  return Object.values(deptStats).map(dept => ({
    ...dept,
    totalEmployees: dept.employees.size,
    employees: undefined, // Remove Set object
    attendanceRate: dept.totalEmployees > 0 ? 
      Math.round(((dept.present + dept.late) / (dept.present + dept.late + dept.absent + dept.leave)) * 100) : 0
  }));
}

function calculateStatusDistribution(records) {
  return {
    present: records.filter(r => r.status === 'present').length,
    late: records.filter(r => r.status === 'late').length,
    absent: records.filter(r => r.status === 'absent').length,
    leave: records.filter(r => r.status === 'leave').length
  };
}

function calculateMonthlyTrends(records) {
  const monthlyData = {};
  
  records.forEach(record => {
    const month = record.date.getMonth();
    const year = record.date.getFullYear();
    const key = `${year}-${month}`;
    
    if (!monthlyData[key]) {
      monthlyData[key] = {
        month,
        year,
        present: 0,
        late: 0,
        absent: 0,
        leave: 0
      };
    }
    
    monthlyData[key][record.status]++;
  });
  
  return Object.values(monthlyData);
}

function calculateWeeklyPatterns(records) {
  const weeklyData = {};
  
  records.forEach(record => {
    const dayOfWeek = record.date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    if (!weeklyData[dayOfWeek]) {
      weeklyData[dayOfWeek] = {
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
        present: 0,
        late: 0,
        absent: 0,
        leave: 0
      };
    }
    
    weeklyData[dayOfWeek][record.status]++;
  });
  
  return Object.values(weeklyData);
}

// @desc    End day - process all attendance and mark absent/leave users
// @route   POST /api/attendance/end-day
// @access  Private (Admin)
const endDay = asyncHandler(async (req, res) => {
  try {
    const Employee = require('../models/employeeModel');
    const Manager = require('../models/managerModel');
    const ManagerAttendance = require('../models/managerAttendanceModel');
    const Leave = require('../models/leaveModel');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let processed = 0;
    let marked_absent = 0;
    let marked_leave = 0;
    let already_present = 0;
    
    // Get all active employees
    const employees = await Employee.find({ status: 'Active' });
    
    // Get all active managers
    const managers = await Manager.find({ status: 'Active' });
    
    // Get all employees with manager role
    const employeeManagers = await Employee.find({ 
      status: 'Active', 
      role: 'manager' 
    });
    
    // Get all approved leave requests for today
    const leaveRequests = await Leave.find({
      startDate: { $lte: today },
      endDate: { $gte: today },
      status: 'approved'
    }).populate('employeeId', '_id');
    
    // Get all approved manager leave requests for today  
    const ManagerLeave = require('../models/managerLeaveModel');
    const managerLeaveRequests = await ManagerLeave.find({
      startDate: { $lte: today },
      endDate: { $gte: today },
      status: 'approved'
    }).populate('managerId', '_id');
    
    // Create a set of user IDs who are on leave today
    const usersOnLeave = new Set();
    leaveRequests.forEach(leave => {
      if (leave.employeeId) {
        usersOnLeave.add(leave.employeeId._id.toString());
      }
    });
    
    managerLeaveRequests.forEach(leave => {
      if (leave.managerId) {
        usersOnLeave.add(leave.managerId._id.toString());
      }
    });
    
    // Process regular employees
    for (const employee of employees) {
      processed++;
      
      // Skip managers (they'll be processed separately)
      if (employee.role === 'manager') {
        continue;
      }
      
      // Check if employee already has attendance record for today
      const existingAttendance = await Attendance.findOne({
        employeeId: employee._id,
        date: { $gte: today, $lt: tomorrow }
      });
      
      if (existingAttendance) {
        already_present++;
        continue;
      }
      
      // Determine status based on leave
      const isOnLeave = usersOnLeave.has(employee._id.toString());
      const status = isOnLeave ? 'leave' : 'absent';
      
      // Create attendance record
      const attendanceRecord = new Attendance({
        employeeId: employee._id,
        date: today,
        status: status,
        checkIn: null, // Always null for automated end-of-day records
        checkOut: null,
        workHours: 0,
        location: null // Always null for automated end-of-day records
      });
      
      await attendanceRecord.save();
      
      if (isOnLeave) {
        marked_leave++;
      } else {
        marked_absent++;
      }
    }
    
    // Process dedicated managers
    for (const manager of managers) {
      processed++;
      
      // Check if manager already has attendance record for today
      const existingAttendance = await ManagerAttendance.findOne({
        managerId: manager._id,
        date: { $gte: today, $lt: tomorrow }
      });
      
      if (existingAttendance) {
        already_present++;
        continue;
      }
      
      // Determine status based on leave
      const isOnLeave = usersOnLeave.has(manager._id.toString());
      const status = isOnLeave ? 'leave' : 'absent';
      
      // Create manager attendance record
      const attendanceRecord = new ManagerAttendance({
        managerId: manager._id,
        date: today,
        status: status,
        checkIn: null, // Always null for automated end-of-day records
        checkOut: null,
        workHours: 0,
        location: null // Always null for automated end-of-day records
      });
      
      await attendanceRecord.save();
      
      if (isOnLeave) {
        marked_leave++;
      } else {
        marked_absent++;
      }
    }
    
    // Process employee-managers
    for (const employeeManager of employeeManagers) {
      processed++;
      
      // Check if employee-manager already has attendance record for today
      const existingAttendance = await Attendance.findOne({
        employeeId: employeeManager._id,
        date: { $gte: today, $lt: tomorrow }
      });
      
      if (existingAttendance) {
        already_present++;
        continue;
      }
      
      // Determine status based on leave
      const isOnLeave = usersOnLeave.has(employeeManager._id.toString());
      const status = isOnLeave ? 'leave' : 'absent';
      
      // Create attendance record
      const attendanceRecord = new Attendance({
        employeeId: employeeManager._id,
        date: today,
        status: status,
        checkIn: null, // Always null for automated end-of-day records
        checkOut: null,
        workHours: 0,
        location: null // Always null for automated end-of-day records
      });
      
      await attendanceRecord.save();
      
      if (isOnLeave) {
        marked_leave++;
      } else {
        marked_absent++;
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Day ended successfully',
      data: {
        processed,
        marked_absent,
        marked_leave,
        already_present,
        date: today.toISOString().split('T')[0]
      }
    });
    
  } catch (error) {
    console.error('Error ending day:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing end of day',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = {
  checkIn,
  checkOut,
  getTodayAttendance,
  getAttendanceByDate,
  getAttendanceByRange,
  getAttendanceStats,
  getAllAttendanceRecords,
  getAttendanceAnalytics,
  getDepartmentAttendanceStats,
  getAttendanceTrends,
  getMonthlyAttendanceStats,
  getAttendanceDistribution,
  endDay
}; 