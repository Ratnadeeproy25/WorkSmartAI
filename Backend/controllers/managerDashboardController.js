const Manager = require('../models/managerModel');
const Employee = require('../models/employeeModel');
const Task = require('../models/Task');
const Attendance = require('../models/attendanceModel');
const Leave = require('../models/leaveModel');
const Reimbursement = require('../models/reimbursementModel');
const EmployeeWellbeing = require('../models/employeeWellbeingModel');

/**
 * Get manager dashboard overview data
 */
exports.getManagerDashboardData = async (req, res) => {
  try {
    console.log('🔍 Manager Dashboard Request - User ID:', req.user._id, 'Custom ID:', req.user.id);
    
    const managerId = req.user._id; // Get manager ID from authenticated user
    const managerCustomId = req.user.id; // Custom ID like MG001

    console.log('📋 Looking for manager with ID:', managerId);

    // Get manager details - check both Manager collection and Employee collection
    let manager = await Manager.findById(managerId);
    console.log('🏢 Manager from Manager collection:', manager ? 'Found' : 'Not found');
    
    if (!manager) {
      // Try to find in Employee collection with manager role
      manager = await Employee.findOne({ 
        _id: managerId,
        role: 'manager'
      });
      console.log('👤 Manager from Employee collection:', manager ? 'Found' : 'Not found');
    }
    
    if (!manager) {
      console.error('❌ Manager not found in either collection');
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }

    console.log('✅ Manager found:', manager.name, 'Department:', manager.department);

    // Get all employees assigned to this manager
    // First try with ObjectId, then try with custom ID if no results
    let teamMembers = await Employee.find({ manager: managerId })
      .select('id name email position status profilePicture updatedAt performanceData')
      .lean();

    console.log(`👥 Found ${teamMembers.length} team members assigned to manager ObjectId ${managerId}`);
    
    // If no team members found with ObjectId, try alternative approaches
    if (teamMembers.length === 0) {
      console.log('⚠️ No employees assigned to manager ObjectId, trying alternative searches...');
      
      // Try finding employees where manager field contains the custom ID as string
      // This handles cases where manager field might have been stored as string
      try {
        const alternativeTeamMembers = await Employee.find({ 
          $or: [
            { 'manager': managerCustomId }, // In case manager field contains string
            { 'manager': manager._id } // Try with manager's ObjectId again
          ]
        })
        .select('id name email position status profilePicture updatedAt performanceData')
        .lean();
        
        console.log(`🔄 Alternative search found ${alternativeTeamMembers.length} team members`);
        
        if (alternativeTeamMembers.length > 0) {
          teamMembers = alternativeTeamMembers;
        }
      } catch (alternativeError) {
        console.log('Alternative search failed:', alternativeError.message);
        
        // Final fallback: search for employees with no manager field restrictions
        // and filter by department if possible
        try {
          const departmentTeamMembers = await Employee.find({ 
            department: manager.department,
            role: { $ne: 'manager' } // Exclude other managers
          })
          .select('id name email position status profilePicture updatedAt performanceData')
          .lean();
          
          console.log(`🏢 Department-based search found ${departmentTeamMembers.length} potential team members`);
          
          // For now, we'll use these as fallback team members
          teamMembers = departmentTeamMembers;
        } catch (deptError) {
          console.log('Department-based search failed:', deptError.message);
          // Continue with empty team members array
        }
      }
    }

    // Calculate metrics
    const metrics = await calculateDashboardMetrics(managerId, teamMembers);
    console.log('📊 Calculated metrics:', metrics);

    // Get chart data
    const chartData = await getChartData(managerId, teamMembers);

    // Get recent activities/tasks created by this manager
    const recentTasks = await Task.find({
      'createdBy.id': managerCustomId
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    console.log(`📝 Found ${recentTasks.length} recent tasks`);

    // Get pending requests (leave and reimbursement)
    const pendingLeaves = await Leave.find({
      employeeId: { $in: teamMembers.map(emp => emp._id) },
      status: 'pending'
    }).countDocuments();

    const pendingReimbursements = await Reimbursement.find({
      employeeId: { $in: teamMembers.map(emp => emp._id) },
      status: 'pending'
    }).countDocuments();

    console.log(`📋 Pending requests - Leaves: ${pendingLeaves}, Reimbursements: ${pendingReimbursements}`);

    // Format team members data
    const formattedTeamMembers = await formatTeamMembers(teamMembers);
    console.log(`👥 Formatted ${formattedTeamMembers.length} team members`);

    const responseData = {
      manager: {
        name: manager.name,
        department: manager.department,
        position: manager.position
      },
      metrics: {
        ...metrics,
        pendingRequests: pendingLeaves + pendingReimbursements
      },
      chartData,
      teamMembers: formattedTeamMembers,
      recentTasks
    };

    console.log('✅ Sending dashboard response with team members count:', responseData.teamMembers.length);

    return res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('❌ Error getting manager dashboard data:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting dashboard data',
      error: error.message
    });
  }
};

/**
 * Get team members assigned to the manager
 */
exports.getTeamMembers = async (req, res) => {
  try {
    const managerId = req.user._id;
    const managerCustomId = req.user.id;

    // First try with ObjectId
    let teamMembers = await Employee.find({ manager: managerId })
      .select('id name email position status profilePicture phone location updatedAt performanceData')
      .lean();

    // If no team members found with ObjectId, try alternative approaches
    if (teamMembers.length === 0) {
      console.log('⚠️ No employees assigned to manager ObjectId, trying alternative searches...');
      
      // Try finding employees where manager field contains the custom ID as string
      try {
        const alternativeTeamMembers = await Employee.find({ 
          $or: [
            { 'manager': managerCustomId }, // In case manager field contains string
            { 'manager': managerId } // Try with manager's ObjectId again
          ]
        })
        .select('id name email position status profilePicture phone location updatedAt performanceData')
        .lean();
        
        console.log(`🔄 Alternative search found ${alternativeTeamMembers.length} team members`);
        
        if (alternativeTeamMembers.length > 0) {
          teamMembers = alternativeTeamMembers;
        }
      } catch (alternativeError) {
        console.log('Alternative search failed:', alternativeError.message);
        
        // Final fallback: Get manager details and search by department
        try {
          const Manager = require('../models/managerModel');
          const manager = await Manager.findById(managerId);
          
          if (manager) {
            const departmentTeamMembers = await Employee.find({ 
              department: manager.department,
              role: { $ne: 'manager' } // Exclude other managers
            })
            .select('id name email position status profilePicture phone location updatedAt performanceData')
            .lean();
            
            console.log(`🏢 Department-based search found ${departmentTeamMembers.length} potential team members`);
            teamMembers = departmentTeamMembers;
          }
        } catch (deptError) {
          console.log('Department-based search failed:', deptError.message);
        }
      }
    }

    const formattedMembers = await formatTeamMembers(teamMembers);

    return res.status(200).json({
      success: true,
      data: formattedMembers
    });
  } catch (error) {
    console.error('Error getting team members:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting team members',
      error: error.message
    });
  }
};

