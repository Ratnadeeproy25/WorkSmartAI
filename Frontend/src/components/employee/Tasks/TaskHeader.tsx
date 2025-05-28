import React from 'react';
import { TaskCountsProps } from './types';
import 'bootstrap-icons/font/bootstrap-icons.css';

interface TaskHeaderProps {
  taskCounts: TaskCountsProps;
  onFilterByStatus: (status: string | null) => void;
}

const TaskHeader: React.FC<TaskHeaderProps> = ({
  taskCounts,
  onFilterByStatus
}) => {
  return (
    <div className="neo-box p-4 md:p-6 mb-6 md:mb-8">
      <div className="flex justify-between flex-wrap md:flex-nowrap items-center mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Tasks</h1>
          <p className="text-base md:text-lg text-gray-600">Track and manage your assigned tasks</p>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <div 
          className="neo-box p-3 md:p-4 text-center cursor-pointer" 
          onClick={() => onFilterByStatus(null)}
        >
          <div className="text-xl md:text-2xl font-bold text-blue-600">{taskCounts.total}</div>
          <div className="text-xs md:text-sm text-gray-600">Total Tasks</div>
        </div>
        <div 
          className="neo-box p-3 md:p-4 text-center cursor-pointer"
          onClick={() => onFilterByStatus('inProgress')}
        >
          <div className="text-xl md:text-2xl font-bold text-yellow-600">{taskCounts.inProgress}</div>
          <div className="text-xs md:text-sm text-gray-600">In Progress</div>
        </div>
        <div 
          className="neo-box p-3 md:p-4 text-center cursor-pointer"
          onClick={() => onFilterByStatus('completed')}
        >
          <div className="text-xl md:text-2xl font-bold text-green-600">{taskCounts.completed}</div>
          <div className="text-xs md:text-sm text-gray-600">Completed</div>
        </div>
        <div 
          className="neo-box p-3 md:p-4 text-center cursor-pointer"
          onClick={() => onFilterByStatus('overdue')}
        >
          <div className="text-xl md:text-2xl font-bold text-red-600">{taskCounts.overdue}</div>
          <div className="text-xs md:text-sm text-gray-600">Overdue</div>
        </div>
      </div>
    </div>
  );
};

export default TaskHeader; 