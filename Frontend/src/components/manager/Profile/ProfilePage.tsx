import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Sidebar from '../Sidebar';
import UserProfile from './UserProfile';
import SecuritySettings from './SecuritySettings';
import '../../../styles/NeomorphicUI.css';
import '../../../styles/manager/index.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const ProfilePage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  
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

  return (
    <div className="manager-profile-container bg-[#e0e5ec] min-h-screen w-full overflow-x-hidden">
      <Helmet>
        <title>WorkSmart AI - Manager Profile</title>
      </Helmet>
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
          
          {/* Tab Navigation */}
          <div className="mb-6 flex gap-4">
            <button 
              className={`py-2 px-6 rounded-lg font-medium ${activeTab === 'profile' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button 
              className={`py-2 px-6 rounded-lg font-medium ${activeTab === 'security' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
          </div>
          
          {/* Main Profile Content */}
          {activeTab === 'profile' ? (
            <UserProfile />
          ) : (
            <SecuritySettings />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 