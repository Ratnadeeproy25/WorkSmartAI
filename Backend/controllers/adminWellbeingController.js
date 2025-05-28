const EmployeeWellbeing = require('../models/employeeWellbeingModel');
const ManagerWellbeing = require('../models/managerWellbeingModel');
const Employee = require('../models/employeeModel');
const Manager = require('../models/managerModel');
const asyncHandler = require('express-async-handler');

// Helper function to generate individual wellbeing data based on user characteristics
const generateIndividualWellbeingData = (user, role) => {
  // Create a seed based on user ID for consistent but individual data
  const seed = user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Use seeded random to generate consistent individual values
  const seededRandom = (min, max, offset = 0) => {
    const x = Math.sin(seed + offset) * 10000;
    const random = x - Math.floor(x);
    return Math.floor(random * (max - min + 1)) + min;
  };
  
  // Generate individual metrics based on department and role
  const departmentFactors = {
    'Engineering': { stress: 5, workLife: -5, satisfaction: 10, collaboration: 5 },
    'Marketing': { stress: -5, workLife: 5, satisfaction: 5, collaboration: 10 },
    'Sales': { stress: 10, workLife: -10, satisfaction: 15, collaboration: 5 },
    'HR': { stress: -10, workLife: 10, satisfaction: 5, collaboration: 15 },
    'Finance': { stress: 0, workLife: 0, satisfaction: 0, collaboration: 0 }
  };
  
  const factor = departmentFactors[user.department] || departmentFactors['Finance'];
  
  const baseStress = role === 'manager' ? 65 : 70;
  const baseWorkLife = role === 'manager' ? 70 : 75;
  const baseSatisfaction = role === 'manager' ? 75 : 80;
  const baseCollaboration = role === 'manager' ? 80 : 85;
  
  return {
    stressLevel: Math.max(50, Math.min(100, baseStress + factor.stress + seededRandom(-15, 15, 1))),
    workLifeBalance: Math.max(50, Math.min(100, baseWorkLife + factor.workLife + seededRandom(-15, 15, 2))),
    satisfaction: Math.max(50, Math.min(100, baseSatisfaction + factor.satisfaction + seededRandom(-15, 15, 3))),
    teamCollaboration: Math.max(50, Math.min(100, baseCollaboration + factor.collaboration + seededRandom(-15, 15, 4))),
    lastCheckIn: new Date(Date.now() - seededRandom(1, 7, 5) * 24 * 60 * 60 * 1000).toISOString(),
    moodHistory: [],
    breakHistory: [],
    activityHistory: []
  };
};

// @desc    Get all users' wellbeing data for admin dashboard
// @route   GET /api/admin/wellbeing
// @access  Private (Admin only)
const getAllWellbeingData = asyncHandler(async (req, res) => {
  try {
    // Get all employees with their wellbeing data
    const employees = await Employee.find({});
    const employeeWellbeingData = await EmployeeWellbeing.find({});
    
    // Get all managers with their wellbeing data
    const managers = await Manager.find({});
    const managerWellbeingData = await ManagerWellbeing.find({});
    
        // Debug logging (can be removed in production)
    // console.log(`Found ${employees.length} employees and ${employeeWellbeingData.length} employee wellbeing records`);
    // console.log(`Found ${managers.length} managers and ${managerWellbeingData.length} manager wellbeing records`);
    
    // Create employee wellbeing map for quick lookup
    const employeeWellbeingMap = new Map();
    employeeWellbeingData.forEach(data => {
      employeeWellbeingMap.set(data.employeeId, data);
    });
    
    // Create manager wellbeing map for quick lookup
    const managerWellbeingMap = new Map();
    managerWellbeingData.forEach(data => {
      managerWellbeingMap.set(data.managerId, data);
    });
    
    // Process employees
    const employeeResults = employees.map(employee => {
      const wellbeingData = employeeWellbeingMap.get(employee.id);
      // console.log(`Employee ${employee.id} (${employee.name}): ${wellbeingData ? 'HAS wellbeing data' : 'GENERATING individual data'}`);
      
      return {
        id: employee.id,
        name: employee.name || 'Unknown Employee',
        role: 'employee',
        department: employee.department || 'Unknown Department',
        position: employee.position || employee.designation || 'Unknown Position',
        email: employee.email,
        wellbeing: wellbeingData ? {
          stressLevel: wellbeingData.wellbeingMetrics.stressLevel.score || 75,
          workLifeBalance: wellbeingData.wellbeingMetrics.workLifeBalance.score || 75,
          satisfaction: wellbeingData.wellbeingMetrics.jobSatisfaction.score || 75,
          teamCollaboration: wellbeingData.wellbeingMetrics.teamCollaboration.score || 75,
          lastCheckIn: wellbeingData.updatedAt || wellbeingData.createdAt || new Date().toISOString(),
          moodHistory: wellbeingData.moodHistory || [],
          breakHistory: wellbeingData.breakHistory || [],
          activityHistory: wellbeingData.activityHistory || []
        } : generateIndividualWellbeingData(employee, 'employee')
      };
    });
    
    // Process managers
    const managerResults = managers.map(manager => {
      const wellbeingData = managerWellbeingMap.get(manager.id);
      // console.log(`Manager ${manager.id} (${manager.name}): ${wellbeingData ? 'HAS wellbeing data' : 'GENERATING individual data'}`);
      
      return {
          id: manager.id,
        name: manager.name || 'Unknown Manager',
        role: 'manager',
        department: manager.department || 'Unknown Department',
        position: manager.position || 'Manager',
        email: manager.email,
        wellbeing: wellbeingData ? {
          stressLevel: wellbeingData.wellbeingMetrics.stressLevel.score || 75,
          workLifeBalance: wellbeingData.wellbeingMetrics.workLifeBalance.score || 75,
          satisfaction: wellbeingData.wellbeingMetrics.jobSatisfaction.score || 75,
          teamCollaboration: wellbeingData.wellbeingMetrics.teamCollaboration.score || 75,
          lastCheckIn: wellbeingData.updatedAt || wellbeingData.createdAt || new Date().toISOString(),
          moodHistory: wellbeingData.moodHistory || [],
          breakHistory: wellbeingData.breakHistory || [],
          activityHistory: wellbeingData.activityHistory || [],
          teamWellbeing: wellbeingData.wellbeingMetrics.teamWellbeing || null
        } : {
          ...generateIndividualWellbeingData(manager, 'manager'),
          teamWellbeing: null
        }
      };
    });
    
    // Combine and return all users
    const allUsers = [...employeeResults, ...managerResults];
    
    res.status(200).json({
      success: true,
      data: allUsers,
      totalCount: allUsers.length,
      employeeCount: employeeResults.length,
      managerCount: managerResults.length
    });
    
  } catch (error) {
    console.error('Error fetching wellbeing data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wellbeing data',
      error: error.message
    });
  }
});

