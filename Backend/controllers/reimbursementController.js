const Reimbursement = require('../models/reimbursementModel');
const Employee = require('../models/employeeModel');
const Manager = require('../models/managerModel');
const Admin = require('../models/adminModel');
const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');

// @desc    Submit a reimbursement request (Employee/Manager)
// @route   POST /api/reimbursement/request
// @access  Private (Employee/Manager)
const requestReimbursement = asyncHandler(async (req, res) => {
  const { type, amount, date, description } = req.body;
  const employeeId = req.user._id;
  const userRole = req.user.role;

  // Validate required fields
  if (!type || !amount || !date || !description) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  // Validate amount
  if (parseFloat(amount) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be greater than 0',
    });
  }

  // Process uploaded receipts (optional)
  const receipts = [];
  
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      receipts.push({
        name: file.originalname,
        path: file.path,
        size: file.size,
        type: file.mimetype
      });
    }
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

  // Create reimbursement request
  const reimbursement = new Reimbursement({
    employeeId,
    type,
    amount: parseFloat(amount),
    date: new Date(date),
    description,
    receipts,
    status,
    currentApprovalLevel
  });

  // If manager is requesting, auto-approve manager level
  if (userRole === 'manager') {
    reimbursement.managerApproval = {
      approvedBy: employeeId, // Manager approves their own request
      approvedAt: new Date(),
      comments: 'Auto-approved (Manager request)',
      status: 'approved'
    };
    
    reimbursement.approvalHistory.push({
      approvedBy: employeeId,
      approverModel: 'Manager',
      approverName: req.user.name,
      action: 'approved',
      comments: 'Auto-approved (Manager request)',
      level: 'manager'
    });
  }

  await reimbursement.save();

  // Populate employee details for response
  await reimbursement.populate('employeeId', 'name email department');

  res.status(201).json({
    success: true,
    message: `Reimbursement request submitted successfully${userRole === 'manager' ? ' and forwarded to admin for final approval' : ''}`,
    data: reimbursement,
  });
});

