const mongoose = require('mongoose');
const Employee = require('../models/employeeModel');
const LeaveBalance = require('../models/leaveBalanceModel');
require('dotenv').config();

const initializeLeaveBalances = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/worksmartAI');
    console.log('Connected to MongoDB');

    const currentYear = new Date().getFullYear();
    
    // Get all active employees
    const employees = await Employee.find({ status: 'Active' });
    console.log(`Found ${employees.length} active employees`);

    let initializedCount = 0;
    let updatedCount = 0;

    for (const employee of employees) {
      try {
        // Check if LeaveBalance already exists for this employee and year
        let leaveBalance = await LeaveBalance.findOne({ 
          employeeId: employee._id, 
          year: currentYear 
        });

        if (!leaveBalance) {
          // Create new LeaveBalance record
          leaveBalance = await LeaveBalance.initializeBalances(employee._id, currentYear);
          console.log(`✅ Initialized leave balance for ${employee.name} (${employee.id})`);
          initializedCount++;
        } else {
          // Update existing record to ensure correct defaults
          let updated = false;
          
          leaveBalance.balances.forEach(balance => {
            switch (balance.type) {
              case 'Annual Leave':
                if (balance.total !== 20) {
                  balance.total = 20;
                  updated = true;
                }
                break;
              case 'Sick Leave':
                if (balance.total !== 10) {
                  balance.total = 10;
                  updated = true;
                }
                break;
              case 'Personal Leave':
                if (balance.total !== 25) {
                  balance.total = 25;
                  updated = true;
                }
                break;
            }
          });

          // Add missing balance types if any
          const existingTypes = leaveBalance.balances.map(b => b.type);
          const requiredTypes = ['Annual Leave', 'Sick Leave', 'Personal Leave'];
          
          for (const type of requiredTypes) {
            if (!existingTypes.includes(type)) {
              const defaults = {
                'Annual Leave': { total: 20, color: '#3b82f6' },
                'Sick Leave': { total: 10, color: '#ef4444' },
                'Personal Leave': { total: 25, color: '#10b981' }
              };
              
              leaveBalance.balances.push({
                type,
                total: defaults[type].total,
                used: 0,
                color: defaults[type].color
              });
              updated = true;
            }
          }

          if (updated) {
            await leaveBalance.save();
            console.log(`🔄 Updated leave balance for ${employee.name} (${employee.id})`);
            updatedCount++;
          } else {
            console.log(`✓ Leave balance already correct for ${employee.name} (${employee.id})`);
          }
        }

        // Also update the embedded employee leave balances for consistency
        let employeeUpdated = false;
        if (employee.leaveBalances.personalLeave.total !== 25) {
          employee.leaveBalances.personalLeave.total = 25;
          employeeUpdated = true;
        }
        if (employee.leaveBalances.annualLeave.total !== 20) {
          employee.leaveBalances.annualLeave.total = 20;
          employeeUpdated = true;
        }
        if (employee.leaveBalances.sickLeave.total !== 10) {
          employee.leaveBalances.sickLeave.total = 10;
          employeeUpdated = true;
        }

        if (employeeUpdated) {
          await employee.save();
          console.log(`🔄 Updated embedded balances for ${employee.name} (${employee.id})`);
        }

      } catch (error) {
        console.error(`❌ Error processing employee ${employee.name} (${employee.id}):`, error.message);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   • Initialized: ${initializedCount} employees`);
    console.log(`   • Updated: ${updatedCount} employees`);
    console.log(`   • Total processed: ${employees.length} employees`);
    console.log('✅ Leave balance initialization completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
if (require.main === module) {
  initializeLeaveBalances()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = initializeLeaveBalances; 