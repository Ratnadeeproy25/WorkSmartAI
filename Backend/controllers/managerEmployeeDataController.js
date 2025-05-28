const Employee = require('../models/employeeModel');
const Manager = require('../models/managerModel');
const Attendance = require('../models/attendanceModel');
const Leave = require('../models/leaveModel');
const Reimbursement = require('../models/reimbursementModel');
const EmployeeWellbeing = require('../models/employeeWellbeingModel');
const LeaveBalance = require('../models/leaveBalanceModel');
const mongoose = require('mongoose');

// Helper function to get assigned employees for a manager
const getAssignedEmployees = async (managerId) => {
  try {
    // Validate managerId
    if (!managerId) {
      throw new Error('Manager ID is required');
    }

    // Verify manager exists (check both collections)
    let managerExists = await Manager.findById(managerId);
    
    if (!managerExists) {
      // Check if manager exists in Employee collection with manager role
      managerExists = await Employee.findOne({ 
        _id: managerId,
        role: 'manager'
      });
    }

    if (!managerExists) {
      throw new Error('Manager not found');
    }

    const employees = await Employee.find({ 
      manager: managerId,
      status: 'Active' 
    }).select('_id id name email department position profilePicture phone location');
    
    return employees;
  } catch (error) {
    throw new Error('Error fetching assigned employees: ' + error.message);
  }
};

// Get all assigned employees for a manager
const getAssignedEmployeesList = async (req, res) => {
  try {
    // Use _id if available, otherwise fallback to id
    const managerId = req.user._id || req.user.id;
    
    const employees = await getAssignedEmployees(managerId);
    
    res.status(200).json({
      success: true,
      data: employees,
      count: employees.length
    });
  } catch (error) {
    console.error('Error fetching assigned employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned employees',
      error: error.message
    });
  }
};

// Get attendance data for assigned employees
const getTeamAttendance = async (req, res) => {
  try {
    // Use _id if available, otherwise fallback to id
    const managerId = req.user._id || req.user.id;
    const { date, department, status, search, page = 1, limit = 10 } = req.query;
    
    // Get assigned employees
    const assignedEmployees = await getAssignedEmployees(managerId);
    const employeeIds = assignedEmployees.map(emp => emp._id);
    
    if (employeeIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalRecords: 0,
          hasNext: false,
          hasPrev: false
        },
        stats: { present: 0, absent: 0, late: 0, leave: 0 }
      });
    }
    
    // Build attendance query
    let attendanceQuery = { employeeId: { $in: employeeIds } };
    
    // Date filter
    if (date) {
      const queryDate = new Date(date);
      const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));
      attendanceQuery.date = { $gte: startOfDay, $lte: endOfDay };
    } else {
      // Default to today if no date specified
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      attendanceQuery.date = { $gte: startOfDay, $lte: endOfDay };
    }
    
    // Status filter
    if (status && status !== 'all') {
      attendanceQuery.status = status;
    }
    
    // Get attendance records with employee details
    let attendanceRecords = await Attendance.find(attendanceQuery)
      .populate({
        path: 'employeeId',
        select: 'id name department position profilePicture'
      })
      .sort({ date: -1, checkIn: -1 });
    
    // Validate attendance data
    attendanceRecords = validateAttendanceData(attendanceRecords);
    
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
    
    // Calculate statistics
    const stats = attendanceRecords.reduce(
      (acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        return acc;
      },
      { present: 0, absent: 0, late: 0, leave: 0 }
    );
    
    // Pagination
    const totalRecords = attendanceRecords.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedRecords = attendanceRecords.slice(startIndex, endIndex);
    
    // Format response data with improved error handling
    const formattedRecords = paginatedRecords.map(record => ({
      id: record._id,
      employee: record.employeeId ? record.employeeId.name : 'Unknown',
      employeeId: record.employeeId ? record.employeeId.id : 'Unknown',
      department: record.employeeId ? record.employeeId.department : 'Unknown',
      position: record.employeeId ? record.employeeId.position : 'Unknown',
      date: record.date.toISOString().split('T')[0],
      checkIn: formatAttendanceTime(record.checkIn),
      checkOut: formatAttendanceTime(record.checkOut),
      status: record.status,
      workHours: calculateWorkHours(record.workHours)
    }));
    
    res.status(200).json({
      success: true,
      data: formattedRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      stats
    });
  } catch (error) {
    console.error('Error fetching team attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team attendance data',
      error: error.message
    });
  }
};

