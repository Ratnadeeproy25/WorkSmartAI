import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { useWellbeingContext } from '../../../context/WellbeingContext';

// Register all Chart.js components
Chart.register(...registerables);

const WellbeingCharts: React.FC = () => {
  const { managerWellbeing, loading, error, refreshWellbeingData } = useWellbeingContext();
  const wlbChartRef = useRef<HTMLCanvasElement>(null);
  const teamChartRef = useRef<HTMLCanvasElement>(null);
  const trendsChartRef = useRef<HTMLCanvasElement>(null);
  const wlbChartInstance = useRef<Chart | null>(null);
  const teamChartInstance = useRef<Chart | null>(null);
  const trendsChartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (loading || error || !managerWellbeing) return;
    
    if (wlbChartRef.current && teamChartRef.current && trendsChartRef.current) {
      // Destroy existing charts to prevent memory leaks
      if (wlbChartInstance.current) {
        wlbChartInstance.current.destroy();
        wlbChartInstance.current = null;
      }
      
      if (teamChartInstance.current) {
        teamChartInstance.current.destroy();
        teamChartInstance.current = null;
      }

      if (trendsChartInstance.current) {
        trendsChartInstance.current.destroy();
        trendsChartInstance.current = null;
      }

      // Create Work-Life Balance History Chart
      const wlbCtx = wlbChartRef.current.getContext('2d');
      if (wlbCtx) {
        // Ensure we have valid history data
        const wlbHistory = managerWellbeing.workLifeBalance?.history || [75, 76, 77, 78, 79];
        const labels = wlbHistory.length === 5 ? 
          ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] : 
          wlbHistory.map((_, index) => `Day ${index + 1}`);
        
        wlbChartInstance.current = new Chart(wlbCtx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Work-Life Balance',
              data: wlbHistory,
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
        // Ensure we have valid team wellbeing data
        const teamWellbeing = managerWellbeing.teamWellbeing || {
          workLifeBalance: { score: 75 },
          stressLevel: { score: 70 },
          satisfaction: { score: 75 },
          collaboration: { score: 80 }
        };
        
        teamChartInstance.current = new Chart(teamCtx, {
          type: 'bar',
          data: {
            labels: ['Work-Life Balance', 'Stress Level', 'Satisfaction', 'Collaboration'],
            datasets: [{
              label: 'Team Wellbeing',
              data: [
                teamWellbeing.workLifeBalance?.score || 75,
                teamWellbeing.stressLevel?.score || 70,
                teamWellbeing.satisfaction?.score || 75,
                teamWellbeing.collaboration?.score || 80
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

      // Create Manager Wellbeing Trends Chart
      const trendsCtx = trendsChartRef.current.getContext('2d');
      if (trendsCtx) {
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        
        trendsChartInstance.current = new Chart(trendsCtx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Work-Life Balance',
                data: managerWellbeing.workLifeBalance?.history || [75, 76, 77, 78, 79],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5
              },
              {
                label: 'Stress Level',
                data: managerWellbeing.stressLevel?.history || [80, 81, 82, 83, 84],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5
              },
              {
                label: 'Job Satisfaction',
                data: managerWellbeing.jobSatisfaction?.history || [85, 86, 87, 88, 89],
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5
              },
              {
                label: 'Team Collaboration',
                data: managerWellbeing.teamCollaboration?.history || [82, 83, 84, 85, 86],
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  usePointStyle: true,
                  padding: 20
                }
              },
              tooltip: {
                backgroundColor: '#ffffff',
                titleColor: '#1f2937',
                bodyColor: '#4b5563',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: 12,
                callbacks: {
                  label: function(context) {
                    return `${context.dataset.label}: ${context.raw}%`;
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
        wlbChartInstance.current = null;
      }
      
      if (teamChartInstance.current) {
        teamChartInstance.current.destroy();
        teamChartInstance.current = null;
      }

      if (trendsChartInstance.current) {
        trendsChartInstance.current.destroy();
        trendsChartInstance.current = null;
      }
    };
  }, [managerWellbeing, loading, error]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Loading state for charts */}
        <div className="neo-box p-6">
          <h3 className="text-xl font-bold text-gray-700 mb-4">Manager Work-Life Balance Trend</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>

        <div className="neo-box p-6">
          <h3 className="text-xl font-bold text-gray-700 mb-4">Team Wellbeing Overview</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>

        <div className="neo-box p-6 lg:col-span-2">
          <h3 className="text-xl font-bold text-gray-700 mb-4">Wellbeing Trends</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Error state for charts */}
        <div className="neo-box p-6">
          <h3 className="text-xl font-bold text-gray-700 mb-4">Manager Work-Life Balance Trend</h3>
          <div className="h-64 flex items-center justify-center flex-col">
            <div className="text-red-500 text-xl mb-2">
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <p className="text-red-700 mb-4">{error}</p>
            <button 
              className="neo-button px-4 py-2"
              onClick={refreshWellbeingData}
            >
              Retry
            </button>
          </div>
        </div>

        <div className="neo-box p-6">
          <h3 className="text-xl font-bold text-gray-700 mb-4">Team Wellbeing Overview</h3>
          <div className="h-64 flex items-center justify-center flex-col">
            <div className="text-red-500 text-xl mb-2">
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <p className="text-red-700 mb-4">{error}</p>
            <button 
              className="neo-button px-4 py-2"
              onClick={refreshWellbeingData}
            >
              Retry
            </button>
          </div>
        </div>

        <div className="neo-box p-6 lg:col-span-2">
          <h3 className="text-xl font-bold text-gray-700 mb-4">Wellbeing Trends</h3>
          <div className="h-64 flex items-center justify-center flex-col">
            <div className="text-red-500 text-xl mb-2">
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <p className="text-red-700 mb-4">{error}</p>
            <button 
              className="neo-button px-4 py-2"
              onClick={refreshWellbeingData}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Work-Life Balance Chart */}
      <div className="neo-box p-6">
        <h3 className="text-xl font-bold text-gray-700 mb-4">Manager Work-Life Balance Trend</h3>
        <div className="h-64">
          <canvas ref={wlbChartRef} id="wlbHistoryChart"></canvas>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Current Score:</strong> {managerWellbeing.workLifeBalance.score}%</p>
          <p><strong>Factors:</strong> {managerWellbeing.workLifeBalance.factors.workHours}h work, {managerWellbeing.workLifeBalance.factors.breaksCount} breaks, {managerWellbeing.workLifeBalance.factors.focusTime}h focus time</p>
        </div>
      </div>

      {/* Team Wellbeing Chart */}
      <div className="neo-box p-6">
        <h3 className="text-xl font-bold text-gray-700 mb-4">Team Wellbeing Overview</h3>
        <div className="h-64">
          <canvas ref={teamChartRef} id="teamWellbeingChart"></canvas>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>Average team wellbeing scores across all metrics</p>
        </div>
      </div>

      {/* Wellbeing Trends Chart */}
      <div className="neo-box p-6 lg:col-span-2">
        <h3 className="text-xl font-bold text-gray-700 mb-4">Manager Wellbeing Trends</h3>
        <div className="h-64">
          <canvas ref={trendsChartRef} id="wellbeingTrendsChart"></canvas>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
          <div>
            <strong>Work-Life Balance:</strong> {managerWellbeing.workLifeBalance.score}%
          </div>
          <div>
            <strong>Stress Level:</strong> {managerWellbeing.stressLevel.score}%
          </div>
          <div>
            <strong>Job Satisfaction:</strong> {managerWellbeing.jobSatisfaction.score}%
          </div>
          <div>
            <strong>Team Collaboration:</strong> {managerWellbeing.teamCollaboration.score}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default WellbeingCharts; 