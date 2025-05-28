import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface WellbeingAnalyticsProps {
  wlbHistory: number[];
  stressFactors: {
    deadlinePressure: string;
    workload: string;
    teamSupport: string;
    workEnvironment: string;
  };
}

const WellbeingAnalytics: React.FC<WellbeingAnalyticsProps> = ({ wlbHistory, stressFactors }) => {
  const wlbChartRef = useRef<HTMLCanvasElement>(null);
  const stressChartRef = useRef<HTMLCanvasElement>(null);
  const wlbChartInstance = useRef<Chart | null>(null);
  const stressChartInstance = useRef<Chart | null>(null);

  // Convert stress factors to chart data
  const getStressFactorValue = (factor: string): number => {
    switch (factor.toLowerCase()) {
      case 'low': return 80;
      case 'moderate': return 60;
      case 'high': return factor === 'teamSupport' || factor === 'workEnvironment' ? 90 : 40;
      case 'positive': return 85;
      case 'neutral': return 65;
      case 'negative': return 45;
      default: return 50;
    }
  };

  useEffect(() => {
    if (wlbChartRef.current && stressChartRef.current) {
      // Destroy existing charts if they exist
      if (wlbChartInstance.current) {
        wlbChartInstance.current.destroy();
      }
      if (stressChartInstance.current) {
        stressChartInstance.current.destroy();
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

      // Create Stress Factors Chart
      const stressCtx = stressChartRef.current.getContext('2d');
      if (stressCtx) {
        stressChartInstance.current = new Chart(stressCtx, {
          type: 'radar',
          data: {
            labels: ['Deadline Pressure', 'Workload', 'Team Support', 'Work Environment'],
            datasets: [{
              label: 'Current',
              data: [
                getStressFactorValue(stressFactors.deadlinePressure),
                getStressFactorValue(stressFactors.workload),
                getStressFactorValue(stressFactors.teamSupport),
                getStressFactorValue(stressFactors.workEnvironment)
              ],
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              pointBackgroundColor: '#10b981',
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
                    const value = context.raw;
                    return `Score: ${value}%`;
                  }
                }
              }
            },
            scales: {
              r: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  stepSize: 20,
                  callback: function(value) {
                    return value + '%';
                  }
                },
                pointLabels: {
                  font: {
                    size: 12
                  }
                },
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)'
                }
              }
            }
          }
        });
      }
    }
    
    // Clean up on unmount
    return () => {
      if (wlbChartInstance.current) {
        wlbChartInstance.current.destroy();
      }
      if (stressChartInstance.current) {
        stressChartInstance.current.destroy();
      }
    };
  }, [wlbHistory, stressFactors]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Work-Life Balance Chart */}
      <div className="p-6 bg-[#e0e5ec] rounded-xl shadow-[10px_10px_20px_#a3b1c6,_-10px_-10px_20px_#ffffff]">
        <h3 className="text-xl font-bold text-gray-700 mb-4">Work-Life Balance Trend</h3>
        <div className="h-64">
          <canvas ref={wlbChartRef} />
        </div>
      </div>

      {/* Stress Factors Chart */}
      <div className="p-6 bg-[#e0e5ec] rounded-xl shadow-[10px_10px_20px_#a3b1c6,_-10px_-10px_20px_#ffffff]">
        <h3 className="text-xl font-bold text-gray-700 mb-4">Stress Factors</h3>
        <div className="h-64">
          <canvas ref={stressChartRef} />
        </div>
      </div>
    </div>
  );
};

export default WellbeingAnalytics; 