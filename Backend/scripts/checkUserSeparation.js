require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('../models/employeeModel');
const Manager = require('../models/managerModel');

// Standalone script to check user separation
async function checkUserSeparation() {
  try {
    console.log('🔍 Checking User Separation...\n');

    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/employee-management';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database\n');

    // Test 1: Check employees endpoint (should only return role='employee' or no role)
    console.log('📋 Test 1: Employee Collection Analysis');
    const allEmployeesInDB = await Employee.find({});
    console.log(`Total employees in database: ${allEmployeesInDB.length}`);
    
    const employeesWithManagerRole = await Employee.find({ role: 'manager' });
    console.log(`Employees with manager role: ${employeesWithManagerRole.length}`);
    
    const actualEmployees = await Employee.find({
      $or: [
        { role: 'employee' },
        { role: { $exists: false } }
      ]
    });
    console.log(`Actual employees (role='employee' or no role): ${actualEmployees.length}`);
    
    if (employeesWithManagerRole.length > 0) {
      console.log('⚠️  Found employees with manager role:');
      employeesWithManagerRole.forEach(emp => {
        console.log(`   - ${emp.name} (${emp.id}) - ${emp.email} - Role: ${emp.role}`);
      });
    }
    console.log('');

    // Test 2: Check managers collection
    console.log('👔 Test 2: Manager Collection Analysis');
    const allManagers = await Manager.find({});
    console.log(`Total managers in Manager collection: ${allManagers.length}`);
    
    if (allManagers.length > 0) {
      console.log('Managers in dedicated collection:');
      allManagers.forEach(mgr => {
        console.log(`   - ${mgr.name} (${mgr.id}) - ${mgr.email}`);
      });
    }
    console.log('');

    // Test 3: Check for ID conflicts
    console.log('🔍 Test 3: ID Conflict Analysis');
    const employeeIds = actualEmployees.map(emp => emp.id);
    const managerIds = allManagers.map(mgr => mgr.id);
    const conflicts = employeeIds.filter(id => managerIds.includes(id));
    
    if (conflicts.length > 0) {
      console.log('❌ ID conflicts found:');
      conflicts.forEach(id => console.log(`   - ${id}`));
    } else {
      console.log('✅ No ID conflicts between employees and managers');
    }
    console.log('');

    // Test 4: Check email conflicts
    console.log('📧 Test 4: Email Conflict Analysis');
    const employeeEmails = actualEmployees.map(emp => emp.email);
    const managerEmails = allManagers.map(mgr => mgr.email);
    const emailConflicts = employeeEmails.filter(email => managerEmails.includes(email));
    
    if (emailConflicts.length > 0) {
      console.log('❌ Email conflicts found:');
      emailConflicts.forEach(email => console.log(`   - ${email}`));
    } else {
      console.log('✅ No email conflicts between employees and managers');
    }
    console.log('');

    // Summary
    console.log('📊 Summary:');
    console.log(`- Employees (excluding managers): ${actualEmployees.length}`);
    console.log(`- Employee-Managers: ${employeesWithManagerRole.length}`);
    console.log(`- Dedicated Managers: ${allManagers.length}`);
    console.log(`- Total Users: ${actualEmployees.length + employeesWithManagerRole.length + allManagers.length}`);
    
    if (employeesWithManagerRole.length > 0) {
      console.log('\n⚠️  ISSUE DETECTED: There are employees with manager role that might appear in employee management!');
      console.log('   These should be handled separately or moved to the Manager collection.');
      console.log('\n🔧 RECOMMENDATION: Run the migration script to move employee-managers to dedicated Manager collection.');
    } else {
      console.log('\n✅ SEPARATION LOOKS GOOD: No employees with manager role found.');
    }

  } catch (error) {
    console.error('❌ Error during checking:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the check
checkUserSeparation().catch(console.error); 