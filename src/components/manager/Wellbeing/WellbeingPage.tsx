import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import WellbeingHeader from './WellbeingHeader';
import ManagerWellbeingOverview from './ManagerWellbeingOverview';
import TeamWellbeingOverview from './TeamWellbeingOverview';
import MoodTracking from './MoodTracking';
import WellbeingCharts from './WellbeingCharts';
import BreakTimer from './BreakTimer';
import WellnessActivities from './WellnessActivities';
import WellbeingTips from './WellbeingTips';
import ReminderSettings from './ReminderSettings';
import TeamWellbeingCheck from './TeamWellbeingCheck';
import NotificationService from './NotificationService';
import { ReminderSettings as ReminderSettingsType } from './types';
import '../../../styles/NeomorphicUI.css';
import '../../../styles/manager/index.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const WellbeingPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettingsType>(() => {
    // Load settings from localStorage if available
    const savedSettings = localStorage.getItem('managerReminderSettings');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (e) {
        console.error('Error parsing saved settings', e);
      }
    }
    
    // Default settings
    return {
      breaks: {
        enabled: true,
        interval: 60, // minutes
        smartReminders: true,
      },
      mood: {
        enabled: true,
        frequency: 'daily',
        time: '09:00',
        smartReminders: true,
      },
      activities: {
        enabled: true,
        frequency: 'weekly',
        days: [1, 3, 5], // Monday, Wednesday, Friday
      },
      teamWellbeing: {
        enabled: true,
        frequency: 'weekly',
        day: 1, // Monday
        time: '10:00',
      }
    };
  });
  
  // Initialize notification service
  useEffect(() => {
    // Save settings to localStorage whenever they change
    localStorage.setItem('managerReminderSettings', JSON.stringify(reminderSettings));
    
    // Initialize notification service with current settings
    NotificationService.init(reminderSettings);
    
    // Request notification permission
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, [reminderSettings]);
  
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

  // Handle reminder settings changes
  const handleSettingsChange = (newSettings: ReminderSettingsType) => {
    setReminderSettings(newSettings);
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
        <div className="max-w-7xl mx-auto space-y-8 fade-in">
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
          <WellbeingHeader />
          
          {/* Reminder Settings */}
          <div className="slide-in-left">
            <ReminderSettings 
              settings={reminderSettings} 
              onSettingsChange={handleSettingsChange} 
            />
          </div>
          
          {/* Manager Wellbeing Overview */}
          <div className="slide-in-left">
            <ManagerWellbeingOverview />
          </div>
          
          {/* Team Wellbeing Overview */}
          <div className="slide-in-right">
            <TeamWellbeingOverview />
          </div>
          
          {/* Team Wellbeing Check */}
          <div className="slide-in-right" style={{ animationDelay: '0.1s' }}>
            <TeamWellbeingCheck />
          </div>
          
          {/* Mood Tracking */}
          <div className="slide-in-up">
            <MoodTracking />
          </div>
          
          {/* Analytics Section */}
          <div className="slide-in-up" style={{ animationDelay: '0.1s' }}>
            <WellbeingCharts />
          </div>
          
          {/* Break Timer Section */}
          <div className="slide-in-up" style={{ animationDelay: '0.2s' }}>
            <BreakTimer />
          </div>
          
          {/* Manager Wellness Activities */}
          <div className="slide-in-up" style={{ animationDelay: '0.3s' }}>
            <WellnessActivities />
          </div>
          
          {/* Manager Wellbeing Tips */}
          <div className="slide-in-up" style={{ animationDelay: '0.4s' }}>
            <WellbeingTips />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WellbeingPage; 