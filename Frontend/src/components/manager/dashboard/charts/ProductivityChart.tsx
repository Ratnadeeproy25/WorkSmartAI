import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartDataset {
  label?: string;
  data: number[];
  borderColor?: string | string[];
  backgroundColor?: string | string[];
  borderWidth?: number;
  tension?: number;
  fill?: boolean;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface ProductivityChartProps {
  className?: string;
  chartData?: ChartData;
}

const ProductivityChart: React.FC<ProductivityChartProps> = ({ className, chartData }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  
  // Default data if no API data is provided
  const defaultData = {
    week: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: [12, 15, 18, 14, 20, 8, 5]
    },
    month: {
      labels: Array.from({ length: 30 }, (_, i) => (i + 1).toString()),
      data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 10) + 5)
    },
    quarter: {
      labels: ['Jan', 'Feb', 'Mar'],
      data: [450, 520, 480]
    }
  };

  // Use API data if available, otherwise use default data
  const data = chartData || {
    labels: defaultData[timeRange].labels,
    datasets: [
      {
        label: 'Tasks Completed',
        data: defaultData[timeRange].data,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 20,
          padding: 10
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 10,
        displayColors: true
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          stepSize: timeRange === 'quarter' ? 50 : timeRange === 'month' ? 5 : 2
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxTicksLimit: timeRange === 'month' ? 10 : undefined
        }
      }
    }
  };

  // Calculate productivity metrics
  const calculateMetrics = () => {
    if (!data.datasets || data.datasets.length === 0) {
      return { total: 0, average: 0, trend: 0 };
    }

    const taskData = data.datasets[0].data;
    const total = taskData.reduce((a, b) => a + b, 0);
    const average = taskData.length > 0 ? Math.round(total / taskData.length) : 0;
    
    // Calculate trend (comparing first half vs second half)
    const midPoint = Math.floor(taskData.length / 2);
    const firstHalf = taskData.slice(0, midPoint);
    const secondHalf = taskData.slice(midPoint);
    
    const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const trend = secondHalfAvg - firstHalfAvg;

    return { total, average, trend };
  };

  const metrics = calculateMetrics();

  return (
    <div className={`neo-box p-6 chart-height-400 productivity-chart-container ${className || ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800 dashboard-card-title">Team Productivity</h3>
        {!chartData && (
          <div className="flex gap-2 productivity-chart-controls">
            <button 
              className={`neo-button p-2 text-sm productivity-chart-tab ${timeRange === 'week' ? 'active' : ''}`}
              onClick={() => setTimeRange('week')}
            >
              Week
            </button>
            <button 
              className={`neo-button p-2 text-sm productivity-chart-tab ${timeRange === 'month' ? 'active' : ''}`}
              onClick={() => setTimeRange('month')}
            >
              Month
            </button>
            <button 
              className={`neo-button p-2 text-sm productivity-chart-tab ${timeRange === 'quarter' ? 'active' : ''}`}
              onClick={() => setTimeRange('quarter')}
            >
              Quarter
            </button>
          </div>
        )}
      </div>
      
      <div className="relative chart-height-280 chart-wrapper">
        {chartData || data.datasets[0].data.length > 0 ? (
          <Line data={data} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading chart data...</div>
          </div>
        )}
      </div>

      {/* Productivity metrics */}
      <div className="mt-4 grid grid-cols-3 gap-4 productivity-metrics">
        <div className="text-center">
          <div className="text-lg font-semibold text-purple-600">{metrics.total}</div>
          <div className="text-sm text-gray-600">Total Tasks</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-600">{metrics.average}</div>
          <div className="text-sm text-gray-600">Daily Average</div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-semibold ${metrics.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.trend >= 0 ? '+' : ''}{metrics.trend.toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">Trend</div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityChart; 