const Task = require('../models/Task');
const _ = require('lodash');

class WorkloadAnalyzer {
  constructor() {
    this.workloadThresholds = {
      light: 0.3,
      moderate: 0.6,
      heavy: 0.8,
      critical: 0.95
    };
    
    this.taskComplexityWeights = {
      low: 1,
      medium: 2,
      high: 3
    };
  }

  /**
   * Analyze workload for a specific user (with optional manager filter)
   */
  async analyzeUserWorkload(userId, managerId = null) {
    try {
      const userTasks = await this.getUserTasks(userId, managerId);
      const activeTasks = userTasks.filter(task => 
        ['todo', 'inProgress'].includes(task.status)
      );

      // Fetch user name from Employee model
      let userName = userId; // Default to ID if name not found
      try {
        const Employee = require('../models/employeeModel');
        const user = await Employee.findById(userId).select('name');
        if (user && user.name) {
          userName = user.name;
        }
      } catch (error) {
        console.log(`Could not fetch name for user ${userId}:`, error.message);
      }

      const analysis = {
        userId,
        userName, // Add userName to the analysis
        totalTasks: userTasks.length,
        activeTasks: activeTasks.length,
        completedTasks: userTasks.filter(task => task.status === 'completed').length,
        overdueTasks: this.getOverdueTasks(activeTasks),
        upcomingDeadlines: this.getUpcomingDeadlines(activeTasks),
        overallLoad: this.calculateOverallLoad(activeTasks),
        complexityDistribution: this.analyzeComplexityDistribution(activeTasks),
        timeDistribution: this.analyzeTimeDistribution(activeTasks),
        performanceMetrics: await this.calculatePerformanceMetrics(userTasks),
        riskFactors: this.identifyRiskFactors(activeTasks),
        recommendations: []
      };

      // Generate recommendations based on analysis
      analysis.recommendations = this.generateWorkloadRecommendations(analysis);

      return analysis;
    } catch (error) {
      console.error('Error analyzing user workload:', error);
      return this.getFallbackWorkloadAnalysis(userId);
    }
  }

  /**
   * Analyze workload across a team
   */
  async analyzeTeamWorkload(teamMemberIds, managerId = null) {
    try {
      console.log(`Team Workload Analysis - Manager: ${managerId}, Team Members: [${teamMemberIds.join(', ')}]`);
      
      const teamAnalysis = [];
      
      for (const memberId of teamMemberIds) {
        // For team members, get their assigned tasks (filtering by manager if provided)
        console.log(`Analyzing workload for team member: ${memberId}`);
        const memberAnalysis = await this.analyzeUserWorkload(memberId, managerId);
        teamAnalysis.push(memberAnalysis);
      }

      const totalActiveTasks = teamAnalysis.reduce((sum, member) => sum + member.activeTasks, 0);
      const totalCompletedTasks = teamAnalysis.reduce((sum, member) => sum + member.completedTasks, 0);
      
      console.log(`Team Analysis Summary - Total Active: ${totalActiveTasks}, Total Completed: ${totalCompletedTasks}`);

      const teamSummary = {
        teamSize: teamMemberIds.length,
        averageLoad: teamAnalysis.reduce((sum, member) => sum + member.overallLoad, 0) / teamAnalysis.length,
        totalActiveTasks: totalActiveTasks,
        overloadedMembers: teamAnalysis.filter(member => member.overallLoad > this.workloadThresholds.heavy),
        underutilizedMembers: teamAnalysis.filter(member => member.overallLoad < this.workloadThresholds.light),
        balanceScore: this.calculateTeamBalanceScore(teamAnalysis),
        riskLevel: this.assessTeamRiskLevel(teamAnalysis),
        redistribution: this.suggestTaskRedistribution(teamAnalysis)
      };

      return {
        teamSummary,
        memberAnalysis: teamAnalysis
      };
    } catch (error) {
      console.error('Error analyzing team workload:', error);
      return { teamSummary: {}, memberAnalysis: [] };
    }
  }

