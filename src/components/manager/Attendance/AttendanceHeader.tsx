import React from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';

const AttendanceHeader: React.FC = () => {
  return (
    <div className="neo-box p-5 md:p-6 mb-8 dashboard-header">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dashboard-title">Attendance Management</h1>
          <p className="text-md md:text-lg text-gray-600 dashboard-subtitle">Team Attendance Overview</p>
        </div>
        <div className="flex gap-3 md:gap-4">
          <button className="neo-button p-3 relative pulse" aria-label="Notifications">
            <i className="bi bi-bell text-xl"></i>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              3
            </span>
          </button>
          <Link to="/manager/profile" className="neo-button p-3 scale-on-hover" aria-label="Settings">
            <i className="bi bi-gear text-xl"></i>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHeader; 