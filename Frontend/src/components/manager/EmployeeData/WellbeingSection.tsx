import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { managerEmployeeDataApi, WellbeingData, WellbeingStats, WellbeingTrends } from '../../../services/managerEmployeeDataApi';

const WellbeingSection: React.FC = () => {
  // State for wellbeing data
  const [wellbeingData, setWellbeingData] = useState<WellbeingData[]>([]);
  const [wellbeingStats, setWellbeingStats] = useState<WellbeingStats>({
    totalEmployees: 0,
    goodStatus: 0,
    warningStatus: 0,
    criticalStatus: 0
  });
  const [wellbeingTrends, setWellbeingTrends] = useState<WellbeingTrends>({
    stressTrend: [],
    workLifeBalanceTrend: [],
    satisfactionTrend: [],
    collaborationTrend: [],
    labels: []
  });
  const [loading, setLoading] = useState(false);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<WellbeingData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Refs for charts
  const stressChartRef = useRef<HTMLCanvasElement>(null);
  const wlbChartRef = useRef<HTMLCanvasElement>(null);

  // Fetch wellbeing data
  const fetchWellbeingData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching wellbeing data...');
      const response = await managerEmployeeDataApi.getTeamWellbeingData();
      console.log('Wellbeing response:', response);
      setWellbeingData(response.data);
      setWellbeingStats(response.stats);
      
      if (response.data.length === 0) {
        console.log('No wellbeing data found - this could mean no employees are assigned to this manager');
      }
    } catch (error: any) {
      console.error('Error fetching wellbeing data:', error);
      setError(error.message || 'Failed to fetch wellbeing data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch wellbeing trends data
  const fetchWellbeingTrends = async () => {
    setTrendsLoading(true);
    try {
      console.log('Fetching wellbeing trends...');
      const response = await managerEmployeeDataApi.getTeamWellbeingTrends();
      console.log('Wellbeing trends response:', response);
      setWellbeingTrends(response.data);
    } catch (error: any) {
      console.error('Error fetching wellbeing trends:', error);
      // Don't set error state for trends, just log it
    } finally {
      setTrendsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchWellbeingData();
    fetchWellbeingTrends();
  }, []);

  // Helper function to determine status based on stress level
  const getStatusClass = (score: number): string => {
    if (score < 60) return 'status-good';
    if (score < 80) return 'status-warning';
    return 'status-critical';
  };
  
  // Helper function to get status text based on stress level
  const getStatusText = (score: number): string => {
    if (score < 60) return 'Good';
    if (score < 80) return 'Warning';
    return 'Critical';
  };

  // Handle viewing detailed employee wellbeing data
  const handleViewDetails = (employee: WellbeingData) => {
    setSelectedEmployee(employee);
    setShowDetailModal(true);
  };

  // Close detail modal
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedEmployee(null);
  };
  
  // Initialize charts
  useEffect(() => {
    if (stressChartRef.current && wlbChartRef.current && wellbeingTrends.labels.length > 0) {
      // Destroy previous charts if they exist
      const stressChartInstance = Chart.getChart(stressChartRef.current);
      const wlbChartInstance = Chart.getChart(wlbChartRef.current);
      
      if (stressChartInstance) {
        stressChartInstance.destroy();
      }
      
      if (wlbChartInstance) {
        wlbChartInstance.destroy();
      }

      // Stress Level Trend Chart
      new Chart(stressChartRef.current.getContext('2d')!, {
        type: 'line',
        data: {
          labels: wellbeingTrends.labels,
          datasets: [{
            label: 'Average Stress Level',
            data: wellbeingTrends.stressTrend,
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
          labels: wellbeingTrends.labels,
          datasets: [{
            label: 'Average Work-Life Balance',
            data: wellbeingTrends.workLifeBalanceTrend,
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
  }, [wellbeingTrends]);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="neo-box p-4 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="h-5 bg-gray-300 rounded w-24 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-20 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-6 bg-gray-300 rounded w-16"></div>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-3 bg-gray-200 rounded w-16"></div>
          <div className="h-2 bg-gray-300 rounded w-20"></div>
        </div>
        <div className="flex justify-between items-center">
          <div className="h-3 bg-gray-200 rounded w-20"></div>
          <div className="h-2 bg-gray-300 rounded w-20"></div>
        </div>
        <div className="flex justify-between items-center">
          <div className="h-3 bg-gray-200 rounded w-18"></div>
          <div className="h-2 bg-gray-300 rounded w-20"></div>
        </div>
      </div>
    </div>
  );

  if (error && !loading) {
    return (
      <div className="neo-box p-8 text-center">
        <div className="text-red-600 mb-4">
          <i className="bi bi-exclamation-triangle text-4xl"></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Error Loading Wellbeing Data</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          className="neo-button p-3 text-blue-600"
          onClick={fetchWellbeingData}
        >
          <i className="bi bi-arrow-clockwise mr-2"></i>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Team Overview */}
      <div className="neo-box p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">Team Overview</h2>
          <button 
            className="neo-button p-3 text-blue-600 hover:text-blue-800 transition-colors"
            onClick={() => {
              fetchWellbeingData();
              fetchWellbeingTrends();
            }}
            disabled={loading || trendsLoading}
          >
            <i className={`bi ${(loading || trendsLoading) ? 'bi-arrow-clockwise animate-spin' : 'bi-arrow-clockwise'} mr-2`}></i>
            {(loading || trendsLoading) ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="neo-box p-4 text-center">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-600">{wellbeingStats.totalEmployees}</div>
            <div className="text-sm text-gray-600">Total Employees</div>
              </>
            )}
          </div>
          <div className="neo-box p-4 text-center">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">{wellbeingStats.goodStatus}</div>
            <div className="text-sm text-gray-600">Good Status</div>
              </>
            )}
          </div>
          <div className="neo-box p-4 text-center">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-600">{wellbeingStats.warningStatus}</div>
            <div className="text-sm text-gray-600">Warning Status</div>
              </>
            )}
          </div>
          <div className="neo-box p-4 text-center">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">{wellbeingStats.criticalStatus}</div>
            <div className="text-sm text-gray-600">Critical Status</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Employee Wellbeing Status */}
      <div className="neo-box p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-700">Employee Wellbeing Status</h2>
            <p className="text-sm text-gray-600 mt-1">
              Individual wellbeing metrics for all assigned employees
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Total Employees</div>
            <div className="text-2xl font-bold text-blue-600">{wellbeingData.length}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <LoadingSkeleton key={index} />
            ))
          ) : wellbeingData.length > 0 ? (
            wellbeingData.map(employee => (
            <div className="neo-box p-4" key={employee.id}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">{employee.name}</h3>
                  <p className="text-sm text-gray-600">{employee.position}</p>
                  <p className="text-sm text-gray-500">{employee.department}</p>
                  <p className="text-xs text-gray-400">ID: {employee.employeeId}</p>
                </div>
                  <span className={`status-badge ${getStatusClass(employee.wellbeing.stressLevel)}`}>
                    {getStatusText(employee.wellbeing.stressLevel)}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Stress Level:</span>
                    <div className="flex items-center">
                      <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            employee.wellbeing.stressLevel < 60 ? 'bg-green-500' : 
                            employee.wellbeing.stressLevel < 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${employee.wellbeing.stressLevel}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{employee.wellbeing.stressLevel}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Work-Life Balance:</span>
                    <div className="flex items-center">
                      <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                        <div 
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${employee.wellbeing.workLifeBalance}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{employee.wellbeing.workLifeBalance}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Job Satisfaction:</span>
                    <div className="flex items-center">
                      <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                        <div 
                          className="h-2 bg-green-500 rounded-full"
                          style={{ width: `${employee.wellbeing.satisfaction}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{employee.wellbeing.satisfaction}%</span>
                    </div>
                  </div>
                  {employee.wellbeing.teamCollaboration && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Team Collaboration:</span>
                      <div className="flex items-center">
                        <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                          <div 
                            className="h-2 bg-purple-500 rounded-full"
                            style={{ width: `${employee.wellbeing.teamCollaboration}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{employee.wellbeing.teamCollaboration}%</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Activity Summary */}
                  <div className="border-t pt-2 mt-3">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Recent Activities:</span>
                      <span>{employee.wellbeing.activityHistory?.length || 0} logged</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Mood Entries:</span>
                      <span>{employee.wellbeing.moodHistory?.length || 0} recorded</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Break Sessions:</span>
                      <span>{employee.wellbeing.breakHistory?.length || 0} taken</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-2">
                    {employee.wellbeing.lastCheckIn === 'No data' ? (
                      <div className="flex items-center">
                        <i className="bi bi-exclamation-circle mr-1 text-yellow-500"></i>
                        <span className="text-yellow-600">No wellbeing data recorded</span>
                      </div>
                    ) : (
                      <span>Last check-in: {employee.wellbeing.lastCheckIn}</span>
                    )}
                  </div>
                  
                  {/* View Details Button */}
                  <div className="mt-3 pt-2 border-t">
                    <button 
                      className="w-full neo-button p-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      onClick={() => handleViewDetails(employee)}
                    >
                      <i className="bi bi-eye mr-1"></i>
                      View Detailed Report
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              No wellbeing data available
            </div>
          )}
        </div>
      </div>

      {/* Wellbeing Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="neo-box p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-700">Stress Level Trend</h3>
            {trendsLoading && (
              <div className="flex items-center text-sm text-gray-500">
                <i className="bi bi-arrow-clockwise animate-spin mr-1"></i>
                Loading...
              </div>
            )}
          </div>
          <div className="h-64 relative">
            {trendsLoading ? (
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
            {trendsLoading && (
              <div className="flex items-center text-sm text-gray-500">
                <i className="bi bi-arrow-clockwise animate-spin mr-1"></i>
                Loading...
              </div>
            )}
          </div>
          <div className="h-64 relative">
            {trendsLoading ? (
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

      {/* Detailed Employee Wellbeing Modal */}
      {showDetailModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-700">{selectedEmployee.name}</h2>
                  <p className="text-gray-600">{selectedEmployee.position} • {selectedEmployee.department}</p>
                  <p className="text-sm text-gray-500">Employee ID: {selectedEmployee.employeeId}</p>
                </div>
                <button 
                  className="neo-button p-2 text-gray-600 hover:text-gray-800"
                  onClick={closeDetailModal}
                >
                  <i className="bi bi-x-lg text-xl"></i>
                </button>
              </div>

              {/* Wellbeing Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="neo-box p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{selectedEmployee.wellbeing.stressLevel}%</div>
                  <div className="text-sm text-gray-600">Stress Level</div>
                  <div className={`text-xs mt-1 ${getStatusClass(selectedEmployee.wellbeing.stressLevel)}`}>
                    {getStatusText(selectedEmployee.wellbeing.stressLevel)}
                  </div>
                </div>
                <div className="neo-box p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedEmployee.wellbeing.workLifeBalance}%</div>
                  <div className="text-sm text-gray-600">Work-Life Balance</div>
                </div>
                <div className="neo-box p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedEmployee.wellbeing.satisfaction}%</div>
                  <div className="text-sm text-gray-600">Job Satisfaction</div>
                </div>
                {selectedEmployee.wellbeing.teamCollaboration && (
                  <div className="neo-box p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{selectedEmployee.wellbeing.teamCollaboration}%</div>
                    <div className="text-sm text-gray-600">Team Collaboration</div>
                  </div>
                )}
              </div>



              {/* Activity Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="neo-box p-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Recent Activities</h3>
                  <div className="text-2xl font-bold text-blue-600">{selectedEmployee.wellbeing.activityHistory?.length || 0}</div>
                  <div className="text-sm text-gray-600">Activities Logged</div>
                </div>
                <div className="neo-box p-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Mood Entries</h3>
                  <div className="text-2xl font-bold text-green-600">{selectedEmployee.wellbeing.moodHistory?.length || 0}</div>
                  <div className="text-sm text-gray-600">Moods Recorded</div>
                </div>
                <div className="neo-box p-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Break Sessions</h3>
                  <div className="text-2xl font-bold text-purple-600">{selectedEmployee.wellbeing.breakHistory?.length || 0}</div>
                  <div className="text-sm text-gray-600">Breaks Taken</div>
                </div>
              </div>

              {/* Last Check-in */}
              <div className="neo-box p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Last Check-in</h3>
                <div className="text-gray-600">
                  {selectedEmployee.wellbeing.lastCheckIn === 'No data' ? (
                    <div className="flex items-center text-yellow-600">
                      <i className="bi bi-exclamation-circle mr-2"></i>
                      No wellbeing data has been recorded for this employee
                    </div>
                  ) : (
                    <div className="flex items-center text-green-600">
                      <i className="bi bi-check-circle mr-2"></i>
                      Last updated: {selectedEmployee.wellbeing.lastCheckIn}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WellbeingSection; 