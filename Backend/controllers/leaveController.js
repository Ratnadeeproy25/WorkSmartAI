const Leave = require('../models/leaveModel');
const LeaveBalance = require('../models/leaveBalanceModel');
const Employee = require('../models/employeeModel');
const Manager = require('../models/managerModel');
const Admin = require('../models/adminModel');
const asyncHandler = require('express-async-handler');
const leaveBalanceService = require('../services/leaveBalanceService');

// @desc    Request leave (Employee/Manager)
// @route   POST /api/leave/request
// @access  Private (Employee/Manager)
const requestLeave = asyncHandler(async (req, res) => {
  let { type, duration, startDate, endDate, reason } = req.body;
  const employeeId = req.user._id;
  const userRole = req.user.role;

  // Validate required fields (duration is optional, will be calculated)
  if (!type || !startDate || !reason) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: type, startDate, and reason',
    });
  }

  // Map frontend leave types to backend types
  const leaveTypeMap = {
    'Annual Leave': 'annual',
    'Sick Leave': 'sick', 
    'Personal Leave': 'personal',
    'annual': 'annual',
    'sick': 'sick',
    'personal': 'personal',
    'maternity': 'maternity',
    'paternity': 'paternity',
    'bereavement': 'bereavement',
    'other': 'other',
    'Other': 'other'
  };

  // Convert to lowercase and then map
  const normalizedType = type.trim();
  type = leaveTypeMap[normalizedType] || normalizedType.toLowerCase();

  // Ensure type is valid for the schema
  const validTypes = ['annual', 'sick', 'personal', 'maternity', 'paternity', 'bereavement', 'other'];
  if (!validTypes.includes(type)) {
    type = 'other';
  }

  // Calculate duration and finalEndDate from dates
  const start = new Date(startDate);
  let end = endDate ? new Date(endDate) : new Date(startDate);

  // If no endDate provided or endDate is same as startDate, it's a single day
  if (!endDate || start.getTime() === end.getTime()) {
    end = new Date(startDate);
    duration = 'full-day'; // Default to full-day for single day requests
  } else {
    duration = 'multiple-days';
  }

  // Validate dates
  if (start > end) {
    return res.status(400).json({
      success: false,
      message: 'Start date must be before or equal to end date',
    });
  }

  // Check if start date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start < today) {
    return res.status(400).json({
      success: false,
      message: 'Cannot request leave for dates in the past',
    });
  }

  // Check for overlapping leave requests
  const hasOverlap = await Leave.checkOverlap(employeeId, startDate, end);
  
  if (hasOverlap) {
    return res.status(400).json({
      success: false,
      message: 'You already have a leave request that overlaps with these dates',
    });
  }

  // Calculate total days
  let totalDays;
  if (duration === 'half-day') {
    totalDays = 0.5;
  } else if (duration === 'full-day') {
    totalDays = 1;
  } else {
  const diffTime = Math.abs(end - start);
    totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  // Check leave balance - we need to map backend type to leave balance type for validation
  const currentYear = new Date().getFullYear();
  let leaveBalance = await LeaveBalance.findOne({ employeeId, year: currentYear });

  if (!leaveBalance) {
    // console.log(`🔄 No existing balance found, initializing for user ${employeeId}`);
    leaveBalance = await LeaveBalance.initializeBalances(employeeId, currentYear);
  }

  // Map backend leave type to leave balance type for validation
  const balanceTypeMap = {
    'annual': 'annual',
    'sick': 'sick', 
    'personal': 'personal',
    'maternity': 'personal',
    'paternity': 'personal',
    'bereavement': 'personal',
    'other': 'personal'
  };

  const balanceType = balanceTypeMap[type] || 'personal';

  if (!leaveBalance.hasEnoughBalance(balanceType, totalDays)) {
    return res.status(400).json({
      success: false,
      message: `Insufficient ${type} leave balance. You requested ${totalDays} days but only have ${leaveBalance.getRemainingLeave(balanceType)} days available.`,
    });
  }

  // Determine approval flow based on user role
  let currentApprovalLevel, status;
  
  if (userRole === 'manager') {
    // Manager requests go directly to admin (skip manager approval)
    currentApprovalLevel = 'admin';
    status = 'manager-approved'; // Skip manager level since requester IS a manager
  } else {
    // Employee requests go to manager first
    currentApprovalLevel = 'manager';
    status = 'pending';
  }

  // Create leave request
  const leave = new Leave({
    employeeId,
    type,
    duration,
    startDate: start,
    endDate: end,
    reason,
    totalDays,
    status,
    currentApprovalLevel
  });

  // If manager is requesting, auto-approve manager level
  if (userRole === 'manager') {
    leave.managerApproval = {
      approvedBy: employeeId, // Manager approves their own request
      approvedAt: new Date(),
      comments: 'Auto-approved (Manager request)',
      status: 'approved'
    };
    
    leave.approvalHistory.push({
      approvedBy: employeeId,
      approverModel: 'Manager',
      approverName: req.user.name,
      action: 'approved',
      comments: 'Auto-approved (Manager request)',
      level: 'manager'
    });
  }

  await leave.save();

  // Populate employee details for response
  await leave.populate('employeeId', 'name email department');

  res.status(201).json({
    success: true,
    message: `Leave request submitted successfully${userRole === 'manager' ? ' and forwarded to admin for final approval' : ''}`,
    data: leave,
  });
});

