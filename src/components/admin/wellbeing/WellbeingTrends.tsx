import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const WellbeingTrends: React.FC = () => {
  const stressChartRef = useRef<HTMLCanvasElement | null>(null);
  const wlbChartRef = useRef<HTMLCanvasElement | null>(null);
  const stressChartInstance = useRef<Chart | null>(null);
  const wlbChartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    initializeCharts();
    
    return () => {
      // Cleanup charts on unmount
      if (stressChartInstance.current) {
        stressChartInstance.current.destroy();
      }
      if (wlbChartInstance.current) {
        wlbChartInstance.current.destroy();
      }
    };
  }, []);

  const initializeCharts = () => {
    if (!stressChartRef.current || !wlbChartRef.current) return;

    // Stress Level Trend Chart
    const stressCtx = stressChartRef.current.getContext('2d');
    if (stressChartInstance.current) {
      stressChartInstance.current.destroy();
    }
    
    stressChartInstance.current = new Chart(stressCtx!, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [{
          label: 'Average Stress Level',
          data: [75, 72, 70, 68, 65],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { 
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    });

    // Work-Life Balance Trend Chart
    const wlbCtx = wlbChartRef.current.getContext('2d');
    if (wlbChartInstance.current) {
      wlbChartInstance.current.destroy();
    }
    
    wlbChartInstance.current = new Chart(wlbCtx!, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [{
          label: 'Average Work-Life Balance',
          data: [78, 80, 82, 85, 88],
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { 
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="neo-box p-4">
        <h3 className="text-base font-semibold text-gray-700 mb-3">Stress Level Trends</h3>
        <div className="h-60">
          <canvas ref={stressChartRef} id="stressTrendChart"></canvas>
        </div>
      </div>
      <div className="neo-box p-4">
        <h3 className="text-base font-semibold text-gray-700 mb-3">Work-Life Balance Trends</h3>
        <div className="h-60">
          <canvas ref={wlbChartRef} id="wlbTrendChart"></canvas>
        </div>
      </div>
    </div>
  );
};

export default WellbeingTrends; 