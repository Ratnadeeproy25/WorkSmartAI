import React, { useEffect, useState } from 'react';
import AdminSidebar from '../AdminSidebar';
import MetricCard from './MetricCard';
import QuickAccessCard from './QuickAccessCard';
import PerformanceChart from './PerformanceChart';
import DepartmentChart from './DepartmentChart';
import AttendanceChart from './AttendanceChart';
import WellbeingChart from './WellbeingChart';
import { Helmet } from 'react-helmet';

const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState({
    totalEmployees: 24,
    attendanceRate: '92%',
    activeTasks: 18,
    pendingRequests: 5
  });

  const quickAccessItems = [
    {
      icon: 'bi-people',
      title: 'Employee Management',
      description: 'View and manage employee data and performance',
      link: '/admin/employee-management',
      color: 'blue'
    },
    {
      icon: 'bi-calendar-check',
      title: 'Attendance Management',
      description: 'Monitor attendance and time tracking',
      link: '/admin/attendance-management',
      color: 'green'
    },
    {
      icon: 'bi-list-task',
      title: 'Task Management',
      description: 'Assign and track tasks',
      link: '/admin/task-management',
      color: 'purple'
    },
    {
      icon: 'bi-calendar2-check',
      title: 'Leave & Reimbursement',
      description: 'Handle leave requests and approvals',
      link: '/admin/leave-reimbursement',
      color: 'yellow'
    },
    {
      icon: 'bi-heart-pulse',
      title: 'Wellbeing & Analytics',
      description: 'Monitor health and satisfaction',
      link: '/admin/wellbeing',
      color: 'red'
    },
    {
      icon: 'bi-person-badge',
      title: 'Manager Management',
      description: 'Manage manager records and performance',
      link: '/admin/manager-management',
      color: 'indigo'
    }
  ];

  // Function to update metrics (simulating real-time updates)
  const updateMetrics = () => {
    setMetrics({
      totalEmployees: Math.floor(Math.random() * 5) + 22,
      attendanceRate: (Math.floor(Math.random() * 5) + 90) + '%',
      activeTasks: Math.floor(Math.random() * 5) + 16,
      pendingRequests: Math.floor(Math.random() * 3) + 4
    });
  };

  // Update metrics every 30 seconds
  useEffect(() => {
    const interval = setInterval(updateMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Helmet>
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
                </div>
                <div className="flex gap-4">
                  <button className="neo-button p-3">
                    <i className="bi bi-bell text-xl"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard 
                value={metrics.totalEmployees} 
                label="Total Employees" 
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
                value={metrics.activeTasks} 
                label="Active Tasks" 
                id="activeTasks" 
                color="purple"
              />
              <MetricCard 
                value={metrics.pendingRequests} 
                label="Pending Requests" 
                id="pendingRequests" 
                color="yellow"
              />
            </div>

            {/* Quick Access Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {quickAccessItems.map((item, index) => (
                <QuickAccessCard 
                  key={index}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  link={item.link}
                  color={item.color}
                />
              ))}
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