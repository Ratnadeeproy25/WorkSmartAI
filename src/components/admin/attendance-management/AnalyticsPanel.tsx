import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const AnalyticsPanel: React.FC = () => {
  const attendanceTrendChartRef = useRef<HTMLCanvasElement | null>(null);
  const departmentChartRef = useRef<HTMLCanvasElement | null>(null);
  const comparisonChartRef = useRef<HTMLCanvasElement | null>(null);
  const monthlyChartRef = useRef<HTMLCanvasElement | null>(null);
  const distributionChartRef = useRef<HTMLCanvasElement | null>(null);
  
  // Refs to store chart instances
  const attendanceTrendChartInstance = useRef<Chart | null>(null);
  const departmentChartInstance = useRef<Chart | null>(null);
  const comparisonChartInstance = useRef<Chart | null>(null);
  const monthlyChartInstance = useRef<Chart | null>(null);
  const distributionChartInstance = useRef<Chart | null>(null);

  // Function to destroy charts
  const destroyCharts = () => {
    if (attendanceTrendChartInstance.current) {
      attendanceTrendChartInstance.current.destroy();
      attendanceTrendChartInstance.current = null;
    }
    if (departmentChartInstance.current) {
      departmentChartInstance.current.destroy();
      departmentChartInstance.current = null;
    }
    if (comparisonChartInstance.current) {
      comparisonChartInstance.current.destroy();
      comparisonChartInstance.current = null;
    }
    if (monthlyChartInstance.current) {
      monthlyChartInstance.current.destroy();
      monthlyChartInstance.current = null;
    }
    if (distributionChartInstance.current) {
      distributionChartInstance.current.destroy();
      distributionChartInstance.current = null;
    }
  };

  // Create charts when component mounts
  useEffect(() => {
    // First, destroy any existing charts
    destroyCharts();
    
    // Attendance Trends Chart
    if (attendanceTrendChartRef.current) {
      const trendCtx = attendanceTrendChartRef.current.getContext('2d');
      if (trendCtx) {
        attendanceTrendChartInstance.current = new Chart(trendCtx, {
          type: 'line',
          data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            datasets: [{
              label: 'Present',
              data: [12, 11, 13, 12, 10],
              borderColor: '#10B981',
              tension: 0.4
            }, {
              label: 'Late',
              data: [2, 3, 1, 2, 4],
              borderColor: '#F59E0B',
              tension: 0.4
            }, {
              label: 'Absent',
              data: [1, 1, 1, 1, 1],
              borderColor: '#EF4444',
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  display: false
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

    // Department-wise Chart
    if (departmentChartRef.current) {
      const deptCtx = departmentChartRef.current.getContext('2d');
      if (deptCtx) {
        departmentChartInstance.current = new Chart(deptCtx, {
          type: 'bar',
          data: {
            labels: ['Development', 'Design', 'Marketing', 'HR'],
            datasets: [{
              label: 'Attendance Rate',
              data: [95, 88, 92, 85],
              backgroundColor: '#2563eb',
              borderRadius: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                grid: {
                  display: false
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

    // Comparison Chart
    if (comparisonChartRef.current) {
      const comparisonCtx = comparisonChartRef.current.getContext('2d');
      if (comparisonCtx) {
        comparisonChartInstance.current = new Chart(comparisonCtx, {
          type: 'bar',
          data: {
            labels: ['Present', 'Absent', 'Late', 'On Leave'],
            datasets: [{
              label: 'Employees',
              data: [85, 5, 7, 3],
              backgroundColor: '#3b82f6'
            }, {
              label: 'Managers',
              data: [90, 3, 5, 2],
              backgroundColor: '#10b981'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
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
      }
    }

    // Monthly Chart
    if (monthlyChartRef.current) {
      const monthlyCtx = monthlyChartRef.current.getContext('2d');
      if (monthlyCtx) {
        monthlyChartInstance.current = new Chart(monthlyCtx, {
          type: 'line',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
              label: 'Attendance Rate',
              data: [92, 88, 90, 95, 89, 93],
              borderColor: '#3b82f6',
              tension: 0.4,
              fill: true,
              backgroundColor: 'rgba(59, 130, 246, 0.1)'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
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
      }
    }

    // Distribution Chart
    if (distributionChartRef.current) {
      const distributionCtx = distributionChartRef.current.getContext('2d');
      if (distributionCtx) {
        distributionChartInstance.current = new Chart(distributionCtx, {
          type: 'doughnut',
          data: {
            labels: ['Present', 'Absent', 'Late', 'On Leave'],
            datasets: [{
              data: [85, 5, 7, 3],
              backgroundColor: [
                '#10b981',
                '#ef4444',
                '#f59e0b',
                '#3b82f6'
              ]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      }
    }
    
    // Cleanup function to destroy charts when component unmounts
    return () => {
      destroyCharts();
    };
  }, []);

  return (
    <>
      <div className="neo-box p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Attendance Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
          {/* Attendance Trends */}
          <div className="neo-box p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Attendance Trends</h3>
            <div className="chart-container">
              <canvas ref={attendanceTrendChartRef} id="attendanceTrendChart"></canvas>
            </div>
          </div>
          {/* Department-wise Attendance */}
          <div className="neo-box p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Department-wise Attendance</h3>
            <div className="chart-container">
              <canvas ref={departmentChartRef} id="departmentChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 mb-6">
        {/* Employee vs Manager Attendance */}
        <div className="neo-box p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Employee vs Manager Attendance</h3>
          <div className="chart-container">
            <canvas ref={comparisonChartRef} id="comparisonChart"></canvas>
          </div>
        </div>
        {/* Monthly Attendance Summary */}
        <div className="neo-box p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Monthly Attendance Summary</h3>
          <div className="chart-container">
            <canvas ref={monthlyChartRef} id="monthlyChart"></canvas>
          </div>
        </div>
        {/* Attendance Distribution */}
        <div className="neo-box p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Attendance Distribution</h3>
          <div className="chart-container">
            <canvas ref={distributionChartRef} id="distributionChart"></canvas>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="neo-box p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Export Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="action-button">
            <i className="bi bi-file-earmark-excel"></i>
            <span>Export to Excel</span>
          </button>
          <button className="action-button">
            <i className="bi bi-file-earmark-pdf"></i>
            <span>Export to PDF</span>
          </button>
          <button className="action-button">
            <i className="bi bi-file-earmark-text"></i>
            <span>Export to CSV</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default AnalyticsPanel; 