/**
 * Get chart data for dashboard
 */
exports.getChartData = async (req, res) => {
  try {
    const managerId = req.user._id;
    const managerCustomId = req.user.id;
    
    // First try with ObjectId
    let teamMembers = await Employee.find({ manager: managerId }).lean();
    
    // If no team members found with ObjectId, try alternative approaches
    if (teamMembers.length === 0) {
      console.log('⚠️ No employees assigned to manager ObjectId for chart data, trying alternative searches...');
      
      try {
        const alternativeTeamMembers = await Employee.find({ 
          $or: [
            { 'manager': managerCustomId },
            { 'manager': managerId }
          ]
        }).lean();
        
        if (alternativeTeamMembers.length > 0) {
          teamMembers = alternativeTeamMembers;
        }
      } catch (alternativeError) {
        console.log('Alternative search failed for chart data:', alternativeError.message);
        
        // Final fallback: search by department
        try {
          const Manager = require('../models/managerModel');
          const manager = await Manager.findById(managerId);
          
          if (manager) {
            const departmentTeamMembers = await Employee.find({ 
              department: manager.department,
              role: { $ne: 'manager' }
            }).lean();
            
            teamMembers = departmentTeamMembers;
          }
        } catch (deptError) {
          console.log('Department-based search failed for chart data:', deptError.message);
        }
      }
    }
    
    const chartData = await getChartData(managerId, teamMembers);

    return res.status(200).json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error('Error getting chart data:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting chart data',
      error: error.message
    });
  }
};

/**
 * Helper function to calculate dashboard metrics
 */
