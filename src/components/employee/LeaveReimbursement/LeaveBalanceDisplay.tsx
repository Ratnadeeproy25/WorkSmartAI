import React from 'react';
import { LeaveBalance } from './types';

interface LeaveBalanceDisplayProps {
  leaveBalances: LeaveBalance[];
}

const LeaveBalanceDisplay: React.FC<LeaveBalanceDisplayProps> = ({ leaveBalances }) => {
  return (
    <div className="neo-box p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Leave Balance</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {leaveBalances.map((balance, index) => (
          <div key={index} className="neo-box p-6 text-center">
            <div 
              className="text-2xl font-bold" 
              style={{ color: balance.color }}
            >
              {balance.remaining}
            </div>
            <div className="text-sm text-gray-600">{balance.type}</div>
            <div className="text-xs text-gray-500 mt-2">Days remaining</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaveBalanceDisplay; 