// Get pending leave requests for assigned employees
const getPendingLeaveRequests = async (req, res) => {
  try {
    // Use _id if available, otherwise fallback to id
    const managerId = req.user._id || req.user.id;
    
    // Get assigned employees
    const assignedEmployees = await getAssignedEmployees(managerId);
    const employeeIds = assignedEmployees.map(emp => emp._id);
    
    if (employeeIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    // Get pending leave requests
    const leaveRequests = await Leave.find({
      employeeId: { $in: employeeIds },
      status: 'pending'
    })
    .populate({
      path: 'employeeId',
      select: 'id name department position profilePicture'
    })
    .sort({ createdAt: -1 });
    
    // Format response data
    const formattedRequests = leaveRequests.map(request => ({
      id: request._id,
      employee: request.employeeId.name,
      employeeId: request.employeeId.id,
      department: request.employeeId.department,
      type: request.type,
      startDate: request.startDate.toISOString().split('T')[0],
      endDate: request.endDate.toISOString().split('T')[0],
      dates: `${request.startDate.toLocaleDateString()} - ${request.endDate.toLocaleDateString()}`,
      days: request.getDays(),
      reason: request.reason,
      status: request.status,
      submittedAt: request.createdAt
    }));
    
    res.status(200).json({
      success: true,
      data: formattedRequests
    });
  } catch (error) {
    console.error('Error fetching pending leave requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending leave requests',
      error: error.message
    });
  }
};

// Update leave request status
const updateLeaveRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, comments } = req.body;
    const managerId = req.user._id || req.user.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved or rejected'
      });
    }

    // Find the leave request
    const leaveRequest = await Leave.findById(requestId)
      .populate('employeeId', 'id name email department role');

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Verify the employee is assigned to this manager
    const assignedEmployees = await getAssignedEmployees(managerId);
    const employeeIds = assignedEmployees.map(emp => emp._id.toString());
    
    if (!employeeIds.includes(leaveRequest.employeeId._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You can only manage leave requests for your assigned employees'
      });
    }

    // Check if request is in correct state for manager approval
    if (leaveRequest.status !== 'pending' || leaveRequest.currentApprovalLevel !== 'manager') {
      return res.status(400).json({
        success: false,
        message: 'Leave request is not pending manager approval'
      });
    }

    // Get manager details for approval record
    const manager = await Manager.findById(managerId) || await Employee.findById(managerId);
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }

    if (status === 'approved') {
      // Manager approval - set status to 'manager-approved' and move to admin level
      leaveRequest.status = 'manager-approved';
      leaveRequest.currentApprovalLevel = 'admin';
      
      // Add manager approval information
      leaveRequest.managerApproval = {
        approvedBy: managerId,
        approvedAt: new Date(),
        comments: comments || '',
        status: 'approved'
      };
      
      // Add to approval history
      leaveRequest.approvalHistory.push({
        approvedBy: managerId,
        approverModel: 'Manager',
        approverName: manager.name,
        action: 'approved',
        comments: comments || '',
        level: 'manager',
        timestamp: new Date()
      });

      // console.log(`✅ Manager ${manager.name} approved leave request ${requestId}. Status: manager-approved, Level: admin`);
      
    } else {
      // Manager rejection - final rejection
      leaveRequest.status = 'rejected';
      leaveRequest.currentApprovalLevel = 'completed';
      leaveRequest.rejectionReason = comments || 'Rejected by manager';
      
      // Add manager rejection information
      leaveRequest.managerApproval = {
        approvedBy: managerId,
        approvedAt: new Date(),
        comments: comments || '',
        status: 'rejected'
      };
      
      // Add to approval history
      leaveRequest.approvalHistory.push({
        approvedBy: managerId,
        approverModel: 'Manager',
        approverName: manager.name,
        action: 'rejected',
        comments: comments || '',
        level: 'manager',
        timestamp: new Date()
      });

      console.log(`❌ Manager ${manager.name} rejected leave request ${requestId}`);
    }

    await leaveRequest.save();

    // Determine response message based on approval flow
    let message;
    if (status === 'approved') {
      message = 'Leave request approved and forwarded to admin for final approval';
    } else {
      message = 'Leave request rejected successfully';
    }

    res.status(200).json({
      success: true,
      data: {
        id: leaveRequest._id,
        status: leaveRequest.status,
        currentApprovalLevel: leaveRequest.currentApprovalLevel,
        managerApproval: leaveRequest.managerApproval
      },
      message
    });
  } catch (error) {
    console.error('Error updating leave request status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update leave request status',
      error: error.message
    });
  }
};

