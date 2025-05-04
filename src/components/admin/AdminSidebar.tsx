import React from 'react';
import Sidebar from '../shared/Sidebar';
import { adminNavItems } from '../../config/navigation';

const AdminSidebar: React.FC = () => {
  const userInfo = {
    name: 'Admin Name',
    email: 'admin@worksmartai.com',
    initials: 'AN'
  };

  return (
    <Sidebar
      portalType="admin"
      navItems={adminNavItems}
      userInfo={userInfo}
    />
  );
};

export default AdminSidebar; 