const EmployeeWellbeing = require('../models/employeeWellbeingModel');
const Employee = require('../models/employeeModel');
const Task = require('../models/Task');
const Attendance = require('../models/attendanceModel');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// Helper function to get employee ID from req.user
const getEmployeeId = (user) => {
  // Handle different possible ID fields from different auth mechanisms
  if (user.id) {
    return user.id;
  } else if (user._id) {
    return user._id.toString();
  } else if (user._doc && user._doc._id) {
    return user._doc._id.toString();
  } else {
    // Last resort, return the stringified user id if it's an object
    return user._id ? user._id.toString() : 'unknown-id';
  }
};

// @desc    Get employee wellbeing data
// @route   GET /api/wellbeing
// @access  Private (Employee)
const getWellbeingData = asyncHandler(async (req, res) => {
  const employeeId = getEmployeeId(req.user);

  let wellbeingData = await EmployeeWellbeing.findOne({ employeeId });

  // If no wellbeing data exists for this employee, create it
  if (!wellbeingData) {
    wellbeingData = await EmployeeWellbeing.create({ employeeId });
  }

  try {
    // Fetch tasks to update stress level based on due dates and priority
    let tasks = [];
    
    // Try by id field
    tasks = await Task.find({ 'assignee.id': employeeId });
    
    // If no tasks found, try by MongoDB _id field if it's a valid ObjectId
    if (tasks.length === 0 && mongoose.Types.ObjectId.isValid(employeeId)) {
      tasks = await Task.find({ 'assignee._id': employeeId });
    }
    
    // Fetch attendance data for the past 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Only query attendance if we have a valid ObjectId
    let attendanceRecords = [];
    if (mongoose.Types.ObjectId.isValid(employeeId)) {
      attendanceRecords = await Attendance.find({
        employeeId: employeeId,
        date: { $gte: thirtyDaysAgo }
      }).sort({ date: -1 });
    } else {
      // Use alternative approach - find employee by ID string first
      const employee = await Employee.findOne({ employeeId });
      if (employee && employee._id) {
        attendanceRecords = await Attendance.find({
          employeeId: employee._id,
          date: { $gte: thirtyDaysAgo }
        }).sort({ date: -1 });
      }
    }
    
    // Update wellbeing metrics based on both task and attendance data
    wellbeingData = await updateWellbeingMetricsComprehensive(wellbeingData, tasks, attendanceRecords);
    
    // Ensure work-life balance factors are always up-to-date with latest break data
    wellbeingData = await updateWorkLifeBalance(wellbeingData, attendanceRecords);
    
    // Ensure break history is properly ordered (newest first)
    if (wellbeingData.breakHistory && wellbeingData.breakHistory.length > 0) {
      wellbeingData.breakHistory.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
    }
    
    // console.log(`Returning wellbeing data for employee ${employeeId} with ${wellbeingData.breakHistory?.length || 0} break entries`);
    
  } catch (error) {
    console.error('Error fetching related data:', error);
    // Don't fail the request if task or attendance fetching fails
  }

  res.status(200).json(wellbeingData);
});

// Comprehensive wellbeing metrics calculation
const updateWellbeingMetricsComprehensive = async (wellbeingData, tasks, attendanceRecords) => {
  // Update stress level based on tasks
  wellbeingData = await updateStressLevel(wellbeingData, tasks);
  
  // Update work-life balance based on attendance
  wellbeingData = await updateWorkLifeBalance(wellbeingData, attendanceRecords);
  
  // Update job satisfaction based on tasks and performance
  wellbeingData = await updateJobSatisfaction(wellbeingData, tasks, attendanceRecords);
  
  // Update team collaboration based on mood patterns and task completion
  wellbeingData = await updateTeamCollaboration(wellbeingData, tasks);
  
  // Save the updated wellbeing data
  await wellbeingData.save();
  
  return wellbeingData;
};

