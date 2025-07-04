import React from 'react';
import { ReimbursementRequest } from '../../../components/employee/LeaveReimbursement/types';

interface ReimbursementHistoryProps {
  reimbursementRequests: ReimbursementRequest[];
}

const ReimbursementHistory: React.FC<ReimbursementHistoryProps> = ({ reimbursementRequests }) => {
  // Helper function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Helper function to get expense type display name
  const getExpenseTypeDisplay = (type: string): string => {
    const typeMap: Record<string, string> = {
      'travel': 'Travel',
      'meals': 'Meals',
      'office-supplies': 'Office Supplies',
      'training': 'Training',
      'team-building': 'Team Building',
      'other': 'Other'
    };
    
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="neo-box p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Reimbursement History</h3>
      {reimbursementRequests.length === 0 ? (
        <div className="text-gray-500 text-center py-6">
          No reimbursement requests found
        </div>
      ) : (
        <div className="space-y-4">
          {reimbursementRequests.map((request, index) => (
            <div className="request-card" key={index}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-gray-700">{getExpenseTypeDisplay(request.type)}</div>
                  <div className="text-sm text-gray-600">{formatDate(request.date)}</div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`status-badge ${request.status}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                  <span className="text-lg font-semibold mt-1">₹{request.amount.toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>{request.description}</p>
              </div>
              {request.receipts && request.receipts.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs text-gray-500">Receipts: {request.receipts.length}</span>
                </div>
              )}
              <div className="mt-2 text-xs text-gray-500">
                <p>Submitted on {formatDate(request.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReimbursementHistory; 