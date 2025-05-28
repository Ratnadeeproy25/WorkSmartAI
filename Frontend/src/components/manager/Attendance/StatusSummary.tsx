import React from 'react';
import { StatusSummaryProps } from './types';

const StatusSummary: React.FC<StatusSummaryProps> = ({ teamData }) => {
  // If no team data is available yet
  if (!teamData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Team Status</h3>
        <div className="text-center text-gray-500 py-4">
          <p>Loading team data...</p>
        </div>
      </div>
    );
  }

  const { summary } = teamData;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Team Status Summary</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-600">Present</div>
          <div className="font-semibold text-2xl">{summary?.presentCount || 0}</div>
          <div className="text-xs text-gray-500">{summary?.presentPercentage.toFixed(1) || 0}% of team</div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-sm text-yellow-600">Late</div>
          <div className="font-semibold text-2xl">{summary?.lateCount || 0}</div>
          <div className="text-xs text-gray-500">{summary?.latePercentage.toFixed(1) || 0}% of team</div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-sm text-red-600">Absent</div>
          <div className="font-semibold text-2xl">{summary?.absentCount || 0}</div>
          <div className="text-xs text-gray-500">{summary?.absentPercentage.toFixed(1) || 0}% of team</div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600">On Leave</div>
          <div className="font-semibold text-2xl">{summary?.leaveCount || 0}</div>
          <div className="text-xs text-gray-500">{summary?.leavePercentage.toFixed(1) || 0}% of team</div>
        </div>
      </div>
      
      <div className="text-center text-sm text-gray-600">
        <p>Today's attendance for {teamData.teamSize} team members</p>
      </div>
    </div>
  );
};

export default StatusSummary; 