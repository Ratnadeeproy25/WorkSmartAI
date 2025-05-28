const LeaveBalance = require('../models/leaveBalanceModel');
const Employee = require('../models/employeeModel');

/**
 * Ensure leave balance exists for an employee for the given year
 * If not exists, create with default values
 */
const ensureLeaveBalance = async (employeeId, year = null) => {
  try {
    const currentYear = year || new Date().getFullYear();
    
    let leaveBalance = await LeaveBalance.findOne({ 
      employeeId, 
      year: currentYear 
    });
    
    if (!leaveBalance) {
      console.log(`Creating leave balance for employee ${employeeId} for year ${currentYear}`);
      leaveBalance = await LeaveBalance.initializeBalances(employeeId, currentYear);
    }
    
    return leaveBalance;
  } catch (error) {
    console.error('Error ensuring leave balance:', error);
    throw error;
  }
};

/**
 * Update leave balance when a leave request is approved
 */
const deductLeaveBalance = async (employeeId, leaveType, days, year = null) => {
  try {
    const currentYear = year || new Date().getFullYear();
    
    // Ensure leave balance exists
    const leaveBalance = await ensureLeaveBalance(employeeId, currentYear);
    
    // Deduct the leave
    const deductionSuccess = leaveBalance.deductLeave(leaveType, days);
    
    if (deductionSuccess) {
      await leaveBalance.save();
      // console.log(`✅ Successfully deducted ${days} days of ${leaveType} leave for employee ${employeeId}`);
      return true;
    } else {
      console.log(`❌ Failed to deduct leave - balance type for ${leaveType} not found`);
      return false;
    }
  } catch (error) {
    console.error('Error deducting leave balance:', error);
    throw error;
  }
};

/**
 * Check if employee has sufficient leave balance
 */
const hasEnoughBalance = async (employeeId, leaveType, days, year = null) => {
  try {
    const currentYear = year || new Date().getFullYear();
    
    // Ensure leave balance exists
    const leaveBalance = await ensureLeaveBalance(employeeId, currentYear);
    
    return leaveBalance.hasEnoughBalance(leaveType, days);
  } catch (error) {
    console.error('Error checking leave balance:', error);
    return false;
  }
};

/**
 * Get remaining leave balance for a specific type
 */
const getRemainingBalance = async (employeeId, leaveType, year = null) => {
  try {
    const currentYear = year || new Date().getFullYear();
    
    // Ensure leave balance exists
    const leaveBalance = await ensureLeaveBalance(employeeId, currentYear);
    
    return leaveBalance.getRemainingLeave(leaveType);
  } catch (error) {
    console.error('Error getting remaining balance:', error);
    return 0;
  }
};

/**
 * Initialize leave balances for all employees without them for the current year
 */
const initializeAllEmployeeBalances = async (year = null) => {
  try {
    const currentYear = year || new Date().getFullYear();
    
    // Get all employees
    const employees = await Employee.find({}, '_id name id');
    
    let created = 0;
    let existing = 0;
    
    for (const employee of employees) {
      try {
        const existingBalance = await LeaveBalance.findOne({
          employeeId: employee._id,
          year: currentYear
        });
        
        if (!existingBalance) {
          await LeaveBalance.initializeBalances(employee._id, currentYear);
          // console.log(`✅ Created leave balance for ${employee.name} (${employee.id})`);
          created++;
        } else {
          existing++;
        }
      } catch (error) {
        console.error(`❌ Error creating leave balance for ${employee.name}:`, error);
      }
    }
    
    console.log(`Leave balance initialization complete: ${created} created, ${existing} existing`);
    return { created, existing, total: employees.length };
  } catch (error) {
    console.error('Error initializing all employee balances:', error);
    throw error;
  }
};

/**
 * Reset leave balance to default values for an employee
 */
const resetEmployeeBalance = async (employeeId, year = null) => {
  try {
    const currentYear = year || new Date().getFullYear();
    
    // Delete existing balance
    await LeaveBalance.findOneAndDelete({
      employeeId,
      year: currentYear
    });
    
    // Create new balance with default values
    const newBalance = await LeaveBalance.initializeBalances(employeeId, currentYear);
    
    // console.log(`✅ Reset leave balance for employee ${employeeId} for year ${currentYear}`);
    return newBalance;
  } catch (error) {
    console.error('Error resetting employee balance:', error);
    throw error;
  }
};

module.exports = {
  ensureLeaveBalance,
  deductLeaveBalance,
  hasEnoughBalance,
  getRemainingBalance,
  initializeAllEmployeeBalances,
  resetEmployeeBalance
}; 