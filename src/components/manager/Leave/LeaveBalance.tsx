import React from 'react';

interface LeaveBalanceItem {
  type: string;
  days: number;
  color: string;
}

const LeaveBalance: React.FC = () => {
  // Mock data - in a real app, this would come from an API
  const balances: LeaveBalanceItem[] = [
    {
      type: 'Annual Leave',
      days: 15,
      color: 'text-blue-600'
    },
    {
      type: 'Sick Leave',
      days: 10,
      color: 'text-green-600'
    },
    {
      type: 'Personal Leave',
      days: 5,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="neo-box p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Leave Balance</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {balances.map((balance, index) => (
          <div className="neo-box p-6 text-center" key={index}>
            <div className={`text-2xl font-bold ${balance.color}`}>{balance.days}</div>
            <div className="text-sm text-gray-600">{balance.type}</div>
            <div className="text-xs text-gray-500 mt-2">Days remaining</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaveBalance; 