// Helper function to update work-life balance based on attendance
const updateWorkLifeBalance = async (wellbeingData, attendanceRecords) => {
  // Calculate breaks count from today's break history
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Count today's breaks
  const todayBreaks = wellbeingData.breakHistory.filter(breakEntry => {
    const breakDate = new Date(breakEntry.timestamp);
    return breakDate >= today && breakDate < tomorrow;
  });
  
  const todayBreaksCount = todayBreaks.length;
  
  // Calculate focus time from today's breaks and work hours
  let estimatedFocusTime = 8; // Default 8 hours
  let totalBreakTime = 0;
  
  todayBreaks.forEach(breakEntry => {
    if (breakEntry.duration) {
      totalBreakTime += breakEntry.duration;
    }
  });
  
  // Calculate work hours and overtime from attendance data
  let averageWorkHours = 8; // Default
  let afterHoursWork = 0; // Default
  
  if (attendanceRecords && attendanceRecords.length > 0) {
    let totalWorkHours = 0;
    let daysWithOvertime = 0;
    let workDaysCount = 0;
    let totalOvertimeHours = 0;
    
    attendanceRecords.forEach(record => {
      if (record.workHours) {
        totalWorkHours += record.workHours;
        workDaysCount++;
        
        // Count days with overtime (over 8 hours) and calculate overtime hours
        if (record.workHours > 8) {
          daysWithOvertime++;
          totalOvertimeHours += (record.workHours - 8);
        }
      }
    });
    
    averageWorkHours = workDaysCount > 0 ? parseFloat((totalWorkHours / workDaysCount).toFixed(1)) : 8;
    afterHoursWork = workDaysCount > 0 ? parseFloat((totalOvertimeHours / workDaysCount).toFixed(1)) : 0;
  }
  
  // Calculate estimated focus time
  // Focus time = work hours - break time - meeting/interruption time (estimated)
  const workHoursToday = averageWorkHours;
  const breakHoursToday = totalBreakTime / 60; // Convert minutes to hours
  const estimatedInterruptionTime = 1.5; // Estimated 1.5 hours for meetings/interruptions
  
  estimatedFocusTime = Math.max(
    workHoursToday - breakHoursToday - estimatedInterruptionTime,
    0
  );
  estimatedFocusTime = parseFloat(estimatedFocusTime.toFixed(1));
  
  // Update all work-life balance factors with actual backend data
  wellbeingData.wellbeingMetrics.workLifeBalance.factors.workHours = averageWorkHours;
  wellbeingData.wellbeingMetrics.workLifeBalance.factors.breaksCount = todayBreaksCount;
  wellbeingData.wellbeingMetrics.workLifeBalance.factors.afterHoursWork = afterHoursWork;
  wellbeingData.wellbeingMetrics.workLifeBalance.factors.focusTime = estimatedFocusTime;
  
  // Log the calculated factors for debugging
  // console.log(`Work-Life Balance factors updated for employee ${wellbeingData.employeeId}:`, {
  //   workHours: averageWorkHours,
  //   breaksCount: todayBreaksCount,
  //   afterHoursWork: afterHoursWork,
  //   focusTime: estimatedFocusTime,
  //   totalBreakTime: totalBreakTime,
  //   attendanceRecordsCount: attendanceRecords ? attendanceRecords.length : 0
  // });
  
  // Recalculate work-life balance score based on all factors
  let workLifeBalanceScore = 70; // Base score
  
  // Work hours factor (25% weight)
  if (averageWorkHours >= 7 && averageWorkHours <= 8) {
    workLifeBalanceScore += 7.5; // Ideal work hours
  } else if (averageWorkHours < 7) {
    workLifeBalanceScore += 5; // Under-working might indicate efficiency
  } else if (averageWorkHours > 10) {
    workLifeBalanceScore -= 7.5; // Excessive work hours
  } else {
    workLifeBalanceScore -= (averageWorkHours - 8) * 2; // Gradual penalty for overtime
  }
  
  // Breaks count factor (25% weight)
  if (todayBreaksCount >= 3) {
    workLifeBalanceScore += 7.5; // Good break frequency
  } else if (todayBreaksCount >= 1) {
    workLifeBalanceScore += 5; // Some breaks
  } else {
    workLifeBalanceScore -= 5; // No breaks taken
  }
  
  // After hours work factor (25% weight)
  if (afterHoursWork === 0) {
    workLifeBalanceScore += 7.5; // No overtime
  } else if (afterHoursWork <= 1) {
    workLifeBalanceScore += 2.5; // Minimal overtime
  } else {
    workLifeBalanceScore -= afterHoursWork * 2; // Penalty for excessive overtime
  }
  
  // Focus time factor (25% weight)
  if (estimatedFocusTime >= 5) {
    workLifeBalanceScore += 7.5; // Good focus time
  } else if (estimatedFocusTime >= 3) {
    workLifeBalanceScore += 5; // Moderate focus time
  } else {
    workLifeBalanceScore += 2.5; // Low focus time
  }
  
  // Ensure the score is between 70 and 100
  const newScore = Math.min(Math.max(Math.round(workLifeBalanceScore), 70), 100);
  wellbeingData.wellbeingMetrics.workLifeBalance.score = newScore;
  
  // Add to history if different from last score
  const lastHistoryValue = wellbeingData.wellbeingMetrics.workLifeBalance.history[
    wellbeingData.wellbeingMetrics.workLifeBalance.history.length - 1
  ];
  
  if (lastHistoryValue !== newScore) {
    wellbeingData.wellbeingMetrics.workLifeBalance.history.push(newScore);
    
    // Keep history array at most 10 items
    if (wellbeingData.wellbeingMetrics.workLifeBalance.history.length > 10) {
      wellbeingData.wellbeingMetrics.workLifeBalance.history.shift();
    }
  }
  
  return wellbeingData;
};

// @desc    Update wellbeing metrics
// @route   PATCH /api/wellbeing/metrics
// @access  Private (Employee)
const updateWellbeingMetrics = asyncHandler(async (req, res) => {
  const employeeId = getEmployeeId(req.user);
  const { metrics } = req.body;

  if (!metrics) {
    res.status(400);
    throw new Error('Metrics data is required');
  }

  let wellbeingData = await EmployeeWellbeing.findOne({ employeeId });

  // If no wellbeing data exists for this employee, create it
  if (!wellbeingData) {
    wellbeingData = await EmployeeWellbeing.create({ 
      employeeId,
      wellbeingMetrics: metrics
    });
  } else {
    // Update the metrics
    wellbeingData.wellbeingMetrics = metrics;
    await wellbeingData.save();
  }

  res.status(200).json(wellbeingData);
});

// @desc    Record a mood entry
// @route   POST /api/wellbeing/mood
// @access  Private (Employee)
const recordMood = asyncHandler(async (req, res) => {
  const employeeId = getEmployeeId(req.user);
  const { mood, note } = req.body;

  if (!mood) {
    res.status(400);
    throw new Error('Mood data is required');
  }

  const moodEntry = {
    mood,
    timestamp: new Date(),
    note
  };

  let wellbeingData = await EmployeeWellbeing.findOne({ employeeId });

  // If no wellbeing data exists for this employee, create it
  if (!wellbeingData) {
    wellbeingData = await EmployeeWellbeing.create({ 
      employeeId,
      moodHistory: [moodEntry]
    });
  } else {
    // Update the notificationTimestamps
    wellbeingData.notificationTimestamps.lastMood = new Date();
    
    // Add the mood entry
    wellbeingData.moodHistory.push(moodEntry);
    await wellbeingData.save();
  }

  // Update wellbeing metrics based on mood
  await updateWellbeingMetricsBasedOnMood(wellbeingData, mood);

  res.status(201).json({
    message: 'Mood recorded successfully',
    moodEntry
  });
});

// @desc    Record an activity completion
// @route   POST /api/wellbeing/activity
// @access  Private (Employee)
const recordActivity = asyncHandler(async (req, res) => {
  const employeeId = getEmployeeId(req.user);
  const { activity } = req.body;

  if (!activity) {
    res.status(400);
    throw new Error('Activity data is required');
  }

  const activityEntry = {
    activity,
    timestamp: new Date()
  };

  let wellbeingData = await EmployeeWellbeing.findOne({ employeeId });

  // If no wellbeing data exists for this employee, create it
  if (!wellbeingData) {
    wellbeingData = await EmployeeWellbeing.create({ 
      employeeId,
      activityHistory: [activityEntry]
    });
  } else {
    // Update the notificationTimestamps
    wellbeingData.notificationTimestamps.lastActivity = new Date();
    
    // Add the activity entry
    wellbeingData.activityHistory.push(activityEntry);
    await wellbeingData.save();
  }

  // Improve wellbeing metrics slightly when activities are completed
  await improveWellbeingMetricsForActivity(wellbeingData);

  res.status(201).json({
    message: 'Activity recorded successfully',
    activityEntry
  });
});

