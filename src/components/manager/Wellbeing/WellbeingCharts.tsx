import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { useWellbeingContext } from '../../../context/WellbeingContext';

// Register all Chart.js components
Chart.register(...registerables);

const WellbeingCharts: React.FC = () => {
  const { managerWellbeing } = useWellbeingContext();
  const wlbChartRef = useRef<HTMLCanvasElement>(null);
  const teamChartRef = useRef<HTMLCanvasElement>(null);
  const wlbChartInstance = useRef<Chart | null>(null);
  const teamChartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (wlbChartRef.current && teamChartRef.current) {
      // Destroy existing charts to prevent memory leaks
      if (wlbChartInstance.current) {
        wlbChartInstance.current.destroy();
      }
      
      if (teamChartInstance.current) {
        teamChartInstance.current.destroy();
      }

      // Create Work-Life Balance History Chart
      const wlbCtx = wlbChartRef.current.getContext('2d');
      if (wlbCtx) {
        wlbChartInstance.current = new Chart(wlbCtx, {
          type: 'line',
          data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            datasets: [{
              label: 'Work-Life Balance',
              data: managerWellbeing.workLifeBalance.history,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true,
              pointBackgroundColor: '#3b82f6',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                backgroundColor: '#ffffff',
                titleColor: '#1f2937',
                bodyColor: '#4b5563',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                  label: function(context) {
                    return `Score: ${context.raw}%`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                  callback: function(value) {
                    return value + '%';
                  }
                }
              },
              x: {
                grid: {
                  display: false
                }
              }
            }
          }
        });
      }

      // Create Team Wellbeing Chart
      const teamCtx = teamChartRef.current.getContext('2d');
      if (teamCtx) {
        teamChartInstance.current = new Chart(teamCtx, {
          type: 'bar',
          data: {
            labels: ['Work-Life Balance', 'Stress Level', 'Satisfaction', 'Collaboration'],
            datasets: [{
              label: 'Team Wellbeing',
              data: [
                managerWellbeing.teamWellbeing.workLifeBalance.score,
                managerWellbeing.teamWellbeing.stressLevel.score,
                managerWellbeing.teamWellbeing.satisfaction.score,
                managerWellbeing.teamWellbeing.collaboration.score
              ],
              backgroundColor: [
                'rgba(59, 130, 246, 0.7)',
                'rgba(16, 185, 129, 0.7)',
                'rgba(139, 92, 246, 0.7)',
                'rgba(245, 158, 11, 0.7)'
              ],
              borderColor: [
                'rgba(59, 130, 246, 1)',
                'rgba(16, 185, 129, 1)',
                'rgba(139, 92, 246, 1)',
                'rgba(245, 158, 11, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                backgroundColor: '#ffffff',
                titleColor: '#1f2937',
                bodyColor: '#4b5563',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                  label: function(context) {
                    return `Score: ${context.raw}%`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                  callback: function(value) {
                    return value + '%';
                  }
                }
              },
              x: {
                grid: {
                  display: false
                }
              }
            }
          }
        });
      }
    }
    
    // Cleanup function
    return () => {
      if (wlbChartInstance.current) {
        wlbChartInstance.current.destroy();
      }
      
      if (teamChartInstance.current) {
        teamChartInstance.current.destroy();
      }
    };
  }, [managerWellbeing]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Work-Life Balance Chart */}
      <div className="neo-box p-6">
        <h3 className="text-xl font-bold text-gray-700 mb-4">Manager Work-Life Balance Trend</h3>
        <div className="h-64">
          <canvas ref={wlbChartRef} id="wlbHistoryChart"></canvas>
        </div>
      </div>

      {/* Team Wellbeing Chart */}
      <div className="neo-box p-6">
        <h3 className="text-xl font-bold text-gray-700 mb-4">Team Wellbeing Overview</h3>
        <div className="h-64">
          <canvas ref={teamChartRef} id="teamWellbeingChart"></canvas>
        </div>
      </div>
    </div>
  );
};

export default WellbeingCharts; 