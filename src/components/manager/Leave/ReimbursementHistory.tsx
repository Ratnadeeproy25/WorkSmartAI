import React from 'react';

interface ReimbursementRequest {
  type: string;
  date: string;
  amount: string;
  description: string;
  status: 'approved' | 'pending' | 'rejected';
  approvedBy?: string;
}

const ReimbursementHistory: React.FC = () => {
  // Mock data - in a real app, this would come from an API
  const reimbursementRequests: ReimbursementRequest[] = [
    {
      type: 'Travel Expense',
      date: 'Dec 5, 2023',
      amount: '$250.00',
      description: 'Client meeting travel expenses',
      status: 'approved',
      approvedBy: 'Admin'
    },
    {
      type: 'Office Supplies',
      date: 'Nov 28, 2023',
      amount: '$75.50',
      description: 'Printer paper and ink cartridges',
      status: 'pending'
    },
    {
      type: 'Training',
      date: 'Nov 15, 2023',
      amount: '$350.00',
      description: 'Online course subscription',
      status: 'approved',
      approvedBy: 'Admin'
    }
  ];

  return (
    <div className="neo-box p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Reimbursement History</h3>
      <div className="space-y-4">
        {reimbursementRequests.map((request, index) => (
          <div className="request-card" key={index}>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-gray-700">{request.type}</div>
                <div className="text-sm text-gray-600">{request.date}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium">{request.amount}</div>
                <span className={`status-badge ${request.status}`}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>{request.description}</p>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              <p>{request.status === 'pending' 
                ? 'Awaiting admin approval' 
                : `Approved by: ${request.approvedBy}`}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReimbursementHistory; 