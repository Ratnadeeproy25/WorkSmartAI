import React, { useState, useEffect } from 'react';
import TaskCard from './TaskCard';
import managerTaskService from '../../../services/managerTaskService';
import '../../../styles/manager/dragdrop.css';

interface Column {
  id: string;
  title: string;
  color: string;
  collapsed?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: string;
  dueDate: string;
  assignee: {
    id: string;
    name: string;
    color: string;
  };
  progress?: number;
  createdAt: string;
  timeSpent?: number;
}

interface KanbanBoardProps {
  searchTerm: string;
  assigneeFilter: string;
  priorityFilter: string;
  dateFilter: string;
  onEditTask: (taskId: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  searchTerm,
  assigneeFilter,
  priorityFilter,
  dateFilter,
  onEditTask
}) => {
  const [columns, setColumns] = useState<Column[]>([
    { id: 'todo', title: 'To Do', color: '#3b82f6' },
    { id: 'inProgress', title: 'In Progress', color: '#f59e0b' },
    { id: 'completed', title: 'Completed', color: '#10b981' },
    { id: 'blocked', title: 'Blocked', color: '#ef4444' }
  ]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State to track the task being dragged
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  // State to track which column is currently being dragged over
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  // Fetch tasks from backend
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const backendTasks = await managerTaskService.getManagerTasks();
      setTasks(backendTasks);
    } catch (err) {
      setError('Failed to load tasks from backend.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // Listen for manager-specific updates
    window.addEventListener('managerTasksUpdated', fetchTasks);
    return () => {
      window.removeEventListener('managerTasksUpdated', fetchTasks);
    };
  }, []);

  const moveTask = async (taskId: string, newStatus: string) => {
    try {
      await managerTaskService.updateTaskStatus(taskId, newStatus);
      fetchTasks();
      // Dispatch manager-specific event to update task stats
      window.dispatchEvent(new Event('managerTasksUpdated'));
    } catch (err) {
      setError('Failed to update task status.');
    }
  };

  const toggleColumn = (columnId: string) => {
    setColumns(prevColumns => 
      prevColumns.map(column => 
        column.id === columnId 
          ? { ...column, collapsed: !column.collapsed } 
          : column
      )
    );
  };

  // Drag and drop event handlers
  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
    setTimeout(() => {
      const taskElement = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement;
      if (taskElement) {
        taskElement.classList.add('dragging');
      }
    }, 10);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault();
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
      moveTask(draggedTaskId, columnId);
      setDraggedTaskId(null);
      setDragOverColumnId(null);
      document.querySelectorAll('.task-container').forEach(el => {
        el.classList.remove('dragging');
      });
    }
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumnId(null);
    document.querySelectorAll('.task-container').forEach(el => {
      el.classList.remove('dragging');
    });
  };

  // Add deleteTask handler
  const handleDeleteTask = async (taskId: string) => {
    try {
      await managerTaskService.deleteTask(taskId);
      fetchTasks();
      // Dispatch manager-specific event to update task stats
      window.dispatchEvent(new Event('managerTasksUpdated'));
    } catch (err) {
      setError('Failed to delete task.');
    }
  };

  // Apply filters to tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchTerm === '' || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAssignee = assigneeFilter === '' || task.assignee.id === assigneeFilter;
    const matchesPriority = priorityFilter === '' || task.priority === priorityFilter;
    // Date filter
    const now = new Date();
    let matchesDate = true;
    if (dateFilter === 'today') {
      const dueDate = new Date(task.dueDate);
      matchesDate = dueDate.toDateString() === now.toDateString();
    } else if (dateFilter === 'this-week') {
      const dueDate = new Date(task.dueDate);
      const weekFromNow = new Date(now);
      weekFromNow.setDate(now.getDate() + 7);
      matchesDate = dueDate >= now && dueDate <= weekFromNow;
    } else if (dateFilter === 'overdue') {
      const dueDate = new Date(task.dueDate);
      matchesDate = dueDate < now && task.status !== 'completed';
    }
    return matchesSearch && matchesAssignee && matchesPriority && matchesDate;
  });

  return (
    <div className="kanban-board-container">
      {loading && <div className="text-center py-8">Loading tasks...</div>}
      {error && <div className="text-center text-red-500 py-4">{error}</div>}
      {!loading && !error && columns.map(column => (
        <div
          key={column.id}
          id={`${column.id}Column`}
          className={`kanban-column ${dragOverColumnId === column.id ? 'drag-over' : ''} ${column.collapsed ? 'collapsed' : ''}`}
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
                {filteredTasks.filter(task => task.status === column.id).length}
              </span>
            </div>
            <div className="column-actions">
              <button 
                className="column-toggle" 
                onClick={() => toggleColumn(column.id)}
              >
                <i className={`bi ${column.collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
              </button>
            </div>
          </div>
          <div className="column-content">
            <div 
              className="column-tasks space-y-4" 
              id={`${column.id}Tasks`}
            >
              {filteredTasks.filter(task => task.status === column.id).map(task => (
                <div 
                  key={task.id}
                  className="task-container"
                  data-task-id={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task.id)}
                  onDragEnd={handleDragEnd}
                >
                  <TaskCard
                    task={task}
                    onEdit={() => onEditTask(task.id)}
                    onDelete={() => handleDeleteTask(task.id)}
                    onStatusChange={() => {}}
                  />
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