// @desc    Get leave requests for employee
// @route   GET /api/leave
// @access  Private (Employee)
const getLeaveRequests = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const { status, page = 1, limit = 10 } = req.query;

  const query = { employeeId };

  if (status) {
    query.status = status;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      { path: 'managerApproval.approvedBy', select: 'name' },
      { path: 'adminApproval.approvedBy', select: 'name' }
    ]
  };

  const result = await Leave.paginate(query, options);

  res.status(200).json({
    success: true,
    data: result.docs,
    pagination: {
      current: result.page,
      pages: result.totalPages,
      total: result.totalDocs
    }
  });
});

// @desc    Get leave requests for manager approval
// @route   GET /api/leave/manager/pending
// @access  Private (Manager)
const getManagerPendingLeaves = asyncHandler(async (req, res) => {
  const managerId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  // Get employees under this manager
  const employees = await Employee.find({ managerId });
  const employeeIds = employees.map(emp => emp._id);

  const query = {
    employeeId: { $in: employeeIds },
    currentApprovalLevel: 'manager',
    status: 'pending'
  };

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      { path: 'employeeId', select: 'name email department employeeId' }
    ]
  };

  const result = await Leave.paginate(query, options);

  res.status(200).json({
    success: true,
    data: result.docs,
    pagination: {
      current: result.page,
      pages: result.totalPages,
      total: result.totalDocs
    }
  });
});

// @desc    Get leave requests for admin approval
// @route   GET /api/leave/admin/pending
// @access  Private (Admin)
const getAdminPendingLeaves = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const query = {
    currentApprovalLevel: 'admin',
    status: 'manager-approved'
  };

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      { path: 'employeeId', select: 'name email department employeeId' },
      { path: 'managerApproval.approvedBy', select: 'name' }
    ]
  };

  const result = await Leave.paginate(query, options);

  res.status(200).json({
    success: true,
    data: result.docs,
    pagination: {
      current: result.page,
      pages: result.totalPages,
      total: result.totalDocs
    }
  });
});

