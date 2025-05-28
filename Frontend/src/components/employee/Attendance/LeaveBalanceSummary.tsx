import React from 'react';
import { LeaveBalance } from './types';

interface LeaveBalanceSummaryProps {
  leaveBalances: LeaveBalance[];
}

const LeaveBalanceSummary: React.FC<LeaveBalanceSummaryProps> = ({ leaveBalances }) => {
  return (
    <div className="neo-box p-6">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Leave Balance</h3>
      <div className="space-y-4">
        {leaveBalances.map((leave, index) => (
          <div key={index}>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">{leave.type}</span>
              <span className="font-semibold text-gray-700">{leave.remaining}/{leave.total} days</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${(leave.remaining / leave.total) * 100}%`,
                  backgroundColor: leave.color 
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaveBalanceSummary; 