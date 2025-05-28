import React from 'react';
import { useWellbeingContext } from '../../../context/WellbeingContext';

const TeamWellbeingOverview: React.FC = () => {
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

  if (loading) {
    return (
      <div className="neo-box p-6">
        <h2 className="text-2xl font-bold text-gray-700 mb-6">Team Wellbeing Overview</h2>
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
        <h2 className="text-2xl font-bold text-gray-700 mb-6">Team Wellbeing Overview</h2>
        <div className="text-center text-red-600">
          <p>Error loading team wellbeing data: {error}</p>
        </div>
      </div>
    );
  }

  // Provide fallback values if data is not available
  const teamWellbeing = managerWellbeing?.teamWellbeing || {
    workLifeBalance: { score: 78, history: [76, 77, 78, 77, 78] },
    stressLevel: { score: 80, history: [79, 80, 80, 80, 80] },
    satisfaction: { score: 85, history: [84, 85, 85, 85, 85] },
    collaboration: { score: 82, history: [81, 82, 82, 82, 82] }
  };

  return (
    <div className="neo-box p-6">
      <h2 className="text-2xl font-bold text-gray-700 mb-6">Team Wellbeing Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="metric-value text-blue-600" id="teamWlbScore">
            {teamWellbeing.workLifeBalance?.score || 78}%
          </div>
          <div className="metric-label">Team Work-Life Balance</div>
          <div className="text-sm text-gray-600 mt-2">
            <i className="bi bi-people"></i>
            <span id="teamSize"> 8</span> team members
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-green-600" id="teamStressScore">
            {teamWellbeing.stressLevel?.score || 80}%
          </div>
          <div className="metric-label">Team Stress Level</div>
          <div className="text-sm text-gray-600 mt-2">
            <i className="bi bi-emoji-smile"></i>
            <span id="teamStressStatus"> {getStressStatus(teamWellbeing.stressLevel?.score || 80)}</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-purple-600" id="teamSatisfactionScore">
            {teamWellbeing.satisfaction?.score || 85}%
          </div>
          <div className="metric-label">Team Satisfaction</div>
          <div className="text-sm text-gray-600 mt-2">
            <i className="bi bi-graph-up"></i>
            <span id="teamSatisfactionTrend"> {getSatisfactionTrend(teamWellbeing.satisfaction?.history)}</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-yellow-600" id="teamCollaborationScore">
            {teamWellbeing.collaboration?.score || 82}%
          </div>
          <div className="metric-label">Team Collaboration</div>
          <div className="text-sm text-gray-600 mt-2">
            <i className="bi bi-people"></i>
            <span id="teamCollaborationStatus"> {getCollaborationStatus(teamWellbeing.collaboration?.score || 82)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamWellbeingOverview; 