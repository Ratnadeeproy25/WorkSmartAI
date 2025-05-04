import React from 'react';
import { Manager } from './types';

interface ManagerTableProps {
  managers: Manager[];
  onEdit: (index: number) => void;
  onToggleStatus: (index: number) => void;
  onDelete: (index: number) => void;
  onSort?: (column: string) => void;
}

const ManagerTable: React.FC<ManagerTableProps> = ({ 
  managers, 
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
        <tbody id="manager-table-body">
          {managers.map((manager, index) => (
            <tr key={manager.id}>
              <td className="p-4">{manager.id}</td>
              <td className="p-4">{manager.name}</td>
              <td className="p-4">{manager.department}</td>
              <td className="p-4">{manager.position}</td>
              <td className="p-4">
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                  manager.status === 'Active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {manager.status}
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
                  {manager.status === 'Active' ? 'Deactivate' : 'Activate'}
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

export default ManagerTable; 