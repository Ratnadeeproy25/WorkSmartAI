const natural = require('natural');
const compromise = require('compromise');
const _ = require('lodash');

class PriorityEngine {
  constructor() {
    this.priorityWeights = {
      deadlineProximity: 0.35,
      userWorkload: 0.25,
      taskComplexity: 0.20,
      historicalPerformance: 0.10,
      businessImpact: 0.10
    };
    
    // Keywords that indicate high business impact
    this.businessImpactKeywords = [
      'client', 'customer', 'revenue', 'urgent', 'critical', 'deadline',
      'presentation', 'meeting', 'demo', 'launch', 'release', 'bug', 'issue'
    ];
    
    // Technical complexity indicators
    this.complexityKeywords = [
      'integrate', 'develop', 'implement', 'design', 'architecture',
      'database', 'api', 'algorithm', 'optimization', 'testing',
      'deployment', 'security', 'performance', 'scalability'
    ];
  }

  /**
   * Main method to calculate AI-powered priority
   */
  async calculateAIPriority(task, userContext = null) {
    try {
      const factors = {
        deadlineProximity: this.calculateDeadlineProximityScore(task),
        userWorkload: userContext ? this.calculateUserWorkloadScore(userContext) : 0.5,
        taskComplexity: await this.calculateTaskComplexityScore(task),
        historicalPerformance: await this.calculateHistoricalPerformanceScore(task),
        businessImpact: this.calculateBusinessImpactScore(task)
      };

      // Calculate weighted score
      const weightedScore = Object.keys(factors).reduce((total, factor) => {
        return total + (factors[factor] * this.priorityWeights[factor]);
      }, 0);

      // Convert score to priority level
      const priorityLevel = this.scoreToPriorityLevel(weightedScore);
      
      // Generate reasoning
      const reasoning = this.generatePriorityReasoning(factors, priorityLevel);
      
      // Calculate confidence based on factor consistency
      const confidence = this.calculateConfidence(factors);

      return {
        level: priorityLevel,
        score: weightedScore,
        confidence,
        reasoning,
        factors,
        recommendations: this.generateRecommendations(factors, priorityLevel)
      };
    } catch (error) {
      console.error('Error calculating AI priority:', error);
      return this.getFallbackPriority(task);
    }
  }

  /**
   * Calculate deadline proximity score (0-1, higher = more urgent)
   */
  calculateDeadlineProximityScore(task) {
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const timeDiff = dueDate - now;
    const hoursUntilDue = timeDiff / (1000 * 60 * 60);

    // Handle overdue tasks
    if (hoursUntilDue < 0) {
      return 1.0; // Maximum urgency for overdue tasks
    }

    // Calculate urgency based on time remaining
    if (hoursUntilDue <= 6) return 0.95;      // 6 hours or less
    if (hoursUntilDue <= 24) return 0.85;     // 1 day
    if (hoursUntilDue <= 72) return 0.70;     // 3 days
    if (hoursUntilDue <= 168) return 0.50;    // 1 week
    if (hoursUntilDue <= 336) return 0.30;    // 2 weeks
    if (hoursUntilDue <= 720) return 0.15;    // 1 month
    
    return 0.05; // More than a month
  }

  /**
   * Calculate user workload score (0-1, higher = more overloaded)
   */
  calculateUserWorkloadScore(userContext) {
    const activeTasks = userContext.activeTasks || 0;
    const avgCompletionTime = userContext.avgCompletionTime || 24; // hours
    const currentProgress = userContext.currentProgress || 0.5;

    // Normalize based on number of active tasks
    let workloadScore = Math.min(activeTasks / 10, 1.0); // Assume 10+ tasks = max workload
    
    // Adjust based on completion patterns
    if (avgCompletionTime > 48) workloadScore += 0.2; // Slow completion
    if (currentProgress < 0.3) workloadScore += 0.15; // Poor progress on current tasks
    
    return Math.min(workloadScore, 1.0);
  }

  /**
   * Calculate task complexity score using NLP analysis
   */
  async calculateTaskComplexityScore(task) {
    try {
      const description = task.description.toLowerCase();
      const title = task.title.toLowerCase();
      const fullText = `${title} ${description}`;
      
      let complexityScore = 0.3; // Base complexity
      
      // Analyze text length and structure
      const wordCount = fullText.split(' ').length;
      if (wordCount > 100) complexityScore += 0.3;
      else if (wordCount > 50) complexityScore += 0.2;
      else if (wordCount > 20) complexityScore += 0.1;
      
      // Check for complexity keywords
      const complexityKeywordCount = this.complexityKeywords.filter(keyword => 
        fullText.includes(keyword)
      ).length;
      complexityScore += Math.min(complexityKeywordCount * 0.05, 0.25);
      
      // Analyze subtasks
      if (task.subtasks && task.subtasks.length > 0) {
        complexityScore += Math.min(task.subtasks.length * 0.03, 0.15);
      }
      
      // Use NLP for additional analysis
      const doc = compromise(fullText);
      const verbs = doc.verbs().out('array');
      const actionVerbCount = verbs.filter(verb => 
        ['create', 'build', 'develop', 'implement', 'design', 'analyze'].includes(verb.toLowerCase())
      ).length;
      
      complexityScore += Math.min(actionVerbCount * 0.02, 0.1);
      
      return Math.min(complexityScore, 1.0);
    } catch (error) {
      console.error('Error calculating complexity score:', error);
      return 0.5; // Default complexity
    }
  }

