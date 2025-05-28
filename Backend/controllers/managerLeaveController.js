const ManagerLeave = require('../models/managerLeaveModel');
const LeaveBalance = require('../models/leaveBalanceModel');
const Manager = require('../models/managerModel');
const Admin = require('../models/adminModel');
const asyncHandler = require('express-async-handler');
const leaveBalanceService = require('../services/leaveBalanceService');

// @desc    Request leave (Manager only)
// @route   POST /api/manager-leave/request
// @access  Private (Manager)
const requestManagerLeave = asyncHandler(async (req, res) => {
  let { type, duration, startDate, endDate, reason } = req.body;
  const managerId = req.user._id;
  const userRole = req.user.role;

  // Validate that user is a manager
  if (userRole !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Only managers can access this endpoint',
    });
  }

  // Validate required fields
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

  // Auto-determine duration if not provided
  if (!duration) {
    if (start.getTime() === end.getTime()) {
      duration = 'full-day';
    } else {
      duration = 'multiple-days';
    }
  }

  // Calculate total days
  const totalDays = ManagerLeave.calculateDays(start, end, duration);

  // Check if manager has enough leave balance
  const balanceType = type;
  const leaveBalance = await leaveBalanceService.ensureLeaveBalance(managerId);

  if (!leaveBalance.hasEnoughBalance(balanceType, totalDays)) {
    return res.status(400).json({
      success: false,
      message: `Insufficient ${type} leave balance. You requested ${totalDays} days but only have ${leaveBalance.getRemainingLeave(balanceType)} days available.`,
    });
  }

  // Create manager leave request (goes directly to admin)
  const managerLeave = new ManagerLeave({
    managerId,
    type,
    duration,
    startDate: start,
    endDate: end,
    reason,
    totalDays,
    status: 'pending', // Manager requests go directly to admin
  });

  await managerLeave.save();

  // Populate manager details for response
  await managerLeave.populate('managerId', 'name email department');

  res.status(201).json({
    success: true,
    message: 'Manager leave request submitted successfully and forwarded to admin for approval',
    data: managerLeave,
  });
});

// @desc    Get manager leave requests
// @route   GET /api/manager-leave
// @access  Private (Manager)
const getManagerLeaveRequests = asyncHandler(async (req, res) => {
  const managerId = req.user._id;
  const { status, page = 1, limit = 10 } = req.query;

  const query = { managerId };

  if (status) {
    query.status = status;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      { path: 'adminApproval.approvedBy', select: 'name' }
    ]
  };

  const result = await ManagerLeave.paginate(query, options);

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

// @desc    Approve/Reject manager leave by admin
// @route   PUT /api/manager-leave/:id/admin-action
// @access  Private (Admin)
const adminManagerLeaveAction = asyncHandler(async (req, res) => {
  const { action, comments } = req.body;
  const leaveId = req.params.id;
  const adminId = req.user._id;

  if (!action || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({
      success: false,
      message: 'Valid action (approve/reject) is required',
    });
  }

  const managerLeave = await ManagerLeave.findById(leaveId).populate('managerId', '_id name email department');

  if (!managerLeave) {
    return res.status(404).json({
      success: false,
      message: 'Manager leave request not found',
    });
  }

  // Check if leave is pending
  if (managerLeave.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Manager leave request is not pending approval',
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
    managerLeave.adminApproval = {
      approvedBy: adminId,
      approvedAt: new Date(),
      comments: comments || '',
      status: 'approved'
    };
    managerLeave.status = 'approved';
    managerLeave.finalApprovalDate = new Date();
    
    managerLeave.approvalHistory.push({
      approvedBy: adminId,
      approverName: admin.name,
      action: 'approved',
      comments: comments || ''
    });

    // Update manager leave balance using service
    try {
      if (!managerLeave.managerId || !managerLeave.managerId._id) {
        console.error('❌ Manager leave request managerId not found or not properly populated');
        throw new Error('Manager ID not found in leave request');
      }
      
      await leaveBalanceService.deductLeaveBalance(managerLeave.managerId._id, managerLeave.type, managerLeave.totalDays);
      console.log(`✅ Manager leave balance updated: ${managerLeave.totalDays} days deducted from ${managerLeave.type} leave for manager ${managerLeave.managerId.name}`);
    } catch (balanceError) {
      console.error('❌ Error updating manager leave balance:', balanceError);
      // Don't fail the approval process due to balance update issues
    }
  } else {
    // Admin rejects
    managerLeave.adminApproval = {
      approvedBy: adminId,
      approvedAt: new Date(),
      comments: comments || '',
      status: 'rejected'
    };
    managerLeave.status = 'rejected';
    managerLeave.rejectionReason = comments || 'Rejected by admin';
    
    managerLeave.approvalHistory.push({
      approvedBy: adminId,
      approverName: admin.name,
      action: 'rejected',
      comments: comments || ''
    });
  }

  await managerLeave.save();

  res.status(200).json({
    success: true,
    message: `Manager leave request ${action}d successfully`,
    data: managerLeave,
  });
});

// @desc    Get manager leave by ID with full details
// @route   GET /api/manager-leave/:id
// @access  Private
const getManagerLeaveById = asyncHandler(async (req, res) => {
  const leaveId = req.params.id;
  const userId = req.user._id;
  const userRole = req.user.role;

  const managerLeave = await ManagerLeave.findById(leaveId)
    .populate('managerId', 'name email department id')
    .populate('adminApproval.approvedBy', 'name');

  if (!managerLeave) {
    return res.status(404).json({
      success: false,
      message: 'Manager leave request not found',
    });
  }

  // Check if user can view this leave
  if (!managerLeave.canView(userId, userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this manager leave request',
    });
  }

  res.status(200).json({
    success: true,
    data: managerLeave,
  });
});

// @desc    Cancel manager leave request (Manager only, if pending)
// @route   DELETE /api/manager-leave/:id
// @access  Private (Manager)
const cancelManagerLeave = asyncHandler(async (req, res) => {
  const leaveId = req.params.id;
  const managerId = req.user._id;

  const managerLeave = await ManagerLeave.findOne({
    _id: leaveId,
    managerId,
  });

  if (!managerLeave) {
    return res.status(404).json({
      success: false,
      message: 'Manager leave request not found',
    });
  }

  if (managerLeave.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel a manager leave request that has been processed',
    });
  }

  await ManagerLeave.findByIdAndDelete(leaveId);

  res.status(200).json({
    success: true,
    message: 'Manager leave request cancelled successfully',
  });
});

// @desc    Get pending manager leaves for admin
// @route   GET /api/manager-leave/admin/pending
// @access  Private (Admin)
const getAdminPendingManagerLeaves = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const query = { status: 'pending' };

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      { path: 'managerId', select: 'name email department id' }
    ]
  };

  const result = await ManagerLeave.paginate(query, options);

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

// @desc    Get manager leave history
// @route   GET /api/manager-leave/history
// @access  Private (Manager)
const getManagerLeaveHistory = asyncHandler(async (req, res) => {
  const managerId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  const query = { managerId };

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      { path: 'adminApproval.approvedBy', select: 'name' }
    ]
  };

  const result = await ManagerLeave.paginate(query, options);

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

module.exports = {
  requestManagerLeave,
  getManagerLeaveRequests,
  adminManagerLeaveAction,
  getManagerLeaveById,
  cancelManagerLeave,
  getAdminPendingManagerLeaves,
  getManagerLeaveHistory,
}; 