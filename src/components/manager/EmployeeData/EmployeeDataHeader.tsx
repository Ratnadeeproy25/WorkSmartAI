import React from 'react';
import { Link } from 'react-router-dom';

const EmployeeDataHeader: React.FC = () => {
  return (
    <div className="neo-box p-8 mb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-700">Employee Data Management</h1>
          <p className="text-gray-600 mt-2">Comprehensive Employee Information System</p>
        </div>
        <div className="flex gap-4">
          <button className="neo-button p-3">
            <i className="bi bi-bell text-xl"></i>
          </button>
          <Link to="/manager/profile" className="neo-button p-3 scale-on-hover" aria-label="Settings">
            <i className="bi bi-gear text-xl"></i>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDataHeader; 