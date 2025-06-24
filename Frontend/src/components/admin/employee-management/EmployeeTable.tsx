import React from 'react';
import { Employee } from './types';

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (index: number) => void;
  onToggleStatus: (index: number) => void;
  onDelete: (index: number) => void;
  onSort?: (column: string) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  managers?: { _id: string; name: string; department: string; position: string }[];
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({ 
  employees, 
  onEdit, 
  onToggleStatus, 
  onDelete,
  onSort,
  sortColumn = 'name',
  sortDirection = 'asc',
  managers = []
}) => {
  // Helper to render sort icons
  const renderSortIcon = (column: string) => {
    if (!sortColumn || sortColumn !== column) 
      return <i className="bi bi-arrow-down-up ml-2 text-gray-400 text-lg"></i>;
    
    return sortDirection === 'asc' 
      ? <i className="bi bi-sort-alpha-down ml-2 text-blue-600 text-lg"></i>
      : <i className="bi bi-sort-alpha-up ml-2 text-blue-600 text-lg"></i>;
  };

  // Helper to get manager name by ID
  const getManagerName = (managerId?: string) => {
    if (!managerId) return 'Not Assigned';
    const manager = managers.find(mgr => mgr._id === managerId);
    return manager ? manager.name : 'Unknown Manager';
  };

  // Helper to format shift time
  const formatShiftTime = (shiftTime?: { start: string; end: string }) => {
    if (!shiftTime || !shiftTime.start || !shiftTime.end) return 'Not Set';
    return `${shiftTime.start} - ${shiftTime.end}`;
  };

  // Helper to format office location
  const formatOfficeLocation = (location?: { lat: number; lng: number; address?: { city: string; state: string; country: string } }) => {
    if (!location) return "Not Set";
    
    // If address is available, display it
    if (location.address && (location.address.city || location.address.state || location.address.country)) {
      const parts = [
        location.address.city,
        location.address.state,
        location.address.country
      ].filter(Boolean);
      
      if (parts.length > 0) {
        return parts.join(", ");
      }
    }
    
    // Fallback to coordinates if no address or if coordinates are set
    if (location.lat !== 0 || location.lng !== 0) {
      return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
    }
    
    return "Not Set";
  };

  return (
    <div className="overflow-x-auto neo-box p-6 shadow-md rounded-lg">
      <table className="min-w-full text-gray-700 table-fixed">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="py-4 px-3 text-left font-semibold w-24">
              <button 
                className="font-medium text-sm flex items-center hover:text-blue-600 transition-colors"
                onClick={() => onSort && onSort('id')}
              >
                ID {renderSortIcon('id')}
              </button>
            </th>
            <th className="py-4 px-3 text-left font-semibold w-32">
              <button 
                className="font-medium text-sm flex items-center hover:text-blue-600 transition-colors"
                onClick={() => onSort && onSort('name')}
              >
                Name {renderSortIcon('name')}
              </button>
            </th>
            <th className="py-4 px-3 text-left font-semibold w-28">
              <button 
                className="font-medium text-sm flex items-center hover:text-blue-600 transition-colors"
                onClick={() => onSort && onSort('department')}
              >
                Department {renderSortIcon('department')}
              </button>
            </th>
            <th className="py-4 px-3 text-left font-semibold w-28">
              <button 
                className="font-medium text-sm flex items-center hover:text-blue-600 transition-colors"
                onClick={() => onSort && onSort('position')}
              >
                Position {renderSortIcon('position')}
              </button>
            </th>
            <th className="py-4 px-3 text-left font-semibold w-28">
              <button 
                className="font-medium text-sm flex items-center hover:text-blue-600 transition-colors"
                onClick={() => onSort && onSort('manager')}
              >
                Manager {renderSortIcon('manager')}
              </button>
            </th>
            <th className="py-4 px-3 text-left font-semibold w-28">
              <button 
                className="font-medium text-sm flex items-center hover:text-blue-600 transition-colors"
                onClick={() => onSort && onSort('shiftTime.start')}
              >
                Shift Time {renderSortIcon('shiftTime.start')}
              </button>
            </th>
            <th className="py-4 px-3 text-left font-semibold w-32">
              <button 
                className="font-medium text-sm flex items-center hover:text-blue-600 transition-colors"
                onClick={() => onSort && onSort('officeLocation.lat')}
              >
                Office Location {renderSortIcon('officeLocation.lat')}
              </button>
            </th>
            <th className="py-4 px-3 text-left font-semibold w-20">
              <button 
                className="font-medium text-sm flex items-center hover:text-blue-600 transition-colors"
                onClick={() => onSort && onSort('status')}
              >
                Status {renderSortIcon('status')}
              </button>
            </th>
            <th className="py-4 px-3 text-center font-semibold w-28">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center py-8 text-gray-500">
                No employee records found
              </td>
            </tr>
          ) : (
            employees.map((employee, index) => (
              <tr 
                key={employee.id} 
                className="hover:bg-gray-50 border-b border-gray-200 transition-colors"
              >
                <td className="py-4 px-3 font-medium text-sm">{employee.id}</td>
                <td className="py-4 px-3 text-sm">{employee.name}</td>
                <td className="py-4 px-3 text-sm">{employee.department}</td>
                <td className="py-4 px-3 text-sm">{employee.position}</td>
                <td className="py-4 px-3 text-sm">
                  <span className={`${employee.manager ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                    {getManagerName(employee.manager)}
                  </span>
                </td>
                <td className="py-4 px-3 text-sm">
                  <span className={`${employee.shiftTime ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                    {formatShiftTime(employee.shiftTime)}
                  </span>
                </td>
                <td className="py-4 px-3 text-sm">
                  <span className={`${employee.officeLocation && employee.officeLocation.lat !== 0 ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                    {formatOfficeLocation(employee.officeLocation)}
                  </span>
                </td>
                <td className="py-4 px-3">
                  <span className={`inline-block py-1 px-3 rounded-full text-xs font-medium ${
                    employee.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {employee.status}
                  </span>
                </td>
                <td className="py-4 px-3">
                  <div className="flex items-center justify-center gap-1">
                    <button 
                      onClick={() => onEdit(index)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors group"
                      title="Edit"
                    >
                      <i className="bi bi-pencil-square text-blue-600 text-sm group-hover:text-blue-700"></i>
                    </button>
                    <button 
                      onClick={() => onToggleStatus(index)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                      title={employee.status === 'Active' ? 'Deactivate' : 'Activate'}
                    >
                      <i className={`bi ${employee.status === 'Active' ? 'bi-toggle-on text-green-600 group-hover:text-green-700' : 'bi-toggle-off text-gray-500 group-hover:text-gray-600'} text-sm`}></i>
                    </button>
                    <button 
                      onClick={() => onDelete(index)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 transition-colors group"
                      title="Delete"
                    >
                      <i className="bi bi-trash text-red-600 text-sm group-hover:text-red-700"></i>
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

export default EmployeeTable; 