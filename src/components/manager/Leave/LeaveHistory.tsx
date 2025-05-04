import React from 'react';

interface LeaveRequest {
  type: string;
  dates: string;
  reason: string;
  status: 'approved' | 'pending' | 'rejected';
  approvedBy?: string;
}

const LeaveHistory: React.FC = () => {
  // Mock data - in a real app, this would come from an API
  const leaveRequests: LeaveRequest[] = [
    {
      type: 'Annual Leave',
      dates: 'Dec 15-20, 2023',
      reason: 'Family vacation',
      status: 'approved',
      approvedBy: 'Admin'
    },
    {
      type: 'Sick Leave',
      dates: 'Dec 10, 2023',
      reason: 'Doctor\'s appointment',
      status: 'pending'
    },
    {
      type: 'Personal Leave',
      dates: 'Nov 25, 2023',
      reason: 'Personal errands',
      status: 'approved',
      approvedBy: 'Admin'
    }
  ];

  return (
    <div className="neo-box p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Leave History</h3>
      <div className="space-y-4">
        {leaveRequests.map((request, index) => (
          <div className="request-card" key={index}>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-gray-700">{request.type}</div>
                <div className="text-sm text-gray-600">{request.dates}</div>
              </div>
              <span className={`status-badge ${request.status}`}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>{request.reason}</p>
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

export default LeaveHistory; 