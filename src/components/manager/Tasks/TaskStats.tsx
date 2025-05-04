import React, { useState, useEffect } from 'react';

interface TaskStatsData {
  totalTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  blockedTasks: number;
}

const TaskStats: React.FC = () => {
  const [stats, setStats] = useState<TaskStatsData>({
    totalTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    blockedTasks: 0
  });

  // Load task stats from localStorage
  useEffect(() => {
    const loadStats = () => {
      try {
        const savedTasks = localStorage.getItem('managerTasks');
        if (savedTasks) {
          const tasks = JSON.parse(savedTasks);
          setStats({
            totalTasks: tasks.length,
            inProgressTasks: tasks.filter((task: any) => task.status === 'inProgress').length,
            completedTasks: tasks.filter((task: any) => task.status === 'completed').length,
            blockedTasks: tasks.filter((task: any) => task.status === 'blocked').length
          });
        }
      } catch (error) {
        console.error('Failed to load task stats', error);
      }
    };

    loadStats();

    // Set up event listener for storage changes
    window.addEventListener('tasksUpdated', loadStats);
    
    return () => {
      window.removeEventListener('tasksUpdated', loadStats);
    };
  }, []);

  const filterTasks = (filterType: string) => {
    // This function would be implemented to filter the tasks by status
    // For now, it's a placeholder that could be expanded later
    console.log(`Filtering tasks by: ${filterType}`);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-6 mb-8">
      <div 
        className="neo-box p-4 text-center cursor-pointer" 
        onClick={() => filterTasks('all')}
      >
        <div className="text-2xl font-bold text-blue-600">{stats.totalTasks}</div>
        <div className="text-sm text-gray-600">Total Tasks</div>
      </div>
      <div 
        className="neo-box p-4 text-center cursor-pointer" 
        onClick={() => filterTasks('inProgress')}
      >
        <div className="text-2xl font-bold text-yellow-600">{stats.inProgressTasks}</div>
        <div className="text-sm text-gray-600">In Progress</div>
      </div>
      <div 
        className="neo-box p-4 text-center cursor-pointer" 
        onClick={() => filterTasks('completed')}
      >
        <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
        <div className="text-sm text-gray-600">Completed</div>
      </div>
      <div 
        className="neo-box p-4 text-center cursor-pointer" 
        onClick={() => filterTasks('blocked')}
      >
        <div className="text-2xl font-bold text-red-600">{stats.blockedTasks}</div>
        <div className="text-sm text-gray-600">Blocked</div>
      </div>
    </div>
  );
};

export default TaskStats; 