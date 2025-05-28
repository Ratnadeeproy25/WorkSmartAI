const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      // Can reference either Employee or Manager collection
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    balances: [
      {
        type: {
          type: String,
          enum: ['Annual Leave', 'Sick Leave', 'Personal Leave'],
          required: true,
        },
        total: {
          type: Number,
          required: true,
          default: 0,
        },
        used: {
          type: Number,
          required: true,
          default: 0,
        },
        color: {
          type: String,
          default: '#3b82f6', // Default blue color
        },
      },
    ],
  },
  { timestamps: true }
);

// Create a compound index for employeeId and year to ensure unique records per year
leaveBalanceSchema.index({ employeeId: 1, year: 1 }, { unique: true });

// Helper method to calculate remaining leave
leaveBalanceSchema.methods.getRemainingLeave = function(leaveType) {
  // Map frontend leave types to backend types
  const typeMap = {
    'sick': 'Sick Leave',
    'annual': 'Annual Leave',
    'personal': 'Personal Leave'
  };
  
  // Convert frontend type to backend type if needed
  const backendType = typeMap[leaveType.toLowerCase()] || leaveType;
  
  // Find the balance with case-insensitive matching
  const leaveBalance = this.balances.find(
    balance => balance.type.toLowerCase() === backendType.toLowerCase()
  );
  
  if (leaveBalance) {
    return leaveBalance.total - leaveBalance.used;
  }
  return 0;
};

// Helper method to update leave usage
leaveBalanceSchema.methods.useLeave = function(leaveType, days) {
  const leaveBalance = this.balances.find(balance => balance.type === leaveType);
  if (leaveBalance) {
    leaveBalance.used += days;
    return true;
  }
  return false;
};

// Helper method to deduct leave (for approved requests)
leaveBalanceSchema.methods.deductLeave = function(leaveType, days) {
  // Map frontend leave types to backend types
  const typeMap = {
    'sick': 'Sick Leave',
    'annual': 'Annual Leave',
    'personal': 'Personal Leave',
    'maternity': 'Personal Leave',
    'paternity': 'Personal Leave',
    'bereavement': 'Personal Leave',
    'other': 'Personal Leave'
  };
  
  // Convert frontend type to backend type if needed
  const backendType = typeMap[leaveType.toLowerCase()] || leaveType;
  
  // Find the balance with case-insensitive matching
  const leaveBalance = this.balances.find(
    balance => balance.type.toLowerCase() === backendType.toLowerCase()
  );
  
  if (leaveBalance) {
    leaveBalance.used += days;
    return true;
  }
  return false;
};

// Helper method to check if employee has enough leave balance
leaveBalanceSchema.methods.hasEnoughBalance = function(leaveType, days) {
  // Always return true to allow negative balances as requested
  // Leave balance can go negative when required
  return true;
};

// Initialize default leave balances for a new employee
leaveBalanceSchema.statics.initializeBalances = async function(employeeId, year) {
  // Validate employeeId
  if (!employeeId) {
    throw new Error('Employee ID is required to initialize leave balances');
  }
  
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new Error('Invalid Employee ID format');
  }

  const defaultBalances = [
    { type: 'Annual Leave', total: 20, used: 0, color: '#3b82f6' },
    { type: 'Sick Leave', total: 10, used: 0, color: '#ef4444' },
    { type: 'Personal Leave', total: 25, used: 0, color: '#10b981' },
  ];

  const leaveBalance = new this({
    employeeId,
    year,
    balances: defaultBalances,
  });

  return await leaveBalance.save();
};

const LeaveBalance = mongoose.model('LeaveBalance', leaveBalanceSchema);

module.exports = LeaveBalance; 