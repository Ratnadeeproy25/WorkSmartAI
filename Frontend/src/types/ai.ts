// AI Recommendation Types
export interface AIRecommendation {
  type: 'priority' | 'workload' | 'scheduling' | 'assignment';
  priority: 'high' | 'medium' | 'low';
  message: string;
  actions: string[];
  confidence?: number;
}

export interface PriorityAdjustment {
  taskId: string;
  currentPriority: 'high' | 'medium' | 'low';
  suggestedPriority: 'high' | 'medium' | 'low';
  reason: string;
  confidence: number;
  factors: {
    deadlineProximity: number;
    userWorkload: number;
    taskComplexity: number;
    historicalPerformance: number;
    businessImpact: number;
  };
}

export interface TaskSequenceRecommendation {
  taskId: string;
  title: string;
  sequenceScore: number;
  reasoning: string;
}

export interface WorkloadWarning {
  type: 'critical' | 'warning';
  message: string;
  currentLoad: number;
  suggestions: string[];
}

export interface SmartAssignment {
  taskId: string;
  taskTitle: string;
  suggestedAssignee: string;
  assigneeName: string;
  reason: string;
  confidence: number;
}

export interface TimeEstimate {
  taskId: string;
  currentEstimate: number;
  predictedDuration: number;
  confidence: number;
  factors: string[];
}

export interface DeadlineAlert {
  taskId: string;
  type: 'overdue' | 'urgent' | 'warning';
  message: string;
  priority: 'critical' | 'high' | 'medium';
  hoursRemaining?: number;
  hoursOverdue?: number;
  progress?: number;
}

export interface AITaskRecommendations {
  priorityAdjustments: PriorityAdjustment[];
  taskSequencing: {
    recommendedOrder: TaskSequenceRecommendation[];
    efficiencyGain: number;
    totalTasks: number;
  };
  workloadWarnings: WorkloadWarning[];
  smartAssignments: SmartAssignment[] | null;
  timeEstimates: TimeEstimate[];
  deadlineAlerts: DeadlineAlert[];
}

export interface WorkloadAnalysis {
  userId: string;
  userName?: string;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: any[];
  upcomingDeadlines: any[];
  overallLoad: number;
  complexityDistribution: {
    counts: { low: number; medium: number; high: number };
    percentages: { low: number; medium: number; high: number };
  };
  timeDistribution: {
    overdue: number;
    today: number;
    thisWeek: number;
    nextWeek: number;
    later: number;
  };
  performanceMetrics: {
    completionRate: number;
    averageCompletionTime: number;
    onTimeDeliveryRate: number;
    qualityScore: number;
  };
  riskFactors: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    count: number;
    message: string;
  }>;
  recommendations: AIRecommendation[];
}

export interface TaskComplexityPrediction {
  complexity: number;
  confidence: number;
  factors: string[];
}

export interface TaskDurationPrediction {
  duration: number;
  confidence: number;
  factors: string[];
  method: 'linear_regression' | 'statistical' | 'fallback';
}

export interface SmartSuggestions {
  todaysFocus: TaskSequenceRecommendation[];
  priorityAdjustments: PriorityAdjustment[];
  workloadWarnings: WorkloadWarning[];
  deadlineAlerts: DeadlineAlert[];
  efficiencyTips: Array<{
    type: 'workload' | 'scheduling' | 'optimization';
    tip: string;
    impact: 'high' | 'medium' | 'low';
  }>;
}

export interface TeamWorkloadAnalysis {
  teamSummary: {
    teamSize: number;
    averageLoad: number;
    totalActiveTasks: number;
    overloadedMembers: WorkloadAnalysis[];
    underutilizedMembers: WorkloadAnalysis[];
    balanceScore: number;
    riskLevel: 'high' | 'medium' | 'low';
    redistribution: Array<{
      from: string;
      to: string;
      reason: string;
      tasksToMove: number;
    }>;
  };
  memberAnalysis: WorkloadAnalysis[];
}

export interface AIStatus {
  system: {
    isInitialized: boolean;
    status: 'initializing' | 'good' | 'fair' | 'needs_improvement';
    version: string;
    lastUpdated: string;
  };
  modelPerformance: {
    accuracy: number;
    confidence: 'high' | 'medium' | 'low';
    status: 'good' | 'fair' | 'needs_improvement' | 'insufficient_data';
    sampleSize: number;
    recentSamples: number;
  };
  learningProgress: {
    totalCompletedTasks: number;
    tasksUsedForTraining: number;
    recentLearningEvents: number;
    lastLearningEvent: string | null;
    learningRate: number;
  };
  predictionTrends: {
    improvingAccuracy: boolean;
    averageError: number;
    errorTrend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
    recentPredictions: Array<{
      taskId: string;
      predicted: number;
      actual: number;
      accuracy: number;
      timestamp: string;
    }>;
  };
  recommendations: Array<{
    type: 'data_collection' | 'model_improvement' | 'performance_alert' | 'optimization';
    priority: 'high' | 'medium' | 'low';
    message: string;
    action: string;
  }>;
  capabilities: {
    taskDurationPrediction: boolean;
    complexityAnalysis: boolean;
    assignmentSuggestions: boolean;
    priorityOptimization: boolean;
    performanceTracking: boolean;
    continuousLearning: boolean;
    ensembleModeling: boolean;
  };
}

export interface AIPrioritySuggestion {
  suggestedPriority: 'high' | 'medium' | 'low';
  reasoning: string;
  confidence: number;
  urgencyScore: number;
}

export interface EnhancedAssignmentSuggestion {
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
}

export interface CompletionDatePrediction {
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
} 