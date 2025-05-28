import React from 'react';
import Sidebar from '../shared/Sidebar';
import { adminNavItems } from '../../config/navigation';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar: React.FC = () => {
  const { logout, userEmail, userName } = useAuth();
  
  // Get the user's initials from their name
  const getUserInitials = (): string => {
    if (!userName) return 'A';
    
    const nameParts = userName.split(' ');
    if (nameParts.length > 1) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  };
  
  const userInfo = {
    name: userName || 'Admin User',
    email: userEmail || 'admin@worksmartai.com',
    initials: getUserInitials()
  };

  return (
    <Sidebar
      portalType="admin"
      navItems={adminNavItems}
      userInfo={userInfo}
      onLogout={logout}
    />
  );
};

export default AdminSidebar; 