// @desc    Record a break completion
// @route   POST /api/wellbeing/break
// @access  Private (Employee)
const recordBreak = asyncHandler(async (req, res) => {
  const employeeId = getEmployeeId(req.user);
  const { duration, type = 'regular', timestamp } = req.body;

  // console.log('Received break data:', { duration, type, timestamp, employeeId });

  if (!duration) {
    res.status(400);
    throw new Error('Break duration is required');
  }

  // Validate break type
  const validBreakTypes = ['regular', 'mindfulness', 'exercise', 'social'];
  if (!validBreakTypes.includes(type)) {
    res.status(400);
    throw new Error(`Invalid break type. Must be one of: ${validBreakTypes.join(', ')}`);
  }

  // Create break entry with proper timestamp
  const breakEntry = {
    timestamp: timestamp || new Date().toISOString(),
    duration: Number(duration),
    type
  };

  // console.log('Creating break entry:', breakEntry);

  let wellbeingData = await EmployeeWellbeing.findOne({ employeeId });

  // If no wellbeing data exists for this employee, create it
  if (!wellbeingData) {
    wellbeingData = await EmployeeWellbeing.create({ 
      employeeId,
      breakHistory: [breakEntry]
    });
  } else {
    // Update the notificationTimestamps
    wellbeingData.notificationTimestamps.lastBreak = new Date();
    
    // Add the break entry
    wellbeingData.breakHistory.push(breakEntry);
    await wellbeingData.save();
  }

  // Update work-life balance metrics with the new break data
  // This will recalculate all factors including the updated breaks count
  wellbeingData = await updateWorkLifeBalance(wellbeingData, null);
  
  // Improve work-life balance metrics when breaks are taken
  await improveWorkLifeBalanceForBreak(wellbeingData, type);

  res.status(201).json({
    message: 'Break recorded successfully',
    breakEntry
  });
});

// @desc    Update reminder settings
// @route   PATCH /api/wellbeing/reminder-settings
// @access  Private (Employee)
const updateReminderSettings = asyncHandler(async (req, res) => {
  const employeeId = getEmployeeId(req.user);
  const { settings } = req.body;

  if (!settings) {
    res.status(400);
    throw new Error('Settings data is required');
  }

  let wellbeingData = await EmployeeWellbeing.findOne({ employeeId });

  // If no wellbeing data exists for this employee, create it
  if (!wellbeingData) {
    wellbeingData = await EmployeeWellbeing.create({ 
      employeeId,
      reminderSettings: settings
    });
  } else {
    // Update the settings
    wellbeingData.reminderSettings = settings;
    await wellbeingData.save();
  }

  res.status(200).json({
    message: 'Reminder settings updated successfully',
    settings: wellbeingData.reminderSettings
  });
});

// @desc    Get wellbeing history (mood, activity, breaks)
// @route   GET /api/wellbeing/history
// @access  Private (Employee)
const getWellbeingHistory = asyncHandler(async (req, res) => {
  const employeeId = getEmployeeId(req.user);
  const { type, startDate, endDate } = req.query;
  
  const wellbeingData = await EmployeeWellbeing.findOne({ employeeId });
  
  if (!wellbeingData) {
    return res.status(200).json({
      moodHistory: [],
      activityHistory: [],
      breakHistory: []
    });
  }
  
  let result = {};
  
  if (!type || type === 'mood') {
    result.moodHistory = filterHistoryByDateRange(
      wellbeingData.moodHistory,
      startDate,
      endDate
    );
  }
  
  if (!type || type === 'activity') {
    result.activityHistory = filterHistoryByDateRange(
      wellbeingData.activityHistory,
      startDate,
      endDate
    );
  }
  
  if (!type || type === 'break') {
    result.breakHistory = filterHistoryByDateRange(
      wellbeingData.breakHistory,
      startDate,
      endDate
    );
  }
  
  res.status(200).json(result);
});

// Helper function to filter history entries by date range
const filterHistoryByDateRange = (history, startDate, endDate) => {
  if (!startDate && !endDate) {
    return history;
  }
  
  return history.filter(entry => {
    const entryDate = new Date(entry.timestamp);
    
    if (startDate && endDate) {
      return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    } else if (startDate) {
      return entryDate >= new Date(startDate);
    } else if (endDate) {
      return entryDate <= new Date(endDate);
    }
    
    return true;
  });
};

