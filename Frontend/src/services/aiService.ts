import api from './api';
import {
  AITaskRecommendations,
  WorkloadAnalysis,
  TeamWorkloadAnalysis,
  TaskDurationPrediction,
  TaskComplexityPrediction,
  SmartSuggestions,
  AIStatus,
  AIPrioritySuggestion,
  EnhancedAssignmentSuggestion,
  CompletionDatePrediction
} from '../types/ai';

class AIService {
  /**
   * Get comprehensive AI-powered task recommendations
   */
  async getTaskRecommendations(): Promise<{
    success: boolean;
    data: AITaskRecommendations;
    user: { id: string; name: string; role: string };
    timestamp: string;
  }> {
    try {
      const response = await api.get('/ai/recommendations');
      return response.data;
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      throw error;
    }
  }

  /**
   * Get AI priority analysis for specific tasks
   */
  async getPriorityAnalysis(taskIds: string[]): Promise<{
    success: boolean;
    data: {
      analysis: Array<{
        taskId: string;
        level: 'high' | 'medium' | 'low';
        score: number;
        confidence: number;
        reasoning: string;
        factors: any;
        recommendations: string[];
      }>;
      userContext: {
        overallLoad: number;
        activeTasks: number;
        recommendations: any[];
      };
    };
    processedTasks: number;
    timestamp: string;
  }> {
    try {
      const response = await api.post('/ai/priority-analysis', { taskIds });
      return response.data;
    } catch (error) {
      console.error('Error fetching priority analysis:', error);
      throw error;
    }
  }

  /**
   * Get personal workload analysis
   */
  async getWorkloadAnalysis(): Promise<{
    success: boolean;
    data: WorkloadAnalysis;
    user: { id: string; name: string };
    timestamp: string;
  }> {
    try {
      const response = await api.get('/ai/workload-analysis');
      return response.data;
    } catch (error) {
      console.error('Error fetching workload analysis:', error);
      throw error;
    }
  }

  /**
   * Get team workload analysis (for managers)
   */
  async getTeamWorkloadAnalysis(teamMemberIds: string[]): Promise<{
    success: boolean;
    data: TeamWorkloadAnalysis;
    manager: { id: string; name: string };
    timestamp: string;
  }> {
    try {
      const response = await api.post('/ai/team-workload-analysis', { teamMemberIds });
      return response.data;
    } catch (error) {
      console.error('Error fetching team workload analysis:', error);
      throw error;
    }
  }

