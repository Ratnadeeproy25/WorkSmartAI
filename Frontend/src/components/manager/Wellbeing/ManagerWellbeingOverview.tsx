import React from 'react';
import { useWellbeingContext } from '../../../context/WellbeingContext';

const ManagerWellbeingOverview: React.FC = () => {
  const { managerWellbeing, loading, error } = useWellbeingContext();

  const getStressStatus = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Moderate';
    return 'Needs Attention';
  };

  const getSatisfactionTrend = (history: number[]) => {
    if (!history || history.length < 2) return 'Stable';
    const last = history[history.length - 1];
    const prev = history[history.length - 2];
    if (last > prev) return 'Trending Up';
    if (last < prev) return 'Trending Down';
    return 'Stable';
  };

  const getCollaborationStatus = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  const getWorkLifeBalanceStatus = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    return 'Needs Attention';
  };

  if (loading) {
    return (
      <div className="neo-box p-6">
        <h2 className="text-2xl font-bold text-gray-700 mb-6">Manager Wellbeing Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="metric-card animate-pulse">
              <div className="h-8 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="neo-box p-6">
        <h2 className="text-2xl font-bold text-gray-700 mb-6">Manager Wellbeing Overview</h2>
        <div className="text-center text-red-600">
          <p>Error loading wellbeing data: {error}</p>
        </div>
      </div>
    );
  }

  // Access wellbeing metrics correctly from context
  const workLifeBalance = managerWellbeing?.workLifeBalance || { 
    score: 82, 
    factors: { 
      workHours: 8.5,
      breaksCount: 4,
      afterHoursWork: 1.0,
      focusTime: 6.5 
    } 
  };
  const stressLevel = managerWellbeing?.stressLevel || { 
    score: 85,
    factors: {
      deadlinePressure: 'Moderate',
      workload: 'High'
    }
  };
  const jobSatisfaction = managerWellbeing?.jobSatisfaction || { 
    score: 90, 
    history: [88, 89, 90, 90, 90],
    factors: {
      taskCompletionRate: 85
    }
  };
  const teamCollaboration = managerWellbeing?.teamCollaboration || { 
    score: 88,
    factors: {
      communicationQuality: 'Excellent'
    }
  };

  return (
    <div className="neo-box p-6">
      <h2 className="text-2xl font-bold text-gray-700 mb-6">Manager Wellbeing Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Work-Life Balance Card */}
        <div className="metric-card">
          <div className="metric-value text-blue-600" id="wlbScore">
            {workLifeBalance.score}%
          </div>
          <div className="metric-label">Work-Life Balance</div>
          <div className="text-sm text-gray-600 mt-2">
            <div className="flex items-center mb-1">
              <i className="bi bi-clock mr-1"></i>
              <span>{workLifeBalance.factors?.workHours || 8.5}h</span> work hours
            </div>
            <div className="flex items-center mb-1">
              <i className="bi bi-cup-hot mr-1"></i>
              <span>{workLifeBalance.factors?.breaksCount || 4}</span> breaks today
            </div>
            <div className="flex items-center">
              <i className="bi bi-bullseye mr-1"></i>
              <span>{workLifeBalance.factors?.focusTime || 6.5}h</span> focus time
            </div>
          </div>
        </div>

        {/* Stress Level Card */}
        <div className="metric-card">
          <div className="metric-value text-green-600" id="stressScore">
            {stressLevel.score}%
          </div>
          <div className="metric-label">Stress Level</div>
          <div className="text-sm text-gray-600 mt-2">
            <div className="flex items-center mb-1">
              <i className="bi bi-emoji-smile mr-1"></i>
              <span>{getStressStatus(stressLevel.score)}</span>
            </div>
            <div className="flex items-center mb-1">
              <i className="bi bi-calendar-check mr-1"></i>
              <span>{stressLevel.factors?.deadlinePressure || 'Moderate'}</span> pressure
            </div>
            <div className="flex items-center">
              <i className="bi bi-briefcase mr-1"></i>
              <span>{stressLevel.factors?.workload || 'High'}</span> workload
            </div>
          </div>
        </div>

        {/* Job Satisfaction Card */}
        <div className="metric-card">
          <div className="metric-value text-purple-600" id="satisfactionScore">
            {jobSatisfaction.score}%
          </div>
          <div className="metric-label">Leadership Satisfaction</div>
          <div className="text-sm text-gray-600 mt-2">
            <div className="flex items-center mb-1">
              <i className="bi bi-graph-up mr-1"></i>
              <span>{getSatisfactionTrend(jobSatisfaction.history)}</span>
            </div>
            <div className="flex items-center">
              <i className="bi bi-check-circle mr-1"></i>
              <span>{jobSatisfaction.factors?.taskCompletionRate || 85}%</span> completion rate
            </div>
          </div>
        </div>

        {/* Team Collaboration Card */}
        <div className="metric-card">
          <div className="metric-value text-yellow-600" id="collaborationScore">
            {teamCollaboration.score}%
          </div>
          <div className="metric-label">Team Management</div>
          <div className="text-sm text-gray-600 mt-2">
            <div className="flex items-center mb-1">
              <i className="bi bi-people mr-1"></i>
              <span>{getCollaborationStatus(teamCollaboration.score)}</span>
            </div>
            <div className="flex items-center">
              <i className="bi bi-chat-dots mr-1"></i>
              <span>{teamCollaboration.factors?.communicationQuality || 'Excellent'}</span> communication
            </div>
          </div>
        </div>
      </div>

      {/* Additional Insights Section */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Work-Life Balance:</strong> {getWorkLifeBalanceStatus(workLifeBalance.score)}
            {workLifeBalance.factors?.afterHoursWork > 1 && (
              <span className="text-orange-600 ml-2">
                ({workLifeBalance.factors.afterHoursWork}h overtime detected)
              </span>
            )}
          </div>
          <div>
            <strong>Stress Management:</strong> {getStressStatus(stressLevel.score)}
            {stressLevel.factors?.deadlinePressure === 'High' && (
              <span className="text-red-600 ml-2">(High deadline pressure)</span>
            )}
          </div>
          <div>
            <strong>Team Performance:</strong> {getCollaborationStatus(teamCollaboration.score)}
          </div>
          <div>
            <strong>Overall Trend:</strong> {getSatisfactionTrend(jobSatisfaction.history)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerWellbeingOverview; 