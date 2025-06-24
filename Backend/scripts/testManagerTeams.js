const mongoose = require('mongoose');
const Employee = require('../models/employeeModel');
const Manager = require('../models/managerModel');

/**
 * Test script to verify manager team member retrieval
 */

async function testManagerTeams() {
  try {
    console.log('🔧 Testing manager team member retrieval...');

    // Connect to database
    await mongoose.connect('mongodb://127.0.0.1:27017/worksmartAI', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Get all managers
    const managers = await Manager.find({});
    console.log(`📋 Found ${managers.length} managers`);

    for (const manager of managers) {
      console.log(`\n🔍 Testing manager: ${manager.name} (${manager.id})`);
      console.log(`   ObjectId: ${manager._id}`);
      console.log(`   Department: ${manager.department}`);

      // Test 1: Direct ObjectId search
      const directTeamMembers = await Employee.find({ manager: manager._id })
        .select('_id id name email position department manager')
        .lean();
      
      console.log(`   📊 Direct ObjectId search: ${directTeamMembers.length} team members`);

      // Test 2: Alternative search with custom ID
      const altTeamMembers = await Employee.find({ 
        $or: [
          { 'manager': manager.id }, // Custom ID string
          { 'manager': manager._id } // ObjectId
        ]
      })
      .select('_id id name email position department manager')
      .lean();
      
      console.log(`   🔄 Alternative search: ${altTeamMembers.length} team members`);

      // Test 3: Department-based fallback
      const deptTeamMembers = await Employee.find({ 
        department: manager.department,
        role: { $ne: 'manager' }
      })
      .select('_id id name email position department manager')
      .lean();
      
      console.log(`   🏢 Department-based search: ${deptTeamMembers.length} potential team members`);

      // Show team member details
      const finalTeamMembers = directTeamMembers.length > 0 ? directTeamMembers : 
                               altTeamMembers.length > 0 ? altTeamMembers : 
                               deptTeamMembers;

      if (finalTeamMembers.length > 0) {
        console.log(`   👥 Final team members for ${manager.name}:`);
        finalTeamMembers.forEach(member => {
          console.log(`     - ${member.name} (${member.id}) - Manager field: ${member.manager} (Type: ${typeof member.manager})`);
        });
      } else {
        console.log(`   ⚠️  No team members found for ${manager.name}`);
      }
    }

    console.log('\n📊 Testing complete!');

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  testManagerTeams();
}

module.exports = testManagerTeams; 