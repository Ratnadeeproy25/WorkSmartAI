const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// Schema for tracking approval history
const approvalHistorySchema = new mongoose.Schema({
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
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
  }
});

const managerLeaveSchema = new mongoose.Schema(
  {
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Manager',
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
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    totalDays: {
      type: Number,
      required: true,
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
    rejectionReason: {
      type: String,
    },
    finalApprovalDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for better query performance
managerLeaveSchema.index({ managerId: 1, createdAt: -1 });
managerLeaveSchema.index({ status: 1 });
managerLeaveSchema.index({ startDate: 1, endDate: 1 });

// Plugin for pagination
managerLeaveSchema.plugin(mongoosePaginate);

// Instance method to calculate days between dates
managerLeaveSchema.methods.getDays = function() {
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const timeDiff = end.getTime() - start.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end date
  return daysDiff;
};

// Instance method to check if manager can view this leave
managerLeaveSchema.methods.canView = function(userId, userRole) {
  if (userRole === 'admin') return true;
  if (userRole === 'manager' && this.managerId.toString() === userId.toString()) return true;
  return false;
};

// Static method to calculate total days
managerLeaveSchema.statics.calculateDays = function(startDate, endDate, duration) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (duration === 'half-day') {
    return 0.5;
  } else if (duration === 'full-day') {
    return 1;
  } else {
    // multiple-days
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    return daysDiff;
  }
};

const ManagerLeave = mongoose.model('ManagerLeave', managerLeaveSchema);

module.exports = ManagerLeave; 