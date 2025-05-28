import React, { useState, useEffect, useCallback } from 'react';
import managerTaskService from '../../../services/managerTaskService';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create a memoized loadStats function to ensure consistent references
  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tasks = await managerTaskService.getManagerTasks();
      setStats({
        totalTasks: tasks.length,
        inProgressTasks: tasks.filter((task: any) => task.status === 'inProgress').length,
        completedTasks: tasks.filter((task: any) => task.status === 'completed').length,
        blockedTasks: tasks.filter((task: any) => task.status === 'blocked').length
      });
    } catch (err) {
      setError('Failed to load task stats from backend.');
      setStats({ totalTasks: 0, inProgressTasks: 0, completedTasks: 0, blockedTasks: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load
    loadStats();
    
    // Set up event listener for manager-specific task updates
    const handleTasksUpdated = () => {
      loadStats();
    };
    
    window.addEventListener('managerTasksUpdated', handleTasksUpdated);
    
    return () => {
      window.removeEventListener('managerTasksUpdated', handleTasksUpdated);
    };
  }, [loadStats]);

  const filterTasks = (filterType: string) => {
    // This function would be implemented to filter the tasks by status
    // For now, it's a placeholder that could be expanded later
    console.log(`Filtering tasks by: ${filterType}`);
  };

  if (loading) return <div className="text-center py-8">Loading stats...</div>;
  if (error) return <div className="text-center text-red-500 py-4">{error}</div>;

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