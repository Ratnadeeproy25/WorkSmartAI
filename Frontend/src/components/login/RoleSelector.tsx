import React from 'react';
import '../../styles/login/RoleSelector.css';

interface RoleSelectorProps {
  onRoleSelect: (role: string) => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ onRoleSelect }) => {
  return (
    <div className="p-8 bg-white rounded-xl">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Select Your Role</h2>
      <div className="grid grid-cols-2 gap-6 mb-4">
        <div 
          className="p-6 bg-white rounded-xl shadow-md flex flex-col items-center justify-center transition-all hover:shadow-lg transform hover:-translate-y-1 cursor-pointer"
          onClick={() => onRoleSelect('employee')}
        >
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
            <i className="bi bi-person text-2xl"></i>
          </div>
          <span className="text-lg font-medium text-gray-700">Employee</span>
        </div>
        <div 
          className="p-6 bg-white rounded-xl shadow-md flex flex-col items-center justify-center transition-all hover:shadow-lg transform hover:-translate-y-1 cursor-pointer"
          onClick={() => onRoleSelect('manager')}
        >
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
            <i className="bi bi-person-badge text-2xl"></i>
          </div>
          <span className="text-lg font-medium text-gray-700">Manager</span>
        </div>
      </div>
      <div className="flex justify-center">
        <div 
          className="p-6 bg-white rounded-xl shadow-md flex flex-col items-center justify-center transition-all hover:shadow-lg transform hover:-translate-y-1 cursor-pointer w-1/2"
          onClick={() => onRoleSelect('admin')}
        >
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
            <i className="bi bi-shield text-2xl"></i>
          </div>
          <span className="text-lg font-medium text-gray-700">Admin</span>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector; 