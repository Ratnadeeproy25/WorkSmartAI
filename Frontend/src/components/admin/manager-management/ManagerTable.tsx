import React from 'react';
import { Manager } from './types';

interface ManagerTableProps {
  managers: Manager[];
  onEdit: (index: number) => void;
  onToggleStatus: (index: number) => void;
  onDelete: (index: number) => void;
  onSort?: (column: string) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

const ManagerTable: React.FC<ManagerTableProps> = ({ 
  managers, 
  onEdit, 
  onToggleStatus, 
  onDelete,
  onSort,
  sortColumn = 'name',
  sortDirection = 'asc'
}) => {
  // Helper to render sort icons
  const renderSortIcon = (column: string) => {
    if (!sortColumn || sortColumn !== column) 
      return <i className="bi bi-arrow-down-up ml-2 text-gray-400 text-lg"></i>;
    
    return sortDirection === 'asc' 
      ? <i className="bi bi-sort-alpha-down ml-2 text-blue-600 text-lg"></i>
      : <i className="bi bi-sort-alpha-up ml-2 text-blue-600 text-lg"></i>;
  };

  return (
    <div className="overflow-x-auto neo-box p-6 shadow-md rounded-lg">
      <table className="min-w-full text-gray-700">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="py-4 px-4 text-left font-semibold">
              <button 
                className="font-medium text-sm flex items-center hover:text-blue-600 transition-colors"
                onClick={() => onSort && onSort('id')}
              >
                Manager ID {renderSortIcon('id')}
              </button>
            </th>
            <th className="py-4 px-4 text-left font-semibold">
              <button 
                className="font-medium text-sm flex items-center hover:text-blue-600 transition-colors"
                onClick={() => onSort && onSort('name')}
              >
                Name {renderSortIcon('name')}
              </button>
            </th>
            <th className="py-4 px-4 text-left font-semibold">
              <button 
                className="font-medium text-sm flex items-center hover:text-blue-600 transition-colors"
                onClick={() => onSort && onSort('department')}
              >
                Department {renderSortIcon('department')}
              </button>
            </th>
            <th className="py-4 px-4 text-left font-semibold">
              <button 
                className="font-medium text-sm flex items-center hover:text-blue-600 transition-colors"
                onClick={() => onSort && onSort('position')}
              >
                Position {renderSortIcon('position')}
              </button>
            </th>
            <th className="py-4 px-4 text-left font-semibold">
              <button 
                className="font-medium text-sm flex items-center hover:text-blue-600 transition-colors"
                onClick={() => onSort && onSort('status')}
              >
                Status {renderSortIcon('status')}
              </button>
            </th>
            <th className="py-4 px-4 text-center font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {managers.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-8 text-gray-500">
                No manager records found
              </td>
            </tr>
          ) : (
            managers.map((manager, index) => (
              <tr 
                key={manager.id} 
                className="hover:bg-gray-50 border-b border-gray-200 transition-colors"
              >
                <td className="py-4 px-4 font-medium">{manager.id}</td>
                <td className="py-4 px-4">{manager.name}</td>
                <td className="py-4 px-4">{manager.department}</td>
                <td className="py-4 px-4">{manager.position}</td>
                <td className="py-4 px-4">
                  <span className={`inline-block py-1.5 px-4 rounded-full text-sm font-medium ${
                    manager.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {manager.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex justify-center gap-3">
                    <button 
                      onClick={() => onEdit(index)}
                      className="neo-button p-2 hover:bg-blue-50 transition-colors"
                      title="Edit"
                    >
                      <i className="bi bi-pencil-square text-lg text-blue-600"></i>
                    </button>
                    <button 
                      onClick={() => onToggleStatus(index)}
                      className="neo-button p-2 hover:bg-blue-50 transition-colors"
                      title={manager.status === 'Active' ? 'Deactivate' : 'Activate'}
                    >
                      <i className={`bi ${manager.status === 'Active' ? 'bi-toggle-on text-green-600' : 'bi-toggle-off text-gray-500'} text-xl`}></i>
                    </button>
                    <button 
                      onClick={() => onDelete(index)}
                      className="neo-button p-2 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <i className="bi bi-trash text-red-600 text-lg"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ManagerTable; 