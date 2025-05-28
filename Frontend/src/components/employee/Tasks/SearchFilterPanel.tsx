import React from 'react';

interface SearchFilterPanelProps {
  searchQuery: string;
  priorityFilter: string;
  dateFilter: string;
  onSearchChange: (query: string) => void;
  onPriorityChange: (priority: string) => void;
  onDateChange: (dateFilter: string) => void;
  onClearFilters: () => void;
}

const SearchFilterPanel: React.FC<SearchFilterPanelProps> = ({
  searchQuery,
  priorityFilter,
  dateFilter,
  onSearchChange,
  onPriorityChange,
  onDateChange,
  onClearFilters
}) => {
  return (
    <div className="neo-box p-4 md:p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search input */}
        <div className="col-span-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <i className="bi bi-search text-gray-400"></i>
            </div>
            <input
              type="search"
              className="block w-full p-2.5 pl-10 text-sm text-gray-900 border border-gray-200 rounded-lg bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Priority filter */}
        <div>
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
          >
            <option value="">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>

        {/* Due date filter */}
        <div>
          <select
            value={dateFilter}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
          >
            <option value="">All Due Dates</option>
            <option value="today">Due Today</option>
            <option value="week">Due This Week</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Filter indicators */}
      <div className="flex flex-wrap gap-2 mt-4 items-center">
        <span className="text-sm text-gray-500">Active Filters:</span>
        
        {(searchQuery || priorityFilter || dateFilter) ? (
          <>
            {searchQuery && (
              <span className="bg-gray-100 text-gray-800 text-xs font-medium me-2 px-2.5 py-1 rounded-full flex items-center">
                Search: {searchQuery}
                <button onClick={() => onSearchChange('')} className="ml-1 text-gray-500 hover:text-gray-700">
                  <i className="bi bi-x-circle-fill"></i>
                </button>
              </span>
            )}
            
            {priorityFilter && (
              <span className="bg-gray-100 text-gray-800 text-xs font-medium me-2 px-2.5 py-1 rounded-full flex items-center">
                Priority: {priorityFilter.charAt(0).toUpperCase() + priorityFilter.slice(1)}
                <button onClick={() => onPriorityChange('')} className="ml-1 text-gray-500 hover:text-gray-700">
                  <i className="bi bi-x-circle-fill"></i>
                </button>
              </span>
            )}
            
            {dateFilter && (
              <span className="bg-gray-100 text-gray-800 text-xs font-medium me-2 px-2.5 py-1 rounded-full flex items-center">
                Due: {dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'This Week' : 'Overdue'}
                <button onClick={() => onDateChange('')} className="ml-1 text-gray-500 hover:text-gray-700">
                  <i className="bi bi-x-circle-fill"></i>
                </button>
              </span>
            )}
            
            <button 
              onClick={onClearFilters}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Clear All
            </button>
          </>
        ) : (
          <span className="text-xs text-gray-400">None</span>
        )}
      </div>
    </div>
  );
};

export default SearchFilterPanel; 