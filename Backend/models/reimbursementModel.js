const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const receiptSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true
  }
});

// Schema for tracking approval history
const approvalHistorySchema = new mongoose.Schema({
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'approverModel',
    required: true
  },
  approverModel: {
    type: String,
    required: true,
    enum: ['Manager', 'Admin']
  },
  approverName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    enum: ['approved', 'rejected'],
    required: true
  },
  comments: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  level: {
    type: String,
    enum: ['manager', 'admin'],
    required: true
  }
});

const reimbursementSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    type: {
      type: String,
      enum: ['travel', 'meals', 'office-supplies', 'training', 'other'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    receipts: {  
      type: [receiptSchema],
      default: []
    },
    status: {
      type: String,
      enum: ['pending', 'manager-approved', 'approved', 'rejected'],
      default: 'pending',
    },
    currentApprovalLevel: {
      type: String,
      enum: ['manager', 'admin', 'completed'],
      default: 'manager'
    },
    managerApproval: {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
        ref: 'Manager'
    },
      approvedAt: Date,
      comments: String,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      }
    },
    adminApproval: {
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
      },
      approvedAt: Date,
      comments: String,
      status: {
      type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
    },
    approvalHistory: [approvalHistorySchema],
    finalApprovalDate: Date,
    rejectionReason: String
  },
  { timestamps: true }
);

// Method to check if employee is the request owner or a valid approver
reimbursementSchema.methods.canView = function(userId, userRole) {
  if (this.employeeId.toString() === userId.toString()) {
    return true;
  }
  
  if (userRole === 'manager' || userRole === 'admin') {
    return true;
  }
  
  return false;
};

// Method to check if user can approve at current level
reimbursementSchema.methods.canApprove = function(userId, userRole) {
  if (this.status === 'approved' || this.status === 'rejected') {
    return false;
  }
  
  if (userRole === 'manager' && this.currentApprovalLevel === 'manager') {
    return true;
  }
  
  if (userRole === 'admin' && this.currentApprovalLevel === 'admin') {
    return true;
  }
  
  return false;
};

reimbursementSchema.index({ employeeId: 1 });
reimbursementSchema.index({ status: 1 });
reimbursementSchema.index({ currentApprovalLevel: 1 });

// Add pagination plugin
reimbursementSchema.plugin(mongoosePaginate);

const Reimbursement = mongoose.model('Reimbursement', reimbursementSchema);

module.exports = Reimbursement;