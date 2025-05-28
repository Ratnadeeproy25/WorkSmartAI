import React, { useState } from 'react';

interface AttendanceFiltersProps {
  onFilter: (dateRange: string, department: string, status: string, searchTerm: string) => void;
}

const AttendanceFilters: React.FC<AttendanceFiltersProps> = ({ onFilter }) => {
  const [dateRange, setDateRange] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = () => {
    onFilter(dateRange, department, status, searchTerm);
  };

  return (
    <div className="neo-box p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
          <input 
            type="date" 
            className="neo-input w-full p-2" 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
          <select 
            className="neo-input w-full p-2"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            <option value="Development">Development</option>
            <option value="Design">Design</option>
            <option value="Marketing">Marketing</option>
            <option value="HR">HR</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select 
            className="neo-input w-full p-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
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
              placeholder="Search employee..." 
              className="neo-input flex-1 p-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              className="neo-button p-2"
              onClick={handleSearch}
            >
              <i className="bi bi-search"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceFilters; 