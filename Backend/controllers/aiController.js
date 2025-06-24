const asyncHandler = require('express-async-handler');
const aiScheduler = require('../services/aiScheduler');
const priorityEngine = require('../services/priorityEngine');
const workloadAnalyzer = require('../services/workloadAnalyzer');
const mlPredictor = require('../services/mlPredictor');
const Task = require('../models/Task');

/**
 * @desc    Get AI-powered task recommendations
 * @route   GET /api/ai/recommendations
 * @access  Private
 */
const getTaskRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id.toString();
  const userRole = req.user.role || 'employee';

  try {
    const recommendations = await aiScheduler.getTaskRecommendations(userId, userRole);
    
    res.status(200).json({
      success: true,
      data: recommendations,
      user: {
        id: userId,
        name: req.user.name,
        role: userRole
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting AI recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI recommendations',
      error: error.message
    });
  }
});

/**
 * @desc    Get AI priority suggestions for specific tasks
 * @route   POST /api/ai/priority-analysis
 * @access  Private
 */
const getPriorityAnalysis = asyncHandler(async (req, res) => {
  const { taskIds } = req.body;
  const userId = req.user.id || req.user._id.toString();

  if (!taskIds || !Array.isArray(taskIds)) {
    res.status(400);
    throw new Error('Please provide an array of task IDs');
  }

  try {
    // Get tasks
    const tasks = await Task.find({
      _id: { $in: taskIds },
      $or: [
        { 'assignee.id': userId },
        { 'assignee.customId': userId },
        { 'createdBy.id': userId }
      ]
    });

    if (tasks.length === 0) {
      res.status(404);
      throw new Error('No tasks found or access denied');
    }

    // Get user context
    const userContext = await workloadAnalyzer.analyzeUserWorkload(userId);

    // Analyze priorities
    const priorityAnalysis = await priorityEngine.calculateBatchPriorities(tasks, userContext);

    res.status(200).json({
      success: true,
      data: {
        analysis: priorityAnalysis,
        userContext: {
          overallLoad: userContext.overallLoad,
          activeTasks: userContext.activeTasks,
          recommendations: userContext.recommendations
        }
      },
      processedTasks: tasks.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error analyzing task priorities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze task priorities',
      error: error.message
    });
  }
});

/**
 * @desc    Get workload analysis for user
 * @route   GET /api/ai/workload-analysis
 * @access  Private
 */
const getWorkloadAnalysis = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id.toString();

  try {
    const workloadAnalysis = await workloadAnalyzer.analyzeUserWorkload(userId);

    res.status(200).json({
      success: true,
      data: workloadAnalysis,
      user: {
        id: userId,
        name: req.user.name
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error analyzing workload:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze workload',
      error: error.message
    });
  }
});

/**
 * @desc    Get team workload analysis (for managers)
 * @route   GET /api/ai/team-workload-analysis
 * @access  Private/Manager
 */
const getTeamWorkloadAnalysis = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id.toString();
  const userRole = req.user.role;

  // Check if user is manager or admin
  if (userRole !== 'manager' && userRole !== 'admin') {
    res.status(403);
    throw new Error('Access denied. Manager or admin role required.');
  }

  try {
    const { teamMemberIds } = req.body;
    
    if (!teamMemberIds || !Array.isArray(teamMemberIds)) {
      res.status(400);
      throw new Error('Please provide team member IDs');
    }

    // Pass the manager's ID to analyze only tasks created by this manager
    const teamAnalysis = await workloadAnalyzer.analyzeTeamWorkload(teamMemberIds, userId);

    res.status(200).json({
      success: true,
      data: teamAnalysis,
      manager: {
        id: userId,
        name: req.user.name
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error analyzing team workload:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze team workload',
      error: error.message
    });
  }
});

/**
 * @desc    Predict task duration using ML
 * @route   POST /api/ai/predict-duration
 * @access  Private
 */