// Get pending reimbursement requests for assigned employees
const getPendingReimbursementRequests = async (req, res) => {
  try {
    // Use _id if available, otherwise fallback to id
    const managerId = req.user._id || req.user.id;
    
    // Get assigned employees
    const assignedEmployees = await getAssignedEmployees(managerId);
    const employeeIds = assignedEmployees.map(emp => emp._id);
    
    if (employeeIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    // Get pending reimbursement requests
    const reimbursementRequests = await Reimbursement.find({
      employeeId: { $in: employeeIds },
      status: 'pending'
    })
    .populate({
      path: 'employeeId',
      select: 'id name department position profilePicture'
    })
    .sort({ createdAt: -1 });
    
    // Format response data
    const formattedRequests = reimbursementRequests.map(request => ({
      id: request._id,
      employee: request.employeeId.name,
      employeeId: request.employeeId.id,
      department: request.employeeId.department,
      type: request.type.charAt(0).toUpperCase() + request.type.slice(1).replace('-', ' '),
      amount: request.amount,
      date: request.date.toISOString().split('T')[0],
      description: request.description,
      reason: request.description,
      status: request.status,
      receipts: request.receipts,
      submittedAt: request.createdAt
    }));
    
    res.status(200).json({
      success: true,
      data: formattedRequests
    });
  } catch (error) {
    console.error('Error fetching pending reimbursement requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending reimbursement requests',
      error: error.message
    });
  }
};

// Approve or reject reimbursement request
const updateReimbursementRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, rejectionReason } = req.body;
    const managerId = req.user._id || req.user.id;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved or rejected'
      });
    }
    
    // Find the reimbursement request
    const reimbursementRequest = await Reimbursement.findById(requestId)
      .populate('employeeId', 'id name email department role');
    
    if (!reimbursementRequest) {
      return res.status(404).json({
        success: false,
        message: 'Reimbursement request not found'
      });
    }
    
    // Verify the employee is assigned to this manager
    const assignedEmployees = await getAssignedEmployees(managerId);
    const employeeIds = assignedEmployees.map(emp => emp._id.toString());
    
    if (!employeeIds.includes(reimbursementRequest.employeeId._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You can only manage reimbursement requests for your assigned employees'
      });
    }
    
    // Check if request is in correct state for manager approval
    if (reimbursementRequest.status !== 'pending' || reimbursementRequest.currentApprovalLevel !== 'manager') {
      return res.status(400).json({
        success: false,
        message: 'Reimbursement request is not pending manager approval'
      });
    }

    // Get manager details for approval record
    const manager = await Manager.findById(managerId) || await Employee.findById(managerId);
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }

    if (status === 'approved') {
      // Manager approval - set status to 'manager-approved' and move to admin level
      reimbursementRequest.status = 'manager-approved';
      reimbursementRequest.currentApprovalLevel = 'admin';
      
      // Add manager approval information
      reimbursementRequest.managerApproval = {
        approvedBy: managerId,
        approvedAt: new Date(),
        comments: rejectionReason || '',
        status: 'approved'
      };
      
      // Add to approval history
      reimbursementRequest.approvalHistory.push({
        approvedBy: managerId,
        approverModel: 'Manager',
        approverName: manager.name,
        action: 'approved',
        comments: rejectionReason || '',
        level: 'manager',
        timestamp: new Date()
      });

      // console.log(`✅ Manager ${manager.name} approved reimbursement request ${requestId}. Status: manager-approved, Level: admin`);
      
    } else {
      // Manager rejection - final rejection
      reimbursementRequest.status = 'rejected';
      reimbursementRequest.currentApprovalLevel = 'completed';
      reimbursementRequest.rejectionReason = rejectionReason || 'Rejected by manager';
      
      // Add manager rejection information
      reimbursementRequest.managerApproval = {
        approvedBy: managerId,
        approvedAt: new Date(),
        comments: rejectionReason || '',
        status: 'rejected'
      };
      
      // Add to approval history
      reimbursementRequest.approvalHistory.push({
        approvedBy: managerId,
        approverModel: 'Manager',
        approverName: manager.name,
        action: 'rejected',
        comments: rejectionReason || '',
        level: 'manager',
        timestamp: new Date()
      });

      console.log(`❌ Manager ${manager.name} rejected reimbursement request ${requestId}`);
    }
    
    await reimbursementRequest.save();
    
    // Determine response message based on approval flow
    let message;
    if (status === 'approved') {
      message = 'Reimbursement request approved and forwarded to admin for final approval';
    } else {
      message = 'Reimbursement request rejected successfully';
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: reimbursementRequest._id,
        status: reimbursementRequest.status,
        currentApprovalLevel: reimbursementRequest.currentApprovalLevel,
        managerApproval: reimbursementRequest.managerApproval
      },
      message
    });
  } catch (error) {
    console.error('Error updating reimbursement request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reimbursement request',
      error: error.message
    });
  }
};

