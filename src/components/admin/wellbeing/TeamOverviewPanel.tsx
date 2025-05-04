import React from 'react';
import { Person } from './WellbeingManagement';

interface TeamOverviewPanelProps {
  filteredPeople: Person[];
}

const TeamOverviewPanel: React.FC<TeamOverviewPanelProps> = ({ filteredPeople }) => {
  const total = filteredPeople.length;
  const good = filteredPeople.filter(e => e.wellbeing.stressLevel >= 80).length;
  const warning = filteredPeople.filter(e => e.wellbeing.stressLevel >= 60 && e.wellbeing.stressLevel < 80).length;
  const critical = filteredPeople.filter(e => e.wellbeing.stressLevel < 60).length;

  return (
    <div className="neo-box p-5 mb-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Team Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 bg-white rounded-md shadow-sm">
          <div className="text-xl font-bold text-blue-600">{total}</div>
          <div className="text-xs text-gray-500">Total People</div>
        </div>
        <div className="p-3 bg-white rounded-md shadow-sm border-l-4 border-green-500">
          <div className="text-xl font-bold text-green-600">{good}</div>
          <div className="text-xs text-gray-500">Good Status</div>
        </div>
        <div className="p-3 bg-white rounded-md shadow-sm border-l-4 border-yellow-500">
          <div className="text-xl font-bold text-yellow-600">{warning}</div>
          <div className="text-xs text-gray-500">Warning Status</div>
        </div>
        <div className="p-3 bg-white rounded-md shadow-sm border-l-4 border-red-500">
          <div className="text-xl font-bold text-red-600">{critical}</div>
          <div className="text-xs text-gray-500">Critical Status</div>
        </div>
      </div>
    </div>
  );
};

export default TeamOverviewPanel; 