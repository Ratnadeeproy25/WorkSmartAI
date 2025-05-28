import React from 'react';

interface SearchFilterPanelProps {
  searchQuery: string;
  assigneeFilter: string;
  priorityFilter: string;
  dateFilter: string;
  onSearchChange: (query: string) => void;
  onAssigneeChange: (assigneeId: string) => void;
  onPriorityChange: (priority: string) => void;
  onDateChange: (dateFilter: string) => void;
  onClearFilters: () => void;
}

const SearchFilterPanel: React.FC<SearchFilterPanelProps> = ({
  searchQuery,
  assigneeFilter,
  priorityFilter,
  dateFilter,
  onSearchChange,
  onAssigneeChange,
  onPriorityChange,
  onDateChange,
  onClearFilters
}) => {
  // Sample assignees data for the filter dropdown
  const assignees = [
    { id: '1', name: 'John Doe', color: '#3b82f6' },
    { id: '2', name: 'Jane Smith', color: '#10b981' },
  ];

  return (
    <div className="neo-box p-5 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search input */}
        <div className="col-span-1 md:col-span-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <i className="bi bi-search text-gray-400"></i>
            </div>
            <input
              type="search"
              className="block w-full p-2.5 pl-10 text-sm text-gray-900 rounded-lg bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 neo-inset"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Assignee filter */}
        <div>
          <select
            value={assigneeFilter}
            onChange={(e) => onAssigneeChange(e.target.value)}
            className="bg-gray-50 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 neo-inset"
          >
            <option value="">All Assignees</option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name}
              </option>
            ))}
          </select>
        </div>

        {/* Priority filter */}
        <div>
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="bg-gray-50 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 neo-inset"
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
            className="bg-gray-50 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 neo-inset"
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
        
        {(searchQuery || assigneeFilter || priorityFilter || dateFilter) ? (
          <>
            {searchQuery && (
              <span className="bg-gray-100 text-gray-800 text-xs font-medium me-2 px-2.5 py-1 rounded-full flex items-center neo-inset-light">
                Search: {searchQuery}
                <button onClick={() => onSearchChange('')} className="ml-1 text-gray-500 hover:text-gray-700">
                  <i className="bi bi-x-circle-fill"></i>
                </button>
              </span>
            )}
            
            {assigneeFilter && (
              <span className="bg-gray-100 text-gray-800 text-xs font-medium me-2 px-2.5 py-1 rounded-full flex items-center neo-inset-light">
                Assignee: {assignees.find(a => a.id === assigneeFilter)?.name}
                <button onClick={() => onAssigneeChange('')} className="ml-1 text-gray-500 hover:text-gray-700">
                  <i className="bi bi-x-circle-fill"></i>
                </button>
              </span>
            )}
            
            {priorityFilter && (
              <span className="bg-gray-100 text-gray-800 text-xs font-medium me-2 px-2.5 py-1 rounded-full flex items-center neo-inset-light">
                Priority: {priorityFilter.charAt(0).toUpperCase() + priorityFilter.slice(1)}
                <button onClick={() => onPriorityChange('')} className="ml-1 text-gray-500 hover:text-gray-700">
                  <i className="bi bi-x-circle-fill"></i>
                </button>
              </span>
            )}
            
            {dateFilter && (
              <span className="bg-gray-100 text-gray-800 text-xs font-medium me-2 px-2.5 py-1 rounded-full flex items-center neo-inset-light">
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