// Get team leave balances for assigned employees
const getTeamLeaveBalances = async (req, res) => {
  try {
    // Use _id if available, otherwise fallback to id
    const managerId = req.user._id || req.user.id;
    const currentYear = new Date().getFullYear();
    
    // Get assigned employees
    const employees = await Employee.find({ 
      manager: managerId,
      status: 'Active' 
    }).select('id name department position');
    
    if (employees.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    // console.log(`🔍 Fetching leave balances for ${employees.length} employees under manager ${managerId}`);
    
    // Get employee IDs for leave balance lookup
    const employeeIds = employees.map(emp => emp._id);
    
    // Get leave balances from the centralized LeaveBalance collection
    let leaveBalances = await LeaveBalance.find({
      employeeId: { $in: employeeIds },
      year: currentYear
    });
    
    // console.log(`📊 Found ${leaveBalances.length} existing leave balance records`);
    
    // Create a map for quick balance lookup
    const balanceMap = new Map();
    leaveBalances.forEach(balance => {
      balanceMap.set(balance.employeeId.toString(), balance);
    });
    
    // Initialize missing leave balances
    const missingEmployees = employees.filter(emp => !balanceMap.has(emp._id.toString()));
    if (missingEmployees.length > 0) {
      console.log(`🔄 Initializing leave balances for ${missingEmployees.length} employees without records`);
      
      for (const employee of missingEmployees) {
        try {
          const newBalance = await LeaveBalance.initializeBalances(employee._id, currentYear);
          balanceMap.set(employee._id.toString(), newBalance);
          // console.log(`✅ Initialized leave balance for ${employee.name} (${employee.id})`);
        } catch (error) {
          console.error(`❌ Failed to initialize balance for ${employee.name}:`, error.message);
        }
      }
    }
    
    // Format response data
    const formattedBalances = employees.map(employee => {
      const leaveBalance = balanceMap.get(employee._id.toString());
      
      let annual = 0, sick = 0, personal = 0;
      let totalAnnual = 20, usedAnnual = 0;
      let totalSick = 10, usedSick = 0; 
      let totalPersonal = 25, usedPersonal = 0;
      
      if (leaveBalance && leaveBalance.balances) {
        // Calculate remaining and used from actual balance data
        leaveBalance.balances.forEach(balance => {
          switch (balance.type) {
            case 'Annual Leave':
              annual = Math.max(0, balance.total - balance.used);
              totalAnnual = balance.total;
              usedAnnual = balance.used;
              break;
            case 'Sick Leave':
              sick = Math.max(0, balance.total - balance.used);
              totalSick = balance.total;
              usedSick = balance.used;
              break;
            case 'Personal Leave':
              personal = Math.max(0, balance.total - balance.used);
              totalPersonal = balance.total;
              usedPersonal = balance.used;
              break;
          }
        });
        
        // console.log(`👤 ${employee.name}: Annual=${annual}/${totalAnnual}, Sick=${sick}/${totalSick}, Personal=${personal}/${totalPersonal}`);
      } else {
        // Use default values if no balance record exists (fallback)
        annual = totalAnnual;
        sick = totalSick;
        personal = totalPersonal;
        console.log(`⚠️ Using defaults for ${employee.name}: Annual=${annual}, Sick=${sick}, Personal=${personal}`);
      }
      
      return {
      id: employee._id,
      employee: employee.name,
      employeeId: employee.id,
      department: employee.department,
      position: employee.position,
        annual,
        sick,
        personal,
        totalAnnual,
        usedAnnual,
        totalSick,
        usedSick,
        totalPersonal,
        usedPersonal
      };
    });
    
    // console.log(`✅ Successfully formatted ${formattedBalances.length} employee leave balances`);
    
    res.status(200).json({
      success: true,
      data: formattedBalances
    });
  } catch (error) {
    console.error('Error fetching team leave balances:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team leave balances',
      error: error.message
    });
  }
};