  /**
   * Calculate historical performance score
   */
  async calculateHistoricalPerformanceScore(task) {
    // This would typically analyze user's past performance on similar tasks
    // For now, using mock implementation
    
    const userCompletionRate = 0.85; // Mock: 85% completion rate
    const avgDelayDays = 0.5; // Mock: Average 0.5 days delay
    
    let performanceScore = userCompletionRate;
    
    // Penalize for delays
    if (avgDelayDays > 1) performanceScore -= 0.2;
    else if (avgDelayDays > 0.5) performanceScore -= 0.1;
    
    return Math.max(0, Math.min(performanceScore, 1.0));
  }

  /**
   * Calculate business impact score
   */
  calculateBusinessImpactScore(task) {
    const description = task.description.toLowerCase();
    const title = task.title.toLowerCase();
    const fullText = `${title} ${description}`;
    
    let impactScore = 0.3; // Base impact
    
    // Check for business impact keywords
    const impactKeywordCount = this.businessImpactKeywords.filter(keyword => 
      fullText.includes(keyword)
    ).length;
    impactScore += Math.min(impactKeywordCount * 0.08, 0.4);
    
    // Check task priority (existing priority influences business impact)
    const priorityBonus = {
      'high': 0.3,
      'medium': 0.1,
      'low': 0
    };
    impactScore += priorityBonus[task.priority] || 0;
    
    // Check for time sensitivity indicators
    const timeSensitiveWords = ['asap', 'immediately', 'today', 'tomorrow', 'this week'];
    const timeSensitiveCount = timeSensitiveWords.filter(word => 
      fullText.includes(word)
    ).length;
    impactScore += Math.min(timeSensitiveCount * 0.1, 0.2);
    
    return Math.min(impactScore, 1.0);
  }

  /**
   * Convert weighted score to priority level
   */
  scoreToPriorityLevel(score) {
    if (score >= 0.75) return 'high';
    if (score >= 0.45) return 'medium';
    return 'low';
  }

  /**
   * Generate human-readable reasoning
   */
  generatePriorityReasoning(factors, priorityLevel) {
    const reasons = [];
    
    if (factors.deadlineProximity > 0.8) {
      reasons.push('Task has an approaching or overdue deadline');
    }
    
    if (factors.userWorkload > 0.7) {
      reasons.push('User has high current workload');
    }
    
    if (factors.taskComplexity > 0.7) {
      reasons.push('Task appears to be complex and may require significant effort');
    }
    
    if (factors.businessImpact > 0.7) {
      reasons.push('Task has high business impact or client visibility');
    }
    
    if (factors.historicalPerformance < 0.5) {
      reasons.push('Historical performance suggests prioritization may help');
    }
    
    if (reasons.length === 0) {
      reasons.push(`Task assigned ${priorityLevel} priority based on overall assessment`);
    }
    
    return reasons.join('. ');
  }

  /**
   * Calculate confidence in the priority assessment
   */
  calculateConfidence(factors) {
    // Calculate variance in factor scores
    const scores = Object.values(factors);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    
    // Lower variance = higher confidence
    const consistency = 1 - Math.min(variance, 1);
    
    // Base confidence is higher if factors are more extreme (close to 0 or 1)
    const extremeness = scores.reduce((sum, score) => {
      return sum + Math.abs(score - 0.5) * 2;
    }, 0) / scores.length;
    
    return Math.min((consistency * 0.6) + (extremeness * 0.4), 1.0);
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(factors, priorityLevel) {
    const recommendations = [];
    
    if (priorityLevel === 'high') {
      if (factors.deadlineProximity > 0.8) {
        recommendations.push('Consider working on this task immediately due to tight deadline');
      }
      if (factors.userWorkload > 0.7) {
        recommendations.push('Consider delegating other tasks to focus on this priority');
      }
    }
    
    if (factors.taskComplexity > 0.7) {
      recommendations.push('Break down this complex task into smaller subtasks');
      recommendations.push('Consider allocating extra time for this task');
    }
    
    if (factors.businessImpact > 0.7) {
      recommendations.push('Keep stakeholders updated on progress');
    }
    
    if (priorityLevel === 'low' && factors.userWorkload > 0.6) {
      recommendations.push('Consider scheduling this task for later when workload decreases');
    }
    
    return recommendations;
  }

  /**
   * Fallback priority calculation
   */
  getFallbackPriority(task) {
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
    
    let level = task.priority; // Use existing priority
    
    // Override if deadline is very close
    if (hoursUntilDue < 24) level = 'high';
    else if (hoursUntilDue < 72) level = 'medium';
    
    return {
      level,
      score: 0.5,
      confidence: 0.3,
      reasoning: 'Using fallback priority calculation due to error',
      factors: {},
      recommendations: []
    };
  }

  /**
   * Batch priority calculation for multiple tasks
   */
  async calculateBatchPriorities(tasks, userContext = null) {
    const results = [];
    
    for (const task of tasks) {
      try {
        const priority = await this.calculateAIPriority(task, userContext);
        results.push({
          taskId: task._id,
          ...priority
        });
      } catch (error) {
        console.error(`Error calculating priority for task ${task._id}:`, error);
        results.push({
          taskId: task._id,
          ...this.getFallbackPriority(task)
        });
      }
    }
    
    return results;
  }

  /**
   * Update priority weights based on feedback
   */
  updateWeights(feedback) {
    // This would implement learning from user feedback
    // For now, just logging the feedback
    console.log('Priority feedback received:', feedback);
  }
}

module.exports = new PriorityEngine(); 