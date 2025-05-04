import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import LeaveReimbursementHeader from './LeaveReimbursementHeader';
import LeaveRequestForm from './LeaveRequestForm';
import LeaveHistory from './LeaveHistory';
import LeaveBalance from './LeaveBalance';
import ReimbursementRequestForm from './ReimbursementRequestForm';
import ReimbursementHistory from './ReimbursementHistory';
import ReimbursementSummary from './ReimbursementSummary';
import '../../../styles/NeomorphicUI.css';
import '../../../styles/manager/index.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const LeaveReimbursementPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [activeTab, setActiveTab] = useState<'leave' | 'reimbursement'>('leave');
  
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
    if (window.location.hash === '#reimbursementSection') {
      setActiveTab('reimbursement');
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleTabChange = (tab: 'leave' | 'reimbursement') => {
    setActiveTab(tab);
    
    // Update URL hash for bookmarking
    window.location.hash = tab === 'reimbursement' ? '#reimbursementSection' : '';
  };

  return (
    <div className="manager-leave-container bg-[#e0e5ec] min-h-screen w-full overflow-x-hidden">
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
          
          {/* Header */}
          <LeaveReimbursementHeader />

          {/* Tabs */}
          <div className="flex flex-wrap gap-4 mb-8 slide-in-left">
            <button 
              className={`tab-button ${activeTab === 'leave' ? 'active' : ''}`}
              onClick={() => handleTabChange('leave')}
            >
              Leave Requests
            </button>
            <button 
              className={`tab-button ${activeTab === 'reimbursement' ? 'active' : ''}`}
              onClick={() => handleTabChange('reimbursement')}
            >
              Reimbursement Requests
            </button>
          </div>

          {/* Leave Requests Section */}
          <div className={`space-y-8 ${activeTab === 'leave' ? '' : 'hidden'}`}>
            <div className="slide-in-up">
              <LeaveRequestForm />
            </div>
            <div className="slide-in-up" style={{ animationDelay: '0.1s' }}>
              <LeaveHistory />
            </div>
            <div className="slide-in-up" style={{ animationDelay: '0.2s' }}>
              <LeaveBalance />
            </div>
          </div>

          {/* Reimbursement Requests Section */}
          <div className={`space-y-8 ${activeTab === 'reimbursement' ? '' : 'hidden'}`}>
            <div className="slide-in-up">
              <ReimbursementRequestForm />
            </div>
            <div className="slide-in-up" style={{ animationDelay: '0.1s' }}>
              <ReimbursementHistory />
            </div>
            <div className="slide-in-up" style={{ animationDelay: '0.2s' }}>
              <ReimbursementSummary />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveReimbursementPage; 