  /**
   * Calculate overall workload score for a user
   */
  calculateOverallLoad(activeTasks) {
    if (activeTasks.length === 0) return 0;

    // Base load from number of tasks
    let load = Math.min(activeTasks.length / 8, 0.6); // 8 tasks = 60% base load

    // Adjust for task complexity
    const complexityLoad = activeTasks.reduce((sum, task) => {
      return sum + (this.taskComplexityWeights[task.priority] || 2);
    }, 0) / (activeTasks.length * 3); // Normalize by max complexity

    load += complexityLoad * 0.3;

    // Adjust for deadline pressure
    const urgentTasks = activeTasks.filter(task => {
      const hoursUntilDue = this.getHoursUntilDue(task);
      return hoursUntilDue < 72; // Less than 3 days
    }).length;

    const urgencyLoad = Math.min(urgentTasks / activeTasks.length, 1) * 0.2;
    load += urgencyLoad;

    // Adjust for overdue tasks
    const overdueTasks = this.getOverdueTasks(activeTasks);
    const overdueLoad = Math.min(overdueTasks.length / activeTasks.length, 1) * 0.3;
    load += overdueLoad;

    return Math.min(load, 1.0);
  }

  /**
   * Analyze task complexity distribution
   */
  analyzeComplexityDistribution(tasks) {
    const distribution = {
      low: tasks.filter(task => task.priority === 'low').length,
      medium: tasks.filter(task => task.priority === 'medium').length,
      high: tasks.filter(task => task.priority === 'high').length
    };

    const total = tasks.length;
    return {
      counts: distribution,
      percentages: {
        low: total > 0 ? (distribution.low / total) * 100 : 0,
        medium: total > 0 ? (distribution.medium / total) * 100 : 0,
        high: total > 0 ? (distribution.high / total) * 100 : 0
      }
    };
  }

  /**
   * Analyze time distribution of tasks
   */
  analyzeTimeDistribution(tasks) {
    const now = new Date();
    const distribution = {
      overdue: 0,
      today: 0,
      thisWeek: 0,
      nextWeek: 0,
      later: 0
    };

    tasks.forEach(task => {
      const hoursUntilDue = this.getHoursUntilDue(task);
      
      if (hoursUntilDue < 0) {
        distribution.overdue++;
      } else if (hoursUntilDue <= 24) {
        distribution.today++;
      } else if (hoursUntilDue <= 168) { // 7 days
        distribution.thisWeek++;
      } else if (hoursUntilDue <= 336) { // 14 days
        distribution.nextWeek++;
      } else {
        distribution.later++;
      }
    });

    return distribution;
  }

