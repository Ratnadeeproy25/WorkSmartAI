import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/login/ProtectedRoute';
import LoginPage from './components/login/LoginPage';
import Sidebar from './components/employee/Sidebar';
import Header from './components/employee/dashboard/Header';
import TaskProgress from './components/employee/dashboard/TaskProgress';
import UpcomingDeadlines from './components/employee/dashboard/UpcomingDeadlines';
import AttendancePage from './components/employee/Attendance/AttendancePage';
import TaskPage from './components/employee/Tasks/TaskPage';
import LeaveReimbursementPage from './components/employee/LeaveReimbursement/LeaveReimbursementPage';
import LeaveReimbursementWidget from './components/employee/LeaveReimbursement/LeaveReimbursementWidget';
import WellbeingPage from './components/employee/Wellbeing/WellbeingPage';
import ProfilePage from './components/employee/Profile/ProfilePage';
import { Dashboard as ManagerDashboard } from './components/manager/dashboard';
import ManagerAttendancePage from './components/manager/Attendance/AttendancePage';
import ManagerTaskPage from './components/manager/Tasks/TaskPage';
import ManagerLeaveReimbursementPage from './components/manager/Leave/LeaveReimbursementPage';
import ManagerEmployeeDataPage from './components/manager/EmployeeData/EmployeeDataPage';
import ManagerWellbeingPage from './components/manager/Wellbeing/WellbeingPage';
import ManagerProfilePage from './components/manager/Profile/ProfilePage';
import { AdminDashboard, EmployeeManagement, ManagerManagement, AttendanceManagement, LeaveReimbursementManagement } from './components/admin';
import WellbeingManagement from './components/admin/wellbeing/WellbeingManagement';
import TaskManagement from './components/admin/task-management/TaskManagement';
import './components/admin/dashboard/ChartConfig'; // Ensure Chart.js is properly configured
import { WellbeingProvider } from './context/WellbeingContext';
import './styles/App.css';

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#e0e5ec]">
      <Sidebar />
      <div className="main-content p-6">
        <div className="max-w-7xl mx-auto">
          <Header />
          <LeaveReimbursementWidget />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <TaskProgress />
            <UpcomingDeadlines />
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <WellbeingProvider>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Employee Dashboard Routes - Protected */}
            <Route 
              path="/employee/dashboard" 
              element={
                <ProtectedRoute requiredRole="employee">
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employee/attendance" 
              element={
                <ProtectedRoute requiredRole="employee">
                  <AttendancePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employee/tasks" 
              element={
                <ProtectedRoute requiredRole="employee">
                  <TaskPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employee/leave" 
              element={
                <ProtectedRoute requiredRole="employee">
                  <LeaveReimbursementPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employee/wellbeing" 
              element={
                <ProtectedRoute requiredRole="employee">
                  <WellbeingPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employee/profile" 
              element={
                <ProtectedRoute requiredRole="employee">
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            
            {/* Manager Dashboard Routes - Protected */}
            <Route 
              path="/manager/dashboard" 
              element={
                <ProtectedRoute requiredRole="manager">
                  <ManagerDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/manager/attendance" 
              element={
                <ProtectedRoute requiredRole="manager">
                  <ManagerAttendancePage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/manager/tasks" 
              element={
                <ProtectedRoute requiredRole="manager">
                  <ManagerTaskPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/manager/leave" 
              element={
                <ProtectedRoute requiredRole="manager">
                  <ManagerLeaveReimbursementPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/manager/employee-data" 
              element={
                <ProtectedRoute requiredRole="manager">
                  <ManagerEmployeeDataPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/manager/wellbeing" 
              element={
                <ProtectedRoute requiredRole="manager">
                  <ManagerWellbeingPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/manager/profile" 
              element={
                <ProtectedRoute requiredRole="manager">
                  <ManagerProfilePage />
                </ProtectedRoute>
              } 
            />

            {/* Admin Dashboard Routes - Protected */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/employee-management" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <EmployeeManagement />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/attendance-management" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AttendanceManagement />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/task-management" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <TaskManagement />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/leave-reimbursement" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <LeaveReimbursementManagement />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/wellbeing" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <WellbeingManagement />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/manager-management" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <ManagerManagement />
                </ProtectedRoute>
              } 
            />
            
            {/* Fallback route */}
            <Route path="*" element={<LoginPage />} />
          </Routes>
        </WellbeingProvider>
      </AuthProvider>
    </Router>
  );
}

export default App; 