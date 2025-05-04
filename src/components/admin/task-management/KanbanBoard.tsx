import React, { useState } from 'react';
import { Task, Column, AdminPermissions } from './TaskManagement';

interface KanbanBoardProps {
  columns: Column[];
  tasks: Task[];
  permissions: AdminPermissions;
  onUpdateTaskStatus: (taskId: string, newStatus: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onEditColumn: (column: Column) => void;
  onToggleColumn: (columnId: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  tasks,
  permissions,
  onUpdateTaskStatus,
  onEditTask,
  onDeleteTask,
  onEditColumn,
  onToggleColumn
}) => {
  // State to track dragged task
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  // State to track which columns are collapsed
  const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>({});

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    if (!permissions.canChangeTaskStatus) return;
    
    setDraggedTask(task);
    e.dataTransfer.setData('taskId', task.id);
    
    // Create a custom drag image
    const dragPreview = document.createElement('div');
    dragPreview.className = 'bg-white shadow-lg rounded-lg p-3 border border-indigo-200';
    dragPreview.style.width = '280px';
    dragPreview.style.position = 'absolute';
    dragPreview.style.top = '-1000px';
    dragPreview.innerHTML = `
      <div class="text-sm font-medium text-gray-800">${task.title}</div>
      <div class="text-xs text-gray-500 mt-1">${task.assignee.name}</div>
    `;
    document.body.appendChild(dragPreview);
    e.dataTransfer.setDragImage(dragPreview, 140, 30);
    
    // Cleanup after drag is done
    setTimeout(() => {
      document.body.removeChild(dragPreview);
    }, 0);
  };

  // Handle drag over a column
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Handle dropping a task in a column
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault();
    
    if (draggedTask && draggedTask.status !== columnId) {
      onUpdateTaskStatus(draggedTask.id, columnId);
    }
    
    setDraggedTask(null);
  };

  // Get tasks for a specific column
  const getTasksByColumn = (columnId: string) => {
    return tasks.filter(task => task.status === columnId);
  };

  // Toggle column collapse
  const toggleColumnCollapse = (columnId: string) => {
    setCollapsedColumns(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
    onToggleColumn(columnId);
  };

  // Function to get priority styling
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Calculate progress percentage for progress bar
  const getProgressBarStyle = (progress: number) => {
    return {
      width: `${progress}%`,
      backgroundColor: progress === 100 ? '#10b981' : '#6366f1'
    };
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Check if a date is overdue
  const isOverdue = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date < today && date.toDateString() !== today.toDateString();
  };

  return (
    <div className="grid grid-cols-4 gap-6">
      {columns.map((column) => (
        <div
          key={column.id}
          className="bg-white rounded-xl shadow-neomorphic"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          {/* Column header */}
          <div 
            className="p-4 border-b border-gray-100 flex items-center justify-between"
            style={{ borderTop: `3px solid ${column.color}`, borderRadius: '0.75rem 0.75rem 0 0' }}
          >
            <div className="flex items-center">
              <h3 className="font-medium text-gray-800">
                {column.title}
              </h3>
              <span className="ml-2 text-xs font-medium bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5">
                {getTasksByColumn(column.id).length}
              </span>
            </div>
            
            <div className="flex space-x-1">
              {permissions.canEditColumn && (
                <button 
                  onClick={() => onEditColumn(column)}
                  className="p-1 text-gray-500 hover:text-gray-700 rounded transition-colors"
                >
                  <i className="bi bi-pencil text-sm"></i>
                </button>
              )}
              
              <button 
                onClick={() => toggleColumnCollapse(column.id)}
                className="p-1 text-gray-500 hover:text-gray-700 rounded transition-colors"
              >
                <i className={`bi ${collapsedColumns[column.id] ? 'bi-chevron-down' : 'bi-chevron-up'} text-sm`}></i>
              </button>
            </div>
          </div>
          
          {/* Column content */}
          {!collapsedColumns[column.id] && (
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
              {getTasksByColumn(column.id).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400">
                  <i className="bi bi-inbox text-3xl mb-2"></i>
                  <p className="text-sm">No tasks in this column</p>
                  {permissions.canCreateTask && (
                    <p className="text-xs mt-1">Drag tasks here or create a new one</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {getTasksByColumn(column.id).map((task) => (
                    <div
                      key={task.id}
                      className={`bg-white border border-gray-100 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                        draggedTask?.id === task.id ? 'opacity-50' : ''
                      }`}
                      draggable={permissions.canChangeTaskStatus}
                      onDragStart={(e) => handleDragStart(e, task)}
                      onClick={() => onEditTask(task)}
                    >
                      {/* Task header */}
                      <div className="flex justify-between mb-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getPriorityStyle(task.priority)}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                        
                        <div className="flex space-x-1">
                          {permissions.canEditAnyTask && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTask(task);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            >
                              <i className="bi bi-pencil text-xs"></i>
                            </button>
                          )}
                          
                          {permissions.canDeleteAnyTask && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTask(task.id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                            >
                              <i className="bi bi-trash text-xs"></i>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Task title */}
                      <h4 className="text-sm font-medium text-gray-800 mb-2">{task.title}</h4>
                      
                      {/* Task description (truncated) */}
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
                      
                      {/* Progress bar */}
                      <div className="h-1.5 w-full bg-gray-100 rounded-full mb-3">
                        <div
                          className="h-1.5 rounded-full transition-all duration-300"
                          style={getProgressBarStyle(task.progress)}
                        ></div>
                      </div>
                      
                      {/* Task footer */}
                      <div className="flex justify-between items-center">
                        {/* Assignee */}
                        <div className="flex items-center">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                            style={{ backgroundColor: task.assignee.color }}
                          >
                            {task.assignee.name.charAt(0)}
                          </div>
                          <span className="text-xs text-gray-500 ml-1.5">{task.assignee.name}</span>
                        </div>
                        
                        {/* Due date */}
                        <div className={`flex items-center text-xs ${isOverdue(task.dueDate) ? 'text-red-500' : 'text-gray-500'}`}>
                          <i className={`bi ${isOverdue(task.dueDate) ? 'bi-exclamation-circle' : 'bi-calendar'} mr-1`}></i>
                          {formatDate(task.dueDate)}
                        </div>
                      </div>
                      
                      {/* Subtasks indicator, if any */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center text-xs text-gray-500">
                          <i className="bi bi-check2-square mr-1"></i>
                          {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtasks
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard; 