// Helper function to update stress level based on tasks
const updateStressLevel = async (wellbeingData, tasks) => {
  // Count tasks by priority and status
  const highPriorityCount = tasks.filter(t => t.priority === 'high').length;
  const mediumPriorityCount = tasks.filter(t => t.priority === 'medium').length;
  const overdueTasks = tasks.filter(t => {
    return new Date(t.dueDate) < new Date() && t.status !== 'completed';
  }).length;
  const upcomingDeadlines = tasks.filter(t => {
    const dueDate = new Date(t.dueDate);
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);
    
    return dueDate >= today && dueDate <= threeDaysFromNow && t.status !== 'completed';
  }).length;
  
  // Count tasks by completion status
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const activeTasks = tasks.filter(t => t.status !== 'completed').length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100;
  
  // Calculate a stress factor from 0 to 20
  let stressFactor = 0;
  stressFactor += highPriorityCount * 2; // Each high priority task adds 2 points
  stressFactor += mediumPriorityCount * 1; // Each medium priority task adds 1 point
  stressFactor += overdueTasks * 3; // Each overdue task adds 3 points
  stressFactor += upcomingDeadlines; // Each upcoming deadline adds 1 point
  
  // Reduce stress if completion rate is high (positive factor)
  stressFactor -= Math.floor(completionRate / 20); // Reduce by 1 for every 20% completion rate
  
  // Cap at 20
  stressFactor = Math.min(Math.max(stressFactor, 0), 20);
  
  // Convert to a score from 70 to 100 (where 100 is unstressed)
  const newStressScore = Math.max(100 - stressFactor * 1.5, 70);
  
  // Determine descriptive factors based on actual data
  let deadlinePressure = 'Low';
  let workload = 'Light';
  
  // Calculate deadline pressure based on overdue and upcoming tasks
  if (overdueTasks > 3 || upcomingDeadlines > 5) {
    deadlinePressure = 'High';
  } else if (overdueTasks > 1 || upcomingDeadlines > 2) {
    deadlinePressure = 'Moderate';
  }
  
  // Calculate workload based on active tasks and priority distribution
  if (activeTasks > 10 || highPriorityCount > 5) {
    workload = 'Heavy';
  } else if (activeTasks > 5 || highPriorityCount > 2) {
    workload = 'Moderate';
  }
  
  // Calculate team support and work environment based on recent mood and activity patterns
  let teamSupport = wellbeingData.wellbeingMetrics.stressLevel.factors.teamSupport || 'Moderate';
  let workEnvironment = wellbeingData.wellbeingMetrics.stressLevel.factors.workEnvironment || 'Neutral';
  
  // Analyze recent mood patterns to infer team support and work environment
  if (wellbeingData.moodHistory && wellbeingData.moodHistory.length > 0) {
    const recentMoods = wellbeingData.moodHistory
      .slice(-7) // Last 7 mood entries
      .map(m => m.mood);
    
    const goodMoodCount = recentMoods.filter(m => m === 'great' || m === 'good').length;
    const badMoodCount = recentMoods.filter(m => m === 'bad' || m === 'okay').length;
    
    // Infer team support based on mood patterns and completion rate
    if (goodMoodCount >= 5 && completionRate > 80) {
      teamSupport = 'High';
    } else if (badMoodCount >= 4 || completionRate < 50) {
      teamSupport = 'Low';
    } else {
      teamSupport = 'Moderate';
    }
    
    // Infer work environment based on stress patterns and break frequency
    const todayBreaks = wellbeingData.breakHistory.filter(breakEntry => {
      const breakDate = new Date(breakEntry.timestamp);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return breakDate >= today && breakDate < tomorrow;
    });
    
    if (goodMoodCount >= 5 && todayBreaks.length >= 3) {
      workEnvironment = 'Positive';
    } else if (badMoodCount >= 4 || todayBreaks.length === 0) {
      workEnvironment = 'Negative';
    } else {
      workEnvironment = 'Neutral';
    }
  }
  
  // Update the stress level metrics with calculated factors
  wellbeingData.wellbeingMetrics.stressLevel.score = Math.round(newStressScore);
  wellbeingData.wellbeingMetrics.stressLevel.factors.deadlinePressure = deadlinePressure;
  wellbeingData.wellbeingMetrics.stressLevel.factors.workload = workload;
  wellbeingData.wellbeingMetrics.stressLevel.factors.teamSupport = teamSupport;
  wellbeingData.wellbeingMetrics.stressLevel.factors.workEnvironment = workEnvironment;
  
  // Log the calculated stress factors for debugging
  // console.log(`Stress Level factors updated for employee ${wellbeingData.employeeId}:`, {
  //   score: Math.round(newStressScore),
  //   deadlinePressure: deadlinePressure,
  //   workload: workload,
  //   teamSupport: teamSupport,
  //   workEnvironment: workEnvironment,
  //   tasksData: {
  //     total: totalTasks,
  //     active: activeTasks,
  //     completed: completedTasks,
  //     overdue: overdueTasks,
  //     upcoming: upcomingDeadlines,
  //     highPriority: highPriorityCount,
  //     completionRate: Math.round(completionRate)
  //   }
  // });
  
  // Add to history - but only if it's different from the last value
  const lastHistoryValue = wellbeingData.wellbeingMetrics.stressLevel.history[
    wellbeingData.wellbeingMetrics.stressLevel.history.length - 1
  ];
  
  if (lastHistoryValue !== Math.round(newStressScore)) {
    wellbeingData.wellbeingMetrics.stressLevel.history.push(Math.round(newStressScore));
    
    // Keep history array at most 10 items
    if (wellbeingData.wellbeingMetrics.stressLevel.history.length > 10) {
      wellbeingData.wellbeingMetrics.stressLevel.history.shift();
    }
  }
  
  return wellbeingData;
};

