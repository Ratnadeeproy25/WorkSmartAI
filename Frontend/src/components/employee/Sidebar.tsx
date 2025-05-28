import React from 'react';
import Sidebar from '../shared/Sidebar';
import { employeeNavItems } from '../../config/navigation';
import { useAuth } from '../../context/AuthContext';

interface EmployeeSidebarProps {
  activeSection?: string;
}

const EmployeeSidebar: React.FC<EmployeeSidebarProps> = ({ activeSection }) => {
  const { logout, userName, userEmail } = useAuth();
  
  // Create initials from the user's name
  const getInitials = (name: string | null): string => {
    if (!name) return 'U';
    const nameArray = name.split(' ');
    if (nameArray.length >= 2) {
      return `${nameArray[0].charAt(0)}${nameArray[1].charAt(0)}`;
    }
    return name.charAt(0);
  };

  const userInfo = {
    name: userName || 'User',
    email: userEmail || 'user@example.com',
    initials: getInitials(userName)
  };

  return (
    <Sidebar
      portalType="employee"
      navItems={employeeNavItems}
      userInfo={userInfo}
      onLogout={logout}
      activeSection={activeSection}
    />
  );
};

export default EmployeeSidebar; 