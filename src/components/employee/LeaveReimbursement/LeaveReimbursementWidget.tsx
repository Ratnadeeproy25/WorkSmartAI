import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LeaveRequest, ReimbursementRequest } from './types';
import '../../../styles/employee/leave-reimbursement.css';

const LeaveReimbursementWidget: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [reimbursementRequests, setReimbursementRequests] = useState<ReimbursementRequest[]>([]);

  // Load data from localStorage
  useEffect(() => {
    const savedLeaveRequests = localStorage.getItem('leaveRequests');
    if (savedLeaveRequests) {
      setLeaveRequests(JSON.parse(savedLeaveRequests));
    }

    const savedReimbursementRequests = localStorage.getItem('reimbursementRequests');
    if (savedReimbursementRequests) {
      setReimbursementRequests(JSON.parse(savedReimbursementRequests));
    }
  }, []);

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

  // Calculate time difference
  const getDayDifference = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end day
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
      {/* Leave Requests Section */}
      <div className="neo-box p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-700">Leave Requests</h2>
          <Link to="/leave#leaveSection" className="neo-button primary px-4 py-2">
            <i className="bi bi-plus-lg mr-2"></i>New Request
          </Link>
        </div>

        {/* Leave Balance Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="neo-box p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">15</div>
            <div className="text-sm text-gray-600">Annual Leave</div>
            <div className="text-xs text-gray-500">Remaining</div>
          </div>
          <div className="neo-box p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">8</div>
            <div className="text-sm text-gray-600">Sick Leave</div>
            <div className="text-xs text-gray-500">Remaining</div>
          </div>
          <div className="neo-box p-4 text-center">
            <div className="text-2xl font-bold text-green-600">3</div>
            <div className="text-sm text-gray-600">Personal</div>
            <div className="text-xs text-gray-500">Remaining</div>
          </div>
        </div>

        {/* Recent Leave Requests */}
        <div className="space-y-4">
          {leaveRequests.slice(0, 2).map(request => (
            <div key={request.id} className="task-item">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="task-avatar bg-blue-500">
                    {request.type.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">
                      {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Leave
                    </div>
                    <div className="text-sm text-gray-600">{formatDateRange(request.startDate, request.endDate)}</div>
                    <div className="text-xs text-gray-500 mt-1">{getDayDifference(request.startDate, request.endDate)}</div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                  request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <Link to="/leave#leaveSection" className="neo-button p-2 inline-flex items-center gap-2">
            <span>View All Requests</span>
            <i className="bi bi-arrow-right"></i>
          </Link>
        </div>
      </div>

      {/* Reimbursement Requests Section */}
      <div className="neo-box p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-700">Reimbursement Requests</h2>
          <Link to="/leave#reimbursementSection" className="neo-button primary px-4 py-2">
            <i className="bi bi-plus-lg mr-2"></i>New Request
          </Link>
        </div>

        {/* Recent Reimbursement Requests */}
        <div className="space-y-4 mb-6">
          {reimbursementRequests.slice(0, 2).map(request => (
            <div key={request.id} className="task-item">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`task-avatar ${
                    request.type === 'travel' ? 'bg-green-500' : 
                    request.type === 'training' ? 'bg-blue-500' : 
                    'bg-purple-500'
                  }`}>
                    {request.type.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">
                      {request.type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </div>
                    <div className="text-sm text-gray-600">{request.description.slice(0, 25)}{request.description.length > 25 ? '...' : ''}</div>
                    <div className="text-xs text-gray-500 mt-1">${request.amount.toFixed(2)}</div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                  request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Reimbursement Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="neo-box p-4">
            <div className="text-sm text-gray-600 mb-1">Total Pending</div>
            <div className="text-2xl font-bold text-yellow-600">
              ${reimbursementRequests
                .filter(req => req.status === 'pending')
                .reduce((sum, req) => sum + req.amount, 0)
                .toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              {reimbursementRequests.filter(req => req.status === 'pending').length} requests
            </div>
          </div>
          <div className="neo-box p-4">
            <div className="text-sm text-gray-600 mb-1">Total Approved</div>
            <div className="text-2xl font-bold text-green-600">
              ${reimbursementRequests
                .filter(req => req.status === 'approved')
                .reduce((sum, req) => sum + req.amount, 0)
                .toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">Last 30 days</div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link to="/leave#reimbursementSection" className="neo-button p-2 inline-flex items-center gap-2">
            <span>View All Reimbursements</span>
            <i className="bi bi-arrow-right"></i>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LeaveReimbursementWidget; 