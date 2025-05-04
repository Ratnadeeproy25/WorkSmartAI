import React from 'react';
import { Link } from 'react-router-dom';

const WellbeingHeader: React.FC = () => {
  return (
    <div className="neo-box p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-700">Manager Wellbeing Dashboard</h1>
        <div className="flex gap-3">
          <Link to="/employee/dashboard#wellbeing" className="neo-button p-3 flex items-center gap-2 dashboard-link">
            <i className="bi bi-speedometer2"></i>
            <span>View Dashboard Summary</span>
          </Link>
          <Link to="/manager/profile" className="neo-button p-3 scale-on-hover" aria-label="Settings">
            <i className="bi bi-gear text-xl"></i>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WellbeingHeader; 