import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../Sidebar';
import MetricCard from './MetricCard';
import TeamMembers from './TeamMembers';
import PerformanceChart from './charts/PerformanceChart';
import TaskDistributionChart from './charts/TaskDistributionChart';
import AttendanceChart from './charts/AttendanceChart';
import ProductivityChart from './charts/ProductivityChart';
import '../../../styles/NeomorphicUI.css';
import '../../../styles/manager/index.css';

const Dashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [metrics, setMetrics] = useState({
    totalEmployees: 24,
    attendanceRate: '92%',
    activeTasks: 18,
    pendingRequests: 5
  });
  
  // Update metrics periodically (simulated)
  const updateMetrics = () => {
    setMetrics({
      totalEmployees: Math.floor(Math.random() * 5) + 22,
      attendanceRate: (Math.floor(Math.random() * 5) + 90) + '%',
      activeTasks: Math.floor(Math.random() * 5) + 16,
      pendingRequests: Math.floor(Math.random() * 3) + 4
    });
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
    
    // Update metrics every 30 seconds
    const intervalId = setInterval(updateMetrics, 30000);
    
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
                <p className="text-md md:text-lg text-gray-600 dashboard-subtitle">Welcome back, Manager</p>
              </div>
              <div className="flex gap-3 md:gap-4">
                <button className="neo-button p-3 relative pulse" aria-label="Notifications">
                  <i className="bi bi-bell text-xl"></i>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    2
                  </span>
                </button>
                <Link to="/manager/profile" className="neo-button p-3 scale-on-hover" aria-label="Settings">
                  <i className="bi bi-gear text-xl"></i>
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 stats-grid">
            <div className="stagger-item">
              <MetricCard 
                value={metrics.totalEmployees} 
                label="Total Employees" 
                className="text-primary" 
                icon="bi-people"
                trend={{ value: 3, isPositive: true }}
              />
            </div>
            <div className="stagger-item">
              <MetricCard 
                value={metrics.attendanceRate} 
                label="Attendance Rate" 
                className="text-success" 
                icon="bi-calendar-check"
                trend={{ value: 2, isPositive: true }}
              />
            </div>
            <div className="stagger-item">
              <MetricCard 
                value={metrics.activeTasks} 
                label="Active Tasks" 
                className="text-purple-600" 
                icon="bi-list-task"
                trend={{ value: 5, isPositive: false }}
              />
            </div>
            <div className="stagger-item">
              <MetricCard 
                value={metrics.pendingRequests} 
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
              <PerformanceChart />
            </div>
            <div className="slide-in-right">
              <TaskDistributionChart />
            </div>
          </div>

          {/* Additional Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mt-8 chart-grid">
            <div className="slide-in-left">
              <AttendanceChart />
            </div>
            <div className="slide-in-right">
              <ProductivityChart />
            </div>
          </div>

          {/* Team Members Section */}
          <div className="mt-8 slide-in-up">
            <TeamMembers />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 