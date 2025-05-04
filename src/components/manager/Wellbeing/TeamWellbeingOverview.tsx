import React from 'react';
import { useWellbeingContext } from '../../../context/WellbeingContext';

const TeamWellbeingOverview: React.FC = () => {
  const { managerWellbeing } = useWellbeingContext();
  const teamWellbeing = managerWellbeing.teamWellbeing;

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
      <h2 className="text-2xl font-bold text-gray-700 mb-6">Team Wellbeing Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="metric-value text-blue-600" id="teamWlbScore">
            {teamWellbeing?.workLifeBalance.score || 78}%
          </div>
          <div className="metric-label">Team Work-Life Balance</div>
          <div className="text-sm text-gray-600 mt-2">
            <i className="bi bi-people"></i>
            <span id="teamSize"> 8</span> team members
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-green-600" id="teamStressScore">
            {teamWellbeing?.stressLevel.score || 80}%
          </div>
          <div className="metric-label">Team Stress Level</div>
          <div className="text-sm text-gray-600 mt-2">
            <i className="bi bi-emoji-smile"></i>
            <span id="teamStressStatus"> {getStressStatus(teamWellbeing?.stressLevel.score || 80)}</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-purple-600" id="teamSatisfactionScore">
            {teamWellbeing?.satisfaction.score || 85}%
          </div>
          <div className="metric-label">Team Satisfaction</div>
          <div className="text-sm text-gray-600 mt-2">
            <i className="bi bi-graph-up"></i>
            <span id="teamSatisfactionTrend"> {getSatisfactionTrend(teamWellbeing?.satisfaction.history || [84, 85, 85, 85, 85])}</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-yellow-600" id="teamCollaborationScore">
            {teamWellbeing?.collaboration.score || 82}%
          </div>
          <div className="metric-label">Team Collaboration</div>
          <div className="text-sm text-gray-600 mt-2">
            <i className="bi bi-people"></i>
            <span id="teamCollaborationStatus"> {getCollaborationStatus(teamWellbeing?.collaboration.score || 82)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamWellbeingOverview; 