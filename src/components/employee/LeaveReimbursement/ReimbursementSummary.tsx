import React from 'react';
import { ReimbursementSummary as ReimbursementSummaryType } from './types';

interface ReimbursementSummaryProps {
  summary: ReimbursementSummaryType;
}

const ReimbursementSummary: React.FC<ReimbursementSummaryProps> = ({ summary }) => {
  return (
    <div className="neo-box p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Reimbursement Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="neo-box p-6 text-center">
          <div className="text-2xl font-bold text-blue-600">${summary.totalSubmitted.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Total Submitted</div>
          <div className="text-xs text-gray-500 mt-2">This year</div>
        </div>
        <div className="neo-box p-6 text-center">
          <div className="text-2xl font-bold text-green-600">${summary.totalApproved.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Total Approved</div>
          <div className="text-xs text-gray-500 mt-2">This year</div>
        </div>
        <div className="neo-box p-6 text-center">
          <div className="text-2xl font-bold text-yellow-600">${summary.totalPending.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-xs text-gray-500 mt-2">Awaiting approval</div>
        </div>
      </div>
    </div>
  );
};

export default ReimbursementSummary; 