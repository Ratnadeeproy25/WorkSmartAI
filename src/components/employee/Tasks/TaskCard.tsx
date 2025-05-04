import React, { useMemo, useCallback } from 'react';
import { Task } from './types';
import 'bootstrap-icons/font/bootstrap-icons.css';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onToggleTimer: (taskId: string) => void;
  isTimerActive: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onEdit, 
  onToggleTimer, 
  isTimerActive 
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

  // Memoize event handlers with proper typing
  const handleEdit = useCallback(() => {
    onEdit(task);
  }, [task, onEdit]);

  const handleToggleTimer = useCallback(() => {
    onToggleTimer(task.id);
  }, [task.id, onToggleTimer]);

  return (
    <div 
      className={`task-card priority-${task.priority} snap-center`}
      data-task-id={task.id}
      draggable={true}
    >
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-semibold text-gray-700 text-sm md:text-base">{task.title}</h4>
        <div className="flex gap-2">
          <button 
            onClick={handleToggleTimer} 
            className="text-gray-500 hover:text-gray-700 task-timer-btn"
          >
            <i className={`bi bi-${isTimerActive ? 'pause' : 'play'}-fill`}></i>
          </button>
          <button 
            onClick={handleEdit} 
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="bi bi-pencil"></i>
          </button>
        </div>
      </div>
      
      <div className="text-xs md:text-sm text-gray-600 mb-3 line-clamp-2" 
           dangerouslySetInnerHTML={{ __html: task.description }}></div>
      
      <div className="mb-3">
        <div className="task-progress">
          <div className="task-progress-bar" style={{ width: `${task.progress || 0}%` }}></div>
        </div>
        <div className="text-xs text-gray-500 mt-1">{task.progress || 0}% Complete</div>
      </div>
      
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs md:text-sm ${dueDateInfo.dueDateClass}`}>
            {dueDateInfo.dueDateText}
          </span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityClass(task.priority)}`}>
          {task.priority}
        </span>
      </div>
      
      <div className="mt-3 text-xs md:text-sm text-gray-600">
        <i className="bi bi-clock"></i>
        Time spent: <span className="task-time">{formatTimeSpent(task.timeSpent)}</span>
      </div>
      
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-3">
          <div className="text-xs md:text-sm font-medium text-gray-700 mb-2">Subtasks</div>
          <div className="space-y-2">
            {task.subtasks.map(subtask => (
              <div key={subtask.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="neo-checkbox"
                  checked={subtask.completed}
                  readOnly
                />
                <span className="text-xs md:text-sm text-gray-600">{subtask.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(TaskCard); 