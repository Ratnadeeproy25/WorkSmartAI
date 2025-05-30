import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../Sidebar';
import TaskHeader from './TaskHeader';
import KanbanBoard from './KanbanBoard';
import TaskModal from './TaskModal';
import SearchFilterPanel from './SearchFilterPanel';
import { Task, TaskStatus, TaskPriority } from './types';
import { getTaskService } from '../../../services/taskServiceFactory';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../../styles/employee/tasks.css';
import '../../../styles/employee/dragdrop.css';
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
        // console.log('Fetching tasks for employee...');
        const fetchedTasks = await taskService.getTasks();
        // console.log('Fetched tasks:', fetchedTasks);
        
        // Don't filter tasks - the backend should already filter by user
        setTasks(fetchedTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setTasks([]); // Show empty if backend fails
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
      setFilteredTasks(tasks.filter(t => t.status === status));
    } else {
      clearFilters();
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setPriorityFilter('');
    setDateFilter('');
    setFilteredTasks(tasks);
  };

  // Generate a task ID for fallback
  const generateTaskId = () => {
    return `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

  // Update task status
  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      // Call the API to update the task status
      const updatedTask = await taskService.updateTaskStatus(taskId, newStatus);
      
      // Update the local state with the updated task
      setTasks(prevTasks => 
        prevTasks.map(task => task.id === taskId ? updatedTask : task)
      );
      
      // Notify about the update
      window.dispatchEvent(new Event('employeeTasksUpdated'));
    } catch (error) {
      console.error('Error updating task status:', error);
      // Fallback if API call fails
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
    
    // Create an interval to update the time spent every minute
    const timer = setInterval(async () => {
      try {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          // Update time spent by adding one minute
          const timeSpent = (task.timeSpent || 0) + 1;
          
          // Call the API to update the time spent
          if (taskService.updateTaskTime) {
            try {
              const updatedTask = await taskService.updateTaskTime(taskId, timeSpent);
              
              // Update the local state with the updated task
              setTasks(prevTasks => 
                prevTasks.map(t => t.id === taskId ? updatedTask : t)
              );
            } catch (error) {
              console.error('Error updating time spent:', error);
              // Fallback if API call fails
              setTasks(prevTasks => {
                const updatedTasks = prevTasks.map(task => {
                  if (task.id === taskId) {
                    return { ...task, timeSpent: (task.timeSpent || 0) + 1 };
                  }
                  return task;
                });
                return updatedTasks;
              });
            }
          } else {
            // Method not available, just update local state
            setTasks(prevTasks => {
              const updatedTasks = prevTasks.map(task => {
                if (task.id === taskId) {
                  return { ...task, timeSpent: (task.timeSpent || 0) + 1 };
                }
                return task;
              });
              return updatedTasks;
            });
          }
        }
      } catch (error) {
        console.error('Error in timer update:', error);
      }
    }, 60000); // 60000 ms = 1 minute
    
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
    <div className="employee-tasks-container bg-[#e0e5ec] min-h-screen w-full overflow-x-hidden">
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && window.innerWidth <= 1024 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <Sidebar />
      
      {/* Main Content */}
      <div 
        className={`employee-main-content ${sidebarOpen && window.innerWidth > 1024 ? 'sidebar-open' : ''}`}
      >
        <div className="employee-content-wrapper max-w-7xl mx-auto">
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

          {/* Page Header with Settings Button */}
          <div className="employee-page-header">
            <h1 className="text-2xl font-bold text-gray-700">Task Management</h1>
            <div className="flex gap-4 actions">
              <Link to="/employee/profile" className="neo-button">
                <i className="bi bi-gear text-xl"></i>
              </Link>
            </div>
          </div>
        
          {/* Task Header Component (My Tasks, Stats) */}
          <div className="employee-task-header">
            <TaskHeader
              taskCounts={taskCounts}
              onFilterByStatus={filterByStatus}
            />
          </div>
        
          {/* Search and Filter Panel */}
          <div className="employee-search-filter-panel">
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

          {/* Task Kanban Board */}
          <div className="employee-kanban-section">
            <KanbanBoard 
              tasks={filteredTasks}
              columns={columns}
              onStatusChange={updateTaskStatus}
            />
          </div>
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        task={currentTask}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default TaskPage; 