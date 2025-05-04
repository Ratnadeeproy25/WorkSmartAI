import React from 'react';
import { Task } from './KanbanBoard';

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  const getPriorityClass = (priority: string) => {
    return {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    }[priority] || '';
  };

  const dueDate = new Date(task.dueDate);
  const now = new Date();
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const dueDateClass = daysUntilDue < 0 ? 'text-red-600' : 
                      daysUntilDue <= 2 ? 'text-yellow-600' : 'text-gray-600';
  
  const dueDateText = daysUntilDue < 0 ? 'Overdue' :
                     daysUntilDue === 0 ? 'Due today' :
                     daysUntilDue === 1 ? 'Due tomorrow' :
                     `Due in ${daysUntilDue} days`;

  // Extract the first letter of the first and last name for the avatar
  const getInitials = (name: string) => {
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      return nameParts[0][0]; // Just use first initial for cleaner look
    }
    return name.charAt(0);
  };

  return (
    <div className="task-card neo-box p-4 hover:shadow-lg transition-all duration-300 bg-white">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-semibold text-gray-700">{task.title}</h4>
        <div className="flex gap-2">
          <button 
            onClick={onEdit} 
            className="text-gray-500 hover:text-gray-700"
            aria-label="Edit task"
          >
            <i className="bi bi-pencil"></i>
          </button>
          <button 
            onClick={onDelete} 
            className="text-gray-500 hover:text-red-500"
            aria-label="Delete task"
          >
            <i className="bi bi-trash"></i>
          </button>
        </div>
      </div>
      <div className="text-sm text-gray-600 mb-3">{task.description}</div>
      <div className="mb-4">
        <div className="task-progress h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-300"
            style={{ 
              width: `${task.progress || 0}%`,
              backgroundColor: task.assignee.color || '#3b82f6' 
            }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 mt-1">{task.progress || 0}% Complete</div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-sm"
            style={{ backgroundColor: task.assignee.color || '#3b82f6' }}
            title={task.assignee.name}
          >
            {getInitials(task.assignee.name)}
          </div>
          <span className={`text-sm ${dueDateClass} font-medium`}>
            {dueDateText}
          </span>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getPriorityClass(task.priority)}`}>
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        </span>
      </div>
    </div>
  );
};

export default TaskCard; 