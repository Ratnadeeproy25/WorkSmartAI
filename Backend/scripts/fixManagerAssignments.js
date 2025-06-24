const mongoose = require('mongoose');
const Employee = require('../models/employeeModel');
const Manager = require('../models/managerModel');

/**
 * Script to fix manager assignments in the database
 * This script will:
 * 1. Find employees with string manager IDs
 * 2. Convert them to proper ObjectIds
 * 3. Fix any data inconsistencies
 */

async function fixManagerAssignments() {
  try {
    console.log('🔧 Starting manager assignment fix...');

    // Connect to database
    await mongoose.connect('mongodb://127.0.0.1:27017/worksmartAI', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Get all managers to create a mapping
    const managers = await Manager.find({});
    console.log(`📋 Found ${managers.length} managers`);

    const managerMap = {};
    managers.forEach(manager => {
      managerMap[manager.id] = manager._id; // Map custom ID to ObjectId
      console.log(`Manager: ${manager.name} (${manager.id} → ${manager._id})`);
    });

    // Get all employees
    const employees = await Employee.find({});
    console.log(`👥 Found ${employees.length} employees`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const employee of employees) {
      console.log(`\n🔍 Checking employee: ${employee.name} (ID: ${employee.id})`);
      console.log(`   Current manager field: ${employee.manager} (Type: ${typeof employee.manager})`);

      // Check if manager field exists and what type it is
      if (employee.manager) {
        // If manager field is a string, try to convert it
        if (typeof employee.manager === 'string') {
          console.log(`   ⚠️  Manager field is string: "${employee.manager}"`);
          
          // Try to find the corresponding ObjectId
          if (managerMap[employee.manager]) {
            console.log(`   🔄 Converting "${employee.manager}" to ObjectId: ${managerMap[employee.manager]}`);
            
            try {
              await Employee.findByIdAndUpdate(employee._id, {
                manager: managerMap[employee.manager]
              });
              console.log(`   ✅ Fixed manager assignment for ${employee.name}`);
              fixedCount++;
            } catch (updateError) {
              console.log(`   ❌ Failed to update ${employee.name}: ${updateError.message}`);
            }
          } else {
            console.log(`   ⚠️  No manager found for custom ID: "${employee.manager}"`);
            // Set manager to null if invalid reference
            try {
              await Employee.findByIdAndUpdate(employee._id, {
                manager: null
              });
              console.log(`   🧹 Cleared invalid manager reference for ${employee.name}`);
              fixedCount++;
            } catch (updateError) {
              console.log(`   ❌ Failed to clear manager for ${employee.name}: ${updateError.message}`);
            }
          }
        } else if (mongoose.Types.ObjectId.isValid(employee.manager)) {
          console.log(`   ✅ Manager field is already a valid ObjectId`);
          skippedCount++;
        } else {
          console.log(`   ⚠️  Manager field is invalid format: ${employee.manager}`);
          // Clear invalid manager field
          try {
            await Employee.findByIdAndUpdate(employee._id, {
              manager: null
            });
            console.log(`   🧹 Cleared invalid manager field for ${employee.name}`);
            fixedCount++;
          } catch (updateError) {
            console.log(`   ❌ Failed to clear invalid manager for ${employee.name}: ${updateError.message}`);
          }
        }
      } else {
        console.log(`   ℹ️  No manager assigned`);
        skippedCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Fixed: ${fixedCount} employees`);
    console.log(`   ⏭️  Skipped: ${skippedCount} employees`);
    console.log(`   📝 Total: ${employees.length} employees processed`);

    // Verify the fixes
    console.log(`\n🔍 Verifying fixes...`);
    const employeesAfterFix = await Employee.find({ manager: { $exists: true, $ne: null } });
    console.log(`👥 Employees with manager assignments: ${employeesAfterFix.length}`);

    for (const emp of employeesAfterFix.slice(0, 5)) { // Show first 5 as sample
      console.log(`   ${emp.name}: manager = ${emp.manager} (Type: ${typeof emp.manager})`);
    }

    console.log('\n✅ Manager assignment fix completed!');

  } catch (error) {
    console.error('❌ Error during manager assignment fix:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  fixManagerAssignments();
}

module.exports = fixManagerAssignments; 