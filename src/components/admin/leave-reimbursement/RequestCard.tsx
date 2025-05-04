import React from 'react';
import { LeaveRequest, ReimbursementRequest, RequestStatus } from './types';

interface RequestCardProps {
  request: LeaveRequest | ReimbursementRequest;
  type: 'leave' | 'reimbursement';
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onComment: (id: string) => void;
  onShowHistory: (id: string) => void;
  onRevoke?: (id: string) => void;
  onSelect?: (id: string, selected: boolean) => void;
  isSelected?: boolean;
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  type,
  onApprove,
  onReject,
  onComment,
  onShowHistory,
  onRevoke,
  onSelect,
  isSelected = false
}) => {
  const isLeaveRequest = type === 'leave';
  const isReimbursementRequest = type === 'reimbursement';
  
  const statusClasses = {
    pending: 'status-badge pending',
    approved: 'status-badge approved',
    rejected: 'status-badge rejected'
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSelect) {
      onSelect(request.id, e.target.checked);
    }
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
        </div>
        <span className={statusClasses[request.status]}>
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>{request.reason}</p>
      </div>
      <div className="mt-4 flex gap-2">
        {request.status === 'pending' && (
          <>
            <button className="neo-button p-2 text-green-600" onClick={() => onApprove(request.id)}>
              <i className="bi bi-check-lg"></i>
              <span>Approve</span>
            </button>
            <button className="neo-button p-2 text-red-600" onClick={() => onReject(request.id)}>
              <i className="bi bi-x-lg"></i>
              <span>Reject</span>
            </button>
          </>
        )}
        <button className="neo-button p-2 text-blue-600" onClick={() => onComment(request.id)}>
          <i className="bi bi-chat"></i>
          <span>Comment</span>
        </button>
        <button className="neo-button p-2 text-purple-600" onClick={() => onShowHistory(request.id)}>
          <i className="bi bi-clock-history"></i>
          <span>History</span>
        </button>
        {request.status === 'approved' && onRevoke && (
          <button className="neo-button p-2 text-red-600" onClick={() => onRevoke(request.id)}>
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
          <div className="text-sm font-medium">${request.amount.toFixed(2)}</div>
          <span className={statusClasses[request.status]}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </span>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>{request.description}</p>
      </div>
      <div className="mt-4 flex gap-2">
        {request.status === 'pending' && (
          <>
            <button className="neo-button p-2 text-green-600" onClick={() => onApprove(request.id)}>
              <i className="bi bi-check-lg"></i>
              <span>Approve</span>
            </button>
            <button className="neo-button p-2 text-red-600" onClick={() => onReject(request.id)}>
              <i className="bi bi-x-lg"></i>
              <span>Reject</span>
            </button>
          </>
        )}
        <button className="neo-button p-2 text-blue-600" onClick={() => onComment(request.id)}>
          <i className="bi bi-chat"></i>
          <span>Comment</span>
        </button>
        {request.status !== 'pending' && (
          <button className="neo-button p-2 text-purple-600" onClick={() => onShowHistory(request.id)}>
            <i className="bi bi-clock-history"></i>
            <span>History</span>
          </button>
        )}
        {request.status === 'approved' && onRevoke && (
          <button className="neo-button p-2 text-red-600" onClick={() => onRevoke(request.id)}>
            <i className="bi bi-x-lg"></i>
            <span>Revoke</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="request-card">
      <div className="flex items-center gap-4 mb-4">
        {onSelect && (
          <input 
            type="checkbox" 
            className="w-4 h-4 rounded border-gray-300"
            checked={isSelected}
            onChange={handleCheckboxChange}
          />
        )}
        {isLeaveRequest && renderLeaveRequest(request as LeaveRequest)}
        {isReimbursementRequest && renderReimbursementRequest(request as ReimbursementRequest)}
      </div>
    </div>
  );
};

export default RequestCard; 