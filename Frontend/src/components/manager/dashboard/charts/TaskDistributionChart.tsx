import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

interface ChartDataset {
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
  isEmpty?: boolean;
  error?: boolean;
  summary?: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    blocked: number;
  };
}

interface TaskDistributionChartProps {
  className?: string;
  chartData?: ChartData;
}

const TaskDistributionChart: React.FC<TaskDistributionChartProps> = ({ className, chartData }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('week');
  
  // Default data if no API data is provided
  const defaultData = {
    week: {
      labels: ['Completed', 'In Progress', 'Pending', 'Overdue'],
      data: [45, 25, 20, 10],
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
    },
    month: {
      labels: ['Completed', 'In Progress', 'Pending', 'Overdue'],
      data: [180, 95, 75, 35],
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
    },
    quarter: {
      labels: ['Completed', 'In Progress', 'Pending', 'Overdue'],
      data: [540, 285, 225, 105],
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
    }
  };

  // Determine if we're using API data or default data
  const hasApiData = chartData && !chartData.isEmpty && !chartData.error;
  
  // Use API data if available, otherwise use default data
  const data = hasApiData ? chartData : {
    labels: defaultData[selectedPeriod].labels,
    datasets: [
      {
        data: defaultData[selectedPeriod].data,
        backgroundColor: defaultData[selectedPeriod].backgroundColor,
        borderColor: ['#ffffff'],
        borderWidth: 2
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
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%'
  };

  // Calculate metrics - use API summary if available, otherwise calculate from data
  const getMetrics = () => {
    if (hasApiData && chartData?.summary) {
      const { total, completed } = chartData.summary;
      return {
        totalTasks: total,
        completedTasks: completed,
        completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0'
      };
    } else {
      const totalTasks = data.datasets[0]?.data.reduce((a, b) => a + b, 0) || 0;
      // For default data, assume first item is completed
      const completedTasks = data.datasets[0]?.data[0] || 0;
      const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0';
      return { totalTasks, completedTasks, completionRate };
    }
  };

  const { totalTasks, completedTasks, completionRate } = getMetrics();

  // Show loading state
  if (!chartData) {
    return (
      <div className={`neo-box p-6 chart-height-400 task-distribution-chart-container ${className || ''}`}>
        <h3 className="text-xl font-semibold text-gray-800 mb-4 dashboard-card-title">Task Distribution</h3>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading chart data...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (chartData?.error) {
    return (
      <div className={`neo-box p-6 chart-height-400 task-distribution-chart-container ${className || ''}`}>
        <h3 className="text-xl font-semibold text-gray-800 mb-4 dashboard-card-title">Task Distribution</h3>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-red-500 mb-2">
              <i className="bi bi-exclamation-triangle text-2xl"></i>
            </div>
            <div className="text-gray-500">Failed to load task data</div>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state
  if (chartData?.isEmpty) {
    return (
      <div className={`neo-box p-6 chart-height-400 task-distribution-chart-container ${className || ''}`}>
        <h3 className="text-xl font-semibold text-gray-800 mb-4 dashboard-card-title">Task Distribution</h3>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-gray-400 mb-2">
              <i className="bi bi-inbox text-3xl"></i>
            </div>
            <div className="text-gray-500">No tasks assigned to your team yet</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`neo-box p-6 chart-height-400 task-distribution-chart-container ${className || ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800 dashboard-card-title">Task Distribution</h3>
        {/* Only show period controls when using default data (no API data) */}
        {!hasApiData && (
          <div className="flex gap-2 task-distribution-controls">
            <button 
              className={`neo-button p-2 text-sm task-distribution-tab ${selectedPeriod === 'week' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('week')}
            >
              Week
            </button>
            <button 
              className={`neo-button p-2 text-sm task-distribution-tab ${selectedPeriod === 'month' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('month')}
            >
              Month
            </button>
            <button 
              className={`neo-button p-2 text-sm task-distribution-tab ${selectedPeriod === 'quarter' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('quarter')}
            >
              Quarter
            </button>
          </div>
        )}
      </div>
      
      <div className="relative chart-height-280 chart-wrapper">
        <Doughnut data={data} options={options} />
        {/* Center text showing completion rate */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{completionRate}%</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>
      </div>

      {/* Task summary */}
      <div className="mt-4 grid grid-cols-2 gap-4 task-summary">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-800">{totalTasks}</div>
          <div className="text-sm text-gray-600">Total Tasks</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">{completedTasks}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
      </div>

      {/* Additional metrics when using API data */}
      {hasApiData && chartData?.summary && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="font-semibold text-yellow-600">{chartData.summary.pending}</div>
            <div className="text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">{chartData.summary.inProgress}</div>
            <div className="text-gray-600">In Progress</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-600">{chartData.summary.blocked}</div>
            <div className="text-gray-600">Blocked</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDistributionChart; 