// @desc    Approve/Reject leave by manager
// @route   PUT /api/leave/:id/manager-action
// @access  Private (Manager)
const managerLeaveAction = asyncHandler(async (req, res) => {
  const { action, comments } = req.body; // action: 'approve' or 'reject'
  const leaveId = req.params.id;
  const managerId = req.user._id;

  if (!action || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({
      success: false,
      message: 'Valid action (approve/reject) is required',
    });
  }

  const leave = await Leave.findById(leaveId).populate('employeeId', 'name managerId');

  if (!leave) {
    return res.status(404).json({
      success: false,
      message: 'Leave request not found',
    });
  }

  // Check if manager has authority over this employee
  if (leave.employeeId.managerId.toString() !== managerId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to approve this leave request',
    });
  }

  // Check if leave is at manager approval level
  if (leave.currentApprovalLevel !== 'manager' || leave.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Leave request is not available for manager approval',
    });
  }

  const manager = await Manager.findById(managerId);

  if (action === 'approve') {
    // Manager approves - move to admin level
    leave.managerApproval = {
      approvedBy: managerId,
      approvedAt: new Date(),
      comments: comments || '',
      status: 'approved'
    };
    leave.currentApprovalLevel = 'admin';
    leave.status = 'manager-approved';
    
    leave.approvalHistory.push({
      approvedBy: managerId,
      approverModel: 'Manager',
      approverName: manager.name,
      action: 'approved',
      comments: comments || '',
      level: 'manager'
    });
  } else {
    // Manager rejects - final rejection
    leave.managerApproval = {
      approvedBy: managerId,
      approvedAt: new Date(),
      comments: comments || '',
      status: 'rejected'
    };
    leave.currentApprovalLevel = 'completed';
    leave.status = 'rejected';
    leave.rejectionReason = comments || 'Rejected by manager';
    
    leave.approvalHistory.push({
      approvedBy: managerId,
      approverModel: 'Manager',
      approverName: manager.name,
      action: 'rejected',
      comments: comments || '',
      level: 'manager'
    });
  }

  await leave.save();

  await leave.populate('employeeId', 'name email department');

  res.status(200).json({
    success: true,
    message: `Leave request ${action}d successfully`,
    data: leave,
  });
});

// @desc    Approve/Reject leave by admin
// @route   PUT /api/leave/:id/admin-action
// @access  Private (Admin)
const adminLeaveAction = asyncHandler(async (req, res) => {
  const { action, comments } = req.body;
  const leaveId = req.params.id;
  const adminId = req.user._id;

  if (!action || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({
      success: false,
      message: 'Valid action (approve/reject) is required',
    });
  }

  const leave = await Leave.findById(leaveId).populate('employeeId', '_id name');

  if (!leave) {
    return res.status(404).json({
      success: false,
      message: 'Leave request not found',
    });
  }

  // Check if leave is at admin approval level
  if (leave.currentApprovalLevel !== 'admin' || leave.status !== 'manager-approved') {
    return res.status(400).json({
      success: false,
      message: 'Leave request is not available for admin approval',
    });
  }

  const admin = await Admin.findById(adminId);
  
  if (!admin) {
    return res.status(404).json({
      success: false,
      message: 'Admin not found',
    });
  }

  if (action === 'approve') {
    // Admin approves - final approval
    leave.adminApproval = {
      approvedBy: adminId,
      approvedAt: new Date(),
      comments: comments || '',
      status: 'approved'
    };
    leave.currentApprovalLevel = 'completed';
    leave.status = 'approved';
    leave.finalApprovalDate = new Date();
    
    leave.approvalHistory.push({
      approvedBy: adminId,
      approverModel: 'Admin',
      approverName: admin.name,
      action: 'approved',
      comments: comments || '',
      level: 'admin'
    });

    // Update leave balance using service
    try {
      // Ensure employeeId exists and is properly populated
      if (!leave.employeeId || !leave.employeeId._id) {
        console.error('❌ Leave request employeeId not found or not properly populated');
        throw new Error('Employee ID not found in leave request');
      }
      
      await leaveBalanceService.deductLeaveBalance(leave.employeeId._id, leave.type, leave.totalDays);
    } catch (balanceError) {
      console.error('Error updating leave balance:', balanceError);
      // Don't fail the approval process due to balance update issues
    }
  } else {
    // Admin rejects
    leave.adminApproval = {
      approvedBy: adminId,
      approvedAt: new Date(),
      comments: comments || '',
      status: 'rejected'
    };
    leave.currentApprovalLevel = 'completed';
    leave.status = 'rejected';
    leave.rejectionReason = comments || 'Rejected by admin';
    
    leave.approvalHistory.push({
      approvedBy: adminId,
      approverModel: 'Admin',
      approverName: admin.name,
      action: 'rejected',
      comments: comments || '',
      level: 'admin'
    });
  }

  await leave.save();

  res.status(200).json({
    success: true,
    message: `Leave request ${action}d successfully`,
    data: leave,
  });
});

