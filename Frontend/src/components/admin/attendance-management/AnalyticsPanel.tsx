import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import {
  getAttendanceTrends,
  getDepartmentAttendanceStats,
  getMonthlyAttendanceStats,
  getAttendanceDistribution,
  AttendanceTrendsData,
  DepartmentAttendanceStats,
  MonthlyAttendanceStats,
  AttendanceDistribution
} from '../../../services/attendanceService';
import { getAllDepartments } from '../../../services/managerService';

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

  // State for analytics data
  const [trendsData, setTrendsData] = useState<AttendanceTrendsData | null>(null);
  const [departmentData, setDepartmentData] = useState<DepartmentAttendanceStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyAttendanceStats | null>(null);
  const [distributionData, setDistributionData] = useState<AttendanceDistribution | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);

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

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all analytics data in parallel
        const [trends, deptStats, monthly, distribution] = await Promise.allSettled([
          getAttendanceTrends({ period: 'week' }),
          getDepartmentAttendanceStats(),
          getMonthlyAttendanceStats(),
          getAttendanceDistribution()
        ]);

        // Handle trends data
        if (trends.status === 'fulfilled') {
          setTrendsData(trends.value);
        } else {
          console.error('Failed to fetch trends data:', trends.reason);
        }

        // Handle department data
        if (deptStats.status === 'fulfilled') {
          setDepartmentData(deptStats.value);
        } else {
          console.error('Failed to fetch department data:', deptStats.reason);
        }

        // Handle monthly data
        if (monthly.status === 'fulfilled') {
          setMonthlyData(monthly.value);
        } else {
          console.error('Failed to fetch monthly data:', monthly.reason);
        }

        // Handle distribution data
        if (distribution.status === 'fulfilled') {
          setDistributionData(distribution.value);
        } else {
          console.error('Failed to fetch distribution data:', distribution.reason);
        }

        // Check if any requests failed
        const failedRequests = [trends, deptStats, monthly, distribution].filter(
          result => result.status === 'rejected'
        );
        
        if (failedRequests.length > 0) {
          setError(`Failed to load ${failedRequests.length} analytics components. Some charts may not display correctly.`);
        }

      } catch (err: any) {
        setError(err.message || 'Failed to fetch analytics data');
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const deptList = await getAllDepartments();
        setDepartments(deptList);
      } catch (err) {
        console.error('Failed to fetch departments:', err);
        setDepartments([]);
      }
    };
    fetchDepartments();
  }, []);

  // Create charts when data is available
  useEffect(() => {
    if (loading || error) return;
    
    // First, destroy any existing charts
    destroyCharts();
    
    // Attendance Trends Chart
    if (attendanceTrendChartRef.current && trendsData) {
      const trendCtx = attendanceTrendChartRef.current.getContext('2d');
      if (trendCtx) {
        attendanceTrendChartInstance.current = new Chart(trendCtx, {
          type: 'line',
          data: trendsData,
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
    if (departmentChartRef.current && departmentData) {
      const deptCtx = departmentChartRef.current.getContext('2d');
      if (deptCtx) {
        const chartData = {
          labels: departmentData.departments.map(dept => dept.department),
          datasets: [{
            label: 'Attendance Rate (%)',
            data: departmentData.departments.map(dept => Math.round(dept.attendanceRate)),
            backgroundColor: '#2563eb',
            borderRadius: 8
          }]
        };

        departmentChartInstance.current = new Chart(deptCtx, {
          type: 'bar',
          data: chartData,
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
                },
                ticks: {
                  callback: function(value: any) {
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

    // Employee vs Manager Comparison Chart (using distribution data)
    if (comparisonChartRef.current && distributionData) {
      const comparisonCtx = comparisonChartRef.current.getContext('2d');
      if (comparisonCtx) {
        // For now, we'll show overall distribution. In future, we can add role-specific endpoints
        const chartData = {
          labels: ['Present', 'Absent', 'Late', 'On Leave'],
          datasets: [{
            label: 'All Staff',
            data: [
              distributionData.distribution.present,
              distributionData.distribution.absent,
              distributionData.distribution.late,
              distributionData.distribution.leave
            ],
            backgroundColor: '#3b82f6'
          }]
        };

        comparisonChartInstance.current = new Chart(comparisonCtx, {
          type: 'bar',
          data: chartData,
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
                beginAtZero: true
              }
            }
          }
        });
      }
    }

    // Monthly Chart
    if (monthlyChartRef.current && monthlyData) {
      const monthlyCtx = monthlyChartRef.current.getContext('2d');
      if (monthlyCtx) {
        monthlyChartInstance.current = new Chart(monthlyCtx, {
          type: 'line',
          data: monthlyData.chartData,
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
                max: 100,
                ticks: {
                  callback: function(value: any) {
                    return value + '%';
                  }
                }
              }
            }
          }
        });
      }
    }

    // Distribution Chart
    if (distributionChartRef.current && distributionData) {
      const distributionCtx = distributionChartRef.current.getContext('2d');
      if (distributionCtx) {
        distributionChartInstance.current = new Chart(distributionCtx, {
          type: 'doughnut',
          data: distributionData.chartData,
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
  }, [trendsData, departmentData, monthlyData, distributionData, loading, error]);

  const handleExportData = async (format: 'excel' | 'pdf' | 'csv') => {
    try {
      // TODO: Implement export functionality
      console.log(`Exporting data as ${format}`);
      alert(`Export as ${format.toUpperCase()} functionality will be implemented soon.`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="neo-box p-6 mb-6">
        <div className="text-red-600 text-center">
          <h3 className="text-lg font-semibold mb-2">Analytics Error</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="neo-box p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Attendance Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
          {/* Attendance Trends */}
          <div className="neo-box p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Attendance Trends (Last 7 Days)</h3>
            <div className="chart-container" style={{ height: '300px' }}>
              <canvas ref={attendanceTrendChartRef} id="attendanceTrendChart"></canvas>
            </div>
          </div>
          
          {/* Department-wise Attendance */}
          <div className="neo-box p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Department-wise Attendance Rate</h3>
            <div className="chart-container" style={{ height: '300px' }}>
              <canvas ref={departmentChartRef} id="departmentChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 mb-6">
        {/* Overall Attendance Distribution */}
        <div className="neo-box p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Overall Attendance Distribution</h3>
          <div className="chart-container" style={{ height: '250px' }}>
            <canvas ref={comparisonChartRef} id="comparisonChart"></canvas>
          </div>
          {distributionData && (
            <div className="mt-4 text-sm text-gray-600">
              <p>Total Records: {distributionData.total}</p>
            </div>
          )}
        </div>
        
        {/* Monthly Attendance Summary */}
        <div className="neo-box p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Monthly Attendance Summary</h3>
          <div className="chart-container" style={{ height: '250px' }}>
            <canvas ref={monthlyChartRef} id="monthlyChart"></canvas>
          </div>
          {monthlyData && (
            <div className="mt-4 text-sm text-gray-600">
              <p>Year: {monthlyData.year}</p>
            </div>
          )}
        </div>
        
        {/* Attendance Distribution */}
        <div className="neo-box p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Status Distribution</h3>
          <div className="chart-container" style={{ height: '250px' }}>
            <canvas ref={distributionChartRef} id="distributionChart"></canvas>
          </div>
          {distributionData && (
            <div className="mt-4 text-xs text-gray-600 grid grid-cols-2 gap-1">
              <div>Present: {distributionData.percentages.present}%</div>
              <div>Late: {distributionData.percentages.late}%</div>
              <div>Absent: {distributionData.percentages.absent}%</div>
              <div>Leave: {distributionData.percentages.leave}%</div>
            </div>
          )}
        </div>
      </div>

      {/* Export Options */}
      <div className="neo-box p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Export Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            className="action-button"
            onClick={() => handleExportData('excel')}
          >
            <i className="bi bi-file-earmark-excel"></i>
            <span>Export to Excel</span>
          </button>
          <button 
            className="action-button"
            onClick={() => handleExportData('pdf')}
          >
            <i className="bi bi-file-earmark-pdf"></i>
            <span>Export to PDF</span>
          </button>
          <button 
            className="action-button"
            onClick={() => handleExportData('csv')}
          >
            <i className="bi bi-file-earmark-text"></i>
            <span>Export to CSV</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default AnalyticsPanel; 