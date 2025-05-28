import React from 'react';
import { ReimbursementRequest } from './types';

interface ReimbursementHistoryProps {
  reimbursementRequests: ReimbursementRequest[];
}

const ReimbursementHistory: React.FC<ReimbursementHistoryProps> = ({ reimbursementRequests }) => {
  // Format expense type for display
  const formatExpenseType = (type: string) => {
    // Replace hyphens with spaces and capitalize each word
    return type.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  };

  return (
    <div className="neo-box p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Reimbursement History</h3>
      <div className="space-y-4">
        {reimbursementRequests.length === 0 ? (
          <div className="text-gray-500 text-center py-4">No reimbursement requests found</div>
        ) : (
          reimbursementRequests.map(request => (
            <div key={request.id} className="request-card">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-700">
                    {formatExpenseType(request.type)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(request.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium">${request.amount.toFixed(2)}</div>
                  <span className={`status-badge ${request.status}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>{request.description}</p>
              </div>
              {request.receipts && request.receipts.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  <i className="bi bi-paperclip"></i> {request.receipts.length} 
                  {request.receipts.length === 1 ? ' receipt' : ' receipts'} attached
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReimbursementHistory; 