// Get team wellbeing data for assigned employees
// Get wellbeing trends data for assigned employees
const getTeamWellbeingTrends = async (req, res) => {
  try {
    // Use _id if available, otherwise fallback to id
    const managerId = req.user._id || req.user.id;
    
    // Get assigned employees
    const assignedEmployees = await getAssignedEmployees(managerId);
    const employeeIdStrings = assignedEmployees.map(emp => emp.id || emp.employeeId);
    
    if (employeeIdStrings.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          stressTrend: [],
          workLifeBalanceTrend: [],
          satisfactionTrend: [],
          collaborationTrend: [],
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5']
        }
      });
    }
    
    // Get wellbeing data for assigned employees
    const wellbeingData = await EmployeeWellbeing.find({
      employeeId: { $in: employeeIdStrings }
    }).sort({ updatedAt: -1 });
    
    // console.log(`Found ${wellbeingData.length} wellbeing records for trends analysis`);
    
    if (wellbeingData.length === 0) {
      // Return default trend data if no wellbeing records found
      return res.status(200).json({
        success: true,
        data: {
          stressTrend: [65, 68, 70, 72, 70],
          workLifeBalanceTrend: [75, 77, 80, 82, 80],
          satisfactionTrend: [80, 82, 85, 87, 85],
          collaborationTrend: [85, 87, 90, 92, 90],
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5']
        }
      });
    }
    
    // Calculate average trends across all employees
    const stressTrend = [];
    const workLifeBalanceTrend = [];
    const satisfactionTrend = [];
    const collaborationTrend = [];
    
    // Get the maximum history length to determine trend points
    const maxHistoryLength = Math.max(
      ...wellbeingData.map(record => 
        Math.max(
          record.wellbeingMetrics?.stressLevel?.history?.length || 0,
          record.wellbeingMetrics?.workLifeBalance?.history?.length || 0,
          record.wellbeingMetrics?.jobSatisfaction?.history?.length || 0,
          record.wellbeingMetrics?.teamCollaboration?.history?.length || 0
        )
      )
    );
    
    const historyLength = Math.min(maxHistoryLength || 5, 5); // Limit to 5 points
    
    // Calculate averages for each time point
    for (let i = 0; i < historyLength; i++) {
      let stressSum = 0, wlbSum = 0, satisfactionSum = 0, collaborationSum = 0;
      let stressCount = 0, wlbCount = 0, satisfactionCount = 0, collaborationCount = 0;
      
      wellbeingData.forEach(record => {
        if (record.wellbeingMetrics?.stressLevel?.history?.[i] !== undefined) {
          stressSum += record.wellbeingMetrics.stressLevel.history[i];
          stressCount++;
        }
        if (record.wellbeingMetrics?.workLifeBalance?.history?.[i] !== undefined) {
          wlbSum += record.wellbeingMetrics.workLifeBalance.history[i];
          wlbCount++;
        }
        if (record.wellbeingMetrics?.jobSatisfaction?.history?.[i] !== undefined) {
          satisfactionSum += record.wellbeingMetrics.jobSatisfaction.history[i];
          satisfactionCount++;
        }
        if (record.wellbeingMetrics?.teamCollaboration?.history?.[i] !== undefined) {
          collaborationSum += record.wellbeingMetrics.teamCollaboration.history[i];
          collaborationCount++;
        }
      });
      
      stressTrend.push(stressCount > 0 ? Math.round(stressSum / stressCount) : 70);
      workLifeBalanceTrend.push(wlbCount > 0 ? Math.round(wlbSum / wlbCount) : 80);
      satisfactionTrend.push(satisfactionCount > 0 ? Math.round(satisfactionSum / satisfactionCount) : 85);
      collaborationTrend.push(collaborationCount > 0 ? Math.round(collaborationSum / collaborationCount) : 90);
    }
    
    // Generate labels based on history length
    const labels = [];
    for (let i = 0; i < historyLength; i++) {
      labels.push(`Week ${i + 1}`);
    }
    
    res.status(200).json({
      success: true,
      data: {
        stressTrend,
        workLifeBalanceTrend,
        satisfactionTrend,
        collaborationTrend,
        labels
      }
    });
  } catch (error) {
    console.error('Error fetching team wellbeing trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team wellbeing trends',
      error: error.message
    });
  }
};

