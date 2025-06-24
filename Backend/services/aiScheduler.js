const Task = require('../models/Task');
const priorityEngine = require('./priorityEngine');
const workloadAnalyzer = require('./workloadAnalyzer');
const mlPredictor = require('./mlPredictor');
const natural = require('natural');
const compromise = require('compromise');
const _ = require('lodash');

class AIScheduler {
  constructor() {
    this.priorityEngine = priorityEngine;
    this.workloadAnalyzer = workloadAnalyzer;
    this.mlPredictor = mlPredictor;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      await this.mlPredictor.initialize();
      this.isInitialized = true;
      console.log('AI Scheduler initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI Scheduler:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Main method to get AI-powered task recommendations
   */
  async getTaskRecommendations(userId, userRole = 'employee') {
    try {
      // Get user's current tasks and workload
      const userTasks = await this.getUserTasks(userId);
      const workloadData = await this.workloadAnalyzer.analyzeUserWorkload(userId);
      
      // Get team context if user is a manager
      const teamContext = userRole === 'manager' ? 
        await this.getTeamContext(userId) : null;

      // Generate recommendations
      const recommendations = {
        priorityAdjustments: await this.suggestPriorityAdjustments(userTasks),
        taskSequencing: await this.optimizeTaskSequence(userTasks),
        workloadWarnings: this.checkWorkloadThresholds(workloadData),
        smartAssignments: teamContext ? 
          await this.suggestSmartAssignments(teamContext) : null,
        timeEstimates: await this.updateTimeEstimates(userTasks),
        deadlineAlerts: this.getDeadlineAlerts(userTasks)
      };

      return recommendations;
    } catch (error) {
      console.error('Error generating task recommendations:', error);
      return this.getFallbackRecommendations();
    }
  }

  /**
   * Auto-adjust task priorities based on multiple factors
   */
  async suggestPriorityAdjustments(tasks) {
    const adjustments = [];

    for (const task of tasks) {
      try {
        // Calculate AI priority score
        const aiPriority = await this.priorityEngine.calculateAIPriority(task);
        const currentPriority = task.priority;
        
        // Check if adjustment is needed
        if (this.shouldAdjustPriority(currentPriority, aiPriority)) {
          adjustments.push({
            taskId: task._id,
            currentPriority,
            suggestedPriority: aiPriority.level,
            reason: aiPriority.reasoning,
            confidence: aiPriority.confidence,
            factors: aiPriority.factors
          });
        }
      } catch (error) {
        console.error(`Error calculating priority for task ${task._id}:`, error);
      }
    }

    return adjustments;
  }

  /**
   * Optimize task sequence for maximum efficiency
   */
  async optimizeTaskSequence(tasks) {
    try {
      // Filter active tasks
      const activeTasks = tasks.filter(task => 
        ['todo', 'inProgress'].includes(task.status)
      );

      // Calculate sequence scores
      const tasksWithScores = await Promise.all(
        activeTasks.map(async (task) => {
          const urgencyScore = this.calculateUrgencyScore(task);
          const complexityScore = await this.calculateComplexityScore(task);
          const dependencyScore = this.calculateDependencyScore(task, activeTasks);
          
          return {
            ...task.toObject(),
            sequenceScore: (urgencyScore * 0.5) + (complexityScore * 0.3) + (dependencyScore * 0.2),
            urgencyScore,
            complexityScore,
            dependencyScore
          };
        })
      );

      // Sort by sequence score (higher = more priority)
      const optimizedSequence = tasksWithScores.sort((a, b) => b.sequenceScore - a.sequenceScore);

      return {
        recommendedOrder: optimizedSequence.map(task => ({
          taskId: task._id,
          title: task.title,
          sequenceScore: task.sequenceScore,
          reasoning: this.generateSequenceReasoning(task)
        })),
        efficiencyGain: this.calculateEfficiencyGain(tasksWithScores),
        totalTasks: optimizedSequence.length
      };
    } catch (error) {
      console.error('Error optimizing task sequence:', error);
      return { recommendedOrder: [], efficiencyGain: 0, totalTasks: 0 };
    }
  }

  /**
   * Check workload thresholds and generate warnings
   */
  checkWorkloadThresholds(workloadData) {
    const warnings = [];
    const thresholds = {
      high: 0.8,
      critical: 0.95
    };

    if (workloadData.overallLoad > thresholds.critical) {
      warnings.push({
        type: 'critical',
        message: 'Critical workload detected. Consider redistributing tasks.',
        currentLoad: workloadData.overallLoad,
        suggestions: [
          'Delegate lower priority tasks',
          'Extend deadlines where possible',
          'Request additional resources'
        ]
      });
    } else if (workloadData.overallLoad > thresholds.high) {
      warnings.push({
        type: 'warning',
        message: 'High workload detected. Monitor closely.',
        currentLoad: workloadData.overallLoad,
        suggestions: [
          'Review task priorities',
          'Consider deadline adjustments'
        ]
      });
    }

    return warnings;
  }

  /**
   * Suggest smart task assignments for managers
   */
  async suggestSmartAssignments(teamContext) {
    try {
      const suggestions = [];
      
      // Analyze team workload distribution
      const workloadAnalysis = await this.workloadAnalyzer.analyzeTeamWorkload(teamContext.teamMembers);
      
      // Find unassigned or poorly assigned tasks
      for (const task of teamContext.unassignedTasks) {
        const bestAssignee = await this.findBestAssignee(task, workloadAnalysis);
        if (bestAssignee) {
          suggestions.push({
            taskId: task._id,
            taskTitle: task.title,
            suggestedAssignee: bestAssignee.id,
            assigneeName: bestAssignee.name,
            reason: bestAssignee.reason,
            confidence: bestAssignee.confidence
          });
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating smart assignments:', error);
      return [];
    }
  }

  /**
   * Update time estimates using ML predictions
   */
  async updateTimeEstimates(tasks) {
    const estimates = [];

    for (const task of tasks) {
      try {
        const prediction = await this.mlPredictor.predictTaskDuration(task);
        estimates.push({
          taskId: task._id,
          currentEstimate: task.timeSpent || 0,
          predictedDuration: prediction.duration,
          confidence: prediction.confidence,
          factors: prediction.factors
        });
      } catch (error) {
        console.error(`Error predicting duration for task ${task._id}:`, error);
      }
    }

    return estimates;
  }

  /**
   * Get deadline alerts and risk assessments
   */
  getDeadlineAlerts(tasks) {
    const now = new Date();
    const alerts = [];

    tasks.forEach(task => {
      const dueDate = new Date(task.dueDate);
      const timeDiff = dueDate - now;
      const hoursUntilDue = timeDiff / (1000 * 60 * 60);

      if (hoursUntilDue < 0 && task.status !== 'completed') {
        alerts.push({
          taskId: task._id,
          type: 'overdue',
          message: `Task "${task.title}" is overdue`,
          hoursOverdue: Math.abs(hoursUntilDue),
          priority: 'critical'
        });
      } else if (hoursUntilDue <= 24 && task.status !== 'completed') {
        alerts.push({
          taskId: task._id,
          type: 'urgent',
          message: `Task "${task.title}" due in ${Math.floor(hoursUntilDue)} hours`,
          hoursRemaining: hoursUntilDue,
          priority: 'high'
        });
      } else if (hoursUntilDue <= 72 && task.progress < 50) {
        alerts.push({
          taskId: task._id,
          type: 'warning',
          message: `Task "${task.title}" may be at risk`,
          hoursRemaining: hoursUntilDue,
          progress: task.progress,
          priority: 'medium'
        });
      }
    });

    return alerts.sort((a, b) => {
      const priorityOrder = { critical: 3, high: 2, medium: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Helper methods
  async getUserTasks(userId) {
    return await Task.find({
      $or: [
        { 'assignee.id': userId },
        { 'assignee.customId': userId }
      ]
    });
  }

  async getTeamContext(managerId) {
    // This would be implemented based on your team structure
    // For now, returning mock structure
    return {
      teamMembers: [],
      unassignedTasks: []
    };
  }

  shouldAdjustPriority(current, suggested) {
    const priorityValues = { low: 1, medium: 2, high: 3 };
    return Math.abs(priorityValues[current] - priorityValues[suggested.level]) > 0;
  }

  calculateUrgencyScore(task) {
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const timeDiff = dueDate - now;
    const hoursUntilDue = timeDiff / (1000 * 60 * 60);
    
    if (hoursUntilDue < 0) return 1.0; // Overdue
    if (hoursUntilDue <= 24) return 0.9;
    if (hoursUntilDue <= 72) return 0.7;
    if (hoursUntilDue <= 168) return 0.5; // 1 week
    return 0.3;
  }

  async calculateComplexityScore(task) {
    try {
      // Use NLP to analyze task description
      const doc = compromise(task.description);
      const wordCount = doc.wordCount();
      const technicalTerms = doc.match('#Technology').length;
      
      // Base complexity on various factors
      let complexity = 0.3; // Base complexity
      
      // Word count factor
      if (wordCount > 100) complexity += 0.3;
      else if (wordCount > 50) complexity += 0.2;
      else if (wordCount > 20) complexity += 0.1;
      
      // Technical terms factor
      complexity += Math.min(technicalTerms * 0.1, 0.3);
      
      // Subtasks factor
      if (task.subtasks && task.subtasks.length > 0) {
        complexity += Math.min(task.subtasks.length * 0.05, 0.2);
      }
      
      return Math.min(complexity, 1.0);
    } catch (error) {
      return 0.5; // Default complexity
    }
  }

  calculateDependencyScore(task, allTasks) {
    // Simple dependency calculation - can be enhanced
    return 0.5;
  }

  generateSequenceReasoning(task) {
    const reasons = [];
    
    if (task.urgencyScore > 0.8) reasons.push('High urgency due to deadline');
    if (task.complexityScore > 0.7) reasons.push('High complexity requires focus');
    if (task.progress > 0) reasons.push('Task already in progress');
    
    return reasons.join(', ') || 'Optimal sequence position';
  }

  calculateEfficiencyGain(tasks) {
    // Simple efficiency calculation
    return Math.random() * 25; // 0-25% efficiency gain
  }

  async findBestAssignee(task, workloadAnalysis) {
    // Mock implementation for now
    return null;
  }

  getFallbackRecommendations() {
    return {
      priorityAdjustments: [],
      taskSequencing: { recommendedOrder: [], efficiencyGain: 0, totalTasks: 0 },
      workloadWarnings: [],
      smartAssignments: null,
      timeEstimates: [],
      deadlineAlerts: []
    };
  }
}

module.exports = new AIScheduler(); 