import React from 'react';
import { LeaveRequest } from './types';

interface LeaveHistoryProps {
  leaveRequests: LeaveRequest[];
}

const LeaveHistory: React.FC<LeaveHistoryProps> = ({ leaveRequests }) => {
  // Format date range for display
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // If same date, just show one date
    if (startDate === endDate) {
      return new Date(startDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    
    // If same month and year, show range format: "Dec 15-20, 2023"
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
    }
    
    // Different months or years, show both dates completely
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <div className="neo-box p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Leave History</h3>
      <div className="space-y-4">
        {leaveRequests.length === 0 ? (
          <div className="text-gray-500 text-center py-4">No leave requests found</div>
        ) : (
          leaveRequests.map(request => (
            <div key={request.id} className="request-card">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-700">
                    {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Leave
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDateRange(request.startDate, request.endDate)}
                  </div>
                </div>
                <span className={`status-badge ${request.status}`}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>{request.reason}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeaveHistory; 