// Helper function to update job satisfaction based on tasks and performance
const updateJobSatisfaction = async (wellbeingData, tasks, attendanceRecords) => {
  // Count tasks by completion status
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100;
  
  // Calculate task variety and complexity
  const priorityDistribution = {
    high: tasks.filter(t => t.priority === 'high').length,
    medium: tasks.filter(t => t.priority === 'medium').length,
    low: tasks.filter(t => t.priority === 'low').length
  };
  
  // Calculate average work hours for skill utilization assessment
  let averageWorkHours = 8;
  if (attendanceRecords && attendanceRecords.length > 0) {
    const totalWorkHours = attendanceRecords.reduce((sum, record) => sum + (record.workHours || 0), 0);
    averageWorkHours = totalWorkHours / attendanceRecords.length;
  }
  
  // Analyze recent mood patterns for role clarity and team dynamics
  let recentMoodScore = 75; // Default neutral
  if (wellbeingData.moodHistory && wellbeingData.moodHistory.length > 0) {
    const recentMoods = wellbeingData.moodHistory.slice(-5);
    const moodValues = { great: 100, good: 80, okay: 60, bad: 40 };
    recentMoodScore = recentMoods.reduce((sum, mood) => sum + moodValues[mood.mood], 0) / recentMoods.length;
  }
  
  // Calculate factors based on actual data
  let roleClarity = 'Good'; // Default
  let skillUtilization = 'Good'; // Default
  let growthOpportunities = 'Moderate'; // Default
  let teamDynamics = 'Good'; // Default
  
  // Role clarity based on task completion rate and variety
  if (completionRate >= 85 && totalTasks > 0) {
    roleClarity = 'High';
  } else if (completionRate < 60 || totalTasks === 0) {
    roleClarity = 'Low';
  }
  
  // Skill utilization based on task complexity and work hours
  const hasComplexTasks = priorityDistribution.high > 0 || priorityDistribution.medium > 3;
  if (hasComplexTasks && averageWorkHours >= 7 && averageWorkHours <= 9) {
    skillUtilization = 'Optimal';
  } else if (!hasComplexTasks || averageWorkHours > 10) {
    skillUtilization = 'Underutilized';
  }
  
  // Growth opportunities based on task variety and completion patterns
  const taskVariety = Object.values(priorityDistribution).filter(count => count > 0).length;
  if (taskVariety >= 3 && completionRate > 75) {
    growthOpportunities = 'Good';
  } else if (taskVariety <= 1 || completionRate < 50) {
    growthOpportunities = 'Limited';
  }
  
  // Team dynamics based on mood patterns and collaboration indicators
  if (recentMoodScore >= 85) {
    teamDynamics = 'Excellent';
  } else if (recentMoodScore < 65) {
    teamDynamics = 'Needs Improvement';
  }
  
  // Calculate job satisfaction score
  let jobSatisfactionScore = 70; // Base score
  
  // Role clarity contribution (25%)
  if (roleClarity === 'High') jobSatisfactionScore += 7.5;
  else if (roleClarity === 'Good') jobSatisfactionScore += 5;
  else jobSatisfactionScore -= 2.5;
  
  // Skill utilization contribution (25%)
  if (skillUtilization === 'Optimal') jobSatisfactionScore += 7.5;
  else if (skillUtilization === 'Good') jobSatisfactionScore += 5;
  else jobSatisfactionScore -= 2.5;
  
  // Growth opportunities contribution (25%)
  if (growthOpportunities === 'Good') jobSatisfactionScore += 7.5;
  else if (growthOpportunities === 'Moderate') jobSatisfactionScore += 5;
  else jobSatisfactionScore -= 2.5;
  
  // Team dynamics contribution (25%)
  if (teamDynamics === 'Excellent') jobSatisfactionScore += 7.5;
  else if (teamDynamics === 'Good') jobSatisfactionScore += 5;
  else jobSatisfactionScore -= 2.5;
  
  // Ensure score is between 70 and 100
  const newJobSatisfactionScore = Math.min(Math.max(Math.round(jobSatisfactionScore), 70), 100);
  
  // Update job satisfaction metrics
  wellbeingData.wellbeingMetrics.jobSatisfaction.score = newJobSatisfactionScore;
  wellbeingData.wellbeingMetrics.jobSatisfaction.factors.roleClarity = roleClarity;
  wellbeingData.wellbeingMetrics.jobSatisfaction.factors.skillUtilization = skillUtilization;
  wellbeingData.wellbeingMetrics.jobSatisfaction.factors.growthOpportunities = growthOpportunities;
  wellbeingData.wellbeingMetrics.jobSatisfaction.factors.teamDynamics = teamDynamics;
  wellbeingData.wellbeingMetrics.jobSatisfaction.factors.taskCompletionRate = `${Math.round(completionRate)}%`;
  
  // Log the calculated job satisfaction factors for debugging
  // console.log(`Job Satisfaction factors updated for employee ${wellbeingData.employeeId}:`, {
  //   score: newJobSatisfactionScore,
  //   roleClarity: roleClarity,
  //   skillUtilization: skillUtilization,
  //   growthOpportunities: growthOpportunities,
  //   teamDynamics: teamDynamics,
  //   taskCompletionRate: `${Math.round(completionRate)}%`,
  //   calculationData: {
  //     completionRate: Math.round(completionRate),
  //     totalTasks: totalTasks,
  //     averageWorkHours: averageWorkHours.toFixed(1),
  //     recentMoodScore: recentMoodScore.toFixed(1),
  //     taskVariety: taskVariety
  //   }
  // });
  
  // Add to history if different from last score
  const lastHistoryValue = wellbeingData.wellbeingMetrics.jobSatisfaction.history[
    wellbeingData.wellbeingMetrics.jobSatisfaction.history.length - 1
  ];
  
  if (lastHistoryValue !== newJobSatisfactionScore) {
    wellbeingData.wellbeingMetrics.jobSatisfaction.history.push(newJobSatisfactionScore);
    
    // Keep history array at most 10 items
    if (wellbeingData.wellbeingMetrics.jobSatisfaction.history.length > 10) {
      wellbeingData.wellbeingMetrics.jobSatisfaction.history.shift();
    }
  }
  
  return wellbeingData;
};