// @desc    Get reimbursement requests for employee
// @route   GET /api/reimbursement
// @access  Private (Employee)
const getReimbursementRequests = asyncHandler(async (req, res) => {
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

  const result = await Reimbursement.paginate(query, options);

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

// @desc    Get reimbursement requests for manager approval
// @route   GET /api/reimbursement/manager/pending
// @access  Private (Manager)
const getManagerPendingReimbursements = asyncHandler(async (req, res) => {
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

  const result = await Reimbursement.paginate(query, options);

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

// @desc    Get reimbursement requests for admin approval
// @route   GET /api/reimbursement/admin/pending
// @access  Private (Admin)
const getAdminPendingReimbursements = asyncHandler(async (req, res) => {
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

  const result = await Reimbursement.paginate(query, options);

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

// @desc    Approve/Reject reimbursement by manager
// @route   PUT /api/reimbursement/:id/manager-action
// @access  Private (Manager)
const managerReimbursementAction = asyncHandler(async (req, res) => {
  const { action, comments } = req.body; // action: 'approve' or 'reject'
  const reimbursementId = req.params.id;
  const managerId = req.user._id;

  if (!action || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({
      success: false,
      message: 'Valid action (approve/reject) is required',
    });
  }

  const reimbursement = await Reimbursement.findById(reimbursementId).populate('employeeId', 'name managerId');

  if (!reimbursement) {
    return res.status(404).json({
      success: false,
      message: 'Reimbursement request not found',
    });
  }

  // Check if manager has authority over this employee
  if (reimbursement.employeeId.managerId.toString() !== managerId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to approve this reimbursement request',
    });
  }

  // Check if reimbursement is at manager approval level
  if (reimbursement.currentApprovalLevel !== 'manager' || reimbursement.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Reimbursement request is not available for manager approval',
    });
  }

  const manager = await Manager.findById(managerId);

  if (action === 'approve') {
    // Manager approves - move to admin level
    reimbursement.managerApproval = {
      approvedBy: managerId,
      approvedAt: new Date(),
      comments: comments || '',
      status: 'approved'
    };
    reimbursement.currentApprovalLevel = 'admin';
    reimbursement.status = 'manager-approved';
    
    reimbursement.approvalHistory.push({
      approvedBy: managerId,
      approverModel: 'Manager',
      approverName: manager.name,
      action: 'approved',
      comments: comments || '',
      level: 'manager'
    });
  } else {
    // Manager rejects - final rejection
    reimbursement.managerApproval = {
      approvedBy: managerId,
      approvedAt: new Date(),
      comments: comments || '',
      status: 'rejected'
    };
    reimbursement.currentApprovalLevel = 'completed';
    reimbursement.status = 'rejected';
    reimbursement.rejectionReason = comments || 'Rejected by manager';
    
    reimbursement.approvalHistory.push({
      approvedBy: managerId,
      approverModel: 'Manager',
      approverName: manager.name,
      action: 'rejected',
      comments: comments || '',
      level: 'manager'
    });
  }

  await reimbursement.save();

  await reimbursement.populate('employeeId', 'name email department');

  res.status(200).json({
    success: true,
    message: `Reimbursement request ${action}d successfully`,
    data: reimbursement,
  });
});

// @desc    Approve/Reject reimbursement by admin
// @route   PUT /api/reimbursement/:id/admin-action
// @access  Private (Admin)
const adminReimbursementAction = asyncHandler(async (req, res) => {
  const { action, comments } = req.body;
  const reimbursementId = req.params.id;
  const adminId = req.user._id;

  if (!action || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({
      success: false,
      message: 'Valid action (approve/reject) is required',
    });
  }

  const reimbursement = await Reimbursement.findById(reimbursementId).populate('employeeId', 'name');

  if (!reimbursement) {
    return res.status(404).json({
      success: false,
      message: 'Reimbursement request not found',
    });
  }

  // Check if reimbursement is at admin approval level
  if (reimbursement.currentApprovalLevel !== 'admin' || reimbursement.status !== 'manager-approved') {
    return res.status(400).json({
      success: false,
      message: 'Reimbursement request is not available for admin approval',
    });
  }

  const admin = await Admin.findById(adminId);

  if (action === 'approve') {
    // Admin approves - final approval
    reimbursement.adminApproval = {
      approvedBy: adminId,
      approvedAt: new Date(),
      comments: comments || '',
      status: 'approved'
    };
    reimbursement.currentApprovalLevel = 'completed';
    reimbursement.status = 'approved';
    reimbursement.finalApprovalDate = new Date();
    
    reimbursement.approvalHistory.push({
      approvedBy: adminId,
      approverModel: 'Admin',
      approverName: admin.name,
      action: 'approved',
      comments: comments || '',
      level: 'admin'
    });
  } else {
    // Admin rejects
    reimbursement.adminApproval = {
      approvedBy: adminId,
      approvedAt: new Date(),
      comments: comments || '',
      status: 'rejected'
    };
    reimbursement.currentApprovalLevel = 'completed';
    reimbursement.status = 'rejected';
    reimbursement.rejectionReason = comments || 'Rejected by admin';
    
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

  res.status(200).json({
    success: true,
    message: `Reimbursement request ${action}d successfully`,
    data: reimbursement,
  });
});

// @desc    Get reimbursement by ID with full details
// @route   GET /api/reimbursement/:id
// @access  Private
const getReimbursementById = asyncHandler(async (req, res) => {
  const reimbursementId = req.params.id;
  const userId = req.user._id;
  const userRole = req.user.role;

  const reimbursement = await Reimbursement.findById(reimbursementId)
    .populate('employeeId', 'name email department employeeId')
    .populate('managerApproval.approvedBy', 'name')
    .populate('adminApproval.approvedBy', 'name');

  if (!reimbursement) {
    return res.status(404).json({
      success: false,
      message: 'Reimbursement request not found',
    });
  }

  // Check if user can view this reimbursement
  if (!reimbursement.canView(userId, userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this reimbursement request',
    });
  }

  res.status(200).json({
    success: true,
    data: reimbursement,
  });
});

// @desc    Cancel reimbursement request (Employee only, if pending)
// @route   DELETE /api/reimbursement/:id
// @access  Private (Employee)
const cancelReimbursement = asyncHandler(async (req, res) => {
  const reimbursementId = req.params.id;
  const employeeId = req.user._id;

  const reimbursement = await Reimbursement.findOne({
    _id: reimbursementId,
    employeeId,
  });

  if (!reimbursement) {
    return res.status(404).json({
      success: false,
      message: 'Reimbursement request not found',
    });
  }

  if (reimbursement.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel a reimbursement request that has been processed',
    });
  }

  // Delete any associated receipt files
  if (reimbursement.receipts && reimbursement.receipts.length > 0) {
    for (const receipt of reimbursement.receipts) {
      try {
        fs.unlinkSync(receipt.path);
      } catch (err) {
        console.error(`Failed to delete receipt: ${receipt.path}`, err);
      }
    }
  }

  await Reimbursement.findByIdAndDelete(reimbursementId);

  res.status(200).json({
    success: true,
    message: 'Reimbursement request cancelled successfully',
  });
});

// @desc    Get reimbursement summary for the employee
// @route   GET /api/reimbursement/summary
// @access  Private (Employee)
const getReimbursementSummary = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  
  // Get all requests for this employee
  const allRequests = await Reimbursement.find({ employeeId });
  
  // Calculate totals
  const totalSubmitted = allRequests.reduce((total, req) => total + req.amount, 0);
  const totalApproved = allRequests
    .filter(req => req.status === 'approved')
    .reduce((total, req) => total + req.amount, 0);
  const totalPending = allRequests
    .filter(req => req.status === 'pending' || req.status === 'manager-approved')
    .reduce((total, req) => total + req.amount, 0);
  
  res.status(200).json({
    success: true,
    data: {
      totalSubmitted,
      totalApproved,
      totalPending,
    },
  });
});

// @desc    Get reimbursement history with status tracking
// @route   GET /api/reimbursement/history
// @access  Private
const getReimbursementHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  const { page = 1, limit = 10 } = req.query;

  let query = {};

  if (userRole === 'employee') {
    query.employeeId = userId;
  }
  // For managers and admins, show all reimbursements they can see

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

  const result = await Reimbursement.paginate(query, options);

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

// @desc    Upload a receipt
// @route   POST /api/reimbursement/upload
// @access  Private (Employee)
const uploadReceipt = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      name: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      type: req.file.mimetype
    },
  });
});

// Export all functions
module.exports = {
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
}; 