const ManagerWellbeing = require('../models/managerWellbeingModel');
const Manager = require('../models/managerModel');
const Task = require('../models/Task');
const ManagerAttendance = require('../models/managerAttendanceModel');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const EmployeeWellbeing = require('../models/employeeWellbeingModel');

// Helper function to get manager ID from req.user
const getManagerId = (user) => {
  // For employees with manager role, use their employee ID
  if (user.role === 'employee' && user.isEmployeeManager) {
    return user.id || user._id?.toString() || 'unknown-employee-manager';
  }
  
  // For dedicated managers, prioritize the string ID field over MongoDB ObjectId
  if (user.id) {
    return user.id; // Return the custom string ID (e.g. "MG001")
  } else if (user._id) {
    return user._id.toString();
  } else if (user._doc && user._doc._id) {
    return user._doc._id.toString();
  } else {
    // Last resort, return the stringified user id if it's an object
    return user._id ? user._id.toString() : 'unknown-id';
  }
};

// Update stress level based on tasks
const updateStressLevel = async (wellbeingData, tasks) => {
  // Get assigned tasks count
  const totalTasks = tasks.length;
  const overdueTasks = tasks.filter(task => 
    task.status !== 'completed' && new Date(task.dueDate) < new Date()
  ).length;
  
  const urgentTasks = tasks.filter(task => task.priority === 'high').length;
  
  // Calculate baseline stress score (50-100)
  let stressScore = 75; // Default baseline
  
  // Adjust for overdue tasks
  if (overdueTasks > 0) {
    stressScore -= Math.min(overdueTasks * 5, 20); // Max 20 point reduction
  }
  
  // Adjust for urgent tasks
  if (urgentTasks > 0) {
    stressScore -= Math.min(urgentTasks * 3, 15); // Max 15 point reduction
  }
  
  // Cap the stress score between 50 and 100
  stressScore = Math.max(50, Math.min(stressScore, 100));
  
  // Add to history (keep only last 30 entries)
  wellbeingData.wellbeingMetrics.stressLevel.history.push(stressScore);
  if (wellbeingData.wellbeingMetrics.stressLevel.history.length > 30) {
    wellbeingData.wellbeingMetrics.stressLevel.history.shift();
  }
  
      // Update current score
    wellbeingData.wellbeingMetrics.stressLevel.score = Math.round(stressScore);
  
  // Update factors
  wellbeingData.wellbeingMetrics.stressLevel.factors = {
    deadlinePressure: overdueTasks > 5 ? 'High' : overdueTasks > 2 ? 'Moderate' : 'Low',
    workload: totalTasks > 15 ? 'High' : totalTasks > 8 ? 'Moderate' : 'Low',
    teamSupport: 'Moderate', // Default value
    workEnvironment: 'Neutral' // Default value
  };
  
  return wellbeingData;
};

// Update work-life balance based on manager attendance and breaks
const updateWorkLifeBalance = async (wellbeingData, attendanceRecords = null) => {
  // Get today's breaks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayBreaks = wellbeingData.breakHistory.filter(
    breakEntry => new Date(breakEntry.startTime) >= today
  );
  
  const breakCount = todayBreaks.length;
  
  // Calculate total break time in minutes
  let totalBreakTime = 0;
  todayBreaks.forEach(breakEntry => {
    if (breakEntry.duration) {
      totalBreakTime += breakEntry.duration;
    }
  });
  
  // Calculate work-life balance score
  let balanceScore = 75; // Default baseline
  
  // Adjust for breaks
  if (breakCount >= 3) {
    balanceScore += 10;
  } else if (breakCount >= 1) {
    balanceScore += 5;
  } else {
    balanceScore -= 5;
  }
  
  // Adjust for break duration
  if (totalBreakTime >= 60) {
    balanceScore += 10;
  } else if (totalBreakTime >= 30) {
    balanceScore += 5;
  } else {
    balanceScore -= 5;
  }
  
  // Integrate attendance data if available
  let averageWorkHours = 8; // Default
  let daysWithOvertime = 0;
  let workDaysCount = 0;
  
  if (attendanceRecords && attendanceRecords.length > 0) {
    let totalWorkHours = 0;
    
    attendanceRecords.forEach(record => {
      if (record.workHours) {
        totalWorkHours += record.workHours;
        workDaysCount++;
        
        // Count days with overtime (over 9 hours)
        if (record.workHours > 9) {
          daysWithOvertime++;
        }
      }
    });
    
    averageWorkHours = workDaysCount > 0 ? totalWorkHours / workDaysCount : 8;
    
    // Adjust balance score based on work hours
    const workHoursScore = averageWorkHours <= 8 ? 10 : Math.max(-10, 10 - ((averageWorkHours - 8) * 5));
    const overtimeScore = workDaysCount > 0 ? -((daysWithOvertime / workDaysCount) * 15) : 0;
    
    balanceScore += workHoursScore + overtimeScore;
  }
  
  // Cap the balance score between 50 and 100
  balanceScore = Math.max(50, Math.min(balanceScore, 100));
  
  // Add to history (keep only last 30 entries)
  wellbeingData.wellbeingMetrics.workLifeBalance.history.push(balanceScore);
  if (wellbeingData.wellbeingMetrics.workLifeBalance.history.length > 30) {
    wellbeingData.wellbeingMetrics.workLifeBalance.history.shift();
  }
  
  // Update current score
  wellbeingData.wellbeingMetrics.workLifeBalance.score = Math.round(balanceScore);
  
  // Update factors with real data
  wellbeingData.wellbeingMetrics.workLifeBalance.factors = {
    workHours: parseFloat(averageWorkHours.toFixed(1)),
    breaksCount: breakCount,
    afterHoursWork: workDaysCount > 0 ? parseFloat((daysWithOvertime / workDaysCount).toFixed(1)) : 0,
    focusTime: parseFloat((averageWorkHours * 0.7).toFixed(1)) // Estimated focus time
  };
  
  return wellbeingData;
};