// Helper function to update team collaboration based on mood patterns and task completion
const updateTeamCollaboration = async (wellbeingData, tasks) => {
  // Calculate task completion metrics
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100;
  
  // Analyze recent mood patterns for collaboration indicators
  let recentMoodScore = 75; // Default neutral
  let moodConsistency = 'Stable';
  
  if (wellbeingData.moodHistory && wellbeingData.moodHistory.length > 0) {
    const recentMoods = wellbeingData.moodHistory.slice(-7); // Last 7 entries
    const moodValues = { great: 100, good: 80, okay: 60, bad: 40 };
    recentMoodScore = recentMoods.reduce((sum, mood) => sum + moodValues[mood.mood], 0) / recentMoods.length;
    
    // Calculate mood consistency
    const moodVariance = recentMoods.reduce((variance, mood) => {
      const diff = moodValues[mood.mood] - recentMoodScore;
      return variance + (diff * diff);
    }, 0) / recentMoods.length;
    
    if (moodVariance < 100) moodConsistency = 'Stable';
    else if (moodVariance < 400) moodConsistency = 'Variable';
    else moodConsistency = 'Unstable';
  }
  
  // Analyze break patterns for peer support indicators
  const todayBreaks = wellbeingData.breakHistory.filter(breakEntry => {
    const breakDate = new Date(breakEntry.timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return breakDate >= today && breakDate < tomorrow;
  });
  
  const socialBreaks = todayBreaks.filter(b => b.type === 'social').length;
  
  // Calculate factors based on actual data
  let communicationQuality = 'Good'; // Default
  let peerSupport = 'Good'; // Default
  let conflictResolution = 'Moderate'; // Default
  let teamworkEfficiency = 'Good'; // Default
  
  // Communication quality based on mood consistency and completion rate
  if (moodConsistency === 'Stable' && completionRate > 80) {
    communicationQuality = 'Excellent';
  } else if (moodConsistency === 'Unstable' || completionRate < 50) {
    communicationQuality = 'Poor';
  }
  
  // Peer support based on social breaks and mood patterns
  if (socialBreaks > 0 && recentMoodScore >= 80) {
    peerSupport = 'High';
  } else if (socialBreaks === 0 && recentMoodScore < 65) {
    peerSupport = 'Low';
  }
  
  // Conflict resolution based on mood stability and task completion
  if (moodConsistency === 'Stable' && completionRate > 75) {
    conflictResolution = 'Good';
  } else if (moodConsistency === 'Unstable') {
    conflictResolution = 'Needs Improvement';
  }
  
  // Teamwork efficiency based on overall performance indicators
  if (completionRate > 85 && recentMoodScore >= 80) {
    teamworkEfficiency = 'High';
  } else if (completionRate < 60 || recentMoodScore < 60) {
    teamworkEfficiency = 'Low';
  }
  
  // Calculate team collaboration score
  let teamCollaborationScore = 70; // Base score
  
  // Communication quality contribution (25%)
  if (communicationQuality === 'Excellent') teamCollaborationScore += 7.5;
  else if (communicationQuality === 'Good') teamCollaborationScore += 5;
  else teamCollaborationScore -= 2.5;
  
  // Peer support contribution (25%)
  if (peerSupport === 'High') teamCollaborationScore += 7.5;
  else if (peerSupport === 'Good') teamCollaborationScore += 5;
  else teamCollaborationScore -= 2.5;
  
  // Conflict resolution contribution (25%)
  if (conflictResolution === 'Good') teamCollaborationScore += 7.5;
  else if (conflictResolution === 'Moderate') teamCollaborationScore += 5;
  else teamCollaborationScore -= 2.5;
  
  // Teamwork efficiency contribution (25%)
  if (teamworkEfficiency === 'High') teamCollaborationScore += 7.5;
  else if (teamworkEfficiency === 'Good') teamCollaborationScore += 5;
  else teamCollaborationScore -= 2.5;
  
  // Ensure score is between 70 and 100
  const newTeamCollaborationScore = Math.min(Math.max(Math.round(teamCollaborationScore), 70), 100);
  
  // Update team collaboration metrics
  wellbeingData.wellbeingMetrics.teamCollaboration.score = newTeamCollaborationScore;
  wellbeingData.wellbeingMetrics.teamCollaboration.factors.communicationQuality = communicationQuality;
  wellbeingData.wellbeingMetrics.teamCollaboration.factors.peerSupport = peerSupport;
  wellbeingData.wellbeingMetrics.teamCollaboration.factors.conflictResolution = conflictResolution;
  wellbeingData.wellbeingMetrics.teamCollaboration.factors.teamworkEfficiency = teamworkEfficiency;
  
  // Log the calculated team collaboration factors for debugging
  // console.log(`Team Collaboration factors updated for employee ${wellbeingData.employeeId}:`, {
  //   score: newTeamCollaborationScore,
  //   communicationQuality: communicationQuality,
  //   peerSupport: peerSupport,
  //   conflictResolution: conflictResolution,
  //   teamworkEfficiency: teamworkEfficiency,
  //   calculationData: {
  //     completionRate: Math.round(completionRate),
  //     recentMoodScore: recentMoodScore.toFixed(1),
  //     moodConsistency: moodConsistency,
  //     socialBreaks: socialBreaks,
  //     totalTasks: totalTasks
  //   }
  // });
  
  // Add to history if different from last score
  const lastHistoryValue = wellbeingData.wellbeingMetrics.teamCollaboration.history[
    wellbeingData.wellbeingMetrics.teamCollaboration.history.length - 1
  ];
  
  if (lastHistoryValue !== newTeamCollaborationScore) {
    wellbeingData.wellbeingMetrics.teamCollaboration.history.push(newTeamCollaborationScore);
    
    // Keep history array at most 10 items
    if (wellbeingData.wellbeingMetrics.teamCollaboration.history.length > 10) {
      wellbeingData.wellbeingMetrics.teamCollaboration.history.shift();
    }
  }
  
  return wellbeingData;
};

// Helper function to update wellbeing metrics based on mood
const updateWellbeingMetricsBasedOnMood = async (wellbeingData, mood) => {
  // Assign numeric values to moods
  const moodValues = {
    great: 10,
    good: 5,
    okay: 0,
    bad: -5
  };
  
  const moodValue = moodValues[mood];
  
  // Calculate adjustments to various metrics
  const jobSatisfactionDelta = moodValue * 0.2;
  const teamCollaborationDelta = moodValue * 0.1;
  
  // Update job satisfaction
  wellbeingData.wellbeingMetrics.jobSatisfaction.score = Math.min(
    Math.max(wellbeingData.wellbeingMetrics.jobSatisfaction.score + jobSatisfactionDelta, 70),
    100
  );
  
  // Update team collaboration
  wellbeingData.wellbeingMetrics.teamCollaboration.score = Math.min(
    Math.max(wellbeingData.wellbeingMetrics.teamCollaboration.score + teamCollaborationDelta, 70),
    100
  );
  
  // Add to history arrays
  wellbeingData.wellbeingMetrics.jobSatisfaction.history.push(
    Math.round(wellbeingData.wellbeingMetrics.jobSatisfaction.score)
  );
  wellbeingData.wellbeingMetrics.teamCollaboration.history.push(
    Math.round(wellbeingData.wellbeingMetrics.teamCollaboration.score)
  );
  
  // Keep history arrays at most 10 items
  if (wellbeingData.wellbeingMetrics.jobSatisfaction.history.length > 10) {
    wellbeingData.wellbeingMetrics.jobSatisfaction.history.shift();
  }
  if (wellbeingData.wellbeingMetrics.teamCollaboration.history.length > 10) {
    wellbeingData.wellbeingMetrics.teamCollaboration.history.shift();
  }
  
  await wellbeingData.save();
};

// Helper function to improve wellbeing metrics when activities are completed
const improveWellbeingMetricsForActivity = async (wellbeingData) => {
  // Small improvement to job satisfaction
  wellbeingData.wellbeingMetrics.jobSatisfaction.score = Math.min(
    wellbeingData.wellbeingMetrics.jobSatisfaction.score + 1,
    100
  );
  
  // Small improvement to stress level
  wellbeingData.wellbeingMetrics.stressLevel.score = Math.min(
    wellbeingData.wellbeingMetrics.stressLevel.score + 1,
    100
  );
  
  // Add to history arrays if value changed
  const lastJobSatisfaction = wellbeingData.wellbeingMetrics.jobSatisfaction.history[
    wellbeingData.wellbeingMetrics.jobSatisfaction.history.length - 1
  ];
  
  if (Math.round(wellbeingData.wellbeingMetrics.jobSatisfaction.score) !== lastJobSatisfaction) {
    wellbeingData.wellbeingMetrics.jobSatisfaction.history.push(
      Math.round(wellbeingData.wellbeingMetrics.jobSatisfaction.score)
    );
    
    // Keep history array at most 10 items
    if (wellbeingData.wellbeingMetrics.jobSatisfaction.history.length > 10) {
      wellbeingData.wellbeingMetrics.jobSatisfaction.history.shift();
    }
  }
  
  const lastStressLevel = wellbeingData.wellbeingMetrics.stressLevel.history[
    wellbeingData.wellbeingMetrics.stressLevel.history.length - 1
  ];
  
  if (Math.round(wellbeingData.wellbeingMetrics.stressLevel.score) !== lastStressLevel) {
    wellbeingData.wellbeingMetrics.stressLevel.history.push(
      Math.round(wellbeingData.wellbeingMetrics.stressLevel.score)
    );
    
    // Keep history array at most 10 items
    if (wellbeingData.wellbeingMetrics.stressLevel.history.length > 10) {
      wellbeingData.wellbeingMetrics.stressLevel.history.shift();
    }
  }
  
  await wellbeingData.save();
};

// Helper function to improve work-life balance for breaks
const improveWorkLifeBalanceForBreak = async (wellbeingData, breakType = 'regular') => {
  // Get the current score
  const currentScore = wellbeingData.wellbeingMetrics.workLifeBalance.score;
  
  // Calculate improvement based on break type
  let improvement = 0;
  switch (breakType) {
    case 'mindfulness':
      improvement = 3; // Mindfulness breaks have the highest impact
      break;
    case 'exercise':
      improvement = 2.5; // Exercise breaks have high impact
      break;
    case 'social':
      improvement = 2; // Social breaks have moderate impact
      break;
    case 'regular':
    default:
      improvement = 1; // Regular breaks have standard impact
  }
  
  // Calculate new score (capped at 100)
  const newScore = Math.min(currentScore + improvement, 100);
  
  // Update the score
  wellbeingData.wellbeingMetrics.workLifeBalance.score = newScore;
  
  // Add to history if different from last score
  const lastHistoryValue = wellbeingData.wellbeingMetrics.workLifeBalance.history[
    wellbeingData.wellbeingMetrics.workLifeBalance.history.length - 1
  ];
  
  if (lastHistoryValue !== newScore) {
    wellbeingData.wellbeingMetrics.workLifeBalance.history.push(newScore);
    
    // Keep history array at most 10 items
    if (wellbeingData.wellbeingMetrics.workLifeBalance.history.length > 10) {
      wellbeingData.wellbeingMetrics.workLifeBalance.history.shift();
    }
  }
  
  await wellbeingData.save();
  return wellbeingData;
};

// @desc    Get wellbeing insights based on attendance, tasks, and wellbeing data
// @route   GET /api/wellbeing/insights
// @access  Private (Employee)
const getWellbeingInsights = asyncHandler(async (req, res) => {
  const employeeId = getEmployeeId(req.user);
  
  try {
    // Get wellbeing data
    const wellbeingData = await EmployeeWellbeing.findOne({ employeeId });
    if (!wellbeingData) {
      return res.status(404).json({
        success: false,
        message: 'Wellbeing data not found'
      });
    }
    
    // Get attendance data for past 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Only query attendance if we have a valid ObjectId
    let attendanceRecords = [];
    if (mongoose.Types.ObjectId.isValid(employeeId)) {
      attendanceRecords = await Attendance.find({
        employeeId: employeeId,
        date: { $gte: thirtyDaysAgo }
      }).sort({ date: -1 });
    } else {
      // Use alternative approach - find employee by ID string first
      const employee = await Employee.findOne({ employeeId });
      if (employee && employee._id) {
        attendanceRecords = await Attendance.find({
          employeeId: employee._id,
          date: { $gte: thirtyDaysAgo }
        }).sort({ date: -1 });
      }
    }
    
    // Get task data
    let tasks = await Task.find({ 'assignee.id': employeeId });
    
    // Generate insights
    const insights = generateWellbeingInsights(wellbeingData, attendanceRecords, tasks);
    
    res.status(200).json({
      success: true,
      insights
    });
  } catch (error) {
    console.error('Error generating wellbeing insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate wellbeing insights'
    });
  }
});