  /**
   * Calculate performance metrics
   */
  async calculatePerformanceMetrics(userTasks) {
    const completedTasks = userTasks.filter(task => task.status === 'completed');
    const totalTasks = userTasks.length;

    if (totalTasks === 0) {
      return {
        completionRate: 0,
        averageCompletionTime: 0,
        onTimeDeliveryRate: 0,
        qualityScore: 0.5
      };
    }

    // Calculate completion rate
    const completionRate = completedTasks.length / totalTasks;

    // Calculate average completion time (mock calculation)
    const averageCompletionTime = completedTasks.reduce((sum, task) => {
      const createdAt = new Date(task.createdAt);
      const updatedAt = new Date(task.updatedAt);
      const completionHours = (updatedAt - createdAt) / (1000 * 60 * 60);
      return sum + completionHours;
    }, 0) / (completedTasks.length || 1);

    // Calculate on-time delivery rate
    const onTimeDeliveries = completedTasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      const completedDate = new Date(task.updatedAt);
      return completedDate <= dueDate;
    }).length;

    const onTimeDeliveryRate = completedTasks.length > 0 ? 
      onTimeDeliveries / completedTasks.length : 0;

    // Mock quality score based on completion patterns
    const qualityScore = Math.min((completionRate * 0.4) + (onTimeDeliveryRate * 0.6), 1.0);

    return {
      completionRate,
      averageCompletionTime,
      onTimeDeliveryRate,
      qualityScore
    };
  }

  /**
   * Identify risk factors in workload
   */
  identifyRiskFactors(activeTasks) {
    const risks = [];

    // Check for overdue tasks
    const overdueTasks = this.getOverdueTasks(activeTasks);
    if (overdueTasks.length > 0) {
      risks.push({
        type: 'overdue_tasks',
        severity: 'high',
        count: overdueTasks.length,
        message: `${overdueTasks.length} overdue task(s) requiring immediate attention`
      });
    }

    // Check for deadline clustering
    const urgentTasks = activeTasks.filter(task => {
      const hoursUntilDue = this.getHoursUntilDue(task);
      return hoursUntilDue > 0 && hoursUntilDue <= 48;
    });

    if (urgentTasks.length > 3) {
      risks.push({
        type: 'deadline_clustering',
        severity: 'medium',
        count: urgentTasks.length,
        message: `${urgentTasks.length} tasks due within 48 hours`
      });
    }

    // Check for high complexity overload
    const highPriorityTasks = activeTasks.filter(task => task.priority === 'high');
    if (highPriorityTasks.length > 5) {
      risks.push({
        type: 'complexity_overload',
        severity: 'medium',
        count: highPriorityTasks.length,
        message: `${highPriorityTasks.length} high-priority tasks may cause burnout`
      });
    }

    return risks;
  }

  /**
   * Generate workload recommendations
   */
  generateWorkloadRecommendations(analysis) {
    const recommendations = [];

    // High workload recommendations
    if (analysis.overallLoad > this.workloadThresholds.critical) {
      recommendations.push({
        type: 'critical_action',
        priority: 'high',
        message: 'Critical workload detected - immediate action required',
        actions: [
          'Delegate or postpone non-critical tasks',
          'Request additional resources',
          'Extend deadlines where possible'
        ]
      });
    } else if (analysis.overallLoad > this.workloadThresholds.heavy) {
      recommendations.push({
        type: 'workload_management',
        priority: 'medium',
        message: 'Heavy workload - monitor closely',
        actions: [
          'Review task priorities',
          'Consider breaking down complex tasks',
          'Schedule regular check-ins'
        ]
      });
    }

    // Overdue task recommendations
    if (analysis.overdueTasks.length > 0) {
      recommendations.push({
        type: 'overdue_tasks',
        priority: 'high',
        message: `Address ${analysis.overdueTasks.length} overdue task(s)`,
        actions: [
          'Prioritize overdue tasks immediately',
          'Communicate with stakeholders about delays',
          'Reassess realistic completion dates'
        ]
      });
    }

    // Performance improvement recommendations
    if (analysis.performanceMetrics.onTimeDeliveryRate < 0.7) {
      recommendations.push({
        type: 'performance_improvement',
        priority: 'medium',
        message: 'Consider strategies to improve on-time delivery',
        actions: [
          'Build buffer time into estimates',
          'Improve task breakdown and planning',
          'Regular progress reviews'
        ]
      });
    }

    // Low utilization recommendations
    if (analysis.overallLoad < this.workloadThresholds.light) {
      recommendations.push({
        type: 'utilization',
        priority: 'low',
        message: 'Capacity available for additional tasks',
        actions: [
          'Consider taking on additional responsibilities',
          'Offer help to overloaded team members',
          'Focus on skill development'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Calculate team balance score
   */
  calculateTeamBalanceScore(teamAnalysis) {
    if (teamAnalysis.length === 0) return 0;

    const loads = teamAnalysis.map(member => member.overallLoad);
    const mean = loads.reduce((sum, load) => sum + load, 0) / loads.length;
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - mean, 2), 0) / loads.length;
    
    // Lower variance = better balance (score closer to 1)
    return Math.max(0, 1 - variance);
  }

  /**
   * Assess team risk level
   */
  assessTeamRiskLevel(teamAnalysis) {
    const overloadedMembers = teamAnalysis.filter(member => 
      member.overallLoad > this.workloadThresholds.heavy
    ).length;
    
    const totalMembers = teamAnalysis.length;
    const overloadPercentage = overloadedMembers / totalMembers;

    if (overloadPercentage > 0.5) return 'high';
    if (overloadPercentage > 0.25) return 'medium';
    return 'low';
  }

  /**
   * Suggest task redistribution
   */
  suggestTaskRedistribution(teamAnalysis) {
    const overloaded = teamAnalysis.filter(member => 
      member.overallLoad > this.workloadThresholds.heavy
    );
    
    const underutilized = teamAnalysis.filter(member => 
      member.overallLoad < this.workloadThresholds.moderate
    );

    const suggestions = [];

    overloaded.forEach(member => {
      const availableMembers = underutilized.filter(available => 
        available.userId !== member.userId
      );

      if (availableMembers.length > 0) {
        // Sort by lowest workload
        availableMembers.sort((a, b) => a.overallLoad - b.overallLoad);
        
        suggestions.push({
          from: member.userId,
          fromName: member.userName || member.userId,
          to: availableMembers[0].userId,
          toName: availableMembers[0].userName || availableMembers[0].userId,
          reason: 'Balance workload distribution',
          tasksToMove: Math.ceil(member.activeTasks * 0.2) // Move 20% of tasks
        });
      }
    });

    return suggestions;
  }

  // Helper methods
  async getUserTasks(userId, managerId = null) {
    let query = {
      $or: [
        { 'assignee.id': userId },
        { 'assignee.customId': userId }
      ]
    };

    // NOTE: For team workload analysis, we want to see ALL tasks assigned to team members,
    // regardless of who created them. The managerId parameter is kept for potential future use
    // but we don't filter by createdBy.id as managers should see their team's complete workload.

    const tasks = await Task.find(query);
    
    // Debug logging
    console.log(`Workload Analysis - User: ${userId}, All tasks assigned to user: ${tasks.length}`);
    if (tasks.length > 0) {
      console.log('Task details:', tasks.map(t => ({
        id: t._id,
        title: t.title,
        status: t.status,
        assigneeId: t.assignee.id,
        createdById: t.createdBy.id
      })));
    }

    return tasks;
  }

  getOverdueTasks(tasks) {
    const now = new Date();
    return tasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      return dueDate < now;
    });
  }

  getUpcomingDeadlines(tasks) {
    const now = new Date();
    return tasks.filter(task => {
      const hoursUntilDue = this.getHoursUntilDue(task);
      return hoursUntilDue > 0 && hoursUntilDue <= 72; // Next 3 days
    }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  getHoursUntilDue(task) {
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    return (dueDate - now) / (1000 * 60 * 60);
  }

  getFallbackWorkloadAnalysis(userId) {
    return {
      userId,
      userName: userId, // Default to userId if name not available
      totalTasks: 0,
      activeTasks: 0,
      completedTasks: 0,
      overdueTasks: [],
      upcomingDeadlines: [],
      overallLoad: 0,
      complexityDistribution: { counts: { low: 0, medium: 0, high: 0 }, percentages: { low: 0, medium: 0, high: 0 } },
      timeDistribution: { overdue: 0, today: 0, thisWeek: 0, nextWeek: 0, later: 0 },
      performanceMetrics: { completionRate: 0, averageCompletionTime: 0, onTimeDeliveryRate: 0, qualityScore: 0.5 },
      riskFactors: [],
      recommendations: []
    };
  }
}

module.exports = new WorkloadAnalyzer(); 