// Update wellbeing metrics based on mood
const updateWellbeingMetricsBasedOnMood = async (wellbeingData, mood) => {
  // Map mood to delta values (how much to add/subtract from current scores)
  const moodDeltas = {
    'great': { satisfaction: 3, stress: 3, collaboration: 2.5, workLifeBalance: 2.5 },
    'good': { satisfaction: 2, stress: 2, collaboration: 1.5, workLifeBalance: 1.5 },
    'okay': { satisfaction: 0, stress: 0, collaboration: 0, workLifeBalance: 0 },
    'bad': { satisfaction: -2, stress: -2, collaboration: -1.5, workLifeBalance: -1.5 }
  };
  
  if (moodDeltas[mood]) {
    // Update job satisfaction with delta (capped between 50-100)
    const newJobSatisfaction = Math.min(
      Math.max(wellbeingData.wellbeingMetrics.jobSatisfaction.score + moodDeltas[mood].satisfaction, 50),
      100
    );
    wellbeingData.wellbeingMetrics.jobSatisfaction.score = Math.round(newJobSatisfaction);
    wellbeingData.wellbeingMetrics.jobSatisfaction.history.push(Math.round(newJobSatisfaction));
    if (wellbeingData.wellbeingMetrics.jobSatisfaction.history.length > 30) {
      wellbeingData.wellbeingMetrics.jobSatisfaction.history.shift();
    }
    
    // Update stress level with delta (capped between 50-100)
    const newStressLevel = Math.min(
      Math.max(wellbeingData.wellbeingMetrics.stressLevel.score + moodDeltas[mood].stress, 50),
      100
    );
    wellbeingData.wellbeingMetrics.stressLevel.score = Math.round(newStressLevel);
    wellbeingData.wellbeingMetrics.stressLevel.history.push(Math.round(newStressLevel));
    if (wellbeingData.wellbeingMetrics.stressLevel.history.length > 30) {
      wellbeingData.wellbeingMetrics.stressLevel.history.shift();
    }
    
    // Update team collaboration with delta (capped between 50-100)
    const newTeamCollaboration = Math.min(
      Math.max(wellbeingData.wellbeingMetrics.teamCollaboration.score + moodDeltas[mood].collaboration, 50),
      100
    );
    wellbeingData.wellbeingMetrics.teamCollaboration.score = Math.round(newTeamCollaboration);
    wellbeingData.wellbeingMetrics.teamCollaboration.history.push(Math.round(newTeamCollaboration));
    if (wellbeingData.wellbeingMetrics.teamCollaboration.history.length > 30) {
      wellbeingData.wellbeingMetrics.teamCollaboration.history.shift();
    }
    
    // Update work-life balance with delta (capped between 50-100)
    const newWorkLifeBalance = Math.min(
      Math.max(wellbeingData.wellbeingMetrics.workLifeBalance.score + moodDeltas[mood].workLifeBalance, 50),
      100
    );
    wellbeingData.wellbeingMetrics.workLifeBalance.score = Math.round(newWorkLifeBalance);
    wellbeingData.wellbeingMetrics.workLifeBalance.history.push(Math.round(newWorkLifeBalance));
    if (wellbeingData.wellbeingMetrics.workLifeBalance.history.length > 30) {
      wellbeingData.wellbeingMetrics.workLifeBalance.history.shift();
    }
    
    await wellbeingData.save();
  }
  
  return wellbeingData;
};

// Calculate team wellbeing based on assigned employees' data
const calculateTeamWellbeing = async (managerId) => {
  try {
    // Get assigned employees for this manager
    const manager = await Manager.findOne({ 
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(managerId) ? managerId : null },
        { id: managerId }
      ]
    });
    
    if (!manager || !manager.assignedEmployees || manager.assignedEmployees.length === 0) {
      // Return default values if no assigned employees
      return {
        workLifeBalance: { score: 75, history: [73, 74, 75, 75, 75] },
        stressLevel: { score: 70, history: [68, 69, 70, 70, 70] },
        satisfaction: { score: 75, history: [72, 73, 74, 75, 75] },
        collaboration: { score: 80, history: [77, 78, 79, 80, 80] }
      };
    }
    
    // Get wellbeing data for assigned employees
    const employeeWellbeingData = await EmployeeWellbeing.find({
      employeeId: { $in: manager.assignedEmployees }
    });
    
    if (employeeWellbeingData.length === 0) {
      // Return default values if no wellbeing data found
      return {
        workLifeBalance: { score: 75, history: [73, 74, 75, 75, 75] },
        stressLevel: { score: 70, history: [68, 69, 70, 70, 70] },
        satisfaction: { score: 75, history: [72, 73, 74, 75, 75] },
        collaboration: { score: 80, history: [77, 78, 79, 80, 80] }
      };
    }
    
    // Calculate averages from employee data
    const totalEmployees = employeeWellbeingData.length;
    
    // Calculate work-life balance average
    const avgWorkLifeBalance = Math.round(
      employeeWellbeingData.reduce((sum, emp) => {
        return sum + (emp.wellbeingMetrics?.workLifeBalance?.score || 75);
      }, 0) / totalEmployees
    );
    
    // Calculate stress level average (invert for wellbeing score)
    const avgStressLevel = Math.round(
      employeeWellbeingData.reduce((sum, emp) => {
        const stressScore = emp.wellbeingMetrics?.stressLevel?.score || 70;
        return sum + (100 - stressScore); // Invert stress to wellbeing
      }, 0) / totalEmployees
    );
    
    // Calculate satisfaction average
    const avgSatisfaction = Math.round(
      employeeWellbeingData.reduce((sum, emp) => {
        return sum + (emp.wellbeingMetrics?.jobSatisfaction?.score || 75);
      }, 0) / totalEmployees
    );
    
    // Calculate collaboration average
    const avgCollaboration = Math.round(
      employeeWellbeingData.reduce((sum, emp) => {
        return sum + (emp.wellbeingMetrics?.teamCollaboration?.score || 80);
      }, 0) / totalEmployees
    );
    
    // Generate history arrays (simulate trend data)
    const generateHistory = (currentScore) => {
      const variation = 3; // ±3 points variation
      return Array.from({ length: 5 }, (_, i) => {
        const baseScore = currentScore - (4 - i);
        const randomVariation = Math.floor(Math.random() * (variation * 2 + 1)) - variation;
        return Math.max(50, Math.min(100, baseScore + randomVariation));
      });
    };
    
    return {
      workLifeBalance: {
        score: avgWorkLifeBalance,
        history: generateHistory(avgWorkLifeBalance)
      },
      stressLevel: {
        score: avgStressLevel,
        history: generateHistory(avgStressLevel)
      },
      satisfaction: {
        score: avgSatisfaction,
        history: generateHistory(avgSatisfaction)
      },
      collaboration: {
        score: avgCollaboration,
        history: generateHistory(avgCollaboration)
      }
    };
    
  } catch (error) {
    console.error('Error calculating team wellbeing:', error);
    // Return default values on error
    return {
      workLifeBalance: { score: 75, history: [73, 74, 75, 75, 75] },
      stressLevel: { score: 70, history: [68, 69, 70, 70, 70] },
      satisfaction: { score: 75, history: [72, 73, 74, 75, 75] },
      collaboration: { score: 80, history: [77, 78, 79, 80, 80] }
    };
  }
};

