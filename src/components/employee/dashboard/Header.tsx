import React from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../../styles/employee/dashboard.css';

const Header: React.FC = () => {
  return (
    <div className="neo-box p-6 mb-8">
      <div className="header-container">
        <div className="header-content">
          <div className="flex items-center gap-4 profile-info">
            <div className="profile-avatar w-12 h-12 lg:w-16 lg:h-16 relative">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"
                alt="Profile"
                className="w-full h-full object-cover rounded-full shadow-lg"
              />
              <div className="status-dot absolute bottom-0 right-0 w-3 h-3 lg:w-4 lg:h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Welcome, John Doe</h1>
              <p className="text-sm lg:text-lg text-gray-600">Employee Dashboard</p>
            </div>
          </div>

          <div className="flex gap-2 lg:gap-4 action-buttons">
            <button className="neo-button p-2 lg:p-3 relative">
              <i className="bi bi-bell text-lg lg:text-xl"></i>
              <span className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            <Link to="/employee/profile" className="neo-button p-2 lg:p-3 scale-on-hover" aria-label="Settings">
              <i className="bi bi-gear text-lg lg:text-xl"></i>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header; 