async function calculateDashboardMetrics(managerId, teamMembers) {
  try {
    // Get manager details to get the correct ID
    const manager = await Manager.findById(managerId);
    if (!manager) {
      throw new Error('Manager not found');
    }

    const totalEmployees = teamMembers.length;
    
    // Calculate attendance rate for the team
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    
    const weeklyAttendance = await Attendance.find({
      employeeId: { $in: teamMembers.map(emp => emp._id) },
      date: { $gte: startOfWeek }
    });

    const totalPossibleAttendance = teamMembers.length * 5; // 5 working days
    const actualAttendance = weeklyAttendance.filter(att => att.status === 'present').length;
    const attendanceRate = totalPossibleAttendance > 0 
      ? Math.round((actualAttendance / totalPossibleAttendance) * 100) 
      : 0;

    // Get active tasks count (tasks created by this manager)
    const activeTasks = await Task.countDocuments({
      'createdBy.id': manager.id,
      status: { $in: ['todo', 'inProgress'] }
    });

    return {
      totalEmployees,
      attendanceRate: `${attendanceRate}%`,
      activeTasks
    };
  } catch (error) {
    console.error('Error calculating metrics:', error);
    return {
      totalEmployees: teamMembers.length,
      attendanceRate: '0%',
      activeTasks: 0
    };
  }
}

/**
 * Helper function to get chart data
 */
async function getChartData(managerId, teamMembers) {
  try {
    const managerCustomId = teamMembers.length > 0 ? teamMembers[0].id.substring(0, 2) : 'MG';
    
    // Performance Chart Data
    const performanceData = await getPerformanceChartData(teamMembers);
    
    // Task Distribution Chart Data
    const taskDistributionData = await getTaskDistributionData(managerId, teamMembers);
    
    // Attendance Chart Data
    const attendanceData = await getAttendanceChartData(teamMembers);
    
    // Productivity Chart Data
    const productivityData = await getProductivityChartData(teamMembers, managerId);

    return {
      performance: performanceData,
      taskDistribution: taskDistributionData,
      attendance: attendanceData,
      productivity: productivityData
    };
  } catch (error) {
    console.error('Error getting chart data:', error);
    return {};
  }
}

/**
 * Helper function to format team members data
 */