// Comprehensive wellbeing metrics calculation
const updateWellbeingMetricsComprehensive = async (wellbeingData, tasks, attendanceRecords = null) => {
  // Update stress level based on tasks
  wellbeingData = await updateStressLevel(wellbeingData, tasks);
  
  // Update work-life balance with attendance data
  wellbeingData = await updateWorkLifeBalance(wellbeingData, attendanceRecords);
  
  // Update team wellbeing based on assigned employees' data
  const teamWellbeingData = await calculateTeamWellbeing(wellbeingData.managerId);
  wellbeingData.wellbeingMetrics.teamWellbeing = teamWellbeingData;
  
  // Save the updated wellbeing data
  await wellbeingData.save();
  
  return wellbeingData;
};

// @desc    Get wellbeing data for a manager
// @route   GET /api/manager/wellbeing
// @access  Private (Manager)
const getManagerWellbeingData = asyncHandler(async (req, res) => {
  const managerId = getManagerId(req.user);
  
  // Check if token is valid and user is authorized
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  let wellbeingData = await ManagerWellbeing.findOne({ managerId });
  
  // If no wellbeing data exists for this manager, create it with default values
  if (!wellbeingData) {
    // Initialize with default values for all required fields
    wellbeingData = await ManagerWellbeing.create({ 
      managerId,
      wellbeingMetrics: {
        workLifeBalance: {
          score: 75,
          history: [72, 73, 75, 74, 75],
          factors: {
            workHours: 8,
            breaksCount: 3,
            afterHoursWork: 1,
            focusTime: 5.5
          }
        },
        stressLevel: {
          score: 70,
          history: [68, 69, 70, 71, 70],
          factors: {
            deadlinePressure: 'Moderate',
            workload: 'Moderate',
            teamSupport: 'Moderate',
            workEnvironment: 'Neutral'
          }
        },
        jobSatisfaction: {
          score: 80,
          history: [78, 79, 80, 80, 80],
          factors: {
            roleClarity: 'Good',
            skillUtilization: 'Good',
            growthOpportunities: 'Moderate',
            teamDynamics: 'Good'
          }
        },
        teamCollaboration: {
          score: 80,
          history: [77, 78, 79, 80, 80],
          factors: {
            communicationQuality: 'Good',
            peerSupport: 'Good',
            conflictResolution: 'Moderate',
            teamworkEfficiency: 'Good'
          }
        },
        teamWellbeing: {
          workLifeBalance: {
            score: 75,
            history: [73, 74, 75, 75, 75]
          },
          stressLevel: {
            score: 70,
            history: [68, 69, 70, 70, 70]
          },
          satisfaction: {
            score: 75,
            history: [72, 73, 74, 75, 75]
          },
          collaboration: {
            score: 80,
            history: [77, 78, 79, 80, 80]
          }
        }
      },
      // Add empty arrays for histories
      moodHistory: [],
      breakHistory: [],
      activityHistory: []
    });
  }
  
  try {
    // Get tasks for stress level calculation - manager is identified by createdBy.id
    const tasks = await Task.find({ 'createdBy.id': managerId });
    
    // Get manager attendance data for the past 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let attendanceRecords = [];
    try {
      // Try to find manager by their MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(req.user._id)) {
        attendanceRecords = await ManagerAttendance.find({
          managerId: req.user._id,
          date: { $gte: thirtyDaysAgo }
        }).sort({ date: -1 });
      }
    } catch (attendanceError) {
      console.log('Manager attendance data not found or error:', attendanceError.message);
      // Continue without attendance data - not a critical error
    }
    
    // Update wellbeing metrics based on tasks and attendance data
    await updateWellbeingMetricsComprehensive(wellbeingData, tasks, attendanceRecords);
    
    // Round all percentage values to whole numbers for display
    const roundWellbeingMetrics = (metrics) => {
      if (!metrics) return metrics;
      
      return {
        ...metrics,
        workLifeBalance: {
          ...metrics.workLifeBalance,
          score: Math.round(metrics.workLifeBalance.score),
          history: metrics.workLifeBalance.history.map(val => Math.round(val))
        },
        stressLevel: {
          ...metrics.stressLevel,
          score: Math.round(metrics.stressLevel.score),
          history: metrics.stressLevel.history.map(val => Math.round(val))
        },
        jobSatisfaction: {
          ...metrics.jobSatisfaction,
          score: Math.round(metrics.jobSatisfaction.score),
          history: metrics.jobSatisfaction.history.map(val => Math.round(val))
        },
        teamCollaboration: {
          ...metrics.teamCollaboration,
          score: Math.round(metrics.teamCollaboration.score),
          history: metrics.teamCollaboration.history.map(val => Math.round(val))
        },
        teamWellbeing: metrics.teamWellbeing ? {
          workLifeBalance: {
            ...metrics.teamWellbeing.workLifeBalance,
            score: Math.round(metrics.teamWellbeing.workLifeBalance.score),
            history: metrics.teamWellbeing.workLifeBalance.history.map(val => Math.round(val))
          },
          stressLevel: {
            ...metrics.teamWellbeing.stressLevel,
            score: Math.round(metrics.teamWellbeing.stressLevel.score),
            history: metrics.teamWellbeing.stressLevel.history.map(val => Math.round(val))
          },
          satisfaction: {
            ...metrics.teamWellbeing.satisfaction,
            score: Math.round(metrics.teamWellbeing.satisfaction.score),
            history: metrics.teamWellbeing.satisfaction.history.map(val => Math.round(val))
          },
          collaboration: {
            ...metrics.teamWellbeing.collaboration,
            score: Math.round(metrics.teamWellbeing.collaboration.score),
            history: metrics.teamWellbeing.collaboration.history.map(val => Math.round(val))
          }
        } : null
      };
    };

    // Ensure response includes reminder settings with rounded values
    const responseData = {
      ...wellbeingData.toObject(),
      wellbeingMetrics: roundWellbeingMetrics(wellbeingData.wellbeingMetrics),
      reminderSettings: wellbeingData.reminderSettings || {
        breaks: {
          enabled: true,
          interval: 60,
          smartReminders: true
        },
        mood: {
          enabled: true,
          frequency: 'daily',
          time: '09:00',
          smartReminders: true
        },
        activities: {
          enabled: true,
          frequency: 'weekly',
          days: [1, 3, 5],
          time: '10:00'
        },
        teamWellbeing: {
          enabled: true,
          frequency: 'weekly',
          day: 1,
          time: '10:00'
        }
      }
    };
    
    // Debug log the response structure
    console.log('Manager Wellbeing Response Structure:', {
      managerId: managerId,
      hasWellbeingMetrics: !!responseData.wellbeingMetrics,
      workLifeBalanceScore: responseData.wellbeingMetrics?.workLifeBalance?.score,
      stressLevelScore: responseData.wellbeingMetrics?.stressLevel?.score,
      jobSatisfactionScore: responseData.wellbeingMetrics?.jobSatisfaction?.score,
      teamCollaborationScore: responseData.wellbeingMetrics?.teamCollaboration?.score
    });
    
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error in getManagerWellbeingData:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching wellbeing data',
      error: error.message
    });
  }
});

