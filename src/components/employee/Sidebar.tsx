import React from 'react';
import Sidebar from '../shared/Sidebar';
import { employeeNavItems } from '../../config/navigation';

const EmployeeSidebar: React.FC = () => {
  const userInfo = {
    name: 'John Doe',
    email: 'john.doe@worksmartai.com',
    initials: 'JD'
  };

  return (
    <Sidebar
      portalType="employee"
      navItems={employeeNavItems}
      userInfo={userInfo}
    />
  );
};

export default EmployeeSidebar; 