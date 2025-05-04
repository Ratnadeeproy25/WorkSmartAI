import React, { useState, useEffect, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
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

interface TaskDistributionChartProps {
  className?: string;
}

type TaskChartData = ChartData<'bar', number[], string>;

const TaskDistributionChart: React.FC<TaskDistributionChartProps> = ({ className }) => {
  const [loading, setLoading] = useState(false);
  const chartRef = useRef<ChartJS<'bar', number[], string>>(null);
  
  // Create gradient fills for the bars
  const createGradients = () => {
    const ctx = chartRef.current?.canvas.getContext('2d');
    
    if (!ctx) return {
      completedGradient: 'rgba(16, 185, 129, 0.9)',
      inProgressGradient: 'rgba(59, 130, 246, 0.9)',
      pendingGradient: 'rgba(245, 158, 11, 0.9)'
    };
    
    // Create gradients
    const height = chartRef.current?.height || 300;
    
    const completedGradient = ctx.createLinearGradient(0, 0, 0, height);
    completedGradient.addColorStop(0, 'rgba(16, 185, 129, 0.9)');
    completedGradient.addColorStop(1, 'rgba(16, 185, 129, 0.5)');
    
    const inProgressGradient = ctx.createLinearGradient(0, 0, 0, height);
    inProgressGradient.addColorStop(0, 'rgba(59, 130, 246, 0.9)');
    inProgressGradient.addColorStop(1, 'rgba(59, 130, 246, 0.5)');
    
    const pendingGradient = ctx.createLinearGradient(0, 0, 0, height);
    pendingGradient.addColorStop(0, 'rgba(245, 158, 11, 0.9)');
    pendingGradient.addColorStop(1, 'rgba(245, 158, 11, 0.5)');
    
    return {
      completedGradient,
      inProgressGradient,
      pendingGradient
    };
  };
  
  // Initial chart data
  const [chartData, setChartData] = useState<TaskChartData>({
    labels: ['Development', 'Design', 'Marketing', 'HR', 'Sales'],
    datasets: [
      {
        label: 'Completed',
        data: [45, 38, 32, 28, 35],
        backgroundColor: 'rgba(16, 185, 129, 0.9)',
        borderRadius: 0,
        barPercentage: 0.9,
        categoryPercentage: 0.9
      },
      {
        label: 'In Progress',
        data: [30, 25, 20, 15, 22],
        backgroundColor: 'rgba(59, 130, 246, 0.9)',
        borderRadius: 0,
        barPercentage: 0.9,
        categoryPercentage: 0.9
      },
      {
        label: 'Pending',
        data: [15, 12, 18, 10, 13],
        backgroundColor: 'rgba(245, 158, 11, 0.9)',
        borderRadius: 0,
        barPercentage: 0.9,
        categoryPercentage: 0.9
      }
    ]
  });

  // Update gradients after chart renders
  useEffect(() => {
    if (chartRef.current) {
      const { completedGradient, inProgressGradient, pendingGradient } = createGradients();
      
      setChartData({
        ...chartData,
        datasets: [
          {
            ...chartData.datasets[0],
            backgroundColor: completedGradient
          },
          {
            ...chartData.datasets[1],
            backgroundColor: inProgressGradient
          },
          {
            ...chartData.datasets[2],
            backgroundColor: pendingGradient
          }
        ]
      });
    }
  }, [chartRef.current]);

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide default legend, we'll use our custom one
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
        },
        border: {
          display: false
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11
          }
        }
      },
      y: {
        min: 0, // Ensure y-axis starts at 0
        max: 100, // Set maximum value
        stacked: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.06)',
          display: true
        },
        border: {
          display: false
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11
          },
          padding: 10,
          stepSize: 10 // Set y-axis tick interval to 10
        }
      }
    },
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 0,
        bottom: 10
      }
    }
  };

  return (
    <div className={`neo-box p-6 chart-height-400 task-distribution-container ${className || ''}`}>
      <h3 className="text-xl font-semibold text-gray-800 mb-2 dashboard-card-title">Department Task Distribution</h3>
      
      {/* Custom Legend - Horizontal Row at the Top */}
      <div className="flex justify-center gap-5 mb-6 mt-3">
        <div className="flex items-center gap-2 legend-item">
          <div className="w-3 h-3 rounded-full bg-emerald-500 legend-color completed"></div>
          <span className="text-sm text-gray-700">Completed</span>
        </div>
        <div className="flex items-center gap-2 legend-item">
          <div className="w-3 h-3 rounded-full bg-blue-500 legend-color in-progress"></div>
          <span className="text-sm text-gray-700">In Progress</span>
        </div>
        <div className="flex items-center gap-2 legend-item">
          <div className="w-3 h-3 rounded-full bg-amber-500 legend-color pending"></div>
          <span className="text-sm text-gray-700">Pending</span>
        </div>
      </div>
      
      <div className="relative chart-height-280 chart-wrapper bg-[#f8f9fa] bg-opacity-30 rounded-lg">
        {loading && (
          <div className="chart-loading">
            <div className="neo-box py-2 px-4">Loading data...</div>
          </div>
        )}
        <Bar 
          ref={chartRef} 
          data={chartData} 
          options={options} 
        />
      </div>
    </div>
  );
};

export default TaskDistributionChart; 