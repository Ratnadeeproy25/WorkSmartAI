import React, { useState, useEffect } from 'react';
import TaskCard from './TaskCard';

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
  progress: number;
  createdAt: string;
  timeSpent?: number;
}

interface KanbanBoardProps {
  searchTerm: string;
  assigneeFilter: string;
  priorityFilter: string;
  dateFilter: string;
  onEditTask: (taskId: string) => void;
  onEditColumn: (columnId: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  searchTerm,
  assigneeFilter,
  priorityFilter,
  dateFilter,
  onEditTask,
  onEditColumn
}) => {
  const [columns, setColumns] = useState<Column[]>([
    { id: 'todo', title: 'To Do', color: '#3b82f6' },
    { id: 'inProgress', title: 'In Progress', color: '#f59e0b' },
    { id: 'completed', title: 'Completed', color: '#10b981' },
    { id: 'blocked', title: 'Blocked', color: '#ef4444' }
  ]);
  
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'task1',
      title: 'Design Homepage',
      description: 'Create a modern and responsive homepage design',
      priority: 'high',
      status: 'todo',
      dueDate: '2024-03-25T15:00',
      assignee: {
        id: '1',
        name: 'John Doe',
        color: '#3b82f6'
      },
      progress: 0,
      createdAt: '2024-03-20T10:00'
    },
    {
      id: 'task2',
      title: 'Implement API',
      description: 'Develop RESTful API endpoints for user management',
      priority: 'medium',
      status: 'inProgress',
      dueDate: '2024-03-28T17:00',
      assignee: {
        id: '2',
        name: 'Jane Smith',
        color: '#10b981'
      },
      progress: 45,
      createdAt: '2024-03-19T09:00'
    },
    {
      id: 'task3',
      title: 'Write Documentation',
      description: 'Create comprehensive documentation for the project',
      priority: 'low',
      status: 'completed',
      dueDate: '2024-03-22T12:00',
      assignee: {
        id: '1',
        name: 'John Doe',
        color: '#3b82f6'
      },
      progress: 100,
      createdAt: '2024-03-18T14:00'
    },
    {
      id: 'task4',
      title: 'Fix Login Bug',
      description: 'Resolve authentication issues in the login system',
      priority: 'high',
      status: 'blocked',
      dueDate: '2024-03-21T16:00',
      assignee: {
        id: '2',
        name: 'Jane Smith',
        color: '#10b981'
      },
      progress: 30,
      createdAt: '2024-03-20T11:00'
    }
  ]);

  // Load columns and tasks from localStorage on mount
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem('managerTasks');
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }

      const savedColumns = localStorage.getItem('managerColumns');
      if (savedColumns) {
        setColumns(JSON.parse(savedColumns));
      }
    } catch (error) {
      console.error('Failed to load data from localStorage', error);
    }
  }, []);

  // Save to localStorage whenever tasks or columns change
  useEffect(() => {
    localStorage.setItem('managerTasks', JSON.stringify(tasks));
    localStorage.setItem('managerColumns', JSON.stringify(columns));
    
    // Dispatch event for other components to know data has changed
    window.dispatchEvent(new Event('tasksUpdated'));
  }, [tasks, columns]);

  const moveTask = (taskId: string, newStatus: string) => {
    // Update the task's status
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    );
    
    setTasks(updatedTasks);
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

  const deleteTask = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(tasks.filter(task => task.id !== taskId));
    }
  };

  // Apply filters to tasks
  const filteredTasks = tasks.filter(task => {
    // Search term filter
    const matchesSearch = searchTerm === '' || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Assignee filter
    const matchesAssignee = assigneeFilter === '' || task.assignee.id === assigneeFilter;
    
    // Priority filter
    const matchesPriority = priorityFilter === '' || task.priority === priorityFilter;
    
    // Date filter
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const daysDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    const matchesDate = dateFilter === '' ||
      (dateFilter === 'today' && daysDue === 0) ||
      (dateFilter === 'week' && daysDue <= 7 && daysDue >= 0) ||
      (dateFilter === 'overdue' && daysDue < 0);
    
    return matchesSearch && matchesAssignee && matchesPriority && matchesDate;
  });

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {columns.map(column => (
        <div 
          key={column.id}
          className={`kanban-column ${column.collapsed ? 'collapsed' : ''}`}
        >
          <div className="column-header">
            <div className="flex items-center gap-2">
              <h3 
                className="text-lg font-semibold" 
                style={{ color: column.color }}
              >
                {column.title}
              </h3>
              <span className="neo-box px-2 py-1 text-sm text-gray-600">
                {filteredTasks.filter(task => task.status === column.id).length}
              </span>
            </div>
            <div className="column-actions">
              <button 
                className="column-toggle"
                onClick={() => onEditColumn(column.id)}
              >
                <i className="bi bi-gear"></i>
              </button>
              <button 
                className="column-toggle"
                onClick={() => toggleColumn(column.id)}
              >
                <i className={`bi ${column.collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
              </button>
            </div>
          </div>
          <div className="column-content">
            <div className="column-tasks space-y-4">
              {filteredTasks
                .filter(task => task.status === column.id)
                .map((task) => (
                  <div key={task.id} className="task-container">
                    <TaskCard 
                      task={task} 
                      onEdit={() => onEditTask(task.id)} 
                      onDelete={() => deleteTask(task.id)} 
                    />
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard; 