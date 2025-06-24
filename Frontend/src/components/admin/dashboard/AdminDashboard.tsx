import React, { useEffect, useState, useCallback } from 'react';
import AdminSidebar from '../AdminSidebar';
import MetricCard from './MetricCard';
import PerformanceChart from './PerformanceChart';
import DepartmentChart from './DepartmentChart';
import AttendanceChart from './AttendanceChart';
import WellbeingChart from './WellbeingChart';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { getDashboardMetrics } from '../../../services/adminDashboardService';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    attendanceRate: '0%',
    pendingRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch dashboard metrics from backend
  const fetchMetrics = useCallback(async () => {
    try {
      const data = await getDashboardMetrics();
      setMetrics(data);
      setError(null); // Clear any previous errors
    } catch (error: any) {
      console.error('Error fetching dashboard metrics:', error);
      if (error.message.includes('Authentication failed') || error.message.includes('No admin authentication token')) {
        setError(error.message);
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(error.message || 'Failed to fetch dashboard metrics');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Initial load and periodic refresh
  useEffect(() => {
    fetchMetrics();
    
    // Update metrics every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return (
    <>
      <Helmet>
        <title>WorkSmart AI - Admin Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" />
        <style>{`
          * {
            font-family: 'Poppins', sans-serif;
          }
        `}</style>
      </Helmet>

      <div className="flex min-h-screen bg-[#e0e5ec]">
        <AdminSidebar />

        <div className="main-content flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="neo-box p-6 mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                  <p className="text-lg text-gray-600">Welcome back, Admin</p>
                  {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-500 text-sm flex items-center">
                        <i className="bi bi-exclamation-triangle mr-2"></i>
                        {error}
                      </p>
                      {error.includes('authentication') && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                          <p className="font-semibold text-blue-800 mb-2">Admin Login Credentials:</p>
                          <p className="text-blue-700">Email: admin@worksmartai.com</p>
                          <p className="text-blue-700">Password: admin123</p>
                          <button 
                            onClick={() => navigate('/login')}
                            className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            Go to Login
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-4">
                  {loading && (
                    <div className="flex items-center text-gray-500">
                      <i className="bi bi-arrow-repeat animate-spin mr-2"></i>
                      Loading...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <MetricCard 
                value={metrics.totalEmployees} 
                label="Total Working" 
                id="totalEmployees" 
                color="blue"
              />
              <MetricCard 
                value={metrics.attendanceRate} 
                label="Attendance Rate" 
                id="attendanceRate" 
                color="green"
              />
              
              <MetricCard 
                value={metrics.pendingRequests} 
                label="Pending Requests" 
                id="pendingRequests" 
                color="yellow"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <PerformanceChart initialRange="week" />
              <DepartmentChart />
            </div>

            {/* Additional Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              <AttendanceChart />
              <WellbeingChart />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard; 