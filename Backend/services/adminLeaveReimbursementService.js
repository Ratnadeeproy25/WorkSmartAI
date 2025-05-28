const Leave = require('../models/leaveModel');
const ManagerLeave = require('../models/managerLeaveModel');
const Reimbursement = require('../models/reimbursementModel');
const Employee = require('../models/employeeModel');
const Manager = require('../models/managerModel');

/**
 * Transform leave request to frontend format
 */
const transformLeaveRequest = (leave) => {
  return {
    id: leave._id,
    employeeId: leave.employeeId?._id || leave.employeeId,
    employeeName: leave.employeeId?.name || 'Unknown',
    department: leave.employeeId?.department || 'Unknown',
    leaveType: capitalizeLeaveType(leave.type),
    startDate: formatDate(leave.startDate),
    endDate: formatDate(leave.endDate),
    reason: leave.reason,
    status: leave.status,
    dateSubmitted: formatDate(leave.createdAt),
    requestType: 'leave',
    currentApprovalLevel: leave.currentApprovalLevel,
    totalDays: leave.totalDays,
    managerApproval: leave.managerApproval,
    adminApproval: leave.adminApproval,
    approvalHistory: leave.approvalHistory
  };
};

/**
 * Transform manager leave request to frontend format
 */
const transformManagerLeaveRequest = (leave) => {
  return {
    id: leave._id,
    employeeId: leave.managerId?._id || leave.managerId,
    employeeName: leave.managerId?.name || 'Unknown Manager',
    department: leave.managerId?.department || 'Management',
    leaveType: capitalizeLeaveType(leave.type),
    startDate: formatDate(leave.startDate),
    endDate: formatDate(leave.endDate),
    reason: leave.reason,
    status: leave.status,
    dateSubmitted: formatDate(leave.createdAt),
    requestType: 'manager-leave',
    currentApprovalLevel: 'admin', // Manager leaves go directly to admin
    totalDays: leave.totalDays,
    adminApproval: leave.adminApproval,
    approvalHistory: leave.approvalHistory,
    isManagerRequest: true
  };
};

/**
 * Transform reimbursement request to frontend format
 */
const transformReimbursementRequest = (reimbursement) => {
  return {
    id: reimbursement._id,
    employeeId: reimbursement.employeeId?._id || reimbursement.employeeId,
    employeeName: reimbursement.employeeId?.name || 'Unknown',
    department: reimbursement.employeeId?.department || 'Unknown',
    expenseType: capitalizeExpenseType(reimbursement.type),
    amount: reimbursement.amount,
    date: formatDate(reimbursement.date),
    description: reimbursement.description,
    status: reimbursement.status,
    dateSubmitted: formatDate(reimbursement.createdAt),
    requestType: 'reimbursement',
    currentApprovalLevel: reimbursement.currentApprovalLevel,
    managerApproval: reimbursement.managerApproval,
    adminApproval: reimbursement.adminApproval,
    approvalHistory: reimbursement.approvalHistory,
    receipts: reimbursement.receipts
  };
};

/**
 * Custom populate function that handles both Employee and Manager collections
 */
const populateEmployeeData = async (requests) => {
  const populatedRequests = [];
  
  for (const request of requests) {
    let employeeData = null;
    
    // Try to find in Employee collection first
    employeeData = await Employee.findById(request.employeeId).select('name email department id role').lean();
    
    // If not found, try Manager collection
    if (!employeeData) {
      employeeData = await Manager.findById(request.employeeId).select('name email department id position').lean();
      // Add role for managers
      if (employeeData) {
        employeeData.role = 'manager';
        // Use position as department fallback if needed
        if (!employeeData.department && employeeData.position) {
          employeeData.department = employeeData.position;
        }
      }
    }
    
    // If still not found, create a placeholder
    if (!employeeData) {
      employeeData = {
        _id: request.employeeId,
        name: 'Unknown User',
        email: 'unknown@company.com',
        department: 'Unknown',
        role: 'unknown'
      };
    }
    
    // Replace the employeeId with populated data
    request.employeeId = employeeData;
    populatedRequests.push(request);
  }
  
  return populatedRequests;
};

/**
 * Get requests pending admin approval
 */