const getTeamWellbeingData = async (req, res) => {
  try {
    // Use _id if available, otherwise fallback to id
    const managerId = req.user._id || req.user.id;
    
    // Get assigned employees
    const assignedEmployees = await getAssignedEmployees(managerId);
    const employeeIds = assignedEmployees.map(emp => emp._id);
    
    if (employeeIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        stats: {
          totalEmployees: 0,
          goodStatus: 0,
          warningStatus: 0,
          criticalStatus: 0
        }
      });
    }
    
    // Get wellbeing data for assigned employees
    // First, try to find by employeeId string (the employee's ID field)
    const employeeIdStrings = assignedEmployees.map(emp => emp.id || emp.employeeId);
    
    const wellbeingData = await EmployeeWellbeing.find({
      employeeId: { $in: employeeIdStrings }
    }).sort({ updatedAt: -1 });
    
    // console.log(`Found ${wellbeingData.length} wellbeing records for ${employeeIdStrings.length} employees`);
    
    // Create a map of employee wellbeing data for quick lookup
    const wellbeingMap = new Map();
    wellbeingData.forEach(data => {
      wellbeingMap.set(data.employeeId, data);
    });
    
    // Format response data - include ALL assigned employees
    const formattedData = assignedEmployees.map(employee => {
      const wellbeingRecord = wellbeingMap.get(employee.id || employee.employeeId);
      
      let stressLevel, workLifeBalance, satisfaction, lastCheckIn;
      
      if (wellbeingRecord && wellbeingRecord.wellbeingMetrics) {
        // Use actual wellbeing data if available - access the correct nested structure
        stressLevel = wellbeingRecord.wellbeingMetrics.stressLevel?.score || 75;
        workLifeBalance = wellbeingRecord.wellbeingMetrics.workLifeBalance?.score || 80;
        satisfaction = wellbeingRecord.wellbeingMetrics.jobSatisfaction?.score || 85;
        const teamCollaboration = wellbeingRecord.wellbeingMetrics.teamCollaboration?.score || 85;
        lastCheckIn = wellbeingRecord.updatedAt ? wellbeingRecord.updatedAt.toISOString().split('T')[0] : 'No data';
        
        // console.log(`Employee ${employee.name} wellbeing data:`, {
        //   stressLevel,
        //   workLifeBalance,
        //   satisfaction,
        //   teamCollaboration,
        //   lastCheckIn
        // });
        
        return {
          id: employee._id,
          name: employee.name,
          employeeId: employee.id,
          department: employee.department,
          position: employee.position,
          profilePicture: employee.profilePicture,
          wellbeing: {
            stressLevel,
            workLifeBalance,
            satisfaction,
            teamCollaboration,
            lastCheckIn,
            moodHistory: wellbeingRecord.moodHistory || [],
            breakHistory: wellbeingRecord.breakHistory || [],
            activityHistory: wellbeingRecord.activityHistory || [],
            factors: {
              stressFactors: wellbeingRecord.wellbeingMetrics.stressLevel?.factors || {},
              workLifeFactors: wellbeingRecord.wellbeingMetrics.workLifeBalance?.factors || {},
              satisfactionFactors: wellbeingRecord.wellbeingMetrics.jobSatisfaction?.factors || {},
              collaborationFactors: wellbeingRecord.wellbeingMetrics.teamCollaboration?.factors || {}
            }
          }
        };
      } else {
        // Use default values for employees without wellbeing data
        stressLevel = 70; // Default moderate stress level
        workLifeBalance = 75; // Default moderate work-life balance
        satisfaction = 80; // Default good satisfaction
        const teamCollaboration = 85; // Default team collaboration
        lastCheckIn = 'No data'; // Indicate no check-in data
        
        // console.log(`Employee ${employee.name} using default wellbeing values (no data found)`);
        
        return {
          id: employee._id,
          name: employee.name,
          employeeId: employee.id,
          department: employee.department,
          position: employee.position,
          profilePicture: employee.profilePicture,
          wellbeing: {
            stressLevel,
            workLifeBalance,
            satisfaction,
            teamCollaboration,
            lastCheckIn,
            moodHistory: [],
            breakHistory: [],
            activityHistory: [],
            factors: {
              stressFactors: {
                deadlinePressure: 'Moderate',
                workload: 'Moderate',
                teamSupport: 'Moderate',
                workEnvironment: 'Neutral'
              },
              workLifeFactors: {
                workHours: 8,
                breaksCount: 3,
                afterHoursWork: 1,
                focusTime: 5
              },
              satisfactionFactors: {
                roleClarity: 'Good',
                skillUtilization: 'Good',
                growthOpportunities: 'Moderate',
                teamDynamics: 'Good',
                taskCompletionRate: '80%'
              },
              collaborationFactors: {
                communicationQuality: 'Good',
                peerSupport: 'Good',
                conflictResolution: 'Moderate',
                teamworkEfficiency: 'Good'
              }
            }
          }
        };
      }
    });
    
    // Calculate statistics based on all employees (including those with default values)
    const totalEmployees = formattedData.length;
    const goodStatus = formattedData.filter(e => e.wellbeing.stressLevel < 60).length;
    const warningStatus = formattedData.filter(e => e.wellbeing.stressLevel >= 60 && e.wellbeing.stressLevel < 80).length;
    const criticalStatus = formattedData.filter(e => e.wellbeing.stressLevel >= 80).length;
    
    res.status(200).json({
      success: true,
      data: formattedData,
      stats: {
        totalEmployees,
        goodStatus,
        warningStatus,
        criticalStatus
      }
    });
  } catch (error) {
    console.error('Error fetching team wellbeing data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team wellbeing data',
      error: error.message
    });
  }
};

