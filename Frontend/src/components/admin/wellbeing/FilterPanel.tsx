import React from 'react';
import { FilterOptions } from './WellbeingManagement';

interface FilterPanelProps {
  filters: FilterOptions;
  onFilterChange: (filters: Partial<FilterOptions>) => void;
  departments?: string[];
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFilterChange, departments = [] }) => {
  return (
    <div className="neo-box p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label htmlFor="departmentFilter" className="text-xs text-gray-600 block mb-1">Department</label>
          <select 
            id="departmentFilter" 
            className="neo-input py-1.5 px-2 rounded text-sm w-full"
            value={filters.department}
            onChange={(e) => onFilterChange({ department: e.target.value })}
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept.toLowerCase()}>
                {dept}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="statusFilter" className="text-xs text-gray-600 block mb-1">Status</label>
          <select 
            id="statusFilter" 
            className="neo-input py-1.5 px-2 rounded text-sm w-full"
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
          >
            <option value="all">All Status</option>
            <option value="good">Good</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="searchInput" className="text-xs text-gray-600 block mb-1">Search</label>
          <input 
            id="searchInput" 
            type="text" 
            placeholder="Search by name, department..." 
            className="neo-input py-1.5 px-2 rounded text-sm w-full"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};

export default FilterPanel; 