// @desc    Record a mood entry
// @route   POST /api/manager/wellbeing/mood
// @access  Private (Manager)
const recordManagerMood = asyncHandler(async (req, res) => {
  const managerId = getManagerId(req.user);
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

  let wellbeingData = await ManagerWellbeing.findOne({ managerId });

  // If no wellbeing data exists for this manager, create it
  if (!wellbeingData) {
    wellbeingData = await ManagerWellbeing.create({ 
      managerId,
      moodHistory: [moodEntry]
    });
    console.log(`Created new manager wellbeing record for ${managerId} in collection: ${ManagerWellbeing.collection.name}`);
  } else {
    // Update the notification timestamps
    wellbeingData.notificationTimestamps.lastMood = new Date();
    
    // Add the mood entry
    wellbeingData.moodHistory.push(moodEntry);
    await wellbeingData.save();
    console.log(`Updated manager wellbeing record for ${managerId} in collection: ${ManagerWellbeing.collection.name}`);
  }

  // Update wellbeing metrics based on mood
  await updateWellbeingMetricsBasedOnMood(wellbeingData, mood);

  res.status(201).json({
    message: 'Mood recorded successfully',
    moodEntry,
    managerId: managerId,
    collectionUsed: ManagerWellbeing.collection.name
  });
});

// @desc    Start a break
// @route   POST /api/manager/wellbeing/breaks/start
// @access  Private (Manager)
const startManagerBreak = asyncHandler(async (req, res) => {
  const managerId = getManagerId(req.user);
  const { type = 'regular', duration = 5 } = req.body;

  const breakEntry = {
    startTime: new Date(),
    type,
    duration: Number(duration)
  };

  let wellbeingData = await ManagerWellbeing.findOne({ managerId });

  // If no wellbeing data exists for this manager, create it
  if (!wellbeingData) {
    wellbeingData = await ManagerWellbeing.create({ 
      managerId,
      breakHistory: [breakEntry]
    });
  } else {
    // Add the break entry
    wellbeingData.breakHistory.push(breakEntry);
    await wellbeingData.save();
  }

  // Get the ID of the newly created break
  const breakId = wellbeingData.breakHistory[wellbeingData.breakHistory.length - 1]._id;

  res.status(201).json({
    message: 'Break started successfully',
    breakId,
    startTime: breakEntry.startTime
  });
});

