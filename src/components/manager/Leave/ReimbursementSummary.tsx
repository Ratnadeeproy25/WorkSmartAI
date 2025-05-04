import React from 'react';

interface SummaryItem {
  label: string;
  amount: string;
  note: string;
  color: string;
}

const ReimbursementSummary: React.FC = () => {
  // Mock data - in a real app, this would come from an API
  const summaryItems: SummaryItem[] = [
    {
      label: 'Total Submitted',
      amount: '$675.50',
      note: 'This year',
      color: 'text-blue-600'
    },
    {
      label: 'Total Approved',
      amount: '$600.00',
      note: 'This year',
      color: 'text-green-600'
    },
    {
      label: 'Pending',
      amount: '$75.50',
      note: 'Awaiting admin approval',
      color: 'text-yellow-600'
    }
  ];

  return (
    <div className="neo-box p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Reimbursement Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summaryItems.map((item, index) => (
          <div className="neo-box p-6 text-center" key={index}>
            <div className={`text-2xl font-bold ${item.color}`}>{item.amount}</div>
            <div className="text-sm text-gray-600">{item.label}</div>
            <div className="text-xs text-gray-500 mt-2">{item.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReimbursementSummary; 