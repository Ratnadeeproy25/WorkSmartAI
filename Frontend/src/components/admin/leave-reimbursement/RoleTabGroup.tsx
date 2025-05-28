import React from 'react';
import { ViewRole } from './types';

interface RoleTabGroupProps {
  activeRole: ViewRole;
  onRoleChange: (role: ViewRole) => void;
}

const RoleTabGroup: React.FC<RoleTabGroupProps> = ({ activeRole, onRoleChange }) => {
  return (
    <div className="flex flex-wrap gap-4 mb-8">
      <button 
        className={`tab-button ${activeRole === 'all' ? 'active' : ''}`}
        onClick={() => onRoleChange('all')}
      >
        All Roles
      </button>
      <button 
        className={`tab-button ${activeRole === 'employee' ? 'active' : ''}`}
        onClick={() => onRoleChange('employee')}
      >
        Employee Requests
      </button>
      <button 
        className={`tab-button ${activeRole === 'manager' ? 'active' : ''}`}
        onClick={() => onRoleChange('manager')}
      >
        Manager Requests
      </button>
    </div>
  );
};

export default RoleTabGroup; 