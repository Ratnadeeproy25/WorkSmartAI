import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../../styles/employee/dashboard.css';
import { useAuth } from '../../../context/AuthContext';
import { getTaskStatistics, getDashboardData, TaskData, PerformanceData } from '../../../services/dashboardService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TaskProgress: React.FC = () => {
  const { userName, userEmail, userId } = useAuth();
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [
      {
        label: 'Performance',
        data: [85, 88, 90, 87, 92],
        borderColor: '#3b82f6',
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.1)'
      }
    ]
  });
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [statistics, setStatistics] = useState({
    completionRate: 85,
    tasksThisWeek: 12,
    dueToday: 4,
    inProgress: 8
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!userId) return;
        setLoading(true);
        
        // Fetch dashboard data using MongoDB ID from auth context
        const dashboardData = await getDashboardData(userId);
        setPerformanceData(dashboardData.performanceData);
        setTasks(dashboardData.tasks);
        
        // Fetch task statistics
        const taskStats = await getTaskStatistics(userId);
        setStatistics(taskStats);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            family: 'Poppins',
            size: 12
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          display: false
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  // Skeleton loader for tasks
  const TaskSkeleton = () => (
    <div className="task-item animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="task-avatar bg-gray-300 w-10 h-10"></div>
          <div className="ml-4">
            <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-24"></div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-4 bg-gray-300 rounded w-10"></div>
          <div className="h-8 w-8 bg-gray-300 rounded"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="w-full h-2 bg-gray-300 rounded-full"></div>
        <div className="flex justify-between">
          <div className="h-3 bg-gray-300 rounded w-20"></div>
          <div className="h-3 bg-gray-300 rounded w-24"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Task Progress */}
      <div className="neo-box p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Task Progress</h3>
          <Link to="/employee/tasks" className="neo-button p-2 flex items-center gap-2">
            <i className="bi bi-kanban"></i>
            <span>View Kanban Board</span>
          </Link>
        </div>
        <div className="space-y-4">
          {loading ? (
            <>
              <TaskSkeleton />
              <TaskSkeleton />
            </>
          ) : error ? (
            <div className="text-center text-red-500 py-4">{error}</div>
          ) : tasks.length === 0 ? (
            <div className="text-center text-gray-500 py-4">No active tasks found.</div>
          ) : (
            tasks.slice(0, 2).map((task) => (
              <div className="task-item" key={task.id}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className={`task-avatar ${
                      task.priority === 'high' ? 'bg-red-500' : 
                      task.priority === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      {task.title.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">{task.title}</div>
                      <div className="text-sm text-gray-600">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-600">{task.progress}%</div>
                    <Link to={`/employee/tasks#task-${task.id}`} className="neo-button p-2">
                      <i className="bi bi-arrow-right"></i>
                    </Link>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div 
                      className={`h-2 rounded-full ${
                        task.priority === 'high' ? 'bg-red-500' : 
                        task.priority === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                      }`} 
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <i className="bi bi-check-circle text-green-500"></i>
                      <span>{task.subtasksCompleted} Subtasks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="bi bi-clock text-yellow-500"></i>
                      <span>{task.timeLeft}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Task Actions */}
        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-700">Quick Actions</h4>
            <Link to="/employee/tasks#new" className="neo-button p-2 flex items-center gap-2">
              <i className="bi bi-plus"></i>
              <span>New Task</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/employee/tasks#priority" className="neo-button p-3 text-left">
              <i className="bi bi-flag text-red-500 mr-2"></i>
              <span>View Priority Tasks</span>
            </Link>
            <Link to="/employee/tasks#deadlines" className="neo-button p-3 text-left">
              <i className="bi bi-calendar-event text-yellow-500 mr-2"></i>
              <span>Upcoming Deadlines</span>
            </Link>
            <Link to="/employee/tasks#completed" className="neo-button p-3 text-left">
              <i className="bi bi-check-circle text-green-500 mr-2"></i>
              <span>Completed Tasks</span>
            </Link>
            <Link to="/employee/tasks#blocked" className="neo-button p-3 text-left">
              <i className="bi bi-exclamation-circle text-red-500 mr-2"></i>
              <span>Blocked Tasks</span>
            </Link>
          </div>
        </div>

        {/* Task Statistics */}
        <div className="mt-6">
          <h4 className="font-semibold text-gray-700 mb-4">Task Statistics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="neo-box p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{statistics.completionRate}%</div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
            <div className="neo-box p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{statistics.tasksThisWeek}</div>
              <div className="text-sm text-gray-600">Tasks This Week</div>
            </div>
            <div className="neo-box p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{statistics.dueToday}</div>
              <div className="text-sm text-gray-600">Due Today</div>
            </div>
            <div className="neo-box p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{statistics.inProgress}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Score */}
      <div className="neo-box p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Performance Score</h3>
        <div className="h-48">
          {loading ? (
            <div className="animate-pulse w-full h-full bg-gray-200 rounded"></div>
          ) : (
            <Line data={performanceData} options={options} />
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskProgress; 