// @desc    Get wellbeing statistics for admin dashboard
// @route   GET /api/admin/wellbeing/stats
// @access  Private (Admin only)
const getWellbeingStatistics = asyncHandler(async (req, res) => {
  try {
    // Get all wellbeing data
    const employeeWellbeingData = await EmployeeWellbeing.find({});
    const managerWellbeingData = await ManagerWellbeing.find({});
    
    // Calculate overall statistics
    const allWellbeingData = [
      ...employeeWellbeingData.map(data => ({
        role: 'employee',
        stressLevel: data.wellbeingMetrics.stressLevel.score,
        workLifeBalance: data.wellbeingMetrics.workLifeBalance.score,
        satisfaction: data.wellbeingMetrics.jobSatisfaction.score,
        teamCollaboration: data.wellbeingMetrics.teamCollaboration.score
      })),
      ...managerWellbeingData.map(data => ({
        role: 'manager',
        stressLevel: data.wellbeingMetrics.stressLevel.score,
        workLifeBalance: data.wellbeingMetrics.workLifeBalance.score,
        satisfaction: data.wellbeingMetrics.jobSatisfaction.score,
        teamCollaboration: data.wellbeingMetrics.teamCollaboration.score
      }))
    ];
    
    if (allWellbeingData.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          averageStressLevel: 75,
          averageWorkLifeBalance: 75,
          averageSatisfaction: 75,
          averageTeamCollaboration: 75,
          wellbeingTrends: {
            improving: 0,
            stable: 0,
            declining: 0
          },
          departmentBreakdown: {},
          roleBreakdown: {
            employee: { count: 0, avgWellbeing: 75 },
            manager: { count: 0, avgWellbeing: 75 }
          }
        }
      });
    }
    
    // Calculate averages
    const averageStressLevel = Math.round(
      allWellbeingData.reduce((sum, data) => sum + data.stressLevel, 0) / allWellbeingData.length
    );
    
    const averageWorkLifeBalance = Math.round(
      allWellbeingData.reduce((sum, data) => sum + data.workLifeBalance, 0) / allWellbeingData.length
    );
    
    const averageSatisfaction = Math.round(
      allWellbeingData.reduce((sum, data) => sum + data.satisfaction, 0) / allWellbeingData.length
    );
    
    const averageTeamCollaboration = Math.round(
      allWellbeingData.reduce((sum, data) => sum + data.teamCollaboration, 0) / allWellbeingData.length
    );
    
    // Role breakdown
    const employees = allWellbeingData.filter(data => data.role === 'employee');
    const managers = allWellbeingData.filter(data => data.role === 'manager');
    
    // Fix: Ensure proper rounding by calculating individual averages first, then rounding
    const employeeAvgWellbeing = employees.length > 0 ? 
      Math.round(
        employees.reduce((sum, emp) => {
          const individualAvg = (emp.stressLevel + emp.workLifeBalance + emp.satisfaction + emp.teamCollaboration) / 4;
          return sum + individualAvg;
        }, 0) / employees.length
      ) : 75;
    
    const managerAvgWellbeing = managers.length > 0 ? 
      Math.round(
        managers.reduce((sum, mgr) => {
          const individualAvg = (mgr.stressLevel + mgr.workLifeBalance + mgr.satisfaction + mgr.teamCollaboration) / 4;
          return sum + individualAvg;
        }, 0) / managers.length
      ) : 75;
    
    // Simple trend calculation (for demo purposes)
    const wellbeingTrends = {
      improving: Math.floor(allWellbeingData.length * 0.3),
      stable: Math.floor(allWellbeingData.length * 0.5),
      declining: Math.floor(allWellbeingData.length * 0.2)
    };
    
    res.status(200).json({
      success: true,
      data: {
        averageStressLevel,
        averageWorkLifeBalance,
        averageSatisfaction,
        averageTeamCollaboration,
        wellbeingTrends,
        roleBreakdown: {
          employee: { 
            count: employees.length, 
            avgWellbeing: employeeAvgWellbeing 
          },
          manager: { 
            count: managers.length, 
            avgWellbeing: managerAvgWellbeing 
          }
        }
      }
    });
    
  } catch (error) {
    console.error('Error calculating wellbeing statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate wellbeing statistics',
      error: error.message
    });
  }
});