const getAdminPendingRequests = async (filters = {}) => {
  const { role = 'all', type = 'all', page = 1, limit = 10 } = filters;
  
  let leaveQuery = {
    currentApprovalLevel: 'admin',
    status: 'manager-approved'
  };
  
  let reimbursementQuery = {
    currentApprovalLevel: 'admin',
    status: 'manager-approved'
  };

  // Add role-based filtering
  if (role === 'employee') {
    // Get all employee IDs (exclude managers and admins)
    const employees = await Employee.find({ role: 'employee' }).select('_id');
    const employeeIds = employees.map(emp => emp._id);
    
    leaveQuery.employeeId = { $in: employeeIds };
    reimbursementQuery.employeeId = { $in: employeeIds };
  } else if (role === 'manager') {
    // Get all manager IDs
    const managers = await Manager.find().select('_id');
    const managerIds = managers.map(mgr => mgr._id);
    
    leaveQuery.employeeId = { $in: managerIds };
    reimbursementQuery.employeeId = { $in: managerIds };
  }

  const populate = [
    { path: 'employeeId', select: 'name email department id role' },
    { path: 'managerApproval.approvedBy', select: 'name' }
  ];

  let allRequests = [];

  // Fetch leave requests if needed
  if (type === 'leave' || type === 'all') {
    let leaveRequests = await Leave.find(leaveQuery)
      .populate([
        { path: 'managerApproval.approvedBy', select: 'name' },
        { path: 'adminApproval.approvedBy', select: 'name' }
      ])
      .sort({ createdAt: -1 })
      .lean();
    
    // Custom populate for employeeId (handles both Employee and Manager collections)
    leaveRequests = await populateEmployeeData(leaveRequests);
    
    allRequests.push(...leaveRequests.map(transformLeaveRequest));

    // Also fetch manager leave requests from the separate ManagerLeave collection
    // Only if not filtering specifically to employee role
    if (role !== 'employee') {
      // Manager leaves go directly to admin (status: 'pending')
      const managerLeaveRequests = await ManagerLeave.find({ status: 'pending' })
        .populate('managerId', 'name department')
        .populate('adminApproval.approvedBy', 'name')
        .sort({ createdAt: -1 })
        .lean();

      allRequests.push(...managerLeaveRequests.map(transformManagerLeaveRequest));
    }
  }

  // Fetch reimbursement requests if needed
  if (type === 'reimbursement' || type === 'all') {
    let reimbursementRequests = await Reimbursement.find(reimbursementQuery)
      .populate([
        { path: 'managerApproval.approvedBy', select: 'name' },
        { path: 'adminApproval.approvedBy', select: 'name' }
      ])
      .sort({ createdAt: -1 })
      .lean();
    
    // Custom populate for employeeId (handles both Employee and Manager collections)
    reimbursementRequests = await populateEmployeeData(reimbursementRequests);
    
    allRequests.push(...reimbursementRequests.map(transformReimbursementRequest));
  }

  // Sort by creation date
  allRequests.sort((a, b) => new Date(b.dateSubmitted) - new Date(a.dateSubmitted));

  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedRequests = allRequests.slice(startIndex, endIndex);

  return {
    data: paginatedRequests,
    pagination: {
      current: parseInt(page),
      total: allRequests.length,
      pages: Math.ceil(allRequests.length / limit),
      hasMore: endIndex < allRequests.length
    }
  };
};

/**
 * Get all requests with filters (approved, rejected, etc.)
 */
