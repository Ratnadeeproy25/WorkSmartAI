const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

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

const leaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    type: {
      type: String,
      enum: ['annual', 'sick', 'personal', 'maternity', 'paternity', 'bereavement', 'other'],
      required: true,
    },
    duration: {
      type: String,
      enum: ['half-day', 'full-day', 'multiple-days'],
      required: true
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
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
    rejectionReason: String,
    totalDays: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

// Method to calculate the number of days
leaveSchema.methods.getDays = function() {
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  
  if (this.duration === 'half-day') {
    return 0.5;
  } else if (this.duration === 'full-day') {
    return 1;
  } else {
  const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
  }
};

// Method to check if employee is the request owner or a valid approver
leaveSchema.methods.canView = function(userId, userRole) {
  if (this.employeeId.toString() === userId.toString()) {
    return true;
  }
  
  if (userRole === 'manager' || userRole === 'admin') {
    return true;
  }
  
  return false;
};

// Method to check if user can approve at current level
leaveSchema.methods.canApprove = function(userId, userRole) {
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

// Check for overlapping leave requests
leaveSchema.statics.checkOverlap = async function(employeeId, startDate, endDate, excludeId = null) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const query = {
    employeeId,
    status: { $nin: ['rejected'] },
    $or: [
      { startDate: { $lte: end }, endDate: { $gte: start } },
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const overlappingLeaves = await this.find(query);
  return overlappingLeaves.length > 0;
};

// Pre-save middleware to calculate total days
leaveSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('startDate') || this.isModified('endDate') || this.isModified('duration')) {
    this.totalDays = this.getDays();
  }
  next();
});

leaveSchema.index({ employeeId: 1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ currentApprovalLevel: 1 });

// Add pagination plugin
leaveSchema.plugin(mongoosePaginate);

const Leave = mongoose.model('Leave', leaveSchema);

module.exports = Leave; 