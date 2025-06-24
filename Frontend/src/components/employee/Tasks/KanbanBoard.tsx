import React, { useState } from 'react';
import { Task, TaskStatus } from './types';
import TaskCard from './TaskCard';
import '../../../styles/employee/dragdrop.css';

interface KanbanBoardProps {
  columns: { id: string; title: string; color: string }[];
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onTaskClick?: (taskId: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  tasks,
  onStatusChange,
  onTaskClick
}) => {
  // State to track the task being dragged
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  // State to track which column is currently being dragged over
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

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

  // Handle task click
  const handleTaskClick = (taskId: string) => {
    // Find the task to check its status
    const task = tasks.find(t => t.id === taskId);
    
    // Only allow editing if task is not completed
    if (task && task.status !== 'completed' && onTaskClick) {
      onTaskClick(taskId);
    }
  };

  // Drag and drop event handlers
  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
    // Add a small delay to make the drag effect visual
    setTimeout(() => {
      const taskElement = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement;
      if (taskElement) {
        taskElement.classList.add('dragging');
      }
    }, 10);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault(); // Allow dropping
    setDragOverColumnId(columnId);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    if (dragOverColumnId === columnId) {
      setDragOverColumnId(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault();
    
    if (draggedTaskId) {
      onStatusChange(draggedTaskId, columnId as TaskStatus);
      setDraggedTaskId(null);
      setDragOverColumnId(null);
      
      // Remove the dragging class from all task elements
      document.querySelectorAll('.task-container').forEach(el => {
        el.classList.remove('dragging');
      });
    }
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumnId(null);
    
    // Remove the dragging class from all task elements
    document.querySelectorAll('.task-container').forEach(el => {
      el.classList.remove('dragging');
    });
  };

  return (
    <div className="kanban-board-container">
      {columns.map(column => (
        <div
          key={column.id}
          id={`${column.id}Column`}
          className={`kanban-column ${dragOverColumnId === column.id ? 'drag-over' : ''}`}
          data-column-id={column.id}
          onDragOver={(e) => handleDragOver(e, column.id)}
          onDragLeave={(e) => handleDragLeave(e, column.id)}
          onDrop={(e) => handleDrop(e, column.id)}
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
                <div 
                  key={task.id}
                  className={`task-container ${task.status === 'completed' ? 'cursor-default' : 'cursor-pointer'}`}
                  data-task-id={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleTaskClick(task.id)}
                >
                  <TaskCard task={task} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard; 