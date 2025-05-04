import React, { useState, useEffect } from 'react';
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

interface PerformanceChartProps {
  className?: string;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ className }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week');
  
  // Chart data based on time range
  const chartData = {
    week: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      productivity: [85, 87, 86, 89, 92, 91, 88],
      engagement: [80, 82, 84, 83, 86, 85, 83]
    },
    month: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      productivity: [86, 88, 90, 89],
      engagement: [82, 84, 85, 83]
    },
    quarter: {
      labels: ['Jan', 'Feb', 'Mar'],
      productivity: [85, 88, 92],
      engagement: [80, 83, 87]
    }
  };

  const data = {
    labels: chartData[timeRange].labels,
    datasets: [
      {
        label: 'Productivity',
        data: chartData[timeRange].productivity,
        borderColor: '#3b82f6',
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.1)'
      },
      {
        label: 'Engagement',
        data: chartData[timeRange].engagement,
        borderColor: '#10b981',
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(16, 185, 129, 0.1)'
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
        mode: 'index' as const,
        intersect: false,
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
        max: 100,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          stepSize: 20
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
    <div className={`neo-box p-6 chart-height-400 performance-chart-container ${className || ''}`}>
      <h3 className="text-xl font-semibold text-gray-800 mb-4 dashboard-card-title">Team Performance Metrics</h3>
      <div className="flex justify-end gap-2 mb-4 performance-chart-controls">
        <button 
          className={`neo-button p-2 text-sm performance-chart-tab ${timeRange === 'week' ? 'active' : ''}`} 
          onClick={() => setTimeRange('week')}
        >
          Week
        </button>
        <button 
          className={`neo-button p-2 text-sm performance-chart-tab ${timeRange === 'month' ? 'active' : ''}`} 
          onClick={() => setTimeRange('month')}
        >
          Month
        </button>
        <button 
          className={`neo-button p-2 text-sm performance-chart-tab ${timeRange === 'quarter' ? 'active' : ''}`} 
          onClick={() => setTimeRange('quarter')}
        >
          Quarter
        </button>
      </div>
      <div className="relative chart-height-280 chart-wrapper">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default PerformanceChart; 