import React, { useState, useEffect } from 'react';
import aiService from '../../services/aiService';
import { getTeamMembers } from '../../services/managerService';
import {
  SmartSuggestions,
  WorkloadAnalysis,
  AIRecommendation,
  DeadlineAlert,
  TaskSequenceRecommendation
} from '../../types/ai';

interface AIDashboardProps {
  userRole: 'employee' | 'manager';
  onTaskAction?: (action: string, taskId: string) => void;
}

const AIDashboard: React.FC<AIDashboardProps> = ({ userRole, onTaskAction }) => {
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestions | null>(null);
  const [workloadAnalysis, setWorkloadAnalysis] = useState<WorkloadAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'workload'>('suggestions');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    fetchAIData();
    
    // Refresh AI data periodically
    const interval = setInterval(fetchAIData, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  const fetchAIData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (userRole === 'manager') {
        // For managers, get team-wide AI recommendations and workload analysis
        
        // First, get team member IDs
        const teamMembers = await getTeamMembers();
        const teamMemberIds = teamMembers.map(member => member.id);
        
        if (teamMemberIds.length === 0) {
          // If no team members, show empty state
          setSmartSuggestions({
            todaysFocus: [],
            priorityAdjustments: [],
            workloadWarnings: [],
            deadlineAlerts: [],
            efficiencyTips: [{
              type: 'workload',
              tip: 'No team members found. Assign employees to your team to see AI insights.',
              impact: 'high'
            }]
          });
          setWorkloadAnalysis({
            userId: 'manager',
            totalTasks: 0,
            activeTasks: 0,
            completedTasks: 0,
            overdueTasks: [],
            upcomingDeadlines: [],
            overallLoad: 0,
            complexityDistribution: { counts: { low: 0, medium: 0, high: 0 }, percentages: { low: 0, medium: 0, high: 0 } },
            timeDistribution: { overdue: 0, today: 0, thisWeek: 0, nextWeek: 0, later: 0 },
            performanceMetrics: { completionRate: 0, averageCompletionTime: 0, onTimeDeliveryRate: 0, qualityScore: 0 },
            riskFactors: [],
            recommendations: []
          });
          return;
        }
        
        const [suggestionsResponse, teamWorkloadResponse] = await Promise.all([
          aiService.getTaskRecommendations(), // Get comprehensive team recommendations
          aiService.getTeamWorkloadAnalysis(teamMemberIds) // Use actual team member IDs
        ]);
        
        // Debug logging to verify team data
        console.log('Manager AI Dashboard - Team Data:', {
          teamMemberIds,
          teamSize: teamWorkloadResponse.data.teamSummary.teamSize,
          memberCount: teamWorkloadResponse.data.memberAnalysis.length,
          memberData: teamWorkloadResponse.data.memberAnalysis.map(member => ({
            userId: member.userId,
            totalTasks: member.totalTasks,
            activeTasks: member.activeTasks,
            completedTasks: member.completedTasks
          }))
        });
        
        // Transform team workload data for display
        const activeTasks = teamWorkloadResponse.data.memberAnalysis.reduce((total, member) => 
          total + member.activeTasks, 0);
        const completedTasks = teamWorkloadResponse.data.memberAnalysis.reduce((total, member) => 
          total + member.completedTasks, 0);
        
        const managerWorkloadData = {
          userId: 'manager',
          totalTasks: activeTasks + completedTasks,
          activeTasks: activeTasks,
          completedTasks: completedTasks,
          overdueTasks: teamWorkloadResponse.data.memberAnalysis.flatMap(member => member.overdueTasks),
          upcomingDeadlines: teamWorkloadResponse.data.memberAnalysis.flatMap(member => member.upcomingDeadlines),
          overallLoad: teamWorkloadResponse.data.teamSummary.averageLoad,
          complexityDistribution: {
            counts: teamWorkloadResponse.data.memberAnalysis.reduce((acc, member) => ({
              low: acc.low + member.complexityDistribution.counts.low,
              medium: acc.medium + member.complexityDistribution.counts.medium,
              high: acc.high + member.complexityDistribution.counts.high
            }), { low: 0, medium: 0, high: 0 }),
            percentages: { low: 0, medium: 0, high: 0 } // Will be calculated below
          },
          timeDistribution: teamWorkloadResponse.data.memberAnalysis.reduce((acc, member) => ({
            overdue: acc.overdue + member.timeDistribution.overdue,
            today: acc.today + member.timeDistribution.today,
            thisWeek: acc.thisWeek + member.timeDistribution.thisWeek,
            nextWeek: acc.nextWeek + member.timeDistribution.nextWeek,
            later: acc.later + member.timeDistribution.later
          }), { overdue: 0, today: 0, thisWeek: 0, nextWeek: 0, later: 0 }),
          performanceMetrics: {
            completionRate: teamWorkloadResponse.data.memberAnalysis.reduce((avg, member) => 
              avg + member.performanceMetrics.completionRate, 0) / teamWorkloadResponse.data.memberAnalysis.length || 0,
            averageCompletionTime: teamWorkloadResponse.data.memberAnalysis.reduce((avg, member) => 
              avg + member.performanceMetrics.averageCompletionTime, 0) / teamWorkloadResponse.data.memberAnalysis.length || 0,
            onTimeDeliveryRate: teamWorkloadResponse.data.memberAnalysis.reduce((avg, member) => 
              avg + member.performanceMetrics.onTimeDeliveryRate, 0) / teamWorkloadResponse.data.memberAnalysis.length || 0,
            qualityScore: teamWorkloadResponse.data.memberAnalysis.reduce((avg, member) => 
              avg + member.performanceMetrics.qualityScore, 0) / teamWorkloadResponse.data.memberAnalysis.length || 0
          },
          riskFactors: teamWorkloadResponse.data.teamSummary.overloadedMembers.map(member => ({
            type: 'overload',
            severity: 'high' as const,
            count: 1,
            message: `${member.userName || member.userId} is overloaded`
          })),
          recommendations: []
        };

        // Calculate complexity distribution percentages
        const totalComplexityTasks = managerWorkloadData.complexityDistribution.counts.low + 
                                   managerWorkloadData.complexityDistribution.counts.medium + 
                                   managerWorkloadData.complexityDistribution.counts.high;
        
        if (totalComplexityTasks > 0) {
          managerWorkloadData.complexityDistribution.percentages = {
            low: (managerWorkloadData.complexityDistribution.counts.low / totalComplexityTasks) * 100,
            medium: (managerWorkloadData.complexityDistribution.counts.medium / totalComplexityTasks) * 100,
            high: (managerWorkloadData.complexityDistribution.counts.high / totalComplexityTasks) * 100
          };
        }

        // Transform task recommendations to smart suggestions format
        const managerSmartSuggestions = {
          todaysFocus: suggestionsResponse.data.taskSequencing.recommendedOrder.slice(0, 5),
          priorityAdjustments: suggestionsResponse.data.priorityAdjustments,
          workloadWarnings: suggestionsResponse.data.workloadWarnings,
          deadlineAlerts: suggestionsResponse.data.deadlineAlerts,
          efficiencyTips: [
            {
              type: 'workload' as const,
              tip: 'Monitor team workload balance to optimize productivity',
              impact: 'high' as const
            },
            {
              type: 'scheduling' as const,
              tip: 'Use AI assignment suggestions to distribute tasks effectively',
              impact: 'high' as const
            },
            {
              type: 'optimization' as const,
              tip: 'Review priority adjustments to ensure critical tasks are handled first',
              impact: 'medium' as const
            }
          ]
        };
        
        setSmartSuggestions(managerSmartSuggestions);
        setWorkloadAnalysis(managerWorkloadData);
      } else {
        // For employees, get personal AI recommendations and workload analysis
        const [suggestionsResponse, workloadResponse] = await Promise.all([
          aiService.getSmartSuggestions(),
          aiService.getWorkloadAnalysis()
        ]);
        
        setSmartSuggestions(suggestionsResponse.data);
        setWorkloadAnalysis(workloadResponse.data);
      }
    } catch (error) {
      console.error('Error fetching AI data:', error);
      setError('Unable to load AI insights at this time.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (recommendationType: string, rating: number) => {
    try {
      await aiService.provideFeedback({
        recommendationType: recommendationType as any,
        rating: rating as any,
        comments: 'User interaction feedback'
      });
    } catch (error) {
      console.error('Error providing feedback:', error);
    }
  };

  const getAlertIcon = (alert: DeadlineAlert) => {
    switch (alert.type) {
      case 'overdue': return 'bi-exclamation-triangle-fill text-red-600';
      case 'urgent': return 'bi-clock-fill text-orange-600';
      case 'warning': return 'bi-info-circle-fill text-yellow-600';
      default: return 'bi-info-circle text-blue-600';
    }
  };

  const getWorkloadColor = (load: number) => {
    if (load > 0.8) return 'text-red-600';
    if (load > 0.6) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  if (isCollapsed) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsCollapsed(false)}
          className="neo-button primary p-3 rounded-full shadow-lg animate-pulse"
          title="Open AI Assistant"
        >
          <i className="bi bi-robot text-xl"></i>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 z-40 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="bi bi-robot text-xl"></i>
            <h3 className="font-semibold">AI Assistant</h3>
            <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
              {userRole === 'manager' ? 'Manager' : 'Employee'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAIData}
              className="text-white hover:bg-white hover:bg-opacity-10 p-1 rounded"
              title="Refresh"
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-white hover:bg-white hover:bg-opacity-10 p-1 rounded"
              title="Minimize"
            >
              <i className="bi bi-dash-lg"></i>
            </button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'suggestions'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <i className="bi bi-lightbulb mr-2"></i>
            Suggestions
          </button>
          <button
            onClick={() => setActiveTab('workload')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'workload'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <i className="bi bi-speedometer2 mr-2"></i>
            Workload
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[500px] overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="loading-spinner"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 py-8">
            <i className="bi bi-exclamation-triangle text-2xl mb-2"></i>
            <p>{error}</p>
            <button 
              onClick={fetchAIData}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Suggestions Tab */}
            {activeTab === 'suggestions' && smartSuggestions && (
              <div className="space-y-4">
                {/* Today's Focus */}
                {smartSuggestions.todaysFocus.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <i className="bi bi-star-fill text-yellow-500"></i>
                      {userRole === 'manager' ? "Team's Priority Tasks" : "Today's Focus"}
                    </h4>
                    <div className="space-y-2">
                      {smartSuggestions.todaysFocus.slice(0, 3).map((task, index) => (
                        <div 
                          key={task.taskId}
                          className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                {index + 1}
                              </span>
                              <span className="font-medium text-gray-700 text-sm">{task.title}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Score: {Math.round(task.sequenceScore * 100)}%
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{task.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Priority Adjustments */}
                {smartSuggestions.priorityAdjustments.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <i className="bi bi-arrow-up-circle text-blue-600"></i>
                      Priority Suggestions
                    </h4>
                    <div className="space-y-2">
                      {smartSuggestions.priorityAdjustments.slice(0, 2).map((adjustment) => (
                        <div 
                          key={adjustment.taskId}
                          className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(adjustment.currentPriority)}`}>
                              {adjustment.currentPriority}
                            </span>
                            <i className="bi bi-arrow-right text-gray-400"></i>
                            <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(adjustment.suggestedPriority)}`}>
                              {adjustment.suggestedPriority}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">{adjustment.reason}</p>
                          <div className="text-xs text-gray-500 mt-1">
                            Confidence: {Math.round(adjustment.confidence * 100)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deadline Alerts */}
                {smartSuggestions.deadlineAlerts.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <i className="bi bi-clock text-red-600"></i>
                      Deadline Alerts
                    </h4>
                    <div className="space-y-2">
                      {smartSuggestions.deadlineAlerts.slice(0, 3).map((alert) => (
                        <div 
                          key={alert.taskId}
                          className="bg-red-50 border border-red-200 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <i className={getAlertIcon(alert)}></i>
                            <span className="font-medium text-gray-700 text-sm">{alert.type.toUpperCase()}</span>
                          </div>
                          <p className="text-xs text-gray-600">{alert.message}</p>
                          {alert.hoursRemaining !== undefined && (
                            <div className="text-xs text-gray-500 mt-1">
                              {alert.hoursRemaining > 0 
                                ? `${alert.hoursRemaining} hours remaining`
                                : `${alert.hoursOverdue} hours overdue`
                              }
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Efficiency Tips */}
                {smartSuggestions.efficiencyTips.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <i className="bi bi-lightbulb text-green-600"></i>
                      Efficiency Tips
                    </h4>
                    <div className="space-y-2">
                      {smartSuggestions.efficiencyTips.slice(0, 2).map((tip, index) => (
                        <div 
                          key={index}
                          className="bg-green-50 border border-green-200 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              tip.impact === 'high' ? 'bg-green-200 text-green-800' :
                              tip.impact === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-gray-200 text-gray-800'
                            }`}>
                              {tip.impact} impact
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">{tip.tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Workload Tab */}
            {activeTab === 'workload' && workloadAnalysis && (
              <div className="space-y-4">
                {/* Overall Workload */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <i className="bi bi-speedometer2"></i>
                    {userRole === 'manager' ? 'Team Workload Overview' : 'Current Workload'}
                  </h4>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      {userRole === 'manager' ? 'Average Team Load' : 'Overall Load'}
                    </span>
                    <span className={`font-bold ${getWorkloadColor(workloadAnalysis.overallLoad)}`}>
                      {Math.round(workloadAnalysis.overallLoad * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                      className={`h-2 rounded-full ${
                        workloadAnalysis.overallLoad > 0.8 ? 'bg-red-500' :
                        workloadAnalysis.overallLoad > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${workloadAnalysis.overallLoad * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">
                        {userRole === 'manager' ? 'Team Active Tasks' : 'Active Tasks'}
                      </span>
                      <div className="font-bold text-blue-600">{workloadAnalysis.activeTasks}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">
                        {userRole === 'manager' ? 'Team Completed' : 'Completed'}
                      </span>
                      <div className="font-bold text-green-600">{workloadAnalysis.completedTasks}</div>
                    </div>
                  </div>

                  {/* Manager-specific team task breakdown */}
                  {userRole === 'manager' && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-600 mb-2">Detailed Team Breakdown</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-bold text-blue-600">{workloadAnalysis.totalTasks}</div>
                          <div className="text-gray-600">Total Tasks</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-orange-600">{workloadAnalysis.activeTasks}</div>
                          <div className="text-gray-600">In Progress</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-green-600">{workloadAnalysis.completedTasks}</div>
                          <div className="text-gray-600">Completed</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Performance Metrics */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <i className="bi bi-graph-up"></i>
                    {userRole === 'manager' ? 'Team Performance' : 'Performance Metrics'}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {userRole === 'manager' ? 'Avg Completion Rate' : 'Completion Rate'}
                      </span>
                      <span className="font-medium text-green-600">
                        {Math.round(workloadAnalysis.performanceMetrics.completionRate * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {userRole === 'manager' ? 'Avg On-Time Delivery' : 'On-Time Delivery'}
                      </span>
                      <span className="font-medium text-blue-600">
                        {Math.round(workloadAnalysis.performanceMetrics.onTimeDeliveryRate * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {userRole === 'manager' ? 'Avg Quality Score' : 'Quality Score'}
                      </span>
                      <span className="font-medium text-purple-600">
                        {Math.round(workloadAnalysis.performanceMetrics.qualityScore * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Risk Factors */}
                {workloadAnalysis.riskFactors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <i className="bi bi-exclamation-triangle text-red-600"></i>
                      {userRole === 'manager' ? 'Team Risk Factors' : 'Risk Factors'}
                    </h4>
                    <div className="space-y-2">
                      {workloadAnalysis.riskFactors.slice(0, 3).map((risk, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{risk.message}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            risk.severity === 'high' ? 'bg-red-200 text-red-800' :
                            risk.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-gray-200 text-gray-800'
                          }`}>
                            {risk.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        .loading-spinner {
          border: 2px solid #f3f3f3;
          border-top: 2px solid #3498db;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AIDashboard; 