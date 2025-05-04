import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';

export interface NavItem {
  path: string;
  label: string;
  icon: string;
}

export interface UserInfo {
  name: string;
  email: string;
  initials: string;
}

export interface SidebarProps {
  portalType: 'employee' | 'manager' | 'admin';
  navItems: NavItem[];
  userInfo: UserInfo;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  portalType, 
  navItems, 
  userInfo,
  onLogout 
}) => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getPortalTitle = () => {
    switch (portalType) {
      case 'employee':
        return 'Employee Portal';
      case 'manager':
        return 'Manager Portal';
      case 'admin':
        return 'Admin Portal';
      default:
        return '';
    }
  };
  
  return (
    <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-lg z-10 transition-all duration-300 transform lg:translate-x-0 p-6 overflow-y-auto" id="sidebar">
      <div className="flex flex-col h-full">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-blue-600">WorkSmart AI</h2>
          <p className="text-sm text-gray-500">{getPortalTitle()}</p>
        </div>
        
        <nav className="flex-1">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path} 
                  className={`flex items-center p-3 rounded-xl transition-all hover:bg-blue-50 ${
                    isActive(item.path) ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <i className={`bi ${item.icon} text-xl mr-3`}></i>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="mt-auto pt-6 border-t border-gray-200">
          <div className="px-3 py-2 mb-2">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                <span>{userInfo.initials}</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">{userInfo.name}</p>
                <p className="text-xs text-gray-500">{userInfo.email}</p>
              </div>
            </div>
          </div>
          <Link 
            to="/" 
            className="flex items-center p-3 rounded-xl transition-all hover:bg-red-50 text-gray-700"
            onClick={onLogout}
          >
            <i className="bi bi-box-arrow-left text-xl mr-3"></i>
            <span>Logout</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 