// @desc    End a break
// @route   POST /api/manager/wellbeing/breaks/:breakId/end
// @access  Private (Manager)
const endManagerBreak = asyncHandler(async (req, res) => {
  const managerId = getManagerId(req.user);
  const { breakId } = req.params;

  let wellbeingData = await ManagerWellbeing.findOne({ managerId });

  if (!wellbeingData) {
    res.status(404);
    throw new Error('Wellbeing data not found');
  }

  // Find the break with the matching ID
  const breakIndex = wellbeingData.breakHistory.findIndex(
    breakEntry => breakEntry._id.toString() === breakId
  );

  if (breakIndex === -1) {
    res.status(404);
    throw new Error('Break not found');
  }

  const breakEntry = wellbeingData.breakHistory[breakIndex];

  // If the break is already ended, return an error
  if (breakEntry.endTime) {
    res.status(400);
    throw new Error('Break already ended');
  }

  // Set the end time and calculate duration
  const endTime = new Date();
  const durationMs = endTime - new Date(breakEntry.startTime);
  const durationMinutes = Math.round(durationMs / (1000 * 60));

  wellbeingData.breakHistory[breakIndex].endTime = endTime;
  wellbeingData.breakHistory[breakIndex].duration = durationMinutes;

  // Update notification timestamp
  wellbeingData.notificationTimestamps.lastBreak = endTime;

  await wellbeingData.save();

  // Get recent attendance data to update work-life balance comprehensively
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  let attendanceRecords = [];
  try {
    if (mongoose.Types.ObjectId.isValid(req.user._id)) {
      attendanceRecords = await ManagerAttendance.find({
        managerId: req.user._id,
        date: { $gte: thirtyDaysAgo }
      }).sort({ date: -1 });
    }
  } catch (attendanceError) {
    console.log('Manager attendance data not found:', attendanceError.message);
  }

  // Update wellbeing metrics after the break with improved score for break type
  await updateWorkLifeBalance(wellbeingData, attendanceRecords);
  
  // Additional improvement based on break type
  const breakType = breakEntry.type || 'regular';
  let additionalImprovement = 0;
  switch (breakType) {
    case 'mindfulness':
      additionalImprovement = 3;
      break;
    case 'exercise':
      additionalImprovement = 2.5;
      break;
    case 'social':
      additionalImprovement = 2;
      break;
    case 'regular':
    default:
      additionalImprovement = 1;
  }
  
  // Apply additional improvement but cap at 100
  wellbeingData.wellbeingMetrics.workLifeBalance.score = Math.min(
    wellbeingData.wellbeingMetrics.workLifeBalance.score + additionalImprovement,
    100
  );
  
  await wellbeingData.save();

  res.status(200).json({
    message: 'Break ended successfully',
    breakEntry: wellbeingData.breakHistory[breakIndex]
  });
});

// @desc    Record a wellbeing activity
// @route   POST /api/manager/wellbeing/activity
// @access  Private (Manager)
const recordManagerActivity = asyncHandler(async (req, res) => {
  const managerId = getManagerId(req.user);
  const { activity } = req.body;

  if (!activity) {
    res.status(400);
    throw new Error('Activity data is required');
  }

  const activityEntry = {
    activity,
    timestamp: new Date()
  };

  let wellbeingData = await ManagerWellbeing.findOne({ managerId });

  // If no wellbeing data exists for this manager, create it
  if (!wellbeingData) {
    wellbeingData = await ManagerWellbeing.create({ 
      managerId,
      activityHistory: [activityEntry]
    });
  } else {
    // Update the notification timestamp
    wellbeingData.notificationTimestamps.lastActivity = new Date();
    
    // Add the activity entry
    wellbeingData.activityHistory.push(activityEntry);
    await wellbeingData.save();
  }

  // Improve wellbeing metrics when activities are completed
  await improveWellbeingMetricsForActivity(wellbeingData);

  res.status(201).json({
    message: 'Activity recorded successfully',
    activityEntry
  });
});

