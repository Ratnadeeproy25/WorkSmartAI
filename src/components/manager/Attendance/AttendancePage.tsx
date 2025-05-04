import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import AttendanceHeader from './AttendanceHeader';
import AttendanceTracking from './AttendanceTracking';
import StatusSummary from './StatusSummary';
import LeaveCalendar from './LeaveCalendar';
import AttendanceReports from './AttendanceReports';
import AdvancedAnalytics from './AdvancedAnalytics';
import '../../../styles/NeomorphicUI.css';
import '../../../styles/manager/index.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const AttendancePage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [leaveDates, setLeaveDates] = useState<Set<string>>(new Set());
  
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
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLeaveDatesChange = (dates: Set<string>) => {
    setLeaveDates(dates);
  };

  return (
    <div className="manager-attendance-container bg-[#e0e5ec] min-h-screen w-full overflow-x-hidden">
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
          {/* Sidebar Toggle for Mobile */}
          {!sidebarOpen && (
            <button 
              className="fixed top-4 left-4 z-20 neo-button p-3 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open Sidebar"
            >
              <i className="bi bi-list text-2xl"></i>
            </button>
          )}
          
          {/* Manager Attendance Header */}
          <AttendanceHeader />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Attendance Tracking Section */}
            <div className="slide-in-left">
              <AttendanceTracking />
            </div>
            {/* Leave Calendar Section */}
            <div className="slide-in-up">
              <LeaveCalendar 
                leaveDates={leaveDates}
                onLeaveDatesChange={handleLeaveDatesChange}
              />
            </div>
          </div>

          {/* Attendance Reports */}
          <div className="slide-in-up mt-8">
            <AttendanceReports />
          </div>

          {/* Advanced Analytics Section */}
          <div className="slide-in-up mt-8">
            <AdvancedAnalytics />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage; 