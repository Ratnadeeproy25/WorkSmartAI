import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../Sidebar';
import TaskHeader from './TaskHeader';
import TaskStats from './TaskStats';
import KanbanBoard from './KanbanBoard';
import TaskModal from './TaskModal';
import ColumnModal from './ColumnModal';
import SearchFilterPanel from './SearchFilterPanel';
import '../../../styles/NeomorphicUI.css';
import '../../../styles/manager/index.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const TaskPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
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

  const handleAddTask = () => {
    setSelectedTaskId(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsTaskModalOpen(true);
  };

  const handleAddColumn = () => {
    setSelectedColumnId(null);
    setIsColumnModalOpen(true);
  };

  const handleEditColumn = (columnId: string) => {
    setSelectedColumnId(columnId);
    setIsColumnModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTaskId(null);
  };

  const handleCloseColumnModal = () => {
    setIsColumnModalOpen(false);
    setSelectedColumnId(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setAssigneeFilter('');
    setPriorityFilter('');
    setDateFilter('');
  };

  return (
    <div className="manager-tasks-container bg-[#e0e5ec] min-h-screen w-full overflow-x-hidden">
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
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manager Task Management</h1>
                <p className="text-md md:text-lg text-gray-600">Manage and track team tasks</p>
              </div>
              <div className="flex gap-4">
                <button 
                  className="neo-button px-4 py-2"
                  onClick={handleAddColumn}
                >
                  <i className="bi bi-plus-square mr-2"></i>Add Column
                </button>
                <button 
                  className="neo-button primary px-4 py-2"
                  onClick={handleAddTask}
                >
                  <i className="bi bi-plus-lg mr-2"></i>Add Task
                </button>
                <Link to="/manager/profile" className="neo-button p-3 scale-on-hover" aria-label="Settings">
                  <i className="bi bi-gear text-xl"></i>
                </Link>
              </div>
            </div>
          </div>

          {/* Task Stats */}
          <div className="slide-in-up">
            <TaskStats />
          </div>

          {/* Search and Filter Panel */}
          <div className="slide-in-up">
            <SearchFilterPanel
              searchQuery={searchTerm}
              assigneeFilter={assigneeFilter}
              priorityFilter={priorityFilter}
              dateFilter={dateFilter}
              onSearchChange={(query) => setSearchTerm(query)}
              onAssigneeChange={(assignee) => setAssigneeFilter(assignee)}
              onPriorityChange={(priority) => setPriorityFilter(priority)}
              onDateChange={(date) => setDateFilter(date)}
              onClearFilters={clearFilters}
            />
          </div>

          {/* Kanban Board */}
          <div className="slide-in-up">
            <KanbanBoard 
              searchTerm={searchTerm}
              assigneeFilter={assigneeFilter}
              priorityFilter={priorityFilter}
              dateFilter={dateFilter}
              onEditTask={handleEditTask}
              onEditColumn={handleEditColumn}
            />
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <TaskModal 
          taskId={selectedTaskId} 
          onClose={handleCloseTaskModal} 
        />
      )}

      {/* Column Modal */}
      {isColumnModalOpen && (
        <ColumnModal 
          columnId={selectedColumnId} 
          onClose={handleCloseColumnModal} 
        />
      )}
    </div>
  );
};

export default TaskPage; 