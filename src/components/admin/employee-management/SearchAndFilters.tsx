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
    <div className="mb-4 flex flex-wrap items-center gap-4">
      <div className="flex-1">
        <input 
          type="text" 
          id="search-input" 
          placeholder="Search employees..." 
          className="w-full p-2 border rounded"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex items-center space-x-2">
        <label htmlFor="department-filter" className="text-gray-700 font-medium">
          Filter by Department:
        </label>
        <select 
          id="department-filter" 
          className="p-2 border rounded"
          value={selectedDepartment}
          onChange={(e) => onDepartmentChange(e.target.value)}
        >
          <option value="All">All</option>
          {departments.map((dept, index) => (
            <option key={index} value={dept}>{dept}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SearchAndFilters; 