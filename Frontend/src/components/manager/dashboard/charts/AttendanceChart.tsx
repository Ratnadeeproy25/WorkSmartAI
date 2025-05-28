import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ChartDataset {
  label?: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface AttendanceChartProps {
  className?: string;
  chartData?: ChartData;
}

const AttendanceChart: React.FC<AttendanceChartProps> = ({ className, chartData }) => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  
  // Default data if no API data is provided
  const defaultData = {
    week: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      present: [8, 7, 9, 8, 8, 5, 3],
      late: [1, 2, 0, 1, 1, 0, 0],
      absent: [1, 1, 1, 1, 1, 2, 4]
    },
    month: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      present: [35, 38, 36, 32],
      late: [3, 2, 4, 5],
      absent: [7, 5, 8, 10]
    }
  };

  // Use API data if available, otherwise use default data
  const data = chartData || {
    labels: defaultData[viewMode].labels,
    datasets: [
      {
        label: 'Present',
        data: defaultData[viewMode].present,
        backgroundColor: '#10b981',
        borderColor: '#10b981',
        borderWidth: 1
      },
      {
        label: 'Late',
        data: defaultData[viewMode].late,
        backgroundColor: '#f59e0b',
        borderColor: '#f59e0b',
        borderWidth: 1
      },
      {
        label: 'Absent',
        data: defaultData[viewMode].absent,
        backgroundColor: '#ef4444',
        borderColor: '#ef4444',
        borderWidth: 1
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
      x: {
        stacked: true,
        grid: {
          display: false
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  // Calculate attendance metrics
  const calculateMetrics = () => {
    if (!data.datasets || data.datasets.length < 3) {
      return { avgPresent: '0%', avgLate: '0%', avgAbsent: '0%' };
    }

    const presentData = data.datasets[0].data;
    const lateData = data.datasets[1].data;
    const absentData = data.datasets[2].data;

    const totalPresent = presentData.reduce((a, b) => a + b, 0);
    const totalLate = lateData.reduce((a, b) => a + b, 0);
    const totalAbsent = absentData.reduce((a, b) => a + b, 0);
    const total = totalPresent + totalLate + totalAbsent;

    if (total === 0) {
      return { avgPresent: '0%', avgLate: '0%', avgAbsent: '0%' };
    }

    return {
      avgPresent: `${((totalPresent / total) * 100).toFixed(1)}%`,
      avgLate: `${((totalLate / total) * 100).toFixed(1)}%`,
      avgAbsent: `${((totalAbsent / total) * 100).toFixed(1)}%`
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className={`neo-box p-6 chart-height-400 attendance-chart-container ${className || ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800 dashboard-card-title">Team Attendance</h3>
        {!chartData && (
          <div className="flex gap-2 attendance-chart-controls">
            <button 
              className={`neo-button p-2 text-sm attendance-chart-tab ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
            <button 
              className={`neo-button p-2 text-sm attendance-chart-tab ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
          </div>
        )}
      </div>
      
      <div className="relative chart-height-280 chart-wrapper">
        {chartData || data.datasets[0].data.length > 0 ? (
          <Bar data={data} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading chart data...</div>
          </div>
        )}
      </div>

      <div className="attendance-metrics mt-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">{metrics.avgPresent}</div>
          <div className="text-sm text-gray-600">Avg. Present</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-yellow-600">{metrics.avgLate}</div>
          <div className="text-sm text-gray-600">Avg. Late</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-red-600">{metrics.avgAbsent}</div>
          <div className="text-sm text-gray-600">Avg. Absent</div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceChart; 