const getAllRequests = async (filters = {}) => {
  const { role = 'all', type = 'all', status = 'all', page = 1, limit = 10, startDate, endDate } = filters;
  
  let leaveQuery = {};
  let reimbursementQuery = {};

  // Add status filter
  if (status !== 'all') {
    leaveQuery.status = status;
    reimbursementQuery.status = status;
  }

  // Add date range filter
  if (startDate && endDate) {
    const dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    leaveQuery = { ...leaveQuery, ...dateFilter };
    reimbursementQuery = { ...reimbursementQuery, ...dateFilter };
  }

  // Add role-based filtering
  if (role === 'employee') {
    const employees = await Employee.find({ role: 'employee' }).select('_id');
    const employeeIds = employees.map(emp => emp._id);
    
    leaveQuery.employeeId = { $in: employeeIds };
    reimbursementQuery.employeeId = { $in: employeeIds };
  } else if (role === 'manager') {
    const managers = await Manager.find().select('_id');
    const managerIds = managers.map(mgr => mgr._id);
    
    leaveQuery.employeeId = { $in: managerIds };
    reimbursementQuery.employeeId = { $in: managerIds };
  }

  const populate = [
    { path: 'employeeId', select: 'name email department id role' },
    { path: 'managerApproval.approvedBy', select: 'name' },
    { path: 'adminApproval.approvedBy', select: 'name' }
  ];

  let allRequests = [];

  // Fetch leave requests if needed
  if (type === 'leave' || type === 'all') {
    let leaveRequests = await Leave.find(leaveQuery)
      .populate([
        { path: 'managerApproval.approvedBy', select: 'name' },
        { path: 'adminApproval.approvedBy', select: 'name' }
      ])
      .sort({ createdAt: -1 })
      .lean();
    
    // Custom populate for employeeId (handles both Employee and Manager collections)
    leaveRequests = await populateEmployeeData(leaveRequests);
    
    allRequests.push(...leaveRequests.map(transformLeaveRequest));

    // Also fetch manager leave requests from the separate ManagerLeave collection
    // Only if not filtering specifically to employee role
    if (role !== 'employee') {
      let managerLeaveQuery = {};
      
      // Add status filter for manager leaves
      if (status !== 'all') {
        managerLeaveQuery.status = status;
      }

      // Add date range filter
      if (startDate && endDate) {
        managerLeaveQuery.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const managerLeaveRequests = await ManagerLeave.find(managerLeaveQuery)
        .populate('managerId', 'name department')
        .populate('adminApproval.approvedBy', 'name')
        .sort({ createdAt: -1 })
        .lean();

      allRequests.push(...managerLeaveRequests.map(transformManagerLeaveRequest));
    }
  }

  // Fetch reimbursement requests if needed
  if (type === 'reimbursement' || type === 'all') {
    let reimbursementRequests = await Reimbursement.find(reimbursementQuery)
      .populate([
        { path: 'managerApproval.approvedBy', select: 'name' },
        { path: 'adminApproval.approvedBy', select: 'name' }
      ])
      .sort({ createdAt: -1 })
      .lean();
    
    // Custom populate for employeeId (handles both Employee and Manager collections)
    reimbursementRequests = await populateEmployeeData(reimbursementRequests);
    
    allRequests.push(...reimbursementRequests.map(transformReimbursementRequest));
  }

  // Sort by creation date
  allRequests.sort((a, b) => new Date(b.dateSubmitted) - new Date(a.dateSubmitted));

  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedRequests = allRequests.slice(startIndex, endIndex);

  return {
    data: paginatedRequests,
    pagination: {
      current: parseInt(page),
      total: allRequests.length,
      pages: Math.ceil(allRequests.length / limit),
      hasMore: endIndex < allRequests.length
    }
  };
};

/**
 * Get dashboard statistics
 */
const getDashboardStats = async () => {
  // Get employee and manager IDs for role-based stats
  const employees = await Employee.find({ role: 'employee' }).select('_id');
  const managers = await Manager.find().select('_id');
  const employeeIds = employees.map(emp => emp._id);
  const managerIds = managers.map(mgr => mgr._id);

  // Pending requests awaiting admin approval
  const pendingEmployeeLeaves = await Leave.countDocuments({ 
    currentApprovalLevel: 'admin', 
    status: 'manager-approved',
    employeeId: { $in: employeeIds }
  });
  
  // Get manager leaves from both old system and new dedicated ManagerLeave collection
  const pendingManagerLeavesOld = await Leave.countDocuments({ 
    currentApprovalLevel: 'admin', 
    status: 'manager-approved',
    employeeId: { $in: managerIds }
  });

  const pendingManagerLeavesNew = await ManagerLeave.countDocuments({ 
    status: 'pending'
  });

  const pendingManagerLeaves = pendingManagerLeavesOld + pendingManagerLeavesNew;

  const pendingEmployeeReimbursements = await Reimbursement.countDocuments({ 
    currentApprovalLevel: 'admin', 
    status: 'manager-approved',
    employeeId: { $in: employeeIds }
  });
  
  const pendingManagerReimbursements = await Reimbursement.countDocuments({ 
    currentApprovalLevel: 'admin', 
    status: 'manager-approved',
    employeeId: { $in: managerIds }
  });

  // Approved requests
  const approvedEmployeeLeaves = await Leave.countDocuments({ 
    status: 'approved',
    employeeId: { $in: employeeIds }
  });
  
  const approvedManagerLeavesOld = await Leave.countDocuments({ 
    status: 'approved',
    employeeId: { $in: managerIds }
  });

  const approvedManagerLeavesNew = await ManagerLeave.countDocuments({ 
    status: 'approved'
  });

  const approvedManagerLeaves = approvedManagerLeavesOld + approvedManagerLeavesNew;

  const approvedEmployeeReimbursements = await Reimbursement.countDocuments({ 
    status: 'approved',
    employeeId: { $in: employeeIds }
  });
  
  const approvedManagerReimbursements = await Reimbursement.countDocuments({ 
    status: 'approved',
    employeeId: { $in: managerIds }
  });

  // Rejected requests
  const rejectedEmployeeLeaves = await Leave.countDocuments({ 
    status: 'rejected',
    employeeId: { $in: employeeIds }
  });
  
  const rejectedManagerLeavesOld = await Leave.countDocuments({ 
    status: 'rejected',
    employeeId: { $in: managerIds }
  });

  const rejectedManagerLeavesNew = await ManagerLeave.countDocuments({ 
    status: 'rejected'
  });

  const rejectedManagerLeaves = rejectedManagerLeavesOld + rejectedManagerLeavesNew;

  const rejectedEmployeeReimbursements = await Reimbursement.countDocuments({ 
    status: 'rejected',
    employeeId: { $in: employeeIds }
  });
  
  const rejectedManagerReimbursements = await Reimbursement.countDocuments({ 
    status: 'rejected',
    employeeId: { $in: managerIds }
  });

  return {
    pending: {
      employee: {
        leaves: pendingEmployeeLeaves,
        reimbursements: pendingEmployeeReimbursements,
        total: pendingEmployeeLeaves + pendingEmployeeReimbursements
      },
      manager: {
        leaves: pendingManagerLeaves,
        reimbursements: pendingManagerReimbursements,
        total: pendingManagerLeaves + pendingManagerReimbursements
      },
      total: pendingEmployeeLeaves + pendingManagerLeaves + pendingEmployeeReimbursements + pendingManagerReimbursements
    },
    approved: {
      employee: {
        leaves: approvedEmployeeLeaves,
        reimbursements: approvedEmployeeReimbursements,
        total: approvedEmployeeLeaves + approvedEmployeeReimbursements
      },
      manager: {
        leaves: approvedManagerLeaves,
        reimbursements: approvedManagerReimbursements,
        total: approvedManagerLeaves + approvedManagerReimbursements
      },
      total: approvedEmployeeLeaves + approvedManagerLeaves + approvedEmployeeReimbursements + approvedManagerReimbursements
    },
    rejected: {
      employee: {
        leaves: rejectedEmployeeLeaves,
        reimbursements: rejectedEmployeeReimbursements,
        total: rejectedEmployeeLeaves + rejectedEmployeeReimbursements
      },
      manager: {
        leaves: rejectedManagerLeaves,
        reimbursements: rejectedManagerReimbursements,
        total: rejectedManagerLeaves + rejectedManagerReimbursements
      },
      total: rejectedEmployeeLeaves + rejectedManagerLeaves + rejectedEmployeeReimbursements + rejectedManagerReimbursements
    }
  };
};

// Helper functions
const capitalizeLeaveType = (type) => {
  const typeMap = {
    'annual': 'Annual Leave',
    'sick': 'Sick Leave',
    'personal': 'Personal Leave',
    'maternity': 'Maternity Leave',
    'paternity': 'Paternity Leave',
    'bereavement': 'Bereavement Leave',
    'other': 'Other Leave'
  };
  return typeMap[type] || type;
};

const capitalizeExpenseType = (type) => {
  const typeMap = {
    'travel': 'Travel Expense',
    'food': 'Food Expense',
    'training': 'Training Expense',
    'equipment': 'Equipment Expense',
    'other': 'Other Expense'
  };
  return typeMap[type] || type;
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

module.exports = {
  getAdminPendingRequests,
  getAllRequests,
  getDashboardStats,
  transformLeaveRequest,
  transformManagerLeaveRequest,
  transformReimbursementRequest
}; 