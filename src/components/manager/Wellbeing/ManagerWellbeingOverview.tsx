import React from 'react';
import { useWellbeingContext } from '../../../context/WellbeingContext';

const ManagerWellbeingOverview: React.FC = () => {
  const { managerWellbeing } = useWellbeingContext();

  const getStressStatus = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Moderate';
    return 'Needs Attention';
  };

  const getSatisfactionTrend = (history: number[]) => {
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

  return (
    <div className="neo-box p-6">
      <h2 className="text-2xl font-bold text-gray-700 mb-6">Manager Wellbeing Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="metric-value text-blue-600" id="wlbScore">
            {managerWellbeing?.workLifeBalance.score || 82}%
          </div>
          <div className="metric-label">Work-Life Balance</div>
          <div className="text-sm text-gray-600 mt-2">
            <i className="bi bi-clock"></i>
            <span id="focusTime"> {managerWellbeing?.workLifeBalance.factors.focusTime || 6.5}h</span> focus time today
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-green-600" id="stressScore">
            {managerWellbeing?.stressLevel.score || 85}%
          </div>
          <div className="metric-label">Stress Level</div>
          <div className="text-sm text-gray-600 mt-2">
            <i className="bi bi-emoji-smile"></i>
            <span id="stressStatus"> {getStressStatus(managerWellbeing?.stressLevel.score || 85)}</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-purple-600" id="satisfactionScore">
            {managerWellbeing?.jobSatisfaction.score || 90}%
          </div>
          <div className="metric-label">Leadership Satisfaction</div>
          <div className="text-sm text-gray-600 mt-2">
            <i className="bi bi-graph-up"></i>
            <span id="satisfactionTrend"> {getSatisfactionTrend(managerWellbeing?.jobSatisfaction.history || [88, 89, 90, 90, 90])}</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-yellow-600" id="collaborationScore">
            {managerWellbeing?.teamCollaboration.score || 88}%
          </div>
          <div className="metric-label">Team Management</div>
          <div className="text-sm text-gray-600 mt-2">
            <i className="bi bi-people"></i>
            <span id="collaborationStatus"> {getCollaborationStatus(managerWellbeing?.teamCollaboration.score || 88)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerWellbeingOverview; 