  /**
   * Predict task duration using ML
   */
  async predictTaskDuration(taskData: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    subtasks?: Array<{ title: string; completed: boolean }>;
    dueDate: string;
  }): Promise<{
    success: boolean;
    data: {
      duration: TaskDurationPrediction;
      complexity: TaskComplexityPrediction;
      task: {
        id: string;
        title: string;
        priority: string;
      };
    };
    timestamp: string;
  }> {
    try {
      const response = await api.post('/ai/predict-duration', { taskData });
      return response.data;
    } catch (error) {
      console.error('Error predicting task duration:', error);
      throw error;
    }
  }

  /**
   * Predict duration for existing task
   */
  async predictExistingTaskDuration(taskId: string): Promise<{
    success: boolean;
    data: {
      duration: TaskDurationPrediction;
      complexity: TaskComplexityPrediction;
      task: {
        id: string;
        title: string;
        priority: string;
      };
    };
    timestamp: string;
  }> {
    try {
      const response = await api.post('/ai/predict-duration', { taskId });
      return response.data;
    } catch (error) {
      console.error('Error predicting existing task duration:', error);
      throw error;
    }
  }

  /**
   * Update AI models with completed task data
   */
  async updateModelWithTaskData(taskId: string): Promise<{
    success: boolean;
    message: string;
    task: {
      id: string;
      title: string;
      timeSpent: number;
    };
    timestamp: string;
  }> {
    try {
      const response = await api.post('/ai/update-model', { taskId });
      return response.data;
    } catch (error) {
      console.error('Error updating AI model:', error);
      throw error;
    }
  }

  /**
   * Get AI system status and metrics
   */
  async getAIStatus(): Promise<{
    success: boolean;
    data: AIStatus;
    timestamp: string;
  }> {
    try {
      const response = await api.get('/ai/status');
      return response.data;
    } catch (error) {
      console.error('Error fetching AI status:', error);
      throw error;
    }
  }

  /**
   * Provide feedback on AI recommendations
   */
  async provideFeedback(feedback: {
    recommendationType: 'priority' | 'workload' | 'scheduling' | 'assignment';
    recommendationId?: string;
    rating: 1 | 2 | 3 | 4 | 5;
    comments?: string;
  }): Promise<{
    success: boolean;
    message: string;
    feedback: {
      type: string;
      rating: number;
      processed: boolean;
    };
    timestamp: string;
  }> {
    try {
      const response = await api.post('/ai/feedback', feedback);
      return response.data;
    } catch (error) {
      console.error('Error providing AI feedback:', error);
      throw error;
    }
  }

  /**
   * Get smart task suggestions for daily planning
   */
  async getSmartSuggestions(): Promise<{
    success: boolean;
    data: SmartSuggestions;
    user: {
      id: string;
      name: string;
      totalActiveTasks: number;
    };
    timestamp: string;
  }> {
    try {
      const response = await api.get('/ai/smart-suggestions');
      return response.data;
    } catch (error) {
      console.error('Error fetching smart suggestions:', error);
      throw error;
    }
  }

  /**
   * Get workload suggestions for task assignment
   */
  async getAssignmentSuggestions(teamMemberIds: string[], taskData: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    dueDate: string;
  }): Promise<{
    bestAssignee: string | null;
    workloadData: TeamWorkloadAnalysis;
    reasoning: string;
  }> {
    try {
      // Get team workload analysis
      const workloadResponse = await this.getTeamWorkloadAnalysis(teamMemberIds);
      const { data: workloadData } = workloadResponse;

      // Find the best assignee based on workload balance
      let bestAssignee: string | null = null;
      let reasoning = '';

      if (workloadData.memberAnalysis.length > 0) {
        // Sort members by workload (ascending) and find the least loaded
        const sortedMembers = workloadData.memberAnalysis.sort((a, b) => a.overallLoad - b.overallLoad);
        const leastLoaded = sortedMembers[0];
        
        // Check if the least loaded member is not overloaded
        if (leastLoaded.overallLoad < 0.8) {
          bestAssignee = leastLoaded.userId;
          reasoning = `${leastLoaded.userId} has the lowest workload (${Math.round(leastLoaded.overallLoad * 100)}%) and capacity for additional tasks.`;
        } else {
          reasoning = 'All team members have high workload. Consider redistributing existing tasks or adjusting deadlines.';
        }
      }

      return { bestAssignee, workloadData, reasoning };
    } catch (error) {
      console.error('Error getting assignment suggestions:', error);
      return { bestAssignee: null, workloadData: {} as TeamWorkloadAnalysis, reasoning: 'Unable to analyze workload at this time.' };
    }
  }

  /**
   * Get AI priority suggestion based on deadline
   */
  async suggestPriorityBasedOnDeadline(dueDate: string, taskComplexity?: number): Promise<{
    suggestedPriority: 'high' | 'medium' | 'low';
    reasoning: string;
    confidence: number;
    urgencyScore: number;
  }> {
    try {
      const now = new Date();
      const deadline = new Date(dueDate);
      const hoursUntilDue = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // Calculate urgency score
      let urgencyScore = 0;
      let suggestedPriority: 'high' | 'medium' | 'low' = 'medium';
      let reasoning = '';
      
      if (hoursUntilDue < 0) {
        urgencyScore = 1.0;
        suggestedPriority = 'high';
        reasoning = 'Task is overdue and requires immediate attention';
      } else if (hoursUntilDue <= 24) {
        urgencyScore = 0.9;
        suggestedPriority = 'high';
        reasoning = 'Task is due within 24 hours - high priority recommended';
      } else if (hoursUntilDue <= 72) {
        urgencyScore = 0.7;
        suggestedPriority = 'high';
        reasoning = 'Task is due within 3 days - consider high priority';
      } else if (hoursUntilDue <= 168) {
        urgencyScore = 0.5;
        suggestedPriority = 'medium';
        reasoning = 'Task is due within a week - medium priority appropriate';
      } else {
        urgencyScore = 0.3;
        suggestedPriority = 'low';
        reasoning = 'Task has adequate time for completion - low priority suitable';
      }
      
      // Adjust based on task complexity if provided
      if (taskComplexity && taskComplexity > 0.7) {
        if (suggestedPriority === 'low') suggestedPriority = 'medium';
        else if (suggestedPriority === 'medium') suggestedPriority = 'high';
        reasoning += '. Elevated due to high task complexity';
      }
      
      const confidence = Math.min(0.9, 0.5 + (Math.abs(0.5 - urgencyScore) * 0.8));
      
      return { suggestedPriority, reasoning, confidence, urgencyScore };
    } catch (error) {
      console.error('Error suggesting priority:', error);
      return { 
        suggestedPriority: 'medium', 
        reasoning: 'Unable to calculate priority suggestion at this time',
        confidence: 0.3,
        urgencyScore: 0.5
      };
    }
  }

  /**
   * Get enhanced assignment suggestions with employee performance
   */
  async getEnhancedAssignmentSuggestions(teamMemberIds: string[], taskData: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    dueDate: string;
    estimatedHours?: number;
  }): Promise<{
    bestAssignee: string | null;
    assigneeName: string | null;
    workloadData: TeamWorkloadAnalysis;
    reasoning: string;
    confidence: number;
    alternativeAssignees: Array<{
      userId: string;
      name: string;
      workloadScore: number;
      performanceScore: number;
      overallScore: number;
      reasoning: string;
    }>;
  }> {
    try {
      // Get team workload analysis
      const workloadResponse = await this.getTeamWorkloadAnalysis(teamMemberIds);
      const { data: workloadData } = workloadResponse;

      if (workloadData.memberAnalysis.length === 0) {
        return {
          bestAssignee: null,
          assigneeName: null,
          workloadData,
          reasoning: 'No team members available for analysis',
          confidence: 0,
          alternativeAssignees: []
        };
      }

      // Calculate scores for each team member
      const memberScores = workloadData.memberAnalysis.map(member => {
        // Workload score (inverse - lower workload = higher score)
        const workloadScore = Math.max(0, 1 - member.overallLoad);
        
        // Performance score based on metrics
        const performanceScore = (
          member.performanceMetrics.completionRate * 0.4 +
          member.performanceMetrics.onTimeDeliveryRate * 0.4 +
          member.performanceMetrics.qualityScore * 0.2
        );
        
        // Overall score (weighted combination)
        const overallScore = (workloadScore * 0.6) + (performanceScore * 0.4);
        
        return {
          userId: member.userId,
          name: member.userName || member.userId, // Use userName from workload analysis
          workloadScore,
          performanceScore,
          overallScore,
          reasoning: `Workload: ${Math.round(member.overallLoad * 100)}%, Performance: ${Math.round(performanceScore * 100)}%`
        };
      });

      // Sort by overall score (descending)
      memberScores.sort((a, b) => b.overallScore - a.overallScore);
      
      const bestCandidate = memberScores[0];
      let bestAssignee = null;
      let reasoning = '';
      let confidence = 0;

      if (bestCandidate.overallScore > 0.6) {
        bestAssignee = bestCandidate.userId;
        reasoning = `${bestCandidate.name} recommended: ${bestCandidate.reasoning}. Overall suitability: ${Math.round(bestCandidate.overallScore * 100)}%`;
        confidence = Math.min(0.95, bestCandidate.overallScore);
      } else if (bestCandidate.workloadScore > 0.3) {
        bestAssignee = bestCandidate.userId;
        reasoning = `${bestCandidate.name} has the best availability, though team is generally busy. Consider deadline adjustment.`;
        confidence = 0.6;
      } else {
        reasoning = 'All team members are heavily loaded. Consider redistributing existing tasks or extending deadlines.';
        confidence = 0.3;
      }

      return {
        bestAssignee,
        assigneeName: bestCandidate.name,
        workloadData,
        reasoning,
        confidence,
        alternativeAssignees: memberScores.slice(0, 3) // Top 3 alternatives
      };
    } catch (error) {
      console.error('Error getting enhanced assignment suggestions:', error);
      return {
        bestAssignee: null,
        assigneeName: null,
        workloadData: {} as TeamWorkloadAnalysis,
        reasoning: 'Unable to analyze assignments at this time',
        confidence: 0,
        alternativeAssignees: []
      };
    }
  }

  /**
   * Predict completion date based on employee performance
   */
  async predictCompletionDate(assigneeId: string, taskData: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    estimatedHours?: number;
  }): Promise<{
    predictedCompletionDate: string;
    confidence: number;
    reasoning: string;
    factors: {
      baseEstimate: number;
      performanceMultiplier: number;
      workloadDelay: number;
      complexityAdjustment: number;
    };
    riskFactors: string[];
  }> {
    try {
      // Get assignee's workload and performance data
      const workloadResponse = await this.getWorkloadAnalysis();
      const workloadData = workloadResponse.data;

      // Get duration prediction
      const durationResponse = await this.predictTaskDuration({
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Default 1 week
      });

      const baseDuration = durationResponse.data.duration.duration;
      
      // Calculate performance multiplier based on historical data
      const completionRate = workloadData.performanceMetrics.completionRate;
      const onTimeRate = workloadData.performanceMetrics.onTimeDeliveryRate;
      const avgCompletionTime = workloadData.performanceMetrics.averageCompletionTime;
      
      // Performance multiplier (1.0 = normal, >1.0 = slower, <1.0 = faster)
      let performanceMultiplier = 1.0;
      if (completionRate < 0.8) performanceMultiplier *= 1.2;
      if (onTimeRate < 0.7) performanceMultiplier *= 1.3;
      if (avgCompletionTime > 40) performanceMultiplier *= 1.15; // If avg completion > 40 hours
      
      // Workload delay factor
      const workloadDelay = Math.max(0, (workloadData.overallLoad - 0.7) * 0.5); // Extra delay if overloaded
      
      // Complexity adjustment
      const complexity = durationResponse.data.complexity.complexity;
      const complexityAdjustment = complexity > 0.7 ? 0.2 : 0;
      
      // Calculate final duration
      const adjustedDuration = baseDuration * performanceMultiplier + workloadDelay + complexityAdjustment;
      
      // Calculate completion date
      const now = new Date();
      const completionDate = new Date(now.getTime() + adjustedDuration * 60 * 60 * 1000);
      
      // Generate reasoning
      const factors = {
        baseEstimate: baseDuration,
        performanceMultiplier,
        workloadDelay,
        complexityAdjustment
      };
      
      let reasoning = `Based on ${Math.round(baseDuration)} hour estimate`;
      if (performanceMultiplier > 1.1) reasoning += `, adjusted for performance patterns (+${Math.round((performanceMultiplier - 1) * 100)}%)`;
      if (workloadDelay > 0) reasoning += `, workload delay (+${Math.round(workloadDelay)} hours)`;
      if (complexityAdjustment > 0) reasoning += `, complexity buffer (+${Math.round(complexityAdjustment)} hours)`;
      
      // Identify risk factors
      const riskFactors = [];
      if (workloadData.overallLoad > 0.8) riskFactors.push('High current workload may cause delays');
      if (onTimeRate < 0.7) riskFactors.push('Historical on-time delivery concerns');
      if (complexity > 0.7) riskFactors.push('High task complexity increases uncertainty');
      if (workloadData.overdueTasks.length > 0) riskFactors.push('Existing overdue tasks may impact timeline');
      
      const confidence = Math.max(0.4, Math.min(0.9, 
        completionRate * 0.3 + 
        onTimeRate * 0.3 + 
        (1 - workloadData.overallLoad) * 0.2 + 
        (1 - complexity) * 0.2
      ));
      
      return {
        predictedCompletionDate: completionDate.toISOString(),
        confidence,
        reasoning,
        factors,
        riskFactors
      };
    } catch (error) {
      console.error('Error predicting completion date:', error);
      const fallbackDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 1 week
      return {
        predictedCompletionDate: fallbackDate.toISOString(),
        confidence: 0.3,
        reasoning: 'Using fallback prediction due to data unavailability',
        factors: { baseEstimate: 40, performanceMultiplier: 1, workloadDelay: 0, complexityAdjustment: 0 },
        riskFactors: ['Limited data available for accurate prediction']
      };
    }
  }
}

export default new AIService(); 