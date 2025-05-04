import React from 'react';
import Sidebar from '../shared/Sidebar';
import { managerNavItems } from '../../config/navigation';

const ManagerSidebar: React.FC = () => {
  const userInfo = {
    name: 'Manager Name',
    email: 'manager@worksmartai.com',
    initials: 'MN'
  };

  return (
    <Sidebar
      portalType="manager"
      navItems={managerNavItems}
      userInfo={userInfo}
    />
  );
};

export default ManagerSidebar; 