import React from 'react';

interface TaskMetricsProps {
  counts: {
    total: number;
    inProgress: number;
    completed: number;
    blocked: number;
  };
  onFilterByStatus: (status: string) => void;
}

const TaskMetrics: React.FC<TaskMetricsProps> = ({ counts, onFilterByStatus }) => {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div 
        onClick={() => onFilterByStatus('all')}
        className="bg-white rounded-xl shadow-neomorphic p-4 cursor-pointer hover:shadow-neomorphic-hover transition-all duration-200"
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-gray-500 text-sm">Total Tasks</h3>
          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
            <i className="bi bi-list-task text-gray-700"></i>
          </div>
        </div>
        <p className="text-2xl font-semibold text-gray-800">{counts.total}</p>
        <p className="text-xs text-gray-500 mt-1">All tasks in all statuses</p>
      </div>

      <div 
        onClick={() => onFilterByStatus('inProgress')}
        className="bg-white rounded-xl shadow-neomorphic p-4 cursor-pointer hover:shadow-neomorphic-hover transition-all duration-200"
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-gray-500 text-sm">In Progress</h3>
          <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center">
            <i className="bi bi-arrow-repeat text-amber-500"></i>
          </div>
        </div>
        <p className="text-2xl font-semibold text-gray-800">{counts.inProgress}</p>
        <p className="text-xs text-gray-500 mt-1">
          {Math.round((counts.inProgress / (counts.total || 1)) * 100)}% of total tasks
        </p>
      </div>

      <div 
        onClick={() => onFilterByStatus('completed')}
        className="bg-white rounded-xl shadow-neomorphic p-4 cursor-pointer hover:shadow-neomorphic-hover transition-all duration-200"
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-gray-500 text-sm">Completed</h3>
          <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
            <i className="bi bi-check-circle text-emerald-500"></i>
          </div>
        </div>
        <p className="text-2xl font-semibold text-gray-800">{counts.completed}</p>
        <p className="text-xs text-gray-500 mt-1">
          {Math.round((counts.completed / (counts.total || 1)) * 100)}% of total tasks
        </p>
      </div>

      <div 
        onClick={() => onFilterByStatus('blocked')}
        className="bg-white rounded-xl shadow-neomorphic p-4 cursor-pointer hover:shadow-neomorphic-hover transition-all duration-200"
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-gray-500 text-sm">Blocked</h3>
          <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center">
            <i className="bi bi-exclamation-circle text-red-500"></i>
          </div>
        </div>
        <p className="text-2xl font-semibold text-gray-800">{counts.blocked}</p>
        <p className="text-xs text-gray-500 mt-1">
          {Math.round((counts.blocked / (counts.total || 1)) * 100)}% of total tasks
        </p>
      </div>
    </div>
  );
};

export default TaskMetrics; 