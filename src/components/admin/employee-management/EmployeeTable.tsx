import React from 'react';
import { Employee } from './types';

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (index: number) => void;
  onToggleStatus: (index: number) => void;
  onDelete: (index: number) => void;
  onSort?: (column: string) => void;
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({ 
  employees, 
  onEdit, 
  onToggleStatus, 
  onDelete,
  onSort 
}) => {
  const handleSortClick = (column: string) => {
    if (onSort) {
      onSort(column);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="text-left p-4 cursor-pointer" onClick={() => handleSortClick('id')}>
              ID <i className="bi bi-arrow-down-up"></i>
            </th>
            <th className="text-left p-4 cursor-pointer" onClick={() => handleSortClick('name')}>
              Name <i className="bi bi-arrow-down-up"></i>
            </th>
            <th className="text-left p-4 cursor-pointer" onClick={() => handleSortClick('department')}>
              Department <i className="bi bi-arrow-down-up"></i>
            </th>
            <th className="text-left p-4 cursor-pointer" onClick={() => handleSortClick('position')}>
              Position <i className="bi bi-arrow-down-up"></i>
            </th>
            <th className="text-left p-4 cursor-pointer" onClick={() => handleSortClick('status')}>
              Status <i className="bi bi-arrow-down-up"></i>
            </th>
            <th className="text-left p-4">Actions</th>
          </tr>
        </thead>
        <tbody id="employee-table-body">
          {employees.map((employee, index) => (
            <tr key={employee.id}>
              <td className="p-4">{employee.id}</td>
              <td className="p-4">{employee.name}</td>
              <td className="p-4">{employee.department}</td>
              <td className="p-4">{employee.position}</td>
              <td className="p-4">
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                  employee.status === 'Active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {employee.status}
                </span>
              </td>
              <td className="p-4">
                <button 
                  className="neo-button p-2 mr-2" 
                  onClick={() => onEdit(index)}
                >
                  Edit
                </button>
                <button 
                  className="neo-button p-2 mr-2" 
                  onClick={() => onToggleStatus(index)}
                >
                  {employee.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>
                <button 
                  className="neo-button p-2" 
                  onClick={() => onDelete(index)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div id="loading-spinner" className="hidden text-center py-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    </div>
  );
};

export default EmployeeTable; 