const predictTaskDuration = asyncHandler(async (req, res) => {
  const { taskId, taskData } = req.body;
  const userId = req.user.id || req.user._id.toString();

  try {
    let task;

    if (taskId) {
      // Predict for existing task
      task = await Task.findById(taskId);
      if (!task) {
        res.status(404);
        throw new Error('Task not found');
      }

      // Check access
      const hasAccess = task.assignee.id === userId || 
                       task.assignee.customId === userId || 
                       task.createdBy.id === userId;
      
      if (!hasAccess) {
        res.status(403);
        throw new Error('Access denied');
      }
    } else if (taskData) {
      // Predict for new task data
      task = taskData;
    } else {
      res.status(400);
      throw new Error('Please provide either taskId or taskData');
    }

    const prediction = await mlPredictor.predictTaskDuration(task);
    const complexityPrediction = await mlPredictor.predictComplexity(task);

    res.status(200).json({
      success: true,
      data: {
        duration: prediction,
        complexity: complexityPrediction,
        task: {
          id: task._id || 'new',
          title: task.title,
          priority: task.priority
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error predicting task duration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to predict task duration',
      error: error.message
    });
  }
});

/**
 * @desc    Update AI models with completed task data
 * @route   POST /api/ai/update-model
 * @access  Private
 */
const updateModelWithTaskData = asyncHandler(async (req, res) => {
  const { taskId } = req.body;
  const userId = req.user.id || req.user._id.toString();

  if (!taskId) {
    res.status(400);
    throw new Error('Please provide task ID');
  }

  try {
    const task = await Task.findById(taskId);
    
    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    // Check if task is completed and user has access
    if (task.status !== 'completed') {
      res.status(400);
      throw new Error('Task must be completed to update model');
    }

    const hasAccess = task.assignee.id === userId || 
                     task.assignee.customId === userId || 
                     task.createdBy.id === userId;
    
    if (!hasAccess) {
      res.status(403);
      throw new Error('Access denied');
    }

    // Update ML model with new data
    await mlPredictor.updateWithNewData(task);

    res.status(200).json({
      success: true,
      message: 'AI model updated with task completion data',
      task: {
        id: task._id,
        title: task.title,
        timeSpent: task.timeSpent
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating AI model:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update AI model',
      error: error.message
    });
  }
});

/**
 * @desc    Get AI system status and performance metrics
 * @route   GET /api/ai/status
 * @access  Private
 */
const getAIStatus = asyncHandler(async (req, res) => {
  try {
    // Get basic model status
    const modelMetrics = mlPredictor.getModelMetrics();
    
    // Get advanced performance metrics if available
    const performanceMetrics = await mlPredictor.calculateModelMetrics();
    
    // Get learning history statistics
    const learningStats = mlPredictor.learningHistory || [];
    const recentLearning = learningStats.slice(-10);
    
    // Get performance history
    const performanceHistory = mlPredictor.performanceHistory || [];
    const recentPerformance = performanceHistory.slice(-10);
    
    // Calculate learning trends
    const learningTrends = calculateLearningTrends(performanceHistory);
    
    // Get task completion count for context
    const completedTasksCount = await Task.countDocuments({ 
      status: 'completed', 
      timeSpent: { $gt: 0 } 
    });

    const status = {
      system: {
        isInitialized: mlPredictor.isInitialized,
        status: performanceMetrics.status || 'initializing',
        version: '2.0.0',
        lastUpdated: performanceMetrics.lastUpdated || new Date().toISOString()
      },
      modelPerformance: {
        accuracy: performanceMetrics.accuracy || 0,
        confidence: performanceMetrics.accuracy > 70 ? 'high' : 
                   performanceMetrics.accuracy > 50 ? 'medium' : 'low',
        status: performanceMetrics.status || 'insufficient_data',
        sampleSize: performanceMetrics.sampleSize || 0,
        recentSamples: performanceMetrics.recentSamples || 0
      },
      learningProgress: {
        totalCompletedTasks: completedTasksCount,
        tasksUsedForTraining: modelMetrics.trainingDataSize || 0,
        recentLearningEvents: recentLearning.length,
        lastLearningEvent: recentLearning.length > 0 ? 
          recentLearning[recentLearning.length - 1].timestamp : null,
        learningRate: calculateLearningRate(learningStats)
      },
      predictionTrends: {
        improvingAccuracy: learningTrends.improving,
        averageError: learningTrends.averageError,
        errorTrend: learningTrends.errorTrend,
        recentPredictions: recentPerformance.map(p => ({
          taskId: p.taskId,
          predicted: Math.round(p.predicted * 10) / 10,
          actual: Math.round(p.actual * 10) / 10,
          accuracy: Math.round((100 - p.percentageError) * 10) / 10,
          timestamp: p.timestamp
        }))
      },
      recommendations: generateAIRecommendations(performanceMetrics, learningTrends),
      capabilities: {
        taskDurationPrediction: true,
        complexityAnalysis: true,
        assignmentSuggestions: true,
        priorityOptimization: true,
        performanceTracking: true,
        continuousLearning: true,
        ensembleModeling: modelMetrics.trainingDataSize > 50
      }
    };

    res.status(200).json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting AI status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI status',
      error: error.message
    });
  }
});

/**
 * Calculate learning trends from performance history
 */
function calculateLearningTrends(performanceHistory) {
  if (performanceHistory.length < 5) {
    return {
      improving: false,
      averageError: 0,
      errorTrend: 'insufficient_data'
    };
  }

  const recent = performanceHistory.slice(-10);
  const older = performanceHistory.slice(-20, -10);
  
  const recentAvgError = recent.reduce((sum, p) => sum + p.percentageError, 0) / recent.length;
  const olderAvgError = older.length > 0 ? 
    older.reduce((sum, p) => sum + p.percentageError, 0) / older.length : 
    recentAvgError;

  const improving = recentAvgError < olderAvgError;
  const errorTrend = improving ? 'improving' : 
                    recentAvgError > olderAvgError ? 'declining' : 'stable';

  return {
    improving,
    averageError: Math.round(recentAvgError * 10) / 10,
    errorTrend
  };
}

/**
 * Calculate learning rate (tasks learned per day)
 */
function calculateLearningRate(learningStats) {
  if (learningStats.length < 2) return 0;

  const recent = learningStats.slice(-30); // Last 30 learning events
  if (recent.length < 2) return 0;

  const firstEvent = new Date(recent[0].timestamp);
  const lastEvent = new Date(recent[recent.length - 1].timestamp);
  const daysDifference = (lastEvent - firstEvent) / (1000 * 60 * 60 * 24);
  
  if (daysDifference === 0) return recent.length;
  
  return Math.round((recent.length / daysDifference) * 10) / 10;
}

/**
 * Generate AI recommendations based on performance
 */
function generateAIRecommendations(performanceMetrics, learningTrends) {
  const recommendations = [];

  if (performanceMetrics.sampleSize < 20) {
    recommendations.push({
      type: 'data_collection',
      priority: 'high',
      message: 'More completed tasks with time tracking needed for better predictions',
      action: 'Encourage time tracking for task completion'
    });
  }

  if (performanceMetrics.accuracy < 50) {
    recommendations.push({
      type: 'model_improvement',
      priority: 'high',
      message: 'Model accuracy is low. Consider reviewing task complexity factors',
      action: 'Review and improve feature extraction'
    });
  }

  if (learningTrends.errorTrend === 'declining') {
    recommendations.push({
      type: 'performance_alert',
      priority: 'medium',
      message: 'Prediction accuracy is declining. May need model retraining',
      action: 'Investigate recent task patterns'
    });
  }

  if (performanceMetrics.accuracy > 80) {
    recommendations.push({
      type: 'optimization',
      priority: 'low',
      message: 'AI is performing well. Consider expanding to more features',
      action: 'Explore advanced prediction features'
    });
  }

  return recommendations;
}

/**
 * @desc    Provide feedback on AI recommendations
 * @route   POST /api/ai/feedback
 * @access  Private
 */
const provideFeedback = asyncHandler(async (req, res) => {
  const { recommendationType, recommendationId, rating, comments } = req.body;
  const userId = req.user.id || req.user._id.toString();

  if (!recommendationType || !rating) {
    res.status(400);
    throw new Error('Please provide recommendation type and rating');
  }

  try {
    const feedback = {
      userId,
      userName: req.user.name,
      recommendationType,
      recommendationId,
      rating, // 1-5 scale
      comments,
      timestamp: new Date().toISOString()
    };

    // Update AI models with feedback
    if (recommendationType === 'priority') {
      priorityEngine.updateWeights(feedback);
    }

    // Store feedback (in a real implementation, you'd save this to a database)
    console.log('AI Feedback received:', feedback);

    res.status(200).json({
      success: true,
      message: 'Feedback received and AI models updated',
      feedback: {
        type: recommendationType,
        rating,
        processed: true
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing AI feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process feedback',
      error: error.message
    });
  }
});

/**
 * @desc    Get smart task suggestions for optimal scheduling
 * @route   GET /api/ai/smart-suggestions
 * @access  Private
 */
const getSmartSuggestions = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id.toString();
  const userRole = req.user.role || 'employee';

  try {
    // Get user's current tasks
    const userTasks = await Task.find({
      $or: [
        { 'assignee.id': userId },
        { 'assignee.customId': userId }
      ],
      status: { $in: ['todo', 'inProgress'] }
    });

    // Get AI recommendations
    const recommendations = await aiScheduler.getTaskRecommendations(userId, userRole);

    // Generate smart suggestions
    const suggestions = {
      todaysFocus: recommendations.taskSequencing.recommendedOrder.slice(0, 3),
      priorityAdjustments: recommendations.priorityAdjustments.filter(adj => adj.confidence > 0.7),
      workloadWarnings: recommendations.workloadWarnings,
      deadlineAlerts: recommendations.deadlineAlerts.slice(0, 5),
      efficiencyTips: generateEfficiencyTips(userTasks, recommendations)
    };

    res.status(200).json({
      success: true,
      data: suggestions,
      user: {
        id: userId,
        name: req.user.name,
        totalActiveTasks: userTasks.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating smart suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate smart suggestions',
      error: error.message
    });
  }
});

/**
 * Helper function to generate efficiency tips
 */
function generateEfficiencyTips(userTasks, recommendations) {
  const tips = [];
  
  if (userTasks.length > 8) {
    tips.push({
      type: 'workload',
      tip: 'Consider breaking down large tasks into smaller, manageable chunks',
      impact: 'high'
    });
  }
  
  if (recommendations.deadlineAlerts.length > 3) {
    tips.push({
      type: 'scheduling',
      tip: 'Focus on deadline-driven tasks first to avoid last-minute stress',
      impact: 'high'
    });
  }
  
  if (recommendations.taskSequencing.efficiencyGain > 15) {
    tips.push({
      type: 'optimization',
      tip: `Following AI-suggested task order could improve efficiency by ${Math.round(recommendations.taskSequencing.efficiencyGain)}%`,
      impact: 'medium'
    });
  }
  
  return tips;
}

module.exports = {
  getTaskRecommendations,
  getPriorityAnalysis,
  getWorkloadAnalysis,
  getTeamWorkloadAnalysis,
  predictTaskDuration,
  updateModelWithTaskData,
  getAIStatus,
  provideFeedback,
  getSmartSuggestions
}; 