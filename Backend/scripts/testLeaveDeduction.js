const mongoose = require('mongoose');
const LeaveBalance = require('../models/leaveBalanceModel');
require('dotenv').config();

const testLeaveDeduction = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms');
    console.log('Connected to MongoDB');

    // Create a test employee ID (using a dummy ObjectId)
    const testEmployeeId = new mongoose.Types.ObjectId();
    const currentYear = new Date().getFullYear();
    
    console.log('\n🧪 Testing Leave Deduction System...');
    console.log(`Test Employee ID: ${testEmployeeId}`);
    console.log(`Year: ${currentYear}`);

    // Initialize leave balance
    console.log('\n1️⃣ Initializing leave balance...');
    const leaveBalance = await LeaveBalance.initializeBalances(testEmployeeId, currentYear);
    
    console.log('Initial balances:');
    leaveBalance.balances.forEach(balance => {
      console.log(`   ${balance.type}: ${balance.used}/${balance.total} (remaining: ${balance.total - balance.used})`);
    });

    // Test different leave type deductions
    const testCases = [
      { type: 'annual', days: 2, description: 'Annual Leave (2 days)' },
      { type: 'sick', days: 1, description: 'Sick Leave (1 day)' },
      { type: 'personal', days: 3, description: 'Personal Leave (3 days)' },
      { type: 'maternity', days: 5, description: 'Maternity Leave (5 days - should deduct from Personal)' },
      { type: 'other', days: 1, description: 'Other Leave (1 day - should deduct from Personal)' }
    ];

    console.log('\n2️⃣ Testing leave deductions...');
    
    for (const testCase of testCases) {
      console.log(`\n   Testing: ${testCase.description}`);
      
      // Deduct leave
      const success = leaveBalance.deductLeave(testCase.type, testCase.days);
      
      if (success) {
        console.log(`   ✅ Successfully deducted ${testCase.days} days`);
        await leaveBalance.save();
        
        // Show updated balances
        leaveBalance.balances.forEach(balance => {
          const remaining = balance.total - balance.used;
          console.log(`      ${balance.type}: ${balance.used}/${balance.total} (remaining: ${remaining})`);
        });
      } else {
        console.log(`   ❌ Failed to deduct leave for type: ${testCase.type}`);
      }
    }

    // Test leave type mapping
    console.log('\n3️⃣ Testing leave type mapping...');
    
    const mappingTests = [
      'annual', 'sick', 'personal', 'maternity', 'paternity', 
      'bereavement', 'other', 'Annual Leave', 'Sick Leave', 'Personal Leave'
    ];
    
    mappingTests.forEach(type => {
      const remaining = leaveBalance.getRemainingLeave(type);
      console.log(`   ${type} -> Remaining: ${remaining} days`);
    });

    // Final balance summary
    console.log('\n📊 Final Balance Summary:');
    leaveBalance.balances.forEach(balance => {
      const remaining = balance.total - balance.used;
      const usagePercent = ((balance.used / balance.total) * 100).toFixed(1);
      console.log(`   ${balance.type}: ${balance.used}/${balance.total} days used (${usagePercent}%, ${remaining} remaining)`);
    });

    // Test negative balance handling
    console.log('\n4️⃣ Testing negative balance handling...');
    const hasEnoughBalance = leaveBalance.hasEnoughBalance('annual', 100);
    console.log(`   Can take 100 days of annual leave? ${hasEnoughBalance ? 'Yes' : 'No'}`);

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await LeaveBalance.deleteOne({ employeeId: testEmployeeId, year: currentYear });
    console.log('   Test data cleaned up');

    console.log('\n✅ All leave deduction tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the test
if (require.main === module) {
  testLeaveDeduction()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = testLeaveDeduction; 