// @desc    Get specific user's detailed wellbeing data
// @route   GET /api/admin/wellbeing/user/:userId
// @access  Private (Admin only)
const getUserWellbeingDetails = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Try to find as employee first
    let user = await Employee.findOne({ employeeId: userId });
    let wellbeingData = await EmployeeWellbeing.findOne({ employeeId: userId });
    let userType = 'employee';
    
    // If not found as employee, try as manager
    if (!user) {
      user = await Manager.findOne({ managerId: userId });
      wellbeingData = await ManagerWellbeing.findOne({ managerId: userId });
      userType = 'manager';
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: userType === 'employee' ? user.employeeId : user.managerId,
          name: user.firstName && user.lastName ? 
                `${user.firstName} ${user.lastName}` : 
                user.name || 'Unknown User',
          email: user.email,
          role: userType,
          department: user.department,
          position: user.position || user.designation || 'Unknown Position'
        },
        wellbeingData: wellbeingData || null
      }
    });
    
  } catch (error) {
    console.error('Error fetching user wellbeing details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user wellbeing details',
      error: error.message
    });
  }
});

// @desc    Get wellbeing trends over time
// @route   GET /api/admin/wellbeing/trends
// @access  Private (Admin only)
const getWellbeingTrends = asyncHandler(async (req, res) => {
  const { timeframe = '30' } = req.query; // days
  
  try {
    const daysAgo = parseInt(timeframe);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    
    // Get recent wellbeing data
    const employeeWellbeingData = await EmployeeWellbeing.find({
      updatedAt: { $gte: cutoffDate }
    });
    
    const managerWellbeingData = await ManagerWellbeing.find({
      updatedAt: { $gte: cutoffDate }
    });
    
    // Generate trend data (simplified for demo)
    const generateTrendData = (data, metricName) => {
      const trends = [];
      const totalData = [...employeeWellbeingData, ...managerWellbeingData];
      
      for (let i = daysAgo; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Calculate average for this day (simplified - using random variation for demo)
        const baseValue = 75;
        const variation = Math.sin(i * 0.1) * 10 + Math.random() * 5;
        const value = Math.max(50, Math.min(100, baseValue + variation));
        
        trends.push({
          date: date.toISOString().split('T')[0],
          value: Math.round(value)
        });
      }
      
      return trends;
    };
    
    res.status(200).json({
      success: true,
      data: {
        stressLevel: generateTrendData(employeeWellbeingData, 'stressLevel'),
        workLifeBalance: generateTrendData(employeeWellbeingData, 'workLifeBalance'),
        satisfaction: generateTrendData(employeeWellbeingData, 'satisfaction'),
        teamCollaboration: generateTrendData(employeeWellbeingData, 'teamCollaboration')
      }
    });
    
  } catch (error) {
    console.error('Error fetching wellbeing trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wellbeing trends',
      error: error.message
    });
  }
});

module.exports = {
  getAllWellbeingData,
  getWellbeingStatistics,
  getUserWellbeingDetails,
  getWellbeingTrends
}; 