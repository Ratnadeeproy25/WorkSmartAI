import React from 'react';
import Sidebar from '../shared/Sidebar';
import { managerNavItems } from '../../config/navigation';
import { useAuth } from '../../context/AuthContext';

const ManagerSidebar: React.FC = () => {
  const { logout, userName, userEmail } = useAuth();
  
  // Create initials from the user's name
  const getInitials = (name: string | null): string => {
    if (!name) return 'M';
    const nameArray = name.split(' ');
    if (nameArray.length >= 2) {
      return `${nameArray[0].charAt(0)}${nameArray[1].charAt(0)}`;
    }
    return name.charAt(0);
  };

  const userInfo = {
    name: userName || 'Manager',
    email: userEmail || 'manager@worksmartai.com',
    initials: getInitials(userName)
  };

  return (
    <Sidebar
      portalType="manager"
      navItems={managerNavItems}
      userInfo={userInfo}
      onLogout={logout}
    />
  );
};

export default ManagerSidebar; 