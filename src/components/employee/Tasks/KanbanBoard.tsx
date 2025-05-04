import React, { useEffect } from 'react';
import { Task, TaskStatus } from './types';
import TaskCard from './TaskCard';
import Sortable from 'sortablejs';
import 'bootstrap-icons/font/bootstrap-icons.css';

interface KanbanBoardProps {
  columns: { id: string; title: string; color: string }[];
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEditTask: (taskId: string) => void;
  onToggleTaskTimer: (taskId: string) => void;
  activeTaskId: string | null;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  tasks,
  onStatusChange,
  onEditTask,
  onToggleTaskTimer,
  activeTaskId
}) => {
  useEffect(() => {
    // Initialize Sortable for each column
    columns.forEach(column => {
      const columnTasksEl = document.getElementById(`${column.id}Tasks`);
      if (columnTasksEl) {
        Sortable.create(columnTasksEl, {
          group: 'tasks',
          animation: 150,
          ghostClass: 'opacity-50',
          onEnd: function(evt) {
            if (evt.item && evt.to) {
              const taskId = evt.item.getAttribute('data-task-id');
              const newStatus = evt.to.id.replace('Tasks', '') as TaskStatus;
              
              if (taskId) {
                onStatusChange(taskId, newStatus);
              }
            }
          }
        });
      }
    });
  }, [columns, onStatusChange]);

  // Helper function to toggle column collapse
  const toggleColumn = (columnId: string) => {
    const column = document.getElementById(`${columnId}Column`);
    if (column) {
      column.classList.toggle('collapsed');
    }
  };

  // Filter tasks for a specific column
  const getColumnTasks = (columnId: string) => {
    return tasks.filter(task => task.status === columnId);
  };

  return (
    <div id="kanbanBoard" className="flex gap-6 overflow-x-auto pb-6 overflow-y-hidden lg:pb-4 snap-x snap-mandatory">
      {columns.map(column => (
        <div
          key={column.id}
          id={`${column.id}Column`}
          className="kanban-column snap-start"
          data-column-id={column.id}
        >
          <div className="column-header">
            <div className="flex items-center gap-2">
              <h3 
                className="text-base md:text-lg font-semibold" 
                style={{ color: column.color }}
              >
                {column.title}
              </h3>
              <span className="neo-box px-2 py-1 text-xs md:text-sm text-gray-600 task-count-badge">
                {getColumnTasks(column.id).length}
              </span>
            </div>
            <div className="column-actions">
              <button 
                className="column-toggle" 
                onClick={() => toggleColumn(column.id)}
              >
                <i className="bi bi-chevron-left"></i>
              </button>
            </div>
          </div>
          <div className="column-content">
            <div 
              className="column-tasks space-y-4" 
              id={`${column.id}Tasks`}
            >
              {getColumnTasks(column.id).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => onEditTask(task.id)}
                  onToggleTimer={() => onToggleTaskTimer(task.id)}
                  isTimerActive={activeTaskId === task.id}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard; 