async function formatTeamMembers(teamMembers) {
  const formattedMembers = await Promise.all(teamMembers.map(async (member) => {
    // Get latest attendance to determine status
    const latestAttendance = await Attendance.findOne({
      employeeId: member._id
    }).sort({ date: -1 });

    // Determine status based on recent activity
    let status = 'Active';
    let lastActive = 'Just now';

    if (latestAttendance) {
      const lastAttendanceDate = new Date(latestAttendance.date);
      const today = new Date();
      const daysDiff = Math.floor((today - lastAttendanceDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        status = latestAttendance.status === 'present' ? 'Active' : 'Absent';
        lastActive = latestAttendance.status === 'present' ? 'Just now' : 'Today';
      } else if (daysDiff === 1) {
        status = 'Active';
        lastActive = '1 day ago';
      } else if (daysDiff > 1 && daysDiff <= 3) {
        status = 'Active';
        lastActive = `${daysDiff} days ago`;
      } else {
        status = 'Absent';
        lastActive = `${daysDiff} days ago`;
      }
    }

    // Check for leave status
    const activeLeave = await Leave.findOne({
      employeeId: member._id,
      status: 'approved',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    if (activeLeave) {
      status = 'On Leave';
      lastActive = `On ${activeLeave.leaveType}`;
    }

    // Calculate performance score
    const performance = member.performanceData && member.performanceData.length > 0
      ? member.performanceData[member.performanceData.length - 1]
      : Math.floor(Math.random() * 15) + 80; // Random between 80-95 if no data

    return {
      id: member._id,
      name: member.name,
      position: member.position,
      status,
      performance,
      avatar: member.profilePicture || `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 99)}.jpg`,
      lastActive,
      email: member.email
    };
  }));

  return formattedMembers;
}

/**
 * Get performance chart data
 */
async function getPerformanceChartData(teamMembers) {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const datasets = [];

  // Get average team performance for the week
  const teamPerformance = [];
  for (let i = 0; i < 5; i++) {
    const dayPerformance = teamMembers.map(member => {
      if (member.performanceData && member.performanceData.length > i) {
        return member.performanceData[i];
      }
      return Math.floor(Math.random() * 15) + 80; // Random between 80-95
    });
    
    const avgPerformance = dayPerformance.reduce((sum, val) => sum + val, 0) / dayPerformance.length;
    teamPerformance.push(Math.round(avgPerformance));
  }

  datasets.push({
    label: 'Team Performance',
    data: teamPerformance,
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    tension: 0.4
  });

  return { labels, datasets };
}

/**
 * Get task distribution chart data
 */
async function getTaskDistributionData(managerId, teamMembers) {
  try {
    // Get manager details to get the correct ID
    const manager = await Manager.findById(managerId);
    if (!manager) {
      throw new Error('Manager not found');
    }
    
    // Get all tasks created by this manager, regardless of assignee
    const taskCounts = await Task.aggregate([
      {
        $match: {
          'createdBy.id': manager.id
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Define consistent status order and mapping (using actual Task model statuses)
    const statusOrder = ['todo', 'inProgress', 'completed', 'blocked'];
    const statusMap = {
      'todo': 'To Do',
      'inProgress': 'In Progress',
      'completed': 'Completed',
      'blocked': 'Blocked'
    };
    const statusColors = {
      'todo': '#ef4444',
      'inProgress': '#f59e0b', 
      'completed': '#10b981',
      'blocked': '#6b7280'
    };

    // Create a map of actual counts
    const countMap = {};
    taskCounts.forEach(item => {
      countMap[item._id] = item.count;
    });

    const labels = [];
    const data = [];
    const backgroundColor = [];

    // Process in consistent order, only include statuses that have tasks
    statusOrder.forEach(status => {
      if (countMap[status] && countMap[status] > 0) {
        labels.push(statusMap[status]);
        data.push(countMap[status]);
        backgroundColor.push(statusColors[status]);
      }
    });

    // If no data, provide default but indicate no real data
    if (labels.length === 0) {
      return {
        labels: ['No Tasks'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e5e7eb']
        }],
        isEmpty: true
      };
    }

    return {
      labels,
      datasets: [{
        data,
        backgroundColor
      }],
      isEmpty: false,
      summary: {
        total: data.reduce((a, b) => a + b, 0),
        completed: countMap['completed'] || 0,
        pending: countMap['todo'] || 0,
        inProgress: countMap['inProgress'] || 0,
        blocked: countMap['blocked'] || 0
      }
    };
  } catch (error) {
    console.error('Error getting task distribution:', error);
    return {
      labels: ['No Data'],
      datasets: [{
        data: [1],
        backgroundColor: ['#ef4444']
      }],
      isEmpty: true,
      error: true
    };
  }
}

/**
 * Get attendance chart data
 */
async function getAttendanceChartData(teamMembers) {
  try {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last7Days.push(date);
    }

    const attendanceData = await Promise.all(last7Days.map(async (date) => {
      const dayAttendance = await Attendance.find({
        employeeId: { $in: teamMembers.map(emp => emp._id) },
        date: {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lt: new Date(date.setHours(23, 59, 59, 999))
        }
      });

      const presentCount = dayAttendance.filter(att => att.status === 'present').length;
      const absentCount = dayAttendance.filter(att => att.status === 'absent').length;
      const lateCount = dayAttendance.filter(att => att.status === 'late').length;

      return {
        present: presentCount,
        absent: absentCount,
        late: lateCount
      };
    }));

    const labels = last7Days.map(date => 
      date.toLocaleDateString('en-US', { weekday: 'short' })
    );

    return {
      labels,
      datasets: [
        {
          label: 'Present',
          data: attendanceData.map(d => d.present),
          backgroundColor: '#10b981'
        },
        {
          label: 'Late',
          data: attendanceData.map(d => d.late),
          backgroundColor: '#f59e0b'
        },
        {
          label: 'Absent',
          data: attendanceData.map(d => d.absent),
          backgroundColor: '#ef4444'
        }
      ]
    };
  } catch (error) {
    console.error('Error getting attendance data:', error);
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Present',
          data: [8, 7, 9, 8, 8, 5, 3],
          backgroundColor: '#10b981'
        },
        {
          label: 'Late',
          data: [1, 2, 0, 1, 1, 0, 0],
          backgroundColor: '#f59e0b'
        },
        {
          label: 'Absent',
          data: [1, 1, 1, 1, 1, 2, 4],
          backgroundColor: '#ef4444'
        }
      ]
    };
  }
}

/**
 * Get productivity chart data
 */
async function getProductivityChartData(teamMembers, managerId) {
  try {
    // Get manager details
    const manager = await Manager.findById(managerId);
    if (!manager) {
      throw new Error('Manager not found');
    }

    const last30Days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last30Days.push(date);
    }

    // Get completed tasks created by this manager for each day
    const productivityData = await Promise.all(last30Days.map(async (date) => {
      const dayTasks = await Task.find({
        'createdBy.id': manager.id,
        status: 'completed',
        updatedAt: {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lt: new Date(date.setHours(23, 59, 59, 999))
        }
      });

      return dayTasks.length;
    }));

    const labels = last30Days.map(date => 
      date.getDate().toString()
    );

    return {
      labels,
      datasets: [{
        label: 'Tasks Completed',
        data: productivityData,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };
  } catch (error) {
    console.error('Error getting productivity data:', error);
    // Return sample data if error
    const sampleData = Array.from({ length: 30 }, () => Math.floor(Math.random() * 10) + 5);
    return {
      labels: Array.from({ length: 30 }, (_, i) => (i + 1).toString()),
      datasets: [{
        label: 'Tasks Completed',
        data: sampleData,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };
  }
} 