// Helper function to improve wellbeing metrics when activities are completed
const improveWellbeingMetricsForActivity = async (wellbeingData) => {
  // Small improvement to job satisfaction
  wellbeingData.wellbeingMetrics.jobSatisfaction.score = Math.round(Math.min(
    wellbeingData.wellbeingMetrics.jobSatisfaction.score + 1,
    100
  ));
  
  // Small improvement to stress level (stress goes down = score goes up)
  wellbeingData.wellbeingMetrics.stressLevel.score = Math.round(Math.min(
    wellbeingData.wellbeingMetrics.stressLevel.score + 1,
    100
  ));
  
  // Add to history arrays if value changed
  const lastJobSatisfaction = wellbeingData.wellbeingMetrics.jobSatisfaction.history[
    wellbeingData.wellbeingMetrics.jobSatisfaction.history.length - 1
  ];
  
  if (Math.round(wellbeingData.wellbeingMetrics.jobSatisfaction.score) !== lastJobSatisfaction) {
    wellbeingData.wellbeingMetrics.jobSatisfaction.history.push(
      Math.round(wellbeingData.wellbeingMetrics.jobSatisfaction.score)
    );
    
    // Keep history array at most 30 items
    if (wellbeingData.wellbeingMetrics.jobSatisfaction.history.length > 30) {
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
    
    // Keep history array at most 30 items
    if (wellbeingData.wellbeingMetrics.stressLevel.history.length > 30) {
      wellbeingData.wellbeingMetrics.stressLevel.history.shift();
    }
  }
  
  await wellbeingData.save();
};

// @desc    Update reminder settings
// @route   PUT /api/manager/wellbeing/reminder-settings
// @access  Private (Manager)
const updateManagerReminderSettings = asyncHandler(async (req, res) => {
  const managerId = getManagerId(req.user);
  const settings = req.body;

  let wellbeingData = await ManagerWellbeing.findOne({ managerId });

  // If no wellbeing data exists for this manager, create it
  if (!wellbeingData) {
    wellbeingData = await ManagerWellbeing.create({ 
      managerId,
      reminderSettings: settings
    });
  } else {
    // Update the settings
    wellbeingData.reminderSettings = {
      ...wellbeingData.reminderSettings,
      ...settings
    };
    await wellbeingData.save();
  }

  res.status(200).json({
    message: 'Reminder settings updated successfully',
    settings: wellbeingData.reminderSettings
  });
});

// @desc    Get wellbeing history (mood, breaks, activities)
// @route   GET /api/manager/wellbeing/history
// @access  Private (Manager)
const getManagerWellbeingHistory = asyncHandler(async (req, res) => {
  const managerId = getManagerId(req.user);
  const { type, startDate, endDate } = req.query;
  
  let wellbeingData = await ManagerWellbeing.findOne({ managerId });

  if (!wellbeingData) {
    res.status(404);
    throw new Error('Wellbeing data not found');
  }

  // Filter by date range if provided
  const filterByDateRange = (entries) => {
    let filtered = entries;
    
    if (startDate) {
      const startDateTime = new Date(startDate);
      filtered = filtered.filter(entry => 
        new Date(entry.timestamp || entry.startTime) >= startDateTime
      );
    }
    
    if (endDate) {
      const endDateTime = new Date(endDate);
      filtered = filtered.filter(entry => 
        new Date(entry.timestamp || entry.startTime) <= endDateTime
      );
    }
    
    return filtered;
  };

  let result = {};
  
  // Get specific history type or all types if not specified
  if (!type || type === 'mood') {
    result.moodHistory = filterByDateRange(wellbeingData.moodHistory || []);
  }
  
  if (!type || type === 'breaks') {
    result.breakHistory = filterByDateRange(wellbeingData.breakHistory || []);
  }
  
  if (!type || type === 'activity') {
    result.activityHistory = filterByDateRange(wellbeingData.activityHistory || []);
  }
  
  res.status(200).json(result);
});

// @desc    Get insights based on wellbeing data
// @route   GET /api/manager/wellbeing/insights
// @access  Private (Manager)
const getManagerWellbeingInsights = asyncHandler(async (req, res) => {
  const managerId = getManagerId(req.user);
  
  let wellbeingData = await ManagerWellbeing.findOne({ managerId });

  if (!wellbeingData) {
    res.status(404);
    throw new Error('Wellbeing data not found');
  }

  // Get tasks for insights
  const tasks = await Task.find({ 'createdBy.id': managerId });
  
  // Generate insights based on wellbeing data
  const insights = {
    stressLevel: {
      trend: calculateTrend(wellbeingData.wellbeingMetrics.stressLevel.history, 5),
      recommendation: generateStressRecommendation(wellbeingData.wellbeingMetrics.stressLevel.score)
    },
    workLifeBalance: {
      trend: calculateTrend(wellbeingData.wellbeingMetrics.workLifeBalance.history, 5),
      recommendation: generateWorkLifeBalanceRecommendation(
        wellbeingData.wellbeingMetrics.workLifeBalance.score,
        wellbeingData.breakHistory
      )
    },
    mood: {
      trend: calculateMoodTrend(wellbeingData.moodHistory),
      recommendation: generateMoodRecommendation(wellbeingData.moodHistory)
    },
    taskManagement: {
      upcomingDeadlines: tasks.filter(task => 
        task.status !== 'completed' && 
        new Date(task.dueDate) > new Date() && 
        new Date(task.dueDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      ).length,
      recommendation: generateTaskRecommendation(tasks)
    }
  };
  
  res.status(200).json({
    message: 'Insights generated successfully',
    insights
  });
});

// Helper function to calculate trend
const calculateTrend = (history, count) => {
  if (!history || history.length < 2) return 'stable';
  
  const recent = history.slice(-count);
  const firstAvg = recent.slice(0, Math.floor(recent.length/2)).reduce((a, b) => a + b, 0) / Math.floor(recent.length/2);
  const secondAvg = recent.slice(Math.floor(recent.length/2)).reduce((a, b) => a + b, 0) / (recent.length - Math.floor(recent.length/2));
  
  if (secondAvg - firstAvg > 3) return 'improving';
  if (firstAvg - secondAvg > 3) return 'declining';
  return 'stable';
};

// Helper function to calculate mood trend
const calculateMoodTrend = (moodHistory) => {
  if (!moodHistory || moodHistory.length < 2) return 'stable';
  
  const moodValues = {
    'great': 4,
    'good': 3,
    'okay': 2,
    'bad': 1
  };
  
  const recent = moodHistory.slice(-5).map(entry => moodValues[entry.mood] || 2);
  const firstAvg = recent.slice(0, Math.floor(recent.length/2)).reduce((a, b) => a + b, 0) / Math.floor(recent.length/2);
  const secondAvg = recent.slice(Math.floor(recent.length/2)).reduce((a, b) => a + b, 0) / (recent.length - Math.floor(recent.length/2));
  
  if (secondAvg - firstAvg > 0.5) return 'improving';
  if (firstAvg - secondAvg > 0.5) return 'declining';
  return 'stable';
};

// Helper function to generate stress recommendation
const generateStressRecommendation = (stressScore) => {
  if (stressScore < 60) {
    return 'Your stress levels are high. Consider taking more breaks and delegating some tasks.';
  } else if (stressScore < 75) {
    return 'Your stress is moderate. Regular short breaks can help maintain your wellbeing.';
  } else {
    return 'Your stress levels are healthy. Keep up with your current stress management practices.';
  }
};

// Helper function to generate work-life balance recommendation
const generateWorkLifeBalanceRecommendation = (balanceScore, breakHistory) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayBreaks = breakHistory.filter(
    breakEntry => new Date(breakEntry.startTime) >= today
  );
  
  if (balanceScore < 65) {
    return 'Your work-life balance needs attention. Try to establish clear boundaries between work and personal time.';
  } else if (todayBreaks.length < 2) {
    return 'Consider taking more regular breaks throughout your workday.';
  } else {
    return 'You\'re maintaining a good work-life balance. Continue with your current practices.';
  }
};

// Helper function to generate mood recommendation
const generateMoodRecommendation = (moodHistory) => {
  if (!moodHistory || moodHistory.length === 0) {
    return 'Start tracking your mood regularly to get personalized recommendations.';
  }
  
  const recentMoods = moodHistory.slice(-3).map(entry => entry.mood);
  const hasLowMood = recentMoods.some(mood => mood === 'bad' || mood === 'okay');
  
  if (hasLowMood) {
    return 'Your recent mood has been low. Consider taking a break or engaging in activities you enjoy.';
  } else {
    return 'Your mood has been positive recently. Keep up with activities that bring you satisfaction.';
  }
};

// Helper function to generate task recommendation
const generateTaskRecommendation = (tasks) => {
  const overdueTasks = tasks.filter(task => 
    task.status !== 'completed' && new Date(task.dueDate) < new Date()
  ).length;
  
  const urgentTasks = tasks.filter(task => task.priority === 'high').length;
  
  if (overdueTasks > 3) {
    return 'You have several overdue tasks. Consider prioritizing these or delegating some tasks.';
  } else if (urgentTasks > 5) {
    return 'You have many high-priority tasks. Try breaking them down into smaller, manageable tasks.';
  } else {
    return 'Your task load appears manageable. Continue with your current task management approach.';
  }
};

// @desc    Update wellbeing metrics
// @route   PATCH /api/manager/wellbeing/metrics
// @access  Private (Manager)
const updateManagerWellbeingMetrics = asyncHandler(async (req, res) => {
  const managerId = getManagerId(req.user);
  const { metrics } = req.body;
  
  if (!metrics) {
    res.status(400);
    throw new Error('Metrics data is required');
  }
  
  let wellbeingData = await ManagerWellbeing.findOne({ managerId });

  if (!wellbeingData) {
    res.status(404);
    throw new Error('Wellbeing data not found');
  }
  
  // Update the metrics
  if (metrics.workLifeBalance) {
    wellbeingData.wellbeingMetrics.workLifeBalance = {
      ...wellbeingData.wellbeingMetrics.workLifeBalance,
      ...metrics.workLifeBalance
    };
  }
  
  if (metrics.stressLevel) {
    wellbeingData.wellbeingMetrics.stressLevel = {
      ...wellbeingData.wellbeingMetrics.stressLevel,
      ...metrics.stressLevel
    };
  }
  
  if (metrics.jobSatisfaction) {
    wellbeingData.wellbeingMetrics.jobSatisfaction = {
      ...wellbeingData.wellbeingMetrics.jobSatisfaction,
      ...metrics.jobSatisfaction
    };
  }
  
  if (metrics.teamCollaboration) {
    wellbeingData.wellbeingMetrics.teamCollaboration = {
      ...wellbeingData.wellbeingMetrics.teamCollaboration,
      ...metrics.teamCollaboration
    };
  }
  
  if (metrics.teamWellbeing) {
    wellbeingData.wellbeingMetrics.teamWellbeing = {
      ...wellbeingData.wellbeingMetrics.teamWellbeing,
      ...metrics.teamWellbeing
    };
  }
  
  await wellbeingData.save();
  
  res.status(200).json({
    message: 'Wellbeing metrics updated successfully',
    wellbeingMetrics: wellbeingData.wellbeingMetrics
  });
});

// @desc    Get manager stress levels with history
// @route   GET /api/manager/wellbeing/stress-levels
// @access  Private (Manager)
const getManagerStressLevels = asyncHandler(async (req, res) => {
  const managerId = getManagerId(req.user);
  const { period = 'month' } = req.query;
  
  let wellbeingData = await ManagerWellbeing.findOne({ managerId });
  
  if (!wellbeingData) {
    // Initialize if not found
    wellbeingData = await createInitialManagerWellbeingData(managerId);
  }
  
  // Calculate date range based on period
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default: // month
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  const stressData = {
    currentLevel: Math.round(wellbeingData.wellbeingMetrics.stressLevel.score),
    history: wellbeingData.wellbeingMetrics.stressLevel.history.slice(-30).map(val => Math.round(val)), // Last 30 entries
    factors: wellbeingData.wellbeingMetrics.stressLevel.factors,
    trend: calculateTrend(wellbeingData.wellbeingMetrics.stressLevel.history, 5),
    period
  };
  
  res.status(200).json({
    success: true,
    data: stressData
  });
});

// @desc    Get manager mood history
// @route   GET /api/manager/wellbeing/mood-history
// @access  Private (Manager)
const getMoodHistory = asyncHandler(async (req, res) => {
  const managerId = getManagerId(req.user);
  const { period = 'month' } = req.query;
  
  let wellbeingData = await ManagerWellbeing.findOne({ managerId });
  
  if (!wellbeingData) {
    wellbeingData = await createInitialManagerWellbeingData(managerId);
  }
  
  // Filter mood history based on period
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default: // month
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  const filteredMoodHistory = wellbeingData.moodHistory.filter(entry => 
    new Date(entry.timestamp) >= startDate
  );
  
  res.status(200).json({
    success: true,
    data: {
      moodHistory: filteredMoodHistory,
      period,
      trend: calculateMoodTrend(filteredMoodHistory)
    }
  });
});

// @desc    Get manager break history
// @route   GET /api/manager/wellbeing/break-history
// @access  Private (Manager)
const getBreakHistory = asyncHandler(async (req, res) => {
  const managerId = getManagerId(req.user);
  
  let wellbeingData = await ManagerWellbeing.findOne({ managerId });
  
  if (!wellbeingData) {
    wellbeingData = await createInitialManagerWellbeingData(managerId);
  }
  
  // Get today's and recent break history
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayBreaks = wellbeingData.breakHistory.filter(
    breakEntry => new Date(breakEntry.startTime) >= today
  );
  
  const weeklyBreaks = wellbeingData.breakHistory.filter(
    breakEntry => new Date(breakEntry.startTime) >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  );
  
  // Calculate total break time for today
  const totalTodayBreakTime = todayBreaks.reduce((total, breakEntry) => {
    return total + (breakEntry.duration || 0);
  }, 0);
  
  res.status(200).json({
    success: true,
    data: {
      todayBreaks,
      weeklyBreaks,
      totalTodayBreakTime,
      breakHistory: wellbeingData.breakHistory.slice(-50) // Last 50 breaks
    }
  });
});

// @desc    Get manager reminder settings
// @route   GET /api/manager/wellbeing/reminder-settings
// @access  Private (Manager)
const getReminderSettings = asyncHandler(async (req, res) => {
  const managerId = getManagerId(req.user);
  
  let wellbeingData = await ManagerWellbeing.findOne({ managerId });
  
  if (!wellbeingData) {
    wellbeingData = await createInitialManagerWellbeingData(managerId);
  }
  
  const defaultSettings = {
    moodCheckIn: { enabled: true, frequency: 'daily', time: '09:00' },
    breakReminder: { enabled: true, frequency: 'hourly', interval: 2 },
    endOfDayReflection: { enabled: true, time: '17:00' },
    wellbeingTips: { enabled: true, frequency: 'weekly' }
  };
  
  const settings = wellbeingData.reminderSettings || defaultSettings;
  
  res.status(200).json({
    success: true,
    data: settings
  });
});

// @desc    Get manager wellbeing metrics for charts
// @route   GET /api/manager/wellbeing/wellbeing-metrics
// @access  Private (Manager)
const getWellbeingMetrics = asyncHandler(async (req, res) => {
  const managerId = getManagerId(req.user);
  const { period = 'month' } = req.query;
  
  let wellbeingData = await ManagerWellbeing.findOne({ managerId });
  
  if (!wellbeingData) {
    wellbeingData = await createInitialManagerWellbeingData(managerId);
  }
  
  // Calculate date range
  const now = new Date();
  let days;
  
  switch (period) {
    case 'week':
      days = 7;
      break;
    case 'quarter':
      days = 90;
      break;
    default: // month
      days = 30;
  }
  
  const metrics = {
    stressLevel: {
      current: Math.round(wellbeingData.wellbeingMetrics.stressLevel.score),
      history: wellbeingData.wellbeingMetrics.stressLevel.history.slice(-days).map(val => Math.round(val)),
      trend: calculateTrend(wellbeingData.wellbeingMetrics.stressLevel.history, 5)
    },
    workLifeBalance: {
      current: Math.round(wellbeingData.wellbeingMetrics.workLifeBalance.score),
      history: wellbeingData.wellbeingMetrics.workLifeBalance.history.slice(-days).map(val => Math.round(val)),
      trend: calculateTrend(wellbeingData.wellbeingMetrics.workLifeBalance.history, 5)
    },
    jobSatisfaction: {
      current: Math.round(wellbeingData.wellbeingMetrics.jobSatisfaction.score),
      history: wellbeingData.wellbeingMetrics.jobSatisfaction.history.slice(-days).map(val => Math.round(val)),
      trend: calculateTrend(wellbeingData.wellbeingMetrics.jobSatisfaction.history, 5)
    },
    teamCollaboration: {
      current: Math.round(wellbeingData.wellbeingMetrics.teamCollaboration.score),
      history: wellbeingData.wellbeingMetrics.teamCollaboration.history.slice(-days).map(val => Math.round(val)),
      trend: calculateTrend(wellbeingData.wellbeingMetrics.teamCollaboration.history, 5)
    },
    moodDistribution: calculateMoodDistribution(wellbeingData.moodHistory.slice(-days)),
    period
  };
  
  res.status(200).json({
    success: true,
    data: metrics
  });
});

// Helper function to calculate mood distribution
const calculateMoodDistribution = (moodHistory) => {
  const distribution = { great: 0, good: 0, okay: 0, bad: 0 };
  
  moodHistory.forEach(entry => {
    if (distribution.hasOwnProperty(entry.mood)) {
      distribution[entry.mood]++;
    }
  });
  
  return distribution;
};

// Helper function to create initial wellbeing data
const createInitialManagerWellbeingData = async (managerId) => {
  const initialData = new ManagerWellbeing({
    managerId,
    wellbeingMetrics: {
      stressLevel: { score: 75, history: [75], factors: {} },
      workLifeBalance: { score: 75, history: [75], factors: {} },
      jobSatisfaction: { score: 75, history: [75], factors: {} },
      teamCollaboration: { score: 75, history: [75], factors: {} }
    },
    moodHistory: [],
    breakHistory: [],
    activityHistory: []
  });
  
  await initialData.save();
  return initialData;
};

// Export the controller functions
module.exports = {
  getManagerWellbeingData,
  recordManagerMood,
  startManagerBreak,
  endManagerBreak,
  recordManagerActivity,
  updateManagerReminderSettings,
  getManagerWellbeingHistory,
  getManagerWellbeingInsights,
  updateManagerWellbeingMetrics,
  getManagerStressLevels,
  getMoodHistory,
  getBreakHistory,
  getReminderSettings,
  getWellbeingMetrics
};