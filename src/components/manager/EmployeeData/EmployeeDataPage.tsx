import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import EmployeeDataHeader from './EmployeeDataHeader';
import AttendanceSection from './AttendanceSection';
import LeaveSection from './LeaveSection';
import WellbeingSection from './WellbeingSection';
import '../../../styles/NeomorphicUI.css';
import '../../../styles/manager/index.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const EmployeeDataPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [activeTab, setActiveTab] = useState<'attendance' | 'leave' | 'wellbeing'>('attendance');
  
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
    
    // Check URL hash on page load
    const hash = window.location.hash;
    if (hash === '#leave') {
      setActiveTab('leave');
    } else if (hash === '#wellbeing') {
      setActiveTab('wellbeing');
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleTabChange = (tab: 'attendance' | 'leave' | 'wellbeing') => {
    setActiveTab(tab);
    
    // Update URL hash for bookmarking
    window.location.hash = tab === 'attendance' ? '' : `#${tab}`;
  };

  return (
    <div className="bg-[#e0e5ec] min-h-screen w-full overflow-x-hidden">
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
        <div className="container mx-auto max-w-7xl fade-in">
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
          
          {/* Header */}
          <EmployeeDataHeader />

          {/* Tabs */}
          <div className="flex flex-wrap gap-4 mb-8 slide-in-left">
            <button 
              className={`tab-button ${activeTab === 'attendance' ? 'active' : ''}`}
              onClick={() => handleTabChange('attendance')}
            >
              Attendance
            </button>
            <button 
              className={`tab-button ${activeTab === 'leave' ? 'active' : ''}`}
              onClick={() => handleTabChange('leave')}
            >
              Leave & Reimbursement
            </button>
            <button 
              className={`tab-button ${activeTab === 'wellbeing' ? 'active' : ''}`}
              onClick={() => handleTabChange('wellbeing')}
            >
              Wellbeing
            </button>
          </div>

          {/* Attendance Section */}
          <div className={`space-y-8 slide-in-up ${activeTab === 'attendance' ? '' : 'hidden'}`}>
            <AttendanceSection />
          </div>

          {/* Leave & Reimbursement Section */}
          <div className={`space-y-8 slide-in-up ${activeTab === 'leave' ? '' : 'hidden'}`}>
            <LeaveSection />
          </div>

          {/* Wellbeing Section */}
          <div className={`space-y-8 slide-in-up ${activeTab === 'wellbeing' ? '' : 'hidden'}`}>
            <WellbeingSection />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDataPage; 