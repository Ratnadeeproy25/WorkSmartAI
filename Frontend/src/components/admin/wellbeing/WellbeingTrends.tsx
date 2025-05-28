import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { getWellbeingTrends } from '../../../services/adminWellbeingService';

interface TrendData {
  date: string;
  value: number;
}

interface WellbeingTrendsData {
  stressLevel: TrendData[];
  workLifeBalance: TrendData[];
  satisfaction: TrendData[];
  teamCollaboration: TrendData[];
}

const WellbeingTrends: React.FC = () => {
  const [trendsData, setTrendsData] = useState<WellbeingTrendsData>({
    stressLevel: [],
    workLifeBalance: [],
    satisfaction: [],
    teamCollaboration: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for charts
  const stressChartRef = useRef<HTMLCanvasElement>(null);
  const wlbChartRef = useRef<HTMLCanvasElement>(null);

  // Fetch wellbeing trends data
  const fetchTrendsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getWellbeingTrends('30');
      setTrendsData(response);
    } catch (error: any) {
      console.error('Error fetching wellbeing trends:', error);
      setError(error.message || 'Failed to fetch trends data');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchTrendsData();
  }, []);

  // Initialize charts
  useEffect(() => {
    if (stressChartRef.current && wlbChartRef.current && trendsData.stressLevel.length > 0) {
      // Destroy previous charts if they exist
      const stressChartInstance = Chart.getChart(stressChartRef.current);
      const wlbChartInstance = Chart.getChart(wlbChartRef.current);
      
      if (stressChartInstance) {
        stressChartInstance.destroy();
      }
      
      if (wlbChartInstance) {
        wlbChartInstance.destroy();
      }

      const labels = trendsData.stressLevel.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });

      // Stress Level Trend Chart
      new Chart(stressChartRef.current.getContext('2d')!, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Average Stress Level',
            data: trendsData.stressLevel.map(item => item.value),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
          }]
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
                padding: 20,
                font: {
                  size: 12,
                  weight: 500
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: '#ef4444',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: false,
              callbacks: {
                label: function(context) {
                  return `Stress Level: ${context.parsed.y}%`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: {
                  size: 11,
                  weight: 500
                },
                color: '#6b7280'
              }
            },
            y: {
              beginAtZero: true,
              max: 100,
              grid: {
                color: 'rgba(107, 114, 128, 0.1)'
              },
              ticks: {
                callback: function(value) {
                  return value + '%';
                },
                font: {
                  size: 11
                },
                color: '#6b7280'
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });

      // Work-Life Balance Trend Chart
      new Chart(wlbChartRef.current.getContext('2d')!, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Average Work-Life Balance',
            data: trendsData.workLifeBalance.map(item => item.value),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#10B981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
          }]
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
                padding: 20,
                font: {
                  size: 12,
                  weight: 500
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: '#10B981',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: false,
              callbacks: {
                label: function(context) {
                  return `Work-Life Balance: ${context.parsed.y}%`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: {
                  size: 11,
                  weight: 500
                },
                color: '#6b7280'
              }
            },
            y: {
              beginAtZero: true,
              max: 100,
              grid: {
                color: 'rgba(107, 114, 128, 0.1)'
              },
              ticks: {
                callback: function(value) {
                  return value + '%';
                },
                font: {
                  size: 11
                },
                color: '#6b7280'
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });
    }
  }, [trendsData]);

  if (error) {
    return (
      <div className="neo-box p-8 text-center">
        <div className="text-red-600 mb-4">
          <i className="bi bi-exclamation-triangle text-4xl"></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Error Loading Trends Data</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          className="neo-button p-3 text-blue-600"
          onClick={fetchTrendsData}
        >
          <i className="bi bi-arrow-clockwise mr-2"></i>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="neo-box p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-700">Stress Level Trend</h3>
          {loading && (
            <div className="flex items-center text-sm text-gray-500">
              <i className="bi bi-arrow-clockwise animate-spin mr-1"></i>
              Loading...
            </div>
          )}
        </div>
        <div className="h-64 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded">
              <div className="text-center">
                <i className="bi bi-arrow-clockwise animate-spin text-2xl text-gray-400 mb-2"></i>
                <p className="text-sm text-gray-500">Loading trend data...</p>
              </div>
            </div>
          ) : (
            <canvas ref={stressChartRef}></canvas>
          )}
        </div>
      </div>
      <div className="neo-box p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-700">Work-Life Balance Trend</h3>
          {loading && (
            <div className="flex items-center text-sm text-gray-500">
              <i className="bi bi-arrow-clockwise animate-spin mr-1"></i>
              Loading...
            </div>
          )}
        </div>
        <div className="h-64 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded">
              <div className="text-center">
                <i className="bi bi-arrow-clockwise animate-spin text-2xl text-gray-400 mb-2"></i>
                <p className="text-sm text-gray-500">Loading trend data...</p>
              </div>
            </div>
          ) : (
            <canvas ref={wlbChartRef}></canvas>
          )}
        </div>
      </div>
    </div>
  );
};

export default WellbeingTrends; 