// Helper function to generate insights from wellbeing data
const generateWellbeingInsights = (wellbeingData, attendanceRecords, tasks) => {
  const insights = [];
  
  // Work-life balance insights
  if (wellbeingData.wellbeingMetrics.workLifeBalance.score < 80) {
    const avgWorkHours = wellbeingData.wellbeingMetrics.workLifeBalance.factors.workHours;
    
    if (avgWorkHours > 9) {
      insights.push({
        type: 'work-life-balance',
        severity: 'warning',
        message: `You're working an average of ${avgWorkHours} hours per day. Consider setting clearer boundaries between work and personal time.`
      });
    }
    
    if (wellbeingData.wellbeingMetrics.workLifeBalance.factors.afterHoursWork > 0.3) {
      insights.push({
        type: 'work-life-balance',
        severity: 'warning',
        message: 'You work overtime frequently. This could lead to burnout over time.'
      });
    }
  }
  
  // Stress level insights
  if (wellbeingData.wellbeingMetrics.stressLevel.score < 85) {
    const deadlinePressure = wellbeingData.wellbeingMetrics.stressLevel.factors.deadlinePressure;
    const workload = wellbeingData.wellbeingMetrics.stressLevel.factors.workload;
    
    if (deadlinePressure === 'High') {
      insights.push({
        type: 'stress-level',
        severity: 'warning',
        message: 'You appear to be under high deadline pressure. Consider discussing priorities with your manager.'
      });
    }
    
    if (workload === 'Heavy') {
      insights.push({
        type: 'stress-level',
        severity: 'warning',
        message: 'Your workload appears to be heavy. Consider discussing task distribution with your team.'
      });
    }
    
    // Check for upcoming deadlines
    const upcomingDeadlines = tasks.filter(t => {
      const dueDate = new Date(t.dueDate);
      const today = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(today.getDate() + 3);
      
      return dueDate >= today && dueDate <= threeDaysFromNow && t.status !== 'completed';
    });
    
    if (upcomingDeadlines.length > 2) {
      insights.push({
        type: 'stress-level',
        severity: 'info',
        message: `You have ${upcomingDeadlines.length} tasks due in the next 3 days. Consider prioritizing them.`
      });
    }
  }
  
  // Break recommendations
  const lastBreak = wellbeingData.notificationTimestamps.lastBreak;
  const daysSinceLastBreak = lastBreak ? 
    Math.floor((new Date() - new Date(lastBreak)) / (1000 * 60 * 60 * 24)) : 
    null;
  
  if (daysSinceLastBreak === null || daysSinceLastBreak > 1) {
    insights.push({
      type: 'break',
      severity: 'info',
      message: 'You haven\'t taken a break recently. Regular breaks can improve productivity and reduce stress.'
    });
  }
  
  // Mood patterns
  if (wellbeingData.moodHistory && wellbeingData.moodHistory.length > 0) {
    const recentMoods = wellbeingData.moodHistory
      .slice(-5)
      .map(m => m.mood);
    
    const badMoodCount = recentMoods.filter(m => m === 'bad' || m === 'okay').length;
    
    if (badMoodCount >= 3) {
      insights.push({
        type: 'mood',
        severity: 'warning',
        message: 'You\'ve reported several negative moods recently. Consider taking time for self-care or speaking with someone.'
      });
    }
  }
  
  // Attendance insights
  if (attendanceRecords && attendanceRecords.length > 0) {
    const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
    
    if (lateCount > 3) {
      insights.push({
        type: 'attendance',
        severity: 'info',
        message: 'You\'ve been late several times recently. This might be adding unnecessary stress to your day.'
      });
    }
  }
  
  return insights;
};