// @desc    Get leave by ID with full details
// @route   GET /api/leave/:id
// @access  Private
const getLeaveById = asyncHandler(async (req, res) => {
  const leaveId = req.params.id;
  const userId = req.user._id;
  const userRole = req.user.role;

  const leave = await Leave.findById(leaveId)
    .populate('employeeId', 'name email department employeeId')
    .populate('managerApproval.approvedBy', 'name')
    .populate('adminApproval.approvedBy', 'name');

  if (!leave) {
    return res.status(404).json({
      success: false,
      message: 'Leave request not found',
    });
  }

  // Check if user can view this leave
  if (!leave.canView(userId, userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this leave request',
    });
  }

  res.status(200).json({
    success: true,
    data: leave,
  });
});

// @desc    Cancel leave request (Employee only, if pending)
// @route   DELETE /api/leave/:id
// @access  Private (Employee)
const cancelLeave = asyncHandler(async (req, res) => {
  const leaveId = req.params.id;
  const employeeId = req.user._id;

  const leave = await Leave.findOne({
    _id: leaveId,
    employeeId,
  });

  if (!leave) {
    return res.status(404).json({
      success: false,
      message: 'Leave request not found',
    });
  }

  if (leave.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel a leave request that has been processed',
    });
  }

  await Leave.findByIdAndDelete(leaveId);

  res.status(200).json({
    success: true,
    message: 'Leave request cancelled successfully',
  });
});

