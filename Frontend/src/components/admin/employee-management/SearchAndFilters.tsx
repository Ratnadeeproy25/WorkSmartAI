import React from 'react';

interface SearchAndFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  departments: string[];
  selectedDepartment: string;
  onDepartmentChange: (department: string) => void;
}

const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchValue,
  onSearchChange,
  departments,
  selectedDepartment,
  onDepartmentChange
}) => {
  return (
    <div className="neo-box p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="neo-input-group w-full md:w-1/2">
          <i className="bi bi-search text-xl text-gray-500 mr-2"></i>
          <input
            type="text"
            placeholder="Search by ID, name, or department..."
            className="neo-input flex-grow py-2.5"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4 items-center w-full md:w-1/2">
          <div className="neo-select-group w-full">
            <label className="text-sm font-medium text-gray-700 mb-1 ml-1">Department:</label>
            <div className="flex items-center">
              <i className="bi bi-filter text-lg text-gray-500 mr-2"></i>
              <select
                className="neo-select w-full py-2.5"
                value={selectedDepartment}
                onChange={(e) => onDepartmentChange(e.target.value)}
              >
                <option value="All">All Departments</option>
                {departments.map((dept, index) => (
                  <option key={index} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilters; 