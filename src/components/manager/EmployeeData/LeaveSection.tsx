import React, { useState } from 'react';

interface LeaveRequest {
  id: number;
  employee: string;
  type: string;
  dates: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface ReimbursementRequest {
  id: number;
  employee: string;
  type: string;
  amount: number;
  date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface EmployeeLeaveBalance {
  id: number;
  employee: string;
  annual: number;
  sick: number;
  personal: number;
}

const LeaveSection: React.FC = () => {
  // Mock data for leave requests
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    {
      id: 1,
      employee: 'John Doe',
      type: 'Annual Leave',
      dates: 'Dec 15-20, 2023',
      reason: 'Family vacation',
      status: 'pending'
    },
    {
      id: 2,
      employee: 'Jane Smith',
      type: 'Sick Leave',
      dates: 'Dec 10, 2023',
      reason: 'Doctor\'s appointment',
      status: 'pending'
    },
    {
      id: 3,
      employee: 'Mike Johnson',
      type: 'Personal Leave',
      dates: 'Dec 25-26, 2023',
      reason: 'Family emergency',
      status: 'pending'
    }
  ]);

  // Mock data for reimbursement requests
  const [reimbursementRequests, setReimbursementRequests] = useState<ReimbursementRequest[]>([
    {
      id: 1,
      employee: 'John Doe',
      type: 'Travel Expense',
      amount: 250.00,
      date: 'Dec 5, 2023',
      reason: 'Client meeting travel expenses',
      status: 'pending'
    },
    {
      id: 2,
      employee: 'Jane Smith',
      type: 'Office Supplies',
      amount: 150.00,
      date: 'Dec 8, 2023',
      reason: 'Project materials',
      status: 'pending'
    }
  ]);

  // Mock data for team leave balance
  const teamLeaveBalance: EmployeeLeaveBalance[] = [
    {
      id: 1,
      employee: 'John Doe',
      annual: 15,
      sick: 10,
      personal: 5
    },
    {
      id: 2,
      employee: 'Jane Smith',
      annual: 12,
      sick: 8,
      personal: 3
    },
    {
      id: 3,
      employee: 'Mike Johnson',
      annual: 8,
      sick: 6,
      personal: 2
    },
    {
      id: 4,
      employee: 'Sarah Wilson',
      annual: 10,
      sick: 5,
      personal: 3
    },
    {
      id: 5,
      employee: 'Tom Brown',
      annual: 7,
      sick: 4,
      personal: 2
    },
    {
      id: 6,
      employee: 'Emily Davis',
      annual: 18,
      sick: 12,
      personal: 6
    }
  ];

  const handleApproveLeave = (id: number) => {
    setLeaveRequests(prev => 
      prev.map(request => 
        request.id === id 
          ? { ...request, status: 'approved' } 
          : request
      )
    );
    alert(`Leave request has been approved.`);
  };

  const handleRejectLeave = (id: number) => {
    setLeaveRequests(prev => 
      prev.map(request => 
        request.id === id 
          ? { ...request, status: 'rejected' } 
          : request
      )
    );
    alert(`Leave request has been rejected.`);
  };

  const handleApproveReimbursement = (id: number) => {
    setReimbursementRequests(prev => 
      prev.map(request => 
        request.id === id 
          ? { ...request, status: 'approved' } 
          : request
      )
    );
    alert(`Reimbursement request has been approved.`);
  };

  const handleRejectReimbursement = (id: number) => {
    setReimbursementRequests(prev => 
      prev.map(request => 
        request.id === id 
          ? { ...request, status: 'rejected' } 
          : request
      )
    );
    alert(`Reimbursement request has been rejected.`);
  };

  // Filter to show only pending requests
  const pendingLeaveRequests = leaveRequests.filter(request => request.status === 'pending');
  const pendingReimbursementRequests = reimbursementRequests.filter(request => request.status === 'pending');

  return (
    <>
      {/* Pending Leave Requests */}
      <div className="neo-box p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Pending Leave Requests</h3>
        <div className="space-y-4">
          {pendingLeaveRequests.length > 0 ? (
            pendingLeaveRequests.map((request) => (
              <div className="neo-box p-4" key={request.id}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-700">{request.employee}</div>
                    <div className="text-sm text-gray-600">{request.type} - {request.dates}</div>
                  </div>
                  <span className="status-badge status-pending">Pending</span>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p>{request.reason}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button 
                    className="neo-button p-2 text-green-600"
                    onClick={() => handleApproveLeave(request.id)}
                  >
                    <i className="bi bi-check-lg"></i>
                    <span>Approve</span>
                  </button>
                  <button 
                    className="neo-button p-2 text-red-600"
                    onClick={() => handleRejectLeave(request.id)}
                  >
                    <i className="bi bi-x-lg"></i>
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No pending leave requests.</p>
          )}
        </div>
      </div>

      {/* Pending Reimbursement Requests */}
      <div className="neo-box p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Pending Reimbursement Requests</h3>
        <div className="space-y-4">
          {pendingReimbursementRequests.length > 0 ? (
            pendingReimbursementRequests.map((request) => (
              <div className="neo-box p-4" key={request.id}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-700">{request.employee}</div>
                    <div className="text-sm text-gray-600">{request.type} - {request.date}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium">${request.amount.toFixed(2)}</div>
                    <span className="status-badge status-pending">Pending</span>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p>{request.reason}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button 
                    className="neo-button p-2 text-green-600"
                    onClick={() => handleApproveReimbursement(request.id)}
                  >
                    <i className="bi bi-check-lg"></i>
                    <span>Approve</span>
                  </button>
                  <button 
                    className="neo-button p-2 text-red-600"
                    onClick={() => handleRejectReimbursement(request.id)}
                  >
                    <i className="bi bi-x-lg"></i>
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No pending reimbursement requests.</p>
          )}
        </div>
      </div>

      {/* Team Leave Balance */}
      <div className="neo-box p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Team Leave Balance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamLeaveBalance.map((employee) => (
            <div className="neo-box p-4" key={employee.id}>
              <h4 className="font-medium text-gray-700 mb-3">{employee.employee}</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Annual Leave:</span>
                  <span className="text-sm font-medium text-blue-600">{employee.annual} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Sick Leave:</span>
                  <span className="text-sm font-medium text-green-600">{employee.sick} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Personal Leave:</span>
                  <span className="text-sm font-medium text-purple-600">{employee.personal} days</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default LeaveSection; 