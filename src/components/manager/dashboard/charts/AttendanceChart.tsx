import React from 'react';
import { Line } from 'react-chartjs-2';
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

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface AttendanceChartProps {
  className?: string;
}

const AttendanceChart: React.FC<AttendanceChartProps> = ({ className }) => {
  const data = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Present',
        data: [95, 92, 94, 93],
        borderColor: '#10B981',
        tension: 0.4
      },
      {
        label: 'Late',
        data: [3, 5, 4, 5],
        borderColor: '#F59E0B',
        tension: 0.4
      },
      {
        label: 'Absent',
        data: [2, 3, 2, 2],
        borderColor: '#EF4444',
        tension: 0.4
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
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
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
    <div className={`neo-box p-6 chart-height-400 attendance-chart-container ${className || ''}`}>
      <h3 className="text-xl font-semibold text-gray-800 mb-4 dashboard-card-title">Attendance Trends</h3>
      <div className="relative chart-height-280 chart-wrapper">
        <Line data={data} options={options} />
      </div>
      <div className="attendance-metrics mt-4">
        <div className="attendance-metric">
          <div className="attendance-metric-value text-success">93.5%</div>
          <div className="attendance-metric-label">Avg. Present</div>
        </div>
        <div className="attendance-metric">
          <div className="attendance-metric-value text-warning">4.3%</div>
          <div className="attendance-metric-label">Avg. Late</div>
        </div>
        <div className="attendance-metric">
          <div className="attendance-metric-value text-danger">2.2%</div>
          <div className="attendance-metric-label">Avg. Absent</div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceChart; 