// @desc    Get leave balance
// @route   GET /api/leave/balance
// @access  Private (Employee, Manager)
const getLeaveBalance = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const currentYear = new Date().getFullYear();

    // console.log(`🔍 getLeaveBalance - User ID: ${userId}, Role: ${userRole}, Year: ${currentYear}`);

    // Use the user's _id directly for leave balance tracking
    // This works for both employees and managers without creating duplicates
    let employeeId = userId;

    // console.log(`📊 Using employee ID for leave balance lookup: ${employeeId}`);

    let leaveBalance = await LeaveBalance.findOne({ employeeId, year: currentYear });

    if (!leaveBalance) {
      // console.log(`🔄 No existing balance found, initializing for user ${employeeId}`);
      leaveBalance = await LeaveBalance.initializeBalances(employeeId, currentYear);
    }

    if (!leaveBalance) {
      console.error(`❌ Failed to initialize leave balance for user ${employeeId}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to initialize leave balance'
      });
    }

    // console.log(`✅ Leave balance found/created with ${leaveBalance.balances.length} balance types`);

    // Transform data for frontend - return array with remaining calculated
    const balances = leaveBalance.balances.map(balance => ({
      type: balance.type,
      used: balance.used,
      total: balance.total,
      remaining: balance.total - balance.used,
      color: balance.color,
    }));

    res.status(200).json({
      success: true,
      data: balances,
    });
  } catch (error) {
    console.error('❌ Error in getLeaveBalance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave balance',
      error: error.message
    });
  }
});

// @desc    Reset leave balance for the current year
// @route   POST /api/leave/balance/reset
// @access  Private (Employee, Manager)
const resetLeaveBalance = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  const currentYear = new Date().getFullYear();
  
  // Use the user's _id directly for leave balance tracking
  // This works for both employees and managers without creating duplicates
  let employeeId = userId;
  
  // Find current balance
  let leaveBalance = await LeaveBalance.findOne({ employeeId, year: currentYear });
  
  // If exists, delete it to reset
  if (leaveBalance) {
    await LeaveBalance.deleteOne({ employeeId, year: currentYear });
  }
  
  // Initialize new balance
  leaveBalance = await LeaveBalance.initializeBalances(employeeId, currentYear);
  
  // Transform data for frontend - return array with remaining calculated
  const balances = leaveBalance.balances.map(balance => ({
    type: balance.type,
    used: balance.used,
    total: balance.total,
    remaining: balance.total - balance.used,
    color: balance.color,
  }));

  res.status(200).json({
    success: true,
    message: 'Leave balance reset successfully for the current year',
    data: balances,
  });
});

// @desc    Get leave history with status tracking
// @route   GET /api/leave/history
// @access  Private
const getLeaveHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  const { page = 1, limit = 10 } = req.query;

  let query = {};

  if (userRole === 'employee') {
    query.employeeId = userId;
  }
  // For managers and admins, show all leaves they can see

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      { path: 'employeeId', select: 'name email department employeeId' },
      { path: 'managerApproval.approvedBy', select: 'name' },
      { path: 'adminApproval.approvedBy', select: 'name' }
    ]
  };

  const result = await Leave.paginate(query, options);

  res.status(200).json({
    success: true,
    data: result.docs,
    pagination: {
      current: result.page,
      pages: result.totalPages,
      total: result.totalDocs
    }
  });
});

// @desc    Get combined pending requests for admin (leaves and reimbursements)
// @route   GET /api/admin/leave-reimbursement/pending
// @access  Private (Admin)
const getAdminPendingRequests = asyncHandler(async (req, res) => {
  try {
    const adminService = require('../services/adminLeaveReimbursementService');
    
    const filters = {
      role: req.query.role || 'all', // 'employee', 'manager', 'all'
      type: req.query.type || 'all', // 'leave', 'reimbursement', 'all'
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };

    const result = await adminService.getAdminPendingRequests(filters);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching admin pending requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending requests'
    });
  }
});

// @desc    Get all requests (approved/rejected) for admin dashboard
// @route   GET /api/admin/leave-reimbursement/all
// @access  Private (Admin)
const getAdminAllRequests = asyncHandler(async (req, res) => {
  try {
    const adminService = require('../services/adminLeaveReimbursementService');
    
    const filters = {
      role: req.query.role || 'all',
      type: req.query.type || 'all',
      status: req.query.status || 'all',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const result = await adminService.getAllRequests(filters);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching admin all requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests'
    });
  }
});

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/leave-reimbursement/stats
// @access  Private (Admin)
const getAdminStats = asyncHandler(async (req, res) => {
  try {
    const adminService = require('../services/adminLeaveReimbursementService');
    const stats = await adminService.getDashboardStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// @desc    Bulk action on multiple requests (approve/reject)
// @route   POST /api/admin/leave-reimbursement/bulk-action
// @access  Private (Admin)
const adminBulkAction = asyncHandler(async (req, res) => {
  const { action, requestIds, comments } = req.body; // action: 'approve' or 'reject', requestIds: [{ id, type }]
  const adminId = req.user._id;

  if (!action || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({
      success: false,
      message: 'Valid action (approve/reject) is required',
    });
  }

  if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Request IDs array is required',
    });
  }

  const results = [];
  const Reimbursement = require('../models/reimbursementModel');
  const Admin = require('../models/adminModel');

  // Get admin details
  const admin = await Admin.findById(adminId);

  for (const { id, type } of requestIds) {
    try {
      if (type === 'leave') {
        // Process leave request
        const leave = await Leave.findById(id).populate('employeeId', '_id name');
        if (leave && leave.currentApprovalLevel === 'admin' && leave.status === 'manager-approved') {
          if (action === 'approve') {
            leave.adminApproval = {
              approvedBy: adminId,
              approvedAt: new Date(),
              comments: comments || '',
              status: 'approved'
            };
            leave.status = 'approved';
            leave.finalApprovalDate = new Date();
            leave.currentApprovalLevel = 'completed';
            
            leave.approvalHistory.push({
              approvedBy: adminId,
              approverModel: 'Admin',
              approverName: admin.name,
              action: 'approved',
              comments: comments || '',
              level: 'admin'
            });
            
            // Deduct leave balance using service
            try {
              // Ensure employeeId exists and is properly populated
              if (!leave.employeeId || !leave.employeeId._id) {
                console.error('❌ Bulk action: Leave request employeeId not found or not properly populated');
                throw new Error('Employee ID not found in leave request');
              }
              
              await leaveBalanceService.deductLeaveBalance(leave.employeeId._id, leave.type, leave.totalDays);
            } catch (balanceError) {
              console.error('Bulk action: Error updating leave balance:', balanceError);
              // Don't fail the approval process due to balance update issues
            }
          } else {
            leave.adminApproval = {
              approvedBy: adminId,
              approvedAt: new Date(),
              comments: comments || '',
              status: 'rejected'
            };
            leave.status = 'rejected';
            leave.rejectionReason = comments || 'Rejected by admin';
            leave.currentApprovalLevel = 'completed';
            
            leave.approvalHistory.push({
              approvedBy: adminId,
              approverModel: 'Admin',
              approverName: admin.name,
              action: 'rejected',
              comments: comments || '',
              level: 'admin'
            });
          }
          
          await leave.save();
          results.push({ id, type: 'leave', status: 'success', action });
        } else {
          results.push({ id, type: 'leave', status: 'error', message: 'Invalid leave request' });
        }
      } else if (type === 'reimbursement') {
        // Process reimbursement request
        const reimbursement = await Reimbursement.findById(id).populate('employeeId', 'name');
        if (reimbursement && reimbursement.currentApprovalLevel === 'admin' && reimbursement.status === 'manager-approved') {
          if (action === 'approve') {
            reimbursement.adminApproval = {
              approvedBy: adminId,
              approvedAt: new Date(),
              comments: comments || '',
              status: 'approved'
            };
            reimbursement.status = 'approved';
            reimbursement.finalApprovalDate = new Date();
            reimbursement.currentApprovalLevel = 'completed';
            
            reimbursement.approvalHistory.push({
              approvedBy: adminId,
              approverModel: 'Admin',
              approverName: admin.name,
              action: 'approved',
              comments: comments || '',
              level: 'admin'
            });
          } else {
            reimbursement.adminApproval = {
              approvedBy: adminId,
              approvedAt: new Date(),
              comments: comments || '',
              status: 'rejected'
            };
            reimbursement.status = 'rejected';
            reimbursement.rejectionReason = comments || 'Rejected by admin';
            reimbursement.currentApprovalLevel = 'completed';
            
            reimbursement.approvalHistory.push({
              approvedBy: adminId,
              approverModel: 'Admin',
              approverName: admin.name,
              action: 'rejected',
              comments: comments || '',
              level: 'admin'
            });
          }
          
          await reimbursement.save();
          results.push({ id, type: 'reimbursement', status: 'success', action });
        } else {
          results.push({ id, type: 'reimbursement', status: 'error', message: 'Invalid reimbursement request' });
        }
      }
    } catch (error) {
      results.push({ id, type, status: 'error', message: error.message });
    }
  }

  res.status(200).json({
    success: true,
    message: `Bulk ${action} completed`,
    results
  });
});

// @desc    Get leave dates for calendar display
// @route   GET /api/leave/calendar
// @access  Private (Employee/Manager)
const getLeaveDatesForCalendar = asyncHandler(async (req, res) => {
  try {
    const employeeId = req.user._id;
    const { year, month } = req.query;
    
    // Build query for approved leaves only
    const query = { 
      employeeId, 
      status: 'approved' 
    };
    
    // Filter by year if provided
    if (year) {
      const startOfYear = new Date(parseInt(year), 0, 1);
      const endOfYear = new Date(parseInt(year), 11, 31, 23, 59, 59);
      
      query.$or = [
        {
          startDate: {
            $gte: startOfYear,
            $lte: endOfYear
          }
        },
        {
          endDate: {
            $gte: startOfYear,
            $lte: endOfYear
          }
        },
        {
          $and: [
            { startDate: { $lte: startOfYear } },
            { endDate: { $gte: endOfYear } }
          ]
        }
      ];
    }
    
    // Get approved leave requests
    const leaves = await Leave.find(query).select('startDate endDate type');
    
    // Extract all dates from leave periods
    const leaveDates = [];
    
    leaves.forEach(leave => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      
      // Generate all dates between start and end date (inclusive)
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        // Filter by month if specified
        if (month && d.getMonth() + 1 !== parseInt(month)) {
          continue;
        }
        
        // Filter by year if specified
        if (year && d.getFullYear() !== parseInt(year)) {
          continue;
        }
        
        const dateString = d.toISOString().split('T')[0];
        if (!leaveDates.includes(dateString)) {
          leaveDates.push(dateString);
        }
      }
    });
    
    res.status(200).json({
      success: true,
      data: leaveDates.sort(), // Sort dates chronologically
      message: `Found ${leaveDates.length} leave dates`
    });
    
  } catch (error) {
    console.error('Error fetching leave calendar dates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave calendar dates',
      error: error.message
    });
  }
});

// Export all functions
module.exports = {
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
  getLeaveHistory,
  getLeaveDatesForCalendar,
  getAdminPendingRequests,
  getAdminAllRequests,
  getAdminStats,
  adminBulkAction
}; 