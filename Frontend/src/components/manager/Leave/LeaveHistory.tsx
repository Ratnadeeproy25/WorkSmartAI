import React from 'react';
import { LeaveRequest, LeaveType } from '../../../components/employee/LeaveReimbursement/types';

interface LeaveHistoryProps {
  leaveRequests: LeaveRequest[];
}

const LeaveHistory: React.FC<LeaveHistoryProps> = ({ leaveRequests }) => {
  // Helper function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Helper function to get date range
  const getDateRange = (startDate: string, endDate: string): string => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    
    if (start === end) {
      return start;
    }
    
    return `${start} - ${end}`;
  };

  return (
    <div className="neo-box p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Leave History</h3>
      {leaveRequests.length === 0 ? (
        <div className="text-gray-500 text-center py-6">
          No leave requests found
        </div>
      ) : (
        <div className="space-y-4">
          {leaveRequests.map((request, index) => (
            <div className="request-card" key={index}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-700">
                    {/* Format leave type for display */}
                    {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Leave
                  </div>
                  <div className="text-sm text-gray-600">
                    {getDateRange(request.startDate, request.endDate)}
                  </div>
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
                  ? 'Awaiting approval' 
                  : `Request ${request.status} on ${formatDate(request.createdAt)}`}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaveHistory; 