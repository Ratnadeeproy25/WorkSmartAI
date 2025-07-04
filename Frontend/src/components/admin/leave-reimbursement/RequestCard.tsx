import React from 'react';
import { LeaveRequest, ReimbursementRequest, RequestStatus } from './types';

interface RequestCardProps {
  request: LeaveRequest | ReimbursementRequest;
  type: 'leave' | 'reimbursement' | 'manager-leave' | 'all';
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRevoke?: (id: string) => void;
  disabled?: boolean;
}

// Helper function to safely extract name from approvedBy field
const getApproverName = (approvedBy: any): string => {
  if (!approvedBy) return 'Unknown';
  
  // If it's already a string, return it
  if (typeof approvedBy === 'string') return approvedBy;
  
  // If it's an object with name property, extract it
  if (typeof approvedBy === 'object' && approvedBy.name) {
    return approvedBy.name;
  }
  
  // If it's an object with _id but no name, try to use _id
  if (typeof approvedBy === 'object' && approvedBy._id) {
    return approvedBy._id;
  }
  
  // Fallback
  return 'Unknown Approver';
};

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  type,
  onApprove,
  onReject,
  onRevoke,
  disabled = false
}) => {
  const isLeaveRequest = request.requestType === 'leave' || request.requestType === 'manager-leave' || type === 'leave' || type === 'manager-leave';
  const isReimbursementRequest = request.requestType === 'reimbursement' || type === 'reimbursement';
  
  const statusClasses = {
    pending: 'status-badge pending',
    'manager-approved': 'status-badge manager-approved',
    approved: 'status-badge approved',
    rejected: 'status-badge rejected'
  };

  const statusLabels = {
    pending: 'Pending',
    'manager-approved': 'Awaiting Admin',
    approved: 'Approved',
    rejected: 'Rejected'
  };



  const canApproveReject = () => {
    return (request.status === 'pending' || request.status === 'manager-approved') && !disabled;
  };

  const renderLeaveRequest = (request: LeaveRequest) => (
    <div className="flex-1">
      <div className="flex justify-between items-center">
        <div>
          <div className="font-medium text-gray-700">{request.employeeName}</div>
          <div className="text-sm text-gray-600">{request.department}</div>
          <div className="text-sm text-gray-600">
            {request.leaveType} - {request.startDate} to {request.endDate}
          </div>
          {request.totalDays && (
            <div className="text-xs text-gray-500">
              Duration: {request.totalDays} day{request.totalDays !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        <div className="text-right">
        <span className={statusClasses[request.status]}>
            {statusLabels[request.status]}
        </span>
          {request.currentApprovalLevel && (
            <div className="text-xs text-gray-500 mt-1">
              Level: {request.currentApprovalLevel}
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>{request.reason}</p>
      </div>
      {request.managerApproval && (
        <div className="mt-2 text-xs text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <i className="bi bi-check-circle-fill text-green-600"></i>
            <span className="font-medium">Manager Approved</span>
          </div>
          <div className="mt-1 text-gray-700">
            <span className="font-medium">By:</span> {getApproverName(request.managerApproval.approvedBy)}
          </div>
          <div className="text-gray-600">
            <span className="font-medium">Date:</span> {new Date(request.managerApproval.approvedAt).toLocaleDateString()}
          </div>
          {request.managerApproval.comments && (
            <div className="mt-2 text-gray-700">
              <span className="font-medium">Comment:</span> {request.managerApproval.comments}
            </div>
          )}
        </div>
      )}
      {request.adminApproval && (
        <div className="mt-2 text-xs text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <i className="bi bi-shield-check-fill text-blue-600"></i>
            <span className="font-medium">Admin Approved</span>
          </div>
          <div className="mt-1 text-gray-700">
            <span className="font-medium">By:</span> {getApproverName(request.adminApproval.approvedBy)}
          </div>
          <div className="text-gray-600">
            <span className="font-medium">Date:</span> {new Date(request.adminApproval.approvedAt).toLocaleDateString()}
          </div>
          {request.adminApproval.comments && (
            <div className="mt-2 text-gray-700">
              <span className="font-medium">Comment:</span> {request.adminApproval.comments}
            </div>
          )}
        </div>
      )}
      <div className="mt-4 flex gap-2">
        {canApproveReject() && (
          <>
            <button 
              className="neo-button p-2 text-green-600" 
              onClick={() => onApprove(request.id)}
              disabled={disabled}
            >
              <i className="bi bi-check-lg"></i>
              <span>Approve</span>
            </button>
            <button 
              className="neo-button p-2 text-red-600" 
              onClick={() => onReject(request.id)}
              disabled={disabled}
            >
              <i className="bi bi-x-lg"></i>
              <span>Reject</span>
            </button>
          </>
        )}

        {request.status === 'approved' && onRevoke && (
          <button 
            className="neo-button p-2 text-red-600" 
            onClick={() => onRevoke(request.id)}
            disabled={disabled}
          >
            <i className="bi bi-x-lg"></i>
            <span>Revoke</span>
          </button>
        )}
      </div>
    </div>
  );

  const renderReimbursementRequest = (request: ReimbursementRequest) => (
    <div className="flex-1">
      <div className="flex justify-between items-center">
        <div>
          <div className="font-medium text-gray-700">{request.employeeName}</div>
          <div className="text-sm text-gray-600">{request.department}</div>
          <div className="text-sm text-gray-600">{request.expenseType} - {request.date}</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium">₹{request.amount.toFixed(2)}</div>
          <div className="text-right">
          <span className={statusClasses[request.status]}>
              {statusLabels[request.status]}
          </span>
            {request.currentApprovalLevel && (
              <div className="text-xs text-gray-500 mt-1">
                Level: {request.currentApprovalLevel}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>{request.description}</p>
      </div>
      {request.receipts && request.receipts.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          Receipts: {request.receipts.length} file{request.receipts.length !== 1 ? 's' : ''} attached
        </div>
      )}
      {request.managerApproval && (
        <div className="mt-2 text-xs text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <i className="bi bi-check-circle-fill text-green-600"></i>
            <span className="font-medium">Manager Approved</span>
          </div>
          <div className="mt-1 text-gray-700">
            <span className="font-medium">By:</span> {getApproverName(request.managerApproval.approvedBy)}
          </div>
          <div className="text-gray-600">
            <span className="font-medium">Date:</span> {new Date(request.managerApproval.approvedAt).toLocaleDateString()}
          </div>
          {request.managerApproval.comments && (
            <div className="mt-2 text-gray-700">
              <span className="font-medium">Comment:</span> {request.managerApproval.comments}
            </div>
          )}
        </div>
      )}
      {request.adminApproval && (
        <div className="mt-2 text-xs text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <i className="bi bi-shield-check-fill text-blue-600"></i>
            <span className="font-medium">Admin Approved</span>
          </div>
          <div className="mt-1 text-gray-700">
            <span className="font-medium">By:</span> {getApproverName(request.adminApproval.approvedBy)}
          </div>
          <div className="text-gray-600">
            <span className="font-medium">Date:</span> {new Date(request.adminApproval.approvedAt).toLocaleDateString()}
          </div>
          {request.adminApproval.comments && (
            <div className="mt-2 text-gray-700">
              <span className="font-medium">Comment:</span> {request.adminApproval.comments}
            </div>
          )}
        </div>
      )}
      <div className="mt-4 flex gap-2">
        {canApproveReject() && (
          <>
            <button 
              className="neo-button p-2 text-green-600" 
              onClick={() => onApprove(request.id)}
              disabled={disabled}
            >
              <i className="bi bi-check-lg"></i>
              <span>Approve</span>
            </button>
            <button 
              className="neo-button p-2 text-red-600" 
              onClick={() => onReject(request.id)}
              disabled={disabled}
            >
              <i className="bi bi-x-lg"></i>
              <span>Reject</span>
            </button>
          </>
        )}

        {request.status === 'approved' && onRevoke && (
          <button 
            className="neo-button p-2 text-red-600" 
            onClick={() => onRevoke(request.id)}
            disabled={disabled}
          >
            <i className="bi bi-x-lg"></i>
            <span>Revoke</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={`request-card ${disabled ? 'opacity-75' : ''}`}>
      <div className="flex items-center gap-4 mb-4">
        {isLeaveRequest && renderLeaveRequest(request as LeaveRequest)}
        {isReimbursementRequest && renderReimbursementRequest(request as ReimbursementRequest)}
      </div>
    </div>
  );
};

export default RequestCard;