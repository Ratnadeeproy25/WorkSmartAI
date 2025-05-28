import React, { useMemo, useCallback } from 'react';
import { Task } from './types';
import 'bootstrap-icons/font/bootstrap-icons.css';

interface TaskCardProps {
  task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task
}) => {
  // Memoize priority class computation
  const getPriorityClass = useCallback((priority: string) => {
    return {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    }[priority] || '';
  }, []);

  // Memoize time formatting
  const formatTimeSpent = useCallback((seconds: number = 0) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }, []);

  // Memoize due date calculations
  const dueDateInfo = useMemo(() => {
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    const dueDateClass = daysUntilDue < 0 ? 'text-red-600' : 
                        daysUntilDue <= 2 ? 'text-yellow-600' : 'text-gray-600';
    
    let dueDateText;
    if (daysUntilDue < 0) {
      dueDateText = 'Overdue';
    } else if (daysUntilDue === 0) {
      dueDateText = 'Due today';
    } else if (daysUntilDue === 1) {
      dueDateText = 'Due tomorrow';
    } else {
      dueDateText = `Due in ${daysUntilDue} days`;
    }
    
    return { dueDateClass, dueDateText };
  }, [task.dueDate]);

  return (
    <div 
      className="task-card"
      data-task-id={task.id}
    >
      {/* Card header with title */}
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-semibold text-gray-700 text-sm md:text-base">{task.title}</h4>
      </div>
      
      {/* Task description */}
      <div className="text-xs md:text-sm text-gray-600 mb-3 line-clamp-2" 
           dangerouslySetInnerHTML={{ __html: task.description }}></div>
      
      {/* Bottom row with due date, priority and time spent */}
      <div className="flex items-center justify-between flex-wrap gap-2 mt-3">
        <span className={`text-xs md:text-sm ${dueDateInfo.dueDateClass} font-medium`}>
          {dueDateInfo.dueDateText}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityClass(task.priority)}`}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
          <span className="text-xs md:text-sm text-gray-600 ml-1">
            {/* {formatTimeSpent(task.timeSpent)} */}
          </span>
        </div>
      </div>
      
      {/* Subtasks section (if any) */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs font-medium text-gray-700 mb-2">Subtasks</div>
          <div className="space-y-2">
            {task.subtasks.slice(0, 2).map(subtask => (
              <div key={subtask.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="neo-checkbox"
                  checked={subtask.completed}
                  readOnly
                />
                <span className="text-xs text-gray-600 line-clamp-1">{subtask.title}</span>
              </div>
            ))}
            {task.subtasks.length > 2 && (
              <div className="text-xs text-gray-500">
                +{task.subtasks.length - 2} more subtasks
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(TaskCard); 