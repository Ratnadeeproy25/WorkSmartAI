import React, { useEffect, useRef } from 'react';
import Chart from './ChartConfig';

const AttendanceChart: React.FC = () => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
          label: 'Present',
          data: [95, 92, 94, 93],
          borderColor: '#10b981',
          tension: 0.4
        },
        {
          label: 'Late',
          data: [3, 5, 4, 5],
          borderColor: '#f59e0b',
          tension: 0.4
        },
        {
          label: 'Absent',
          data: [2, 3, 2, 2],
          borderColor: '#ef4444',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  return (
    <div className="neo-box p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Attendance Trends</h3>
      <div className="h-64">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default AttendanceChart; 