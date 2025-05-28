const Employee = require('../models/employeeModel');
const Manager = require('../models/managerModel');
const Attendance = require('../models/attendanceModel');
const ManagerAttendance = require('../models/managerAttendanceModel');

/**
 * User Service - Handles operations across Employee and Manager collections
 * Ensures proper separation and unified access to user data
 */

// Get all active users (employees + managers)
const getAllActiveUsers = async () => {
  try {
    // Get regular employees (excluding those with manager role to avoid duplication)
    const employees = await Employee.find({ 
      status: 'Active', 
      role: { $ne: 'manager' } 
    }).select('id name email department position role status');
    
    // Get dedicated managers
    const managers = await Manager.find({ 
      status: 'Active' 
    }).select('id name email department position status');
    
    // Get employees with manager role (if any exist)
    const employeeManagers = await Employee.find({ 
      status: 'Active', 
      role: 'manager' 
    }).select('id name email department position role status');

    // Combine all users with role identification
    const allUsers = [
      ...employees.map(emp => ({ ...emp.toObject(), userType: 'employee' })),
      ...managers.map(mgr => ({ ...mgr.toObject(), userType: 'manager', role: 'manager' })),
      ...employeeManagers.map(empMgr => ({ ...empMgr.toObject(), userType: 'employee-manager' }))
    ];

    return allUsers;
  } catch (error) {
    console.error('Error getting all active users:', error);
    throw error;
  }
};

// Get user counts by category
const getUserCounts = async () => {
  try {
    const regularEmployees = await Employee.countDocuments({ 
      status: 'Active', 
      role: { $ne: 'manager' } 
    });
    
    const dedicatedManagers = await Manager.countDocuments({ 
      status: 'Active' 
    });
    
    const employeeManagers = await Employee.countDocuments({ 
      status: 'Active', 
      role: 'manager' 
    });

    return {
      totalEmployees: regularEmployees,
      totalManagers: dedicatedManagers + employeeManagers,
      totalUsers: regularEmployees + dedicatedManagers + employeeManagers,
      breakdown: {
        regularEmployees,
        dedicatedManagers,
        employeeManagers
      }
    };
  } catch (error) {
    console.error('Error getting user counts:', error);
    throw error;
  }
};

// Get department distribution
const getDepartmentDistribution = async () => {
  try {
    // Get regular employees by department
    const employeeDepts = await Employee.aggregate([
      { $match: { status: 'Active', role: { $ne: 'manager' } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get dedicated managers by department
    const managerDepts = await Manager.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    // Get employee-managers by department
    const empManagerDepts = await Employee.aggregate([
      { $match: { status: 'Active', role: 'manager' } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    // Combine all department data
    const departmentMap = new Map();
    
    [...employeeDepts, ...managerDepts, ...empManagerDepts].forEach(dept => {
      if (dept._id && dept._id.trim()) { // Only add if department name exists and is not empty
        const deptName = dept._id.trim();
        departmentMap.set(deptName, (departmentMap.get(deptName) || 0) + dept.count);
      }
    });

    // Convert to sorted array
    const departments = Array.from(departmentMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return departments;
  } catch (error) {
    console.error('Error getting department distribution:', error);
    throw error;
  }
};

// Get attendance data for a specific date range
const getAttendanceData = async (startDate, endDate) => {
  try {
    // Get employee attendance
    const employeeAttendance = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate({
      path: 'employeeId',
      match: { status: 'Active' },
      select: 'id name email department status role'
    });

    // Get manager attendance
    const managerAttendance = await ManagerAttendance.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate({
      path: 'managerId',
      match: { status: 'Active' },
      select: 'id name email department status'
    });

    // Filter out records where user was not found (inactive users)
    const validEmployeeAttendance = employeeAttendance
      .filter(record => record.employeeId)
      .map(record => ({
        ...record.toObject(),
        userType: 'employee',
        user: record.employeeId
      }));

    const validManagerAttendance = managerAttendance
      .filter(record => record.managerId)
      .map(record => ({
        ...record.toObject(),
        userType: 'manager',
        user: record.managerId
      }));

    return {
      employeeAttendance: validEmployeeAttendance,
      managerAttendance: validManagerAttendance,
      totalRecords: validEmployeeAttendance.length + validManagerAttendance.length
    };
  } catch (error) {
    console.error('Error getting attendance data:', error);
    throw error;
  }
};

// Calculate attendance statistics
const calculateAttendanceStats = async (startDate, endDate) => {
  try {
    const attendanceData = await getAttendanceData(startDate, endDate);
    const allAttendance = [...attendanceData.employeeAttendance, ...attendanceData.managerAttendance];
    
    const totalRecords = allAttendance.length;
    if (totalRecords === 0) {
      return {
        totalRecords: 0,
        presentCount: 0,
        lateCount: 0,
        absentCount: 0,
        presentPercentage: 95,
        latePercentage: 3,
        absentPercentage: 2
      };
    }

    const presentCount = allAttendance.filter(record => record.status === 'present').length;
    const lateCount = allAttendance.filter(record => record.status === 'late').length;
    const absentCount = allAttendance.filter(record => record.status === 'absent').length;

    return {
      totalRecords,
      presentCount,
      lateCount,
      absentCount,
      presentPercentage: Math.round((presentCount / totalRecords) * 100),
      latePercentage: Math.round((lateCount / totalRecords) * 100),
      absentPercentage: Math.round((absentCount / totalRecords) * 100)
    };
  } catch (error) {
    console.error('Error calculating attendance stats:', error);
    throw error;
  }
};

// Find user by ID across both collections
const findUserById = async (userId, userType = null) => {
  try {
    let user = null;

    if (!userType || userType === 'employee') {
      user = await Employee.findById(userId).select('-password');
      if (user) return { ...user.toObject(), userType: 'employee' };
    }

    if (!userType || userType === 'manager') {
      user = await Manager.findById(userId).select('-password');
      if (user) return { ...user.toObject(), userType: 'manager' };
    }

    return null;
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw error;
  }
};

// Find user by email across both collections
const findUserByEmail = async (email) => {
  try {
    // Try Employee collection first
    let user = await Employee.findOne({ email: email.toLowerCase() }).select('-password');
    if (user) return { ...user.toObject(), userType: 'employee' };

    // Try Manager collection
    user = await Manager.findOne({ email: email.toLowerCase() }).select('-password');
    if (user) return { ...user.toObject(), userType: 'manager' };

    return null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
};

// Get users by department
const getUsersByDepartment = async (department) => {
  try {
    const employees = await Employee.find({ 
      department, 
      status: 'Active',
      role: { $ne: 'manager' }
    }).select('-password');
    
    const managers = await Manager.find({ 
      department, 
      status: 'Active' 
    }).select('-password');
    
    const employeeManagers = await Employee.find({ 
      department, 
      status: 'Active',
      role: 'manager'
    }).select('-password');

    return {
      employees: employees.map(emp => ({ ...emp.toObject(), userType: 'employee' })),
      managers: managers.map(mgr => ({ ...mgr.toObject(), userType: 'manager' })),
      employeeManagers: employeeManagers.map(empMgr => ({ ...empMgr.toObject(), userType: 'employee-manager' })),
      totalCount: employees.length + managers.length + employeeManagers.length
    };
  } catch (error) {
    console.error('Error getting users by department:', error);
    throw error;
  }
};

module.exports = {
  getAllActiveUsers,
  getUserCounts,
  getDepartmentDistribution,
  getAttendanceData,
  calculateAttendanceStats,
  findUserById,
  findUserByEmail,
  getUsersByDepartment
}; 