const Employee = require('../models/employeeModel');
const Attendance = require('../models/attendanceModel');
const Task = require('../models/Task');
const EmployeeWellbeing = require('../models/employeeWellbeingModel');
const Leave = require('../models/leaveModel');
const Reimbursement = require('../models/reimbursementModel');

/**
 * Get dashboard overview data
 */
exports.getDashboardData = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    // Try to find by employee's custom ID first
    let employee = await Employee.findOne({ id: employeeId });
    
    // If not found, try to find by MongoDB _id
    if (!employee) {
      try {
        employee = await Employee.findById(employeeId);
      } catch (err) {
        // Not a valid ObjectId, ignore this error
      }
    }
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Get performance score data (based on attendance and mood)
    const performanceData = await getPerformanceData(employee._id);
    
    // Get active tasks
    const tasks = await getActiveTasks(employee.id, employee._id);

    // Get leave and reimbursement data
    const leaveData = await getLeaveData(employee._id);
    const reimbursementData = await getReimbursementData(employee._id);

    return res.status(200).json({
      success: true,
      data: {
        performanceData,
        tasks,
        leaveData,
        reimbursementData
      }
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting dashboard data'
    });
  }
};

/**
 * Get performance score data based on attendance and mood
 */
const getPerformanceData = async (employeeId) => {
  try {
    // Get last 5 days of attendance
    const today = new Date();
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(today.getDate() - 5);
    
    const attendance = await Attendance.find({
      employeeId,
      date: { $gte: fiveDaysAgo, $lte: today }
    }).sort({ date: 1 });
    
    // Get wellbeing data (mood history)
    const wellbeing = await EmployeeWellbeing.findOne({ employeeId });
    
    // Calculate performance score based on attendance and mood
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const performanceScores = [];
    
    // Default performance data if not enough data is available
    if (!attendance.length && (!wellbeing || !wellbeing.moodHistory.length)) {
      return {
        labels: dayLabels,
        datasets: [{
          label: 'Performance',
          data: [85, 88, 90, 87, 92],
          borderColor: '#3b82f6',
          tension: 0.4,
          fill: true,
          backgroundColor: 'rgba(59, 130, 246, 0.1)'
        }]
      };
    }
    
    // Calculate performance scores for each day
    for (let i = 0; i < 5; i++) {
      const date = new Date(fiveDaysAgo);
      date.setDate(date.getDate() + i);
      
      const dayAttendance = attendance.find(a => 
        new Date(a.date).toDateString() === date.toDateString()
      );
      
      // Get mood entries for this day
      const dayMoods = wellbeing ? wellbeing.moodHistory.filter(m => 
        new Date(m.timestamp).toDateString() === date.toDateString()
      ) : [];
      
      // Base score starts at 85
      let score = 85;
      
      // Attendance score component (max +10)
      if (dayAttendance) {
        // Check-in on time or early: +5
        const onTime = dayAttendance.status !== 'late';
        if (onTime) score += 5;
        
        // Full day worked: +5
        if (dayAttendance.workHours >= 7.5) score += 5;
      }
      
      // Mood score component (max +5)
      if (dayMoods.length > 0) {
        // Get latest mood for the day
        const latestMood = dayMoods.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        )[0];
        
        switch (latestMood.mood) {
          case 'great': score += 5; break;
          case 'good': score += 3; break;
          case 'okay': score += 0; break;
          case 'bad': score -= 3; break;
        }
      }
      
      // Ensure score is within 0-100 range
      score = Math.max(0, Math.min(100, score));
      performanceScores.push(score);
    }
    
    return {
      labels: dayLabels,
      datasets: [{
        label: 'Performance',
        data: performanceScores,
        borderColor: '#3b82f6',
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.1)'
      }]
    };
  } catch (error) {
    console.error('Error calculating performance data:', error);
    // Return default data in case of error
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      datasets: [{
        label: 'Performance',
        data: [85, 88, 90, 87, 92],
        borderColor: '#3b82f6',
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.1)'
      }]
    };
  }
};

/**
 * Get active tasks for the employee
 */