// @desc    Get wellbeing tips by category
// @route   GET /api/wellbeing/tips
// @access  Private (Employee)
const getWellbeingTips = asyncHandler(async (req, res) => {
  const { category = 'all' } = req.query;
  
  const wellbeingTips = {
    stress: [
      {
        id: 1,
        title: "Take Deep Breaths",
        description: "Practice deep breathing exercises for 2-3 minutes to help reduce stress and anxiety.",
        category: "stress",
        icon: "🧘‍♀️"
      },
      {
        id: 2,
        title: "Break Large Tasks Down",
        description: "Divide overwhelming tasks into smaller, manageable steps to reduce stress.",
        category: "stress",
        icon: "📝"
      },
      {
        id: 3,
        title: "Set Realistic Deadlines",
        description: "Work with your manager to set achievable deadlines that don't compromise quality.",
        category: "stress",
        icon: "⏰"
      }
    ],
    mood: [
      {
        id: 4,
        title: "Practice Gratitude",
        description: "Write down three things you're grateful for each day to boost your mood.",
        category: "mood",
        icon: "🙏"
      },
      {
        id: 5,
        title: "Take Short Walks",
        description: "A 5-10 minute walk can help clear your mind and improve your mood.",
        category: "mood",
        icon: "🚶‍♀️"
      },
      {
        id: 6,
        title: "Connect with Colleagues",
        description: "Having positive social interactions at work can significantly boost your mood.",
        category: "mood",
        icon: "💬"
      }
    ],
    workLife: [
      {
        id: 7,
        title: "Set Clear Boundaries",
        description: "Establish specific work hours and stick to them to maintain work-life balance.",
        category: "workLife",
        icon: "⚖️"
      },
      {
        id: 8,
        title: "Take Regular Breaks",
        description: "Take short breaks every hour to refresh your mind and maintain productivity.",
        category: "workLife",
        icon: "☕"
      },
      {
        id: 9,
        title: "Organize Your Workspace",
        description: "A clean, organized workspace can help reduce stress and improve focus.",
        category: "workLife",
        icon: "🗂️"
      }
    ],
    productivity: [
      {
        id: 10,
        title: "Use the Pomodoro Technique",
        description: "Work in 25-minute focused intervals followed by 5-minute breaks.",
        category: "productivity",
        icon: "🍅"
      },
      {
        id: 11,
        title: "Prioritize Important Tasks",
        description: "Start your day with the most important or challenging tasks when your energy is highest.",
        category: "productivity",
        icon: "🎯"
      },
      {
        id: 12,
        title: "Minimize Distractions",
        description: "Turn off non-essential notifications during focused work time.",
        category: "productivity",
        icon: "🔕"
      }
    ],
    general: [
      {
        id: 13,
        title: "Stay Hydrated",
        description: "Drink plenty of water throughout the day to maintain energy and focus.",
        category: "general",
        icon: "💧"
      },
      {
        id: 14,
        title: "Get Enough Sleep",
        description: "Aim for 7-9 hours of quality sleep to support your mental and physical wellbeing.",
        category: "general",
        icon: "😴"
      },
      {
        id: 15,
        title: "Practice Mindfulness",
        description: "Spend a few minutes each day being present and aware of your thoughts and feelings.",
        category: "general",
        icon: "🧠"
      }
    ]
  };
  
  let tips;
  
  if (category === 'all') {
    // Return all tips from all categories
    tips = [
      ...wellbeingTips.stress,
      ...wellbeingTips.mood,
      ...wellbeingTips.workLife,
      ...wellbeingTips.productivity,
      ...wellbeingTips.general
    ];
  } else {
    // Return tips for specific category
    tips = wellbeingTips[category] || [];
  }
  
  // Shuffle tips to provide variety
  const shuffledTips = tips.sort(() => Math.random() - 0.5);
  
  res.status(200).json({
    success: true,
    data: {
      tips: shuffledTips,
      category,
      total: shuffledTips.length
    }
  });
});

module.exports = {
  getWellbeingData,
  updateWellbeingMetrics,
  recordMood,
  recordActivity,
  recordBreak,
  updateReminderSettings,
  getWellbeingHistory,
  getWellbeingInsights,
  getWellbeingTips,
  updateJobSatisfaction,
  updateTeamCollaboration,
  updateWellbeingMetricsComprehensive
}; 