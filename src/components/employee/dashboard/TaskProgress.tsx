import React from 'react';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../../styles/employee/dashboard.css';
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
  const performanceData = {
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
  };

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

  return (
    <div className="space-y-8">
      {/* Task Progress */}
      <div className="neo-box p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Task Progress</h3>
          <Link to="/tasks" className="neo-button p-2 flex items-center gap-2">
            <i className="bi bi-kanban"></i>
            <span>View Kanban Board</span>
          </Link>
        </div>
        <div className="space-y-4">
          <div className="task-item">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="task-avatar bg-blue-500">TD</div>
                <div>
                  <div className="font-medium text-gray-700">Task Dashboard</div>
                  <div className="text-sm text-gray-600">Due: Today</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600">75%</div>
                <Link to="/tasks#task-1" className="neo-button p-2">
                  <i className="bi bi-arrow-right"></i>
                </Link>
              </div>
            </div>
            <div className="space-y-2">
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div className="w-3/4 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <i className="bi bi-check-circle text-green-500"></i>
                  <span>3/4 Subtasks</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="bi bi-clock text-yellow-500"></i>
                  <span>2 hours left</span>
                </div>
              </div>
            </div>
          </div>

          <div className="task-item">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="task-avatar bg-green-500">AP</div>
                <div>
                  <div className="font-medium text-gray-700">API Project</div>
                  <div className="text-sm text-gray-600">Due: Tomorrow</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600">50%</div>
                <Link to="/tasks#task-2" className="neo-button p-2">
                  <i className="bi bi-arrow-right"></i>
                </Link>
              </div>
            </div>
            <div className="space-y-2">
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div className="w-1/2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <i className="bi bi-check-circle text-green-500"></i>
                  <span>2/4 Subtasks</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="bi bi-clock text-yellow-500"></i>
                  <span>1 day left</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Task Actions */}
        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-700">Quick Actions</h4>
            <Link to="/tasks#new" className="neo-button p-2 flex items-center gap-2">
              <i className="bi bi-plus"></i>
              <span>New Task</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/tasks#priority" className="neo-button p-3 text-left">
              <i className="bi bi-flag text-red-500 mr-2"></i>
              <span>View Priority Tasks</span>
            </Link>
            <Link to="/tasks#deadlines" className="neo-button p-3 text-left">
              <i className="bi bi-calendar-event text-yellow-500 mr-2"></i>
              <span>Upcoming Deadlines</span>
            </Link>
            <Link to="/tasks#completed" className="neo-button p-3 text-left">
              <i className="bi bi-check-circle text-green-500 mr-2"></i>
              <span>Completed Tasks</span>
            </Link>
            <Link to="/tasks#blocked" className="neo-button p-3 text-left">
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
              <div className="text-2xl font-bold text-blue-600">85%</div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
            <div className="neo-box p-4 text-center">
              <div className="text-2xl font-bold text-green-600">12</div>
              <div className="text-sm text-gray-600">Tasks This Week</div>
            </div>
            <div className="neo-box p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">4</div>
              <div className="text-sm text-gray-600">Due Today</div>
            </div>
            <div className="neo-box p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">8</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Score */}
      <div className="neo-box p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Performance Score</h3>
        <div className="h-48">
          <Line data={performanceData} options={options} />
        </div>
      </div>
    </div>
  );
};

export default TaskProgress; 