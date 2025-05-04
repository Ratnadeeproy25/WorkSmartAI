import React, { ChangeEvent } from 'react';
import { DateRange, FilterOptions } from './types';

interface FilterPanelProps {
  filterOptions: FilterOptions;
  onDateRangeChange: (dateRange: DateRange) => void;
  onDepartmentChange: (department: string) => void;
  onStatusChange: (status: string) => void;
  onSearchChange: (query: string) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filterOptions,
  onDateRangeChange,
  onDepartmentChange,
  onStatusChange,
  onSearchChange
}) => {
  const handleStartDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    onDateRangeChange({
      ...filterOptions.dateRange,
      startDate: e.target.value
    });
  };

  const handleEndDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    onDateRangeChange({
      ...filterOptions.dateRange,
      endDate: e.target.value
    });
  };

  return (
    <div className="neo-box p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
          <div className="date-range-container">
            <div className="date-input-container">
              <label>From:</label>
              <input 
                type="date" 
                className="neo-input" 
                placeholder="Start Date"
                value={filterOptions.dateRange.startDate}
                onChange={handleStartDateChange}
              />
            </div>
            <div className="date-input-container">
              <label>To:</label>
              <input 
                type="date" 
                className="neo-input" 
                placeholder="End Date"
                value={filterOptions.dateRange.endDate}
                onChange={handleEndDateChange}
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
          <select 
            className="neo-select"
            value={filterOptions.department}
            onChange={(e) => onDepartmentChange(e.target.value)}
          >
            <option value="">All Departments</option>
            <option value="development">Development</option>
            <option value="design">Design</option>
            <option value="marketing">Marketing</option>
            <option value="hr">HR</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select 
            className="neo-select"
            value={filterOptions.status}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="leave">On Leave</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Search..." 
              className="neo-input"
              value={filterOptions.searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <button className="neo-button p-2">
              <i className="bi bi-search"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel; 