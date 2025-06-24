import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Sidebar from '../Sidebar';
import TaskHeader from './TaskHeader';
import KanbanBoard from './KanbanBoard';
import TaskModal from './TaskModal';
import AIDashboard from '../../common/AIDashboard';
import SearchFilterPanel from './SearchFilterPanel';
import { Task, TaskStatus, TaskPriority } from './types';
import { getTaskService } from '../../../services/taskServiceFactory';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../../styles/employee/tasks.css';
import '../../../styles/employee/dragdrop.css';
import '../../../styles/NeomorphicUI.css';
import { useAuth } from '../../../context/AuthContext';

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
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const { userId, userRole } = useAuth();
  const taskService = getTaskService(userRole);

  // Columns for the kanban board
  const columns = [
    { id: 'todo', title: 'To Do', color: '#3b82f6' },
    { id: 'inProgress', title: 'In Progress', color: '#f59e0b' },
    { id: 'completed', title: 'Completed', color: '#10b981' },
    { id: 'blocked', title: 'Blocked', color: '#ef4444' }
  ];

  // Handle sidebar and window resizing
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Load tasks from the backend API
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const fetchedTasks = await taskService.getTasks();
        setTasks(fetchedTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setTasks([]);
      }
    };
    
    loadTasks();
    
    // Also listen for task updates from other components
    window.addEventListener('employeeTasksUpdated', loadTasks);
    
    return () => {
      window.removeEventListener('employeeTasksUpdated', loadTasks);
    };
  }, []);

  // Apply filters whenever tasks or filter criteria change
  useEffect(() => {
    applyFilters();
  }, [tasks, searchTerm, priorityFilter, dateFilter]);

  // Apply search and filters
  const applyFilters = () => {
    let results = [...tasks];
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(task => 
        task.title.toLowerCase().includes(term) ||
        task.description.toLowerCase().includes(term)
      );
    }
    
    // Apply priority filter
    if (priorityFilter) {
      results = results.filter(task => task.priority === priorityFilter);
    }
    
    // Apply date filter
    if (dateFilter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      switch (dateFilter) {
        case 'today':
          results = results.filter(task => {
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate.getTime() === today.getTime();
          });
          break;
        case 'tomorrow':
          results = results.filter(task => {
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate.getTime() === tomorrow.getTime();
          });
          break;
        case 'this-week':
          results = results.filter(task => {
            const dueDate = new Date(task.dueDate);
            return dueDate >= today && dueDate < nextWeek;
          });
          break;
        case 'overdue':
          results = results.filter(task => {
            const dueDate = new Date(task.dueDate);
            return dueDate < today && task.status !== 'completed';
          });
          break;
      }
    }
    
    setFilteredTasks(results);
  };

  // Generate task counts for header stats
  const taskCounts = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'inProgress').length,
    overdue: tasks.filter(t => {
      const dueDate = new Date(t.dueDate);
      const now = new Date();
      return dueDate < now && t.status !== 'completed';
    }).length
  };

  // Filter tasks by status from header stats
  const filterByStatus = (status: string | null) => {
    if (status === 'overdue') {
      setDateFilter('overdue');
      setPriorityFilter('');
      setSearchTerm('');
    } else if (status) {
      setDateFilter('');
      setPriorityFilter('');
      setSearchTerm('');
      // Filter tasks directly instead of using statusFilter
      setFilteredTasks(tasks.filter(t => t.status === status));
      return;
    } else {
      clearFilters();
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setPriorityFilter('');
    setDateFilter('');
  };

  // Update task status
  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const updatedTask = await taskService.updateTaskStatus(taskId, newStatus);
      setTasks(prevTasks => 
        prevTasks.map(task => task.id === taskId ? updatedTask : task)
      );
      window.dispatchEvent(new Event('employeeTasksUpdated'));
    } catch (error) {
      console.error('Error updating task status:', error);
      setTasks(prevTasks => {
        const updatedTasks = prevTasks.map(task => {
          if (task.id === taskId) {
            const progress = newStatus === 'completed' ? 100 : task.progress;
            return { ...task, status: newStatus, progress };
          }
          return task;
        });
        return updatedTasks;
      });
    }
  };

  // Open the task modal for viewing and updating status/progress
  const openTaskModal = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setCurrentTask(task);
      setIsModalOpen(true);
    }
  };

  // Toggle task timer
  const toggleTaskTimer = (taskId: string) => {
    if (activeTaskId === taskId) {
      stopTaskTimer();
    } else {
      startTaskTimer(taskId);
    }
  };

  // Start task timer
  const startTaskTimer = (taskId: string) => {
    if (activeTaskTimer) {
      clearInterval(activeTaskTimer);
    }
    
    setActiveTaskId(taskId);
    
    const timer = setInterval(async () => {
      try {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          const newTimeSpent = (task.timeSpent || 0) + 1;
          // Update local state since updateTimeSpent might not exist
          setTasks(prevTasks => 
            prevTasks.map(t => t.id === taskId ? { ...t, timeSpent: newTimeSpent } : t)
          );
        }
      } catch (error) {
        console.error('Error updating time spent:', error);
      }
    }, 60000); // Update every minute
    
    setActiveTaskTimer(timer);
  };

  // Stop task timer
  const stopTaskTimer = () => {
    if (activeTaskTimer) {
      clearInterval(activeTaskTimer);
      setActiveTaskTimer(null);
    }
    setActiveTaskId(null);
  };

  return (
    <>
      <Helmet>
        <title>WorkSmart AI - Employee Tasks</title>
      </Helmet>
      <div className="employee-tasks-container bg-[#e0e5ec] min-h-screen w-full overflow-x-hidden">
        {/* Overlay for mobile sidebar */}
        {sidebarOpen && window.innerWidth <= 1024 && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={`sidebar fixed h-full transition-all duration-300 z-50 ${sidebarOpen ? '' : '-translate-x-full'}`}>
          <Sidebar />
        </div>
        
        {/* Main Content */}
        <div 
          className="main-content transition-all duration-300 py-6 px-4 md:px-6" 
          style={{ marginLeft: sidebarOpen && window.innerWidth > 1024 ? '250px' : '0' }}
        >
          <div className="max-w-7xl mx-auto fade-in">
            {/* Sidebar Toggle for Mobile */}
            {!sidebarOpen && (
              <button 
                className="fixed top-4 left-4 z-20 neo-button p-3 lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open Sidebar"
              >
                <i className="bi bi-list text-2xl"></i>
              </button>
            )}
            
            {/* Task Header */}
            <div className="neo-box p-5 md:p-6 mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Tasks</h1>
                  <p className="text-md md:text-lg text-gray-600">Track and manage your assigned tasks with AI insights</p>
                </div>
                <div className="flex gap-4">
                  <Link to="/employee/profile" className="neo-button p-3 scale-on-hover" aria-label="Settings">
                    <i className="bi bi-gear text-xl"></i>
                  </Link>
                </div>
              </div>
            </div>

            {/* Task Header Component */}
            <div className="slide-in-up">
              <TaskHeader
                taskCounts={taskCounts}
                onFilterByStatus={filterByStatus}
              />
            </div>

            {/* Search and Filter Panel */}
            <div className="slide-in-up">
              <SearchFilterPanel
                searchQuery={searchTerm}
                priorityFilter={priorityFilter}
                dateFilter={dateFilter}
                onSearchChange={setSearchTerm}
                onPriorityChange={setPriorityFilter}
                onDateChange={setDateFilter}
                onClearFilters={clearFilters}
              />
            </div>

            {/* Kanban Board */}
            <div className="slide-in-up">
              <KanbanBoard 
                tasks={filteredTasks}
                columns={columns}
                onStatusChange={updateTaskStatus}
                onTaskClick={openTaskModal}
              />
            </div>
          </div>
        </div>

        {/* Task Modal */}
        {isModalOpen && currentTask && (
          <TaskModal 
            isOpen={isModalOpen}
            task={currentTask}
            onClose={() => setIsModalOpen(false)}
          />
        )}

        {/* AI Dashboard - Always shown */}
        <AIDashboard 
          userRole="employee"
          onTaskAction={(action, taskId) => {
            // Handle AI dashboard actions
            if (action === 'view' || action === 'edit') {
              openTaskModal(taskId);
            }
          }}
        />

        <style>
          {`
          .fade-in {
            animation: fadeIn 0.5s ease-in;
          }

          .slide-in-up {
            animation: slideInUp 0.6s ease-out;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideInUp {
            from {
              transform: translateY(30px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          .scale-on-hover {
            transition: transform 0.2s ease;
          }

          .scale-on-hover:hover {
            transform: scale(1.05);
          }
          `}
        </style>
      </div>
    </>
  );
};

export default TaskPage; 