// Get attendance overview/stats for assigned employees
const getAttendanceOverview = async (req, res) => {
  try {
    // Use _id if available, otherwise fallback to id
    const managerId = req.user._id || req.user.id;
    const { date } = req.query;
    
    // Get assigned employees
    const assignedEmployees = await getAssignedEmployees(managerId);
    const employeeIds = assignedEmployees.map(emp => emp._id);
    
    if (employeeIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          present: 0,
          absent: 0,
          late: 0,
          leave: 0,
          totalEmployees: 0
        }
      });
    }
    
    // Build query for specific date or today
    const queryDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));
    
    // Get attendance records for the date
    const attendanceRecords = await Attendance.find({
      employeeId: { $in: employeeIds },
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    
    // Calculate statistics
    const stats = attendanceRecords.reduce(
      (acc, record) => {
        acc[record.status]++;
        return acc;
      },
      { present: 0, absent: 0, late: 0, leave: 0 }
    );
    
    // Add total employees count
    stats.totalEmployees = assignedEmployees.length;
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching attendance overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance overview',
      error: error.message
    });
  }
};

// Helper function to validate attendance data consistency
const validateAttendanceData = (attendanceRecords) => {
  return attendanceRecords.filter(record => {
    if (!record.employeeId) {
      console.warn('Attendance record missing employee data:', record._id);
      return false;
    }
    return true;
  });
};

// Helper function to format attendance time safely
const formatAttendanceTime = (timeValue) => {
  if (!timeValue) return '-';
  try {
    return timeValue.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.warn('Error formatting time:', timeValue);
    return '-';
  }
};

// Helper function to calculate work hours safely
const calculateWorkHours = (workHours) => {
  if (!workHours || workHours <= 0) return '0h';
  try {
    const hours = Math.floor(workHours);
    const minutes = Math.round((workHours % 1) * 60);
    return `${hours}h ${minutes}m`;
  } catch (error) {
    console.warn('Error calculating work hours:', workHours);
    return '0h';
  }
};

module.exports = {
  getAssignedEmployeesList,
  getTeamAttendance,
  getPendingLeaveRequests,
  updateLeaveRequestStatus,
  getPendingReimbursementRequests,
  updateReimbursementRequestStatus,
  getTeamLeaveBalances,
  getTeamWellbeingData,
  getTeamWellbeingTrends,
  getAttendanceOverview
}; 