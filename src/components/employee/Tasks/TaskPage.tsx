import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../Sidebar';
import TaskHeader from './TaskHeader';
import KanbanBoard from './KanbanBoard';
import TaskModal from './TaskModal';
import SearchFilterPanel from './SearchFilterPanel';
import { Task, TaskStatus, TaskPriority } from './types';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../../styles/employee/tasks.css';

const TaskPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [activeTaskTimer, setActiveTaskTimer] = useState<NodeJS.Timeout | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Columns for the kanban board
  const columns = [
    { id: 'todo', title: 'To Do', color: '#3b82f6' },
    { id: 'inProgress', title: 'In Progress', color: '#f59e0b' },
    { id: 'completed', title: 'Completed', color: '#10b981' },
    { id: 'blocked', title: 'Blocked', color: '#ef4444' }
  ];

  // Load tasks from localStorage if available
  useEffect(() => {
    const savedTasks = localStorage.getItem('employeeTasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      // Demo tasks if no saved tasks exist
      setTasks([
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
            id: '1',
            name: 'John Doe',
            color: '#3b82f6'
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
            id: '1',
            name: 'John Doe',
            color: '#3b82f6'
          },
          progress: 30,
          createdAt: '2024-03-20T11:00'
        }
      ]);
    }
  }, []);

  // Apply filters whenever tasks or filter criteria change
  useEffect(() => {
    applyFilters();
  }, [tasks, searchTerm, priorityFilter, dateFilter]);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('employeeTasks', JSON.stringify(tasks));
  }, [tasks]);

  // Apply all filters to tasks
  const applyFilters = () => {
    let filtered = [...tasks];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(term) || 
        task.description.toLowerCase().includes(term)
      );
    }
    
    // Apply priority filter
    if (priorityFilter) {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }
    
    // Apply date filter
    if (dateFilter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(task => {
        const dueDate = new Date(task.dueDate);
        
        if (dateFilter === 'today') {
          return dueDate.toDateString() === today.toDateString();
        } else if (dateFilter === 'week') {
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          return dueDate >= today && dueDate <= nextWeek;
        } else if (dateFilter === 'overdue') {
          return dueDate < today;
        }
        
        return true;
      });
    }
    
    setFilteredTasks(filtered);
  };

  // Generate a unique task ID
  const generateTaskId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Update task status
  const updateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId) {
          // If moving to completed, set progress to 100%
          const progress = newStatus === 'completed' ? 100 : task.progress;
          return { ...task, status: newStatus, progress };
        }
        return task;
      })
    );
  };

  // Add a new task
  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      id: generateTaskId(),
      ...task,
      createdAt: new Date().toISOString()
    };
    
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  // Update an existing task
  const updateTask = (updatedTask: Task) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    );
  };

  // Open the task modal for editing
  const openEditTaskModal = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setCurrentTask(task);
      setIsModalOpen(true);
    }
  };

  // Open the task modal for adding a new task
  const openAddTaskModal = () => {
    setCurrentTask(null);
    setIsModalOpen(true);
  };

  // Save a task (add or update)
  const saveTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    if (currentTask) {
      // Update existing task
      updateTask({ ...currentTask, ...taskData });
    } else {
      // Add new task
      addTask(taskData);
    }
    
    setIsModalOpen(false);
  };

  // Toggle task timer
  const toggleTaskTimer = (taskId: string) => {
    if (activeTaskId === taskId) {
      stopTaskTimer();
    } else {
      startTaskTimer(taskId);
    }
  };

  // Start the task timer
  const startTaskTimer = (taskId: string) => {
    if (activeTaskTimer) {
      clearInterval(activeTaskTimer);
    }
    
    setActiveTaskId(taskId);
    
    const updatedTasks = [...tasks];
    const taskIndex = updatedTasks.findIndex(t => t.id === taskId);
    
    if (taskIndex !== -1) {
      if (!updatedTasks[taskIndex].timeSpent) {
        updatedTasks[taskIndex].timeSpent = 0;
      }
      
      const startTime = Date.now();
      const timer = setInterval(() => {
        setTasks(currentTasks => {
          const updatedTasks = [...currentTasks];
          const taskIndex = updatedTasks.findIndex(t => t.id === taskId);
          
          if (taskIndex !== -1) {
            const timeSpent = (Date.now() - startTime) / 1000;
            updatedTasks[taskIndex].timeSpent = (updatedTasks[taskIndex].timeSpent || 0) + timeSpent;
          }
          
          return updatedTasks;
        });
      }, 1000);
      
      setActiveTaskTimer(timer);
      setTasks(updatedTasks);
    }
  };

  // Stop the task timer
  const stopTaskTimer = () => {
    if (activeTaskTimer) {
      clearInterval(activeTaskTimer);
      setActiveTaskTimer(null);
      setActiveTaskId(null);
    }
  };

  // Calculate task counts for the stats display
  const taskCounts = {
    total: tasks.length,
    inProgress: tasks.filter(t => t.status === 'inProgress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    blocked: tasks.filter(t => t.status === 'blocked').length
  };

  // Filter tasks by status for display
  const filterByStatus = (status: string) => {
    if (status === 'all') {
      setSearchTerm('');
      setPriorityFilter('');
      setDateFilter('');
    } else {
      setTasks(tasks => tasks.filter(task => task.status === status));
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setPriorityFilter('');
    setDateFilter('');
  };

  return (
    <div className="bg-[#e0e5ec] min-h-screen">
      <Sidebar />
      <div className="ml-0 lg:ml-64 p-6">
        {/* Page Header with Settings Button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Task Management</h1>
          <div className="flex gap-4">
            <button className="neo-button p-3 relative">
              <i className="bi bi-bell text-xl"></i>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                2
              </span>
            </button>
            <Link to="/employee/profile" className="neo-button p-3 scale-on-hover" aria-label="Settings">
              <i className="bi bi-gear text-xl"></i>
            </Link>
          </div>
        </div>
        
        {/* Task Header Component */}
        <TaskHeader
          taskCounts={{
            total: filteredTasks.length,
            inProgress: filteredTasks.filter(task => task.status === 'inProgress').length,
            completed: filteredTasks.filter(task => task.status === 'completed').length,
            blocked: filteredTasks.filter(task => task.status === 'blocked').length
          }}
          onAddTask={openAddTaskModal}
          onFilterByStatus={filterByStatus}
        />
        
        {/* Search and Filter Panel */}
        <SearchFilterPanel
          searchQuery={searchTerm}
          priorityFilter={priorityFilter}
          dateFilter={dateFilter}
          onSearchChange={setSearchTerm}
          onPriorityChange={setPriorityFilter}
          onDateChange={setDateFilter}
          onClearFilters={clearFilters}
        />

        {/* Task Kanban Board */}
        <KanbanBoard 
          tasks={filteredTasks}
          columns={columns}
          onEditTask={openEditTaskModal}
          onStatusChange={updateTaskStatus}
          onToggleTaskTimer={toggleTaskTimer}
          activeTaskId={activeTaskId}
        />

        {/* Task Modal */}
        <TaskModal
          isOpen={isModalOpen}
          task={currentTask}
          onSave={saveTask}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default TaskPage; 