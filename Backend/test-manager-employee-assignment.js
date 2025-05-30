const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/employeeModel');
const Manager = require('./models/managerModel');

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/worksmartAI');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
};

const debugManagerAssignments = async () => {
  try {
    console.log('\n🔍 DEBUG: Manager-Employee Assignments\n');
    
    // Check all managers
    console.log('📋 CHECKING MANAGERS:');
    const managersFromManagerCollection = await Manager.find({}).select('_id id name email department');
    const managersFromEmployeeCollection = await Employee.find({ role: 'manager' }).select('_id id name email department role');
    
    console.log(`\n👨‍💼 Managers in Manager collection: ${managersFromManagerCollection.length}`);
    managersFromManagerCollection.forEach(mgr => {
      console.log(`  - ${mgr.name} (${mgr.email}) - ID: ${mgr._id} - Custom ID: ${mgr.id}`);
    });
    
    console.log(`\n👤 Managers in Employee collection: ${managersFromEmployeeCollection.length}`);
    managersFromEmployeeCollection.forEach(mgr => {
      console.log(`  - ${mgr.name} (${mgr.email}) - ID: ${mgr._id} - Custom ID: ${mgr.id} - Role: ${mgr.role}`);
    });
    
    // Check all employees and their manager assignments
    console.log('\n👥 CHECKING EMPLOYEE ASSIGNMENTS:');
    const allEmployees = await Employee.find({ 
      $or: [
        { role: 'employee' },
        { role: { $exists: false } }
      ]
    }).select('_id id name email manager department');
    
    console.log(`\nTotal employees: ${allEmployees.length}`);
    
    const employeesWithManager = allEmployees.filter(emp => emp.manager);
    const employeesWithoutManager = allEmployees.filter(emp => !emp.manager);
    
    console.log(`📊 Employees with manager assigned: ${employeesWithManager.length}`);
    console.log(`📊 Employees without manager: ${employeesWithoutManager.length}`);
    
    if (employeesWithoutManager.length > 0) {
      console.log('\n⚠️ Employees without manager:');
      employeesWithoutManager.forEach(emp => {
        console.log(`  - ${emp.name} (${emp.email}) - ID: ${emp._id}`);
      });
    }
    
    // Group employees by manager
    console.log('\n👥 EMPLOYEES BY MANAGER:');
    const employeesByManager = {};
    employeesWithManager.forEach(emp => {
      const managerId = emp.manager.toString();
      if (!employeesByManager[managerId]) {
        employeesByManager[managerId] = [];
      }
      employeesByManager[managerId].push(emp);
    });
    
    for (const [managerId, employees] of Object.entries(employeesByManager)) {
      // Try to find manager name
      let managerName = 'Unknown';
      const managerFromManagerColl = managersFromManagerCollection.find(mgr => mgr._id.toString() === managerId);
      const managerFromEmployeeColl = managersFromEmployeeCollection.find(mgr => mgr._id.toString() === managerId);
      
      if (managerFromManagerColl) {
        managerName = `${managerFromManagerColl.name} (Manager Collection)`;
      } else if (managerFromEmployeeColl) {
        managerName = `${managerFromEmployeeColl.name} (Employee Collection)`;
      }
      
      console.log(`\n📋 Manager: ${managerName} (ID: ${managerId})`);
      console.log(`   Assigned employees: ${employees.length}`);
      employees.forEach(emp => {
        console.log(`     - ${emp.name} (${emp.email})`);
      });
    }
    
    // Check for orphaned assignments (employees assigned to non-existent managers)
    console.log('\n🔍 CHECKING FOR ORPHANED ASSIGNMENTS:');
    const allManagerIds = [
      ...managersFromManagerCollection.map(mgr => mgr._id.toString()),
      ...managersFromEmployeeCollection.map(mgr => mgr._id.toString())
    ];
    
    const orphanedEmployees = employeesWithManager.filter(emp => 
      !allManagerIds.includes(emp.manager.toString())
    );
    
    if (orphanedEmployees.length > 0) {
      console.log(`⚠️ Found ${orphanedEmployees.length} orphaned employee assignments:`);
      orphanedEmployees.forEach(emp => {
        console.log(`  - ${emp.name} assigned to non-existent manager ID: ${emp.manager}`);
      });
    } else {
      console.log('✅ No orphaned assignments found');
    }
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
};

const fixManagerAssignments = async () => {
  try {
    console.log('\n🔧 FIXING MANAGER ASSIGNMENTS:\n');
    
    // Create sample assignments if none exist
    const employeesWithoutManager = await Employee.find({ 
      $or: [
        { manager: { $exists: false } },
        { manager: null }
      ],
      $and: [
        { $or: [{ role: 'employee' }, { role: { $exists: false } }] }
      ]
    });
    
    const managers = await Manager.find({});
    const employeeManagers = await Employee.find({ role: 'manager' });
    
    const allManagers = [...managers, ...employeeManagers];
    
    if (allManagers.length === 0) {
      console.log('⚠️ No managers found to assign employees to');
      return;
    }
    
    if (employeesWithoutManager.length === 0) {
      console.log('✅ All employees already have managers assigned');
      return;
    }
    
    console.log(`📋 Assigning ${employeesWithoutManager.length} employees to ${allManagers.length} managers`);
    
    // Distribute employees among managers
    for (let i = 0; i < employeesWithoutManager.length; i++) {
      const employee = employeesWithoutManager[i];
      const manager = allManagers[i % allManagers.length];
      
      await Employee.findByIdAndUpdate(employee._id, { manager: manager._id });
      console.log(`✅ Assigned ${employee.name} to manager ${manager.name}`);
    }
    
    console.log('\n✅ Manager assignments completed!');
    
  } catch (error) {
    console.error('❌ Error fixing assignments:', error);
  }
};

const main = async () => {
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }
  
  const args = process.argv.slice(2);
  
  if (args.includes('--fix')) {
    await fixManagerAssignments();
  }
  
  await debugManagerAssignments();
  
  process.exit(0);
};

main().catch(console.error); 