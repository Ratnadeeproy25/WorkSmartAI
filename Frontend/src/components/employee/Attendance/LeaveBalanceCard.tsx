import React from 'react';
import { LeaveBalance } from './types';

interface LeaveBalanceCardProps {
  leaveBalances: LeaveBalance[];
}

const LeaveBalanceCard: React.FC<LeaveBalanceCardProps> = ({ leaveBalances }) => {
  return (
    <div className="neo-box p-6">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Leave Balances</h3>
      
      {leaveBalances.length === 0 ? (
        <div className="text-center text-gray-500 py-6">
          <i className="bi bi-calendar-x text-3xl block mb-2"></i>
          <p>No leave balances available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leaveBalances.map((balance, index) => (
            <div key={index} className="neo-box p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium">{balance.type}</div>
                <div className="text-sm font-semibold">
                  <span className="text-blue-600">{balance.remaining}</span>
                  <span className="text-gray-400"> / </span>
                  <span className="text-gray-600">{balance.total}</span>
                </div>
              </div>
              
              <div className="relative">
                <div className="progress-bar">
                  <div 
                    className={`progress-bar-fill ${balance.color}`}
                    style={{ width: `${(balance.remaining / balance.total) * 100}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <div>{Math.round((balance.remaining / balance.total) * 100)}% remaining</div>
                  <div>{balance.used} days used</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaveBalanceCard; 