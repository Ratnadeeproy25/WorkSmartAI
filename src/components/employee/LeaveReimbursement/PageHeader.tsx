import React from 'react';
import { Link } from 'react-router-dom';

const PageHeader: React.FC = () => {
  return (
    <div className="neo-box p-6 mb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Leave & Reimbursement</h1>
          <p className="text-lg text-gray-600">Request time off or expense reimbursement</p>
        </div>
        <div className="flex gap-3">
          <Link to="/employee/dashboard" className="neo-button p-3 flex items-center gap-2">
            <i className="bi bi-arrow-left"></i>
            <span>Back to Dashboard</span>
          </Link>
          <Link to="/employee/profile" className="neo-button p-3 scale-on-hover" aria-label="Settings">
            <i className="bi bi-gear text-xl"></i>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PageHeader; 