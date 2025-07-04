import React from 'react';
import { ReimbursementSummary as ReimbursementSummaryType } from '../../../components/employee/LeaveReimbursement/types';

interface ReimbursementSummaryProps {
  summary: ReimbursementSummaryType;
}

const ReimbursementSummary: React.FC<ReimbursementSummaryProps> = ({ summary }) => {
  return (
    <div className="neo-box p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Reimbursement Summary</h3>
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">₹{summary.totalSubmitted.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total Submitted</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">₹{summary.totalApproved.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">₹{summary.totalPending.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
        
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                Approved Rate
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-green-600">
                {summary.totalSubmitted > 0 
                  ? `${Math.round((summary.totalApproved / summary.totalSubmitted) * 100)}%`
                  : '0%'}
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
            <div 
              style={{ 
                width: summary.totalSubmitted > 0 
                  ? `${Math.round((summary.totalApproved / summary.totalSubmitted) * 100)}%`
                  : '0%'
              }} 
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReimbursementSummary; 