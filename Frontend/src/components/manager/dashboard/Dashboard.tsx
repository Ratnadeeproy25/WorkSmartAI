import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../Sidebar';
import MetricCard from './MetricCard';
import TeamMembers from './TeamMembers';
import PerformanceChart from './charts/PerformanceChart';
import TaskDistributionChart from './charts/TaskDistributionChart';
import AttendanceChart from './charts/AttendanceChart';
import ProductivityChart from './charts/ProductivityChart';
import { useAuth } from '../../../context/AuthContext';
import { getManagerDashboardData, DashboardData, DashboardMetrics, getTeamMembers } from '../../../services/managerService';
import { managerEmployeeDataApi } from '../../../services/managerEmployeeDataApi';
import '../../../styles/NeomorphicUI.css';
import '../../../styles/manager/index.css';

const Dashboard: React.FC = () => {
  const { userName } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalEmployees: 0,
    attendanceRate: '0%',
    activeTasks: 0,
    pendingRequests: 0
  });
  
  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get dashboard data first
      let data;
      try {
        data = await getManagerDashboardData();
        // console.log('Dashboard data received:', data);
      } catch (dashboardError) {
        // console.error('Dashboard API failed, trying alternative approach:', dashboardError);
        
        // If dashboard API fails, try to fetch team members separately
        try {
          const assignedEmployees = await managerEmployeeDataApi.getAssignedEmployees();
          // console.log('Assigned employees data:', assignedEmployees);
          
          // Format the data to match TeamMember interface
          const formattedTeamMembers = assignedEmployees.data.map(emp => ({
            id: emp._id || emp.id,
            name: emp.name,
            position: emp.position,
            status: 'Active' as const, // Default status
            performance: 85, // Default performance
            avatar: emp.profilePicture || `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 99)}.jpg`,
            lastActive: 'Recently',
            email: emp.email
          }));
          
          // Create a mock dashboard data structure
          data = {
            manager: {
              name: userName || 'Manager',
              department: 'Unknown',
              position: 'Manager'
            },
            metrics: {
              totalEmployees: assignedEmployees.count,
              attendanceRate: '0%',
              activeTasks: 0,
              pendingRequests: 0
            },
            chartData: {
              performance: { labels: [], datasets: [], isEmpty: true },
              taskDistribution: { labels: [], datasets: [], isEmpty: true },
              attendance: { labels: [], datasets: [], isEmpty: true },
              productivity: { labels: [], datasets: [], isEmpty: true }
            },
            teamMembers: formattedTeamMembers,
            recentTasks: []
          };
        } catch (employeeDataError) {
          // console.error('Failed to fetch assigned employees:', employeeDataError);
          throw new Error('Unable to fetch team data from any endpoint');
        }
      }
      
      setDashboardData(data);
      setMetrics(data.metrics);
      
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(`Failed to load dashboard data: ${error.message}`);
      // Keep the default metrics values on error
    } finally {
      setLoading(false);
    }
  };

  // Handle sidebar and window resizing
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Fetch initial data
    fetchDashboardData();
    
    // Update metrics every 30 seconds
    const intervalId = setInterval(fetchDashboardData, 30000);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="manager-dashboard-container bg-[#e0e5ec] min-h-screen w-full overflow-x-hidden">
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && window.innerWidth <= 1024 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`sidebar fixed h-full transition-all duration-300 z-50 ${sidebarOpen ? '' : '-translate-x-full'}`}>
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <div 
        className="main-content transition-all duration-300 py-6 px-4 md:px-6" 
        style={{ marginLeft: sidebarOpen && window.innerWidth > 1024 ? '250px' : '0' }}
      >
        <div className="max-w-7xl mx-auto fade-in">
          {/* Header */}
          <div className="neo-box p-5 md:p-6 mb-8 dashboard-header">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dashboard-title">Manager Dashboard</h1>
                <p className="text-md md:text-lg text-gray-600 dashboard-subtitle">
                  Welcome back, {dashboardData?.manager?.name || userName || 'Manager'}
                </p>
                {dashboardData?.manager?.department && (
                  <p className="text-sm text-gray-500">
                    {dashboardData.manager.position} - {dashboardData.manager.department}
                  </p>
                )}
              </div>
              <div className="flex gap-3 md:gap-4">
                <Link to="/manager/profile" className="neo-button p-3 scale-on-hover" aria-label="Settings">
                  <i className="bi bi-gear text-xl"></i>
                </Link>
                <button 
                  onClick={fetchDashboardData}
                  className="neo-button p-3 scale-on-hover" 
                  aria-label="Refresh"
                  disabled={loading}
                >
                  <i className={`bi bi-arrow-clockwise text-xl ${loading ? 'animate-spin' : ''}`}></i>
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="neo-box p-4 mb-8 bg-red-50 border-red-200">
              <div className="flex items-center">
                <i className="bi bi-exclamation-triangle text-red-500 mr-2"></i>
                <span className="text-red-700">{error}</span>
                <button 
                  onClick={fetchDashboardData}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 stats-grid">
            <div className="stagger-item">
              <MetricCard 
                value={loading ? '...' : metrics.totalEmployees} 
                label="Total Employees" 
                className="text-primary" 
                icon="bi-people"
                trend={{ value: 3, isPositive: true }}
              />
            </div>
            <div className="stagger-item">
              <MetricCard 
                value={loading ? '...' : metrics.attendanceRate} 
                label="Attendance Rate" 
                className="text-success" 
                icon="bi-calendar-check"
                trend={{ value: 2, isPositive: true }}
              />
            </div>
            <div className="stagger-item">
              <MetricCard 
                value={loading ? '...' : metrics.activeTasks} 
                label="Active Tasks" 
                className="text-purple-600" 
                icon="bi-list-task"
                trend={{ value: 5, isPositive: false }}
              />
            </div>
            <div className="stagger-item">
              <MetricCard 
                value={loading ? '...' : metrics.pendingRequests} 
                label="Pending Requests" 
                className="text-warning" 
                icon="bi-clock-history"
                trend={{ value: 1, isPositive: true }}
              />
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 chart-grid">
            <div className="slide-in-left">
              <PerformanceChart chartData={dashboardData?.chartData?.performance} />
            </div>
            <div className="slide-in-right">
              <TaskDistributionChart chartData={dashboardData?.chartData?.taskDistribution} />
            </div>
          </div>

          {/* Additional Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mt-8 chart-grid">
            <div className="slide-in-left">
              <AttendanceChart chartData={dashboardData?.chartData?.attendance} />
            </div>
            <div className="slide-in-right">
              <ProductivityChart chartData={dashboardData?.chartData?.productivity} />
            </div>
          </div>

          {/* Team Members Section */}
          <div className="mt-8 slide-in-up">
            <TeamMembers teamMembers={dashboardData?.teamMembers} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 