const getActiveTasks = async (employeeId, objectId) => {
  try {
    const today = new Date();
    
    // Get tasks that are due today or in the future and not completed
    // Try using the custom employee ID first (for Task schema)
    const tasks = await Task.find({
      'assignee.id': employeeId,
      status: { $ne: 'completed' },
      dueDate: { $gte: today }
    }).sort({ dueDate: 1 }).limit(5);
    
    return tasks.map(task => {
      // Calculate progress based on subtasks
      let progress = 0;
      if (task.subtasks && task.subtasks.length > 0) {
        const completedSubtasks = task.subtasks.filter(subtask => subtask.completed).length;
        progress = Math.round((completedSubtasks / task.subtasks.length) * 100);
      } else {
        progress = task.progress;
      }
      
      // Calculate time left until due date
      const dueDate = new Date(task.dueDate);
      const timeLeft = {
        days: Math.floor((dueDate - today) / (1000 * 60 * 60 * 24)),
        hours: Math.floor(((dueDate - today) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      };
      
      let timeLeftText = '';
      if (timeLeft.days > 0) {
        timeLeftText = `${timeLeft.days} day${timeLeft.days !== 1 ? 's' : ''} left`;
      } else if (timeLeft.hours > 0) {
        timeLeftText = `${timeLeft.hours} hour${timeLeft.hours !== 1 ? 's' : ''} left`;
      } else {
        timeLeftText = 'Due now';
      }
      
      return {
        id: task._id,
        title: task.title,
        dueDate: task.dueDate,
        progress,
        subtasksCompleted: task.subtasks ? 
          `${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length}` : 
          '0/0',
        timeLeft: timeLeftText,
        priority: task.priority
      };
    });
  } catch (error) {
    console.error('Error getting active tasks:', error);
    return [];
  }
};

/**
 * Get leave data for the employee
 */
const getLeaveData = async (employeeId) => {
  try {
    // Get employee with leave balances
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return {
        balances: {
          annualLeave: { total: 20, used: 0 },
          sickLeave: { total: 10, used: 0 },
          personalLeave: { total: 5, used: 0 }
        },
        recentRequests: []
      };
    }
    
    // Get recent leave requests
    const recentLeaves = await Leave.find({ employeeId })
      .sort({ createdAt: -1 })
      .limit(2);
    
    return {
      balances: employee.leaveBalances || {
        annualLeave: { total: 20, used: 0 },
        sickLeave: { total: 10, used: 0 },
        personalLeave: { total: 5, used: 0 }
      },
      recentRequests: recentLeaves.map(leave => ({
        id: leave._id,
        type: leave.type,
        startDate: leave.startDate,
        endDate: leave.endDate,
        days: leave.days,
        status: leave.status
      }))
    };
  } catch (error) {
    console.error('Error getting leave data:', error);
    return {
      balances: {
        annualLeave: { total: 20, used: 0 },
        sickLeave: { total: 10, used: 0 },
        personalLeave: { total: 5, used: 0 }
      },
      recentRequests: []
    };
  }
};

/**
 * Get reimbursement data for the employee
 */
const getReimbursementData = async (employeeId) => {
  try {
    // Get recent reimbursement requests
    const recentReimbursements = await Reimbursement.find({ employeeId })
      .sort({ createdAt: -1 })
      .limit(2);
    
    // Calculate totals
    const allReimbursements = await Reimbursement.find({ 
      employeeId,
      createdAt: { 
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    });
    
    let totalPending = 0;
    let pendingCount = 0;
    let totalApproved = 0;
    let approvedCount = 0;
    
    allReimbursements.forEach(r => {
      if (r.status === 'pending') {
        totalPending += r.amount;
        pendingCount++;
      } else if (r.status === 'approved') {
        totalApproved += r.amount;
        approvedCount++;
      }
    });
    
    return {
      recentRequests: recentReimbursements.map(r => ({
        id: r._id,
        type: r.type,
        description: r.description,
        amount: r.amount,
        status: r.status
      })),
      summary: {
        pending: {
          amount: totalPending,
          count: pendingCount
        },
        approved: {
          amount: totalApproved,
          count: approvedCount
        }
      }
    };
  } catch (error) {
    console.error('Error getting reimbursement data:', error);
    return {
      recentRequests: [],
      summary: {
        pending: { amount: 0, count: 0 },
        approved: { amount: 0, count: 0 }
      }
    };
  }
};

/**
 * Get task statistics for the employee
 */
exports.getTaskStatistics = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }
    
    // Try to find employee by ID or MongoDB _id to get the employee.id
    let employee;
    try {
      employee = await Employee.findOne({ id: employeeId });
      if (!employee) {
        employee = await Employee.findById(employeeId);
      }
    } catch (err) {
      // Ignore ObjectId errors
    }
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    
    // Get all tasks for the employee using employee.id
    const allTasks = await Task.find({ 'assignee.id': employee.id });
    
    // Calculate statistics
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const tasksThisWeek = allTasks.filter(t => 
      new Date(t.createdAt) >= startOfWeek
    ).length;
    
    const dueTodayTasks = allTasks.filter(t => 
      t.status !== 'completed' && 
      new Date(t.dueDate).toDateString() === today.toDateString()
    ).length;
    
    const inProgressTasks = allTasks.filter(t => 
      t.status === 'inProgress'
    ).length;
    
    return res.status(200).json({
      success: true,
      data: {
        completionRate,
        tasksThisWeek,
        dueToday: dueTodayTasks,
        inProgress: inProgressTasks
      }
    });
  } catch (error) {
    console.error('Error getting task statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting task statistics'
    });
  }
};