import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import AdminSidebar from '../AdminSidebar';
import HeaderPanel from './HeaderPanel';
import TaskMetrics from './TaskMetrics';
import SearchFilterPanel from './SearchFilterPanel';
import KanbanBoard from './KanbanBoard';
import TaskModal from './TaskModal';
import ColumnModal from './ColumnModal';
import '../../../styles/NeomorphicUI.css';

// Types
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
  subtasks?: Array<{ text: string; completed: boolean }>;
  attachments?: Array<{ name: string; url: string; type: string }>;
}

export interface Column {
  id: string;
  title: string;
  color: string;
}

export interface AdminPermissions {
  canCreateTask: boolean;
  canEditAnyTask: boolean;
  canDeleteAnyTask: boolean;
  canChangeTaskStatus: boolean;
  canAddColumn: boolean;
  canEditColumn: boolean;
  canDeleteColumn: boolean;
  canAssignTask: boolean;
  visibleStatuses: string[];
}

const TaskManagement: React.FC = () => {
  // State for tasks and columns
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // State for modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [currentColumn, setCurrentColumn] = useState<Column | null>(null);
  
  // Admin permissions
  const adminPermissions: AdminPermissions = {
    canCreateTask: true,
    canEditAnyTask: true,
    canDeleteAnyTask: true,
    canChangeTaskStatus: true,
    canAddColumn: true,
    canEditColumn: true,
    canDeleteColumn: true,
    canAssignTask: true,
    visibleStatuses: ['todo', 'inProgress', 'completed', 'blocked']
  };

  // Initial data
  const initialColumns: Column[] = [
    { id: 'todo', title: 'To Do', color: '#3b82f6' },
    { id: 'inProgress', title: 'In Progress', color: '#f59e0b' },
    { id: 'completed', title: 'Completed', color: '#10b981' },
    { id: 'blocked', title: 'Blocked', color: '#ef4444' }
  ];

  const initialTasks: Task[] = [
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
  ];

  // Load data from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    const savedColumns = localStorage.getItem('columns');

    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      setTasks(initialTasks);
    }

    if (savedColumns) {
      setColumns(JSON.parse(savedColumns));
    } else {
      setColumns(initialColumns);
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    if (columns.length > 0) {
      localStorage.setItem('columns', JSON.stringify(columns));
    }
  }, [tasks, columns]);

  // Task operations
  const addTask = (task: Task) => {
    setTasks(prev => [...prev, task]);
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
  };

  const deleteTask = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(prev => prev.filter(task => task.id !== taskId));
    }
  };

  const updateTaskStatus = (taskId: string, newStatus: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const updatedTask = { ...task, status: newStatus };
        if (newStatus === 'completed') {
          updatedTask.progress = 100;
        }
        return updatedTask;
      }
      return task;
    }));
  };

  // Column operations
  const addColumn = (column: Column) => {
    setColumns(prev => [...prev, column]);
  };

  const updateColumn = (updatedColumn: Column) => {
    setColumns(prev => prev.map(column => 
      column.id === updatedColumn.id ? updatedColumn : column
    ));
  };

  const deleteColumn = (columnId: string) => {
    const tasksInColumn = tasks.filter(t => t.status === columnId).length;
    if (tasksInColumn > 0) {
      alert(`Cannot delete column with ${tasksInColumn} tasks. Please move or delete the tasks first.`);
      return;
    }

    if (window.confirm('Are you sure you want to delete this column?')) {
      setColumns(prev => prev.filter(column => column.id !== columnId));
    }
  };

  // Modal handling
  const openTaskModal = (task?: Task) => {
    setCurrentTask(task || null);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setCurrentTask(null);
    setIsTaskModalOpen(false);
  };

  const openColumnModal = (column?: Column) => {
    setCurrentColumn(column || null);
    setIsColumnModalOpen(true);
  };

  const closeColumnModal = () => {
    setCurrentColumn(null);
    setIsColumnModalOpen(false);
  };

  // Filter handling
  const clearFilters = () => {
    setSearchQuery('');
    setAssigneeFilter('');
    setPriorityFilter('');
    setDateFilter('');
  };

  const applyFilters = (tasksList: Task[]) => {
    return tasksList.filter(task => {
      const matchesSearch = !searchQuery || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesAssignee = !assigneeFilter || task.assignee.id === assigneeFilter;
      const matchesPriority = !priorityFilter || task.priority === priorityFilter;

      const now = new Date();
      const dueDate = new Date(task.dueDate);
      const matchesDate = !dateFilter ||
        (dateFilter === 'today' && dueDate.toDateString() === now.toDateString()) ||
        (dateFilter === 'week' && (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 7) ||
        (dateFilter === 'overdue' && dueDate < now);

      return matchesSearch && matchesAssignee && matchesPriority && matchesDate;
    });
  };

  // Get task counts for metrics
  const getTaskCounts = () => {
    return {
      total: tasks.length,
      inProgress: tasks.filter(t => t.status === 'inProgress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      blocked: tasks.filter(t => t.status === 'blocked').length
    };
  };

  const handleAddTask = (newTask: Omit<Task, 'id' | 'createdAt'>) => {
    const task: Task = {
      ...newTask,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      createdAt: new Date().toISOString()
    };
    addTask(task);
    closeTaskModal();
  };

  const handleUpdateTask = (updatedTask: Task) => {
    updateTask(updatedTask);
    closeTaskModal();
  };

  const handleAddColumn = (newColumn: Omit<Column, 'id'>) => {
    const column: Column = {
      ...newColumn,
      id: 'column-' + Date.now().toString(36)
    };
    addColumn(column);
    closeColumnModal();
  };

  const handleUpdateColumn = (updatedColumn: Column) => {
    updateColumn(updatedColumn);
    closeColumnModal();
  };

  const filteredTasks = applyFilters(tasks);

  return (
    <>
      <Helmet>
        <title>WorkSmart AI - Admin Task Management</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet" />
        <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css" />
      </Helmet>

      <div className="flex h-screen bg-[#e0e5ec]">
        <AdminSidebar />
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <HeaderPanel 
              onAddColumn={() => openColumnModal()} 
              onAddTask={() => openTaskModal()} 
            />
            
            <TaskMetrics 
              counts={getTaskCounts()}
              onFilterByStatus={(status: string) => {
                clearFilters();
                if (status !== 'all') {
                  // Handle filtering by status (this would need custom implementation)
                }
              }}
            />
            
            <SearchFilterPanel
              searchQuery={searchQuery}
              assigneeFilter={assigneeFilter}
              priorityFilter={priorityFilter}
              dateFilter={dateFilter}
              onSearchChange={setSearchQuery}
              onAssigneeChange={setAssigneeFilter}
              onPriorityChange={setPriorityFilter}
              onDateChange={setDateFilter}
              onClearFilters={clearFilters}
            />
            
            <KanbanBoard
              columns={columns}
              tasks={filteredTasks}
              permissions={adminPermissions}
              onUpdateTaskStatus={updateTaskStatus}
              onEditTask={(task: Task) => openTaskModal(task)}
              onDeleteTask={deleteTask}
              onEditColumn={(column: Column) => openColumnModal(column)}
              onToggleColumn={(columnId: string) => {
                // Toggle column collapse logic would go here
                console.log('Toggle column:', columnId);
              }}
            />
          </div>
          
          {isTaskModalOpen && (
            <TaskModal
              task={currentTask}
              onClose={closeTaskModal}
              onSubmit={currentTask ? handleUpdateTask : handleAddTask}
            />
          )}
          
          {isColumnModalOpen && (
            <ColumnModal
              column={currentColumn}
              onClose={closeColumnModal}
              onSubmit={(columnData: Column | Omit<Column, 'id'>) => {                if ('id' in columnData) {                  handleUpdateColumn(columnData as Column);                } else {                  handleAddColumn(columnData);                }              }}
              onDelete={currentColumn ? () => deleteColumn(currentColumn.id) : undefined}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default TaskManagement; 