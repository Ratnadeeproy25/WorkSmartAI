import React from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface ProductivityChartProps {
  className?: string;
}

const ProductivityChart: React.FC<ProductivityChartProps> = ({ className }) => {
  const data = {
    labels: [
      'Task Completion',
      'Code Quality',
      'Collaboration',
      'Innovation',
      'Communication',
      'Time Management'
    ],
    datasets: [
      {
        label: 'Current Score',
        data: [85, 88, 92, 78, 90, 85],
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: '#3b82f6',
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#3b82f6'
      },
      {
        label: 'Target Score',
        data: [90, 90, 90, 90, 90, 90],
        fill: true,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: '#10b981',
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#10b981'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: {
        borderWidth: 3
      }
    },
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
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 20
        }
      }
    }
  };

  return (
    <div className={`neo-box p-6 chart-height-400 productivity-chart-container ${className || ''}`}>
      <h3 className="text-xl font-semibold text-gray-800 mb-4 dashboard-card-title">Team Productivity Score</h3>
      <div className="relative chart-height-280 chart-wrapper">
        <Radar data={data} options={options} />
      </div>
      <div className="productivity-metrics mt-4">
        <div className="productivity-metric">
          <div className="productivity-score text-primary">86.3</div>
          <div className="productivity-label">Avg. Score</div>
        </div>
        <div className="productivity-metric">
          <div className="productivity-score text-success">92</div>
          <div className="productivity-label">Highest: Collaboration</div>
        </div>
        <div className="productivity-metric">
          <div className="productivity-score text-warning">78</div>
          <div className="productivity-label">Lowest: Innovation</div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityChart; 