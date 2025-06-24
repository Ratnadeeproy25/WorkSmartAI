import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Sidebar from '../Sidebar';
import WellbeingHeader from './WellbeingHeader';
import ManagerWellbeingOverview from './ManagerWellbeingOverview';
import MoodTracking from './MoodTracking';
import WellbeingCharts from './WellbeingCharts';
import BreakTimer from './BreakTimer';
import WellbeingTips from './WellbeingTips';
import ReminderSettings from './ReminderSettings';
import NotificationService from './NotificationService';

import { ReminderSettings as ReminderSettingsType, MoodEntry } from './types';
import { useAuth } from '../../../context/AuthContext';
import managerWellbeingService from '../../../services/managerWellbeingService';
import '../../../styles/NeomorphicUI.css';
import '../../../styles/manager/index.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const WellbeingPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettingsType | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  
  // Fetch wellbeing data from the backend
  useEffect(() => {
    const fetchWellbeingData = async () => {
      try {
        setLoading(true);
        
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }
        
        const response = await managerWellbeingService.getManagerWellbeingData();
        
        // Set reminder settings and mood history from the backend data
        if (response.reminderSettings) {
          setReminderSettings(response.reminderSettings);
          
          // Initialize notification service with backend settings
          NotificationService.init(response.reminderSettings);
        }
        
        // Set mood history if available
        if (response.moodHistory) {
          setMoodHistory(response.moodHistory);
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching wellbeing data:', err);
        setError(err.response?.data?.message || 'Failed to fetch wellbeing data');
        setLoading(false);
      }
    };
    
    fetchWellbeingData();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, [token]);
  
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

  // Handle mood selection - similar to employee version
  const handleMoodSelection = async (mood: MoodEntry) => {
    try {
      // Update local mood history
      const updatedMoodHistory = [...moodHistory, mood];
      setMoodHistory(updatedMoodHistory);
      
      // Show wellness recommendations for not-great moods
      if (mood.mood === 'bad' || mood.mood === 'okay') {
        showWellnessRecommendations(mood.mood);
      }
      
      showNotification('Mood tracked successfully', 'success');
      
      // The MoodTracking component already handles backend submission and data refresh
    } catch (error) {
      console.error('Error handling mood selection:', error);
      showNotification('Failed to process mood entry', 'error');
    }
  };

  // Show wellness recommendations
  const showWellnessRecommendations = (mood: 'okay' | 'bad') => {
    const recommendations = {
      okay: [
        'Take a short break and try some deep breathing exercises',
        'Go for a quick walk to refresh your mind',
        'Chat with a colleague or friend',
        'Review your team\'s progress to boost motivation'
      ],
      bad: [
        'Consider taking a proper break to recharge',
        'Try a meditation session to calm your mind',
        'Speak with your supervisor or HR about any concerns',
        'Use our wellness resources for support',
        'Consider delegating some tasks to reduce workload'
      ]
    };

    // Display recommendations as in-app notification
    const recommendation = recommendations[mood][Math.floor(Math.random() * recommendations[mood].length)];
    NotificationService.showNotification('Wellness Recommendation', recommendation);
  };

  // Notification system
  const showNotification = (message: string, type: 'success' | 'error') => {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white z-50`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  // Handle reminder settings changes
  const handleSettingsChange = async (newSettings: ReminderSettingsType) => {
    setReminderSettings(newSettings);
    
    try {
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      // Update backend settings
      await managerWellbeingService.updateManagerReminderSettings(newSettings);
      
      // Update notification service with new settings
      NotificationService.init(newSettings);
    } catch (err: any) {
      console.error('Error updating reminder settings:', err);
      setError(err.response?.data?.message || 'Failed to update reminder settings');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-[#e0e5ec] min-h-screen w-full flex items-center justify-center">
        <div className="neo-card p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700">Loading wellbeing data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-[#e0e5ec] min-h-screen w-full flex items-center justify-center">
        <div className="neo-card p-6 bg-red-50">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-2">
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <p className="text-red-700">{error}</p>
            <button 
              className="neo-button mt-4 bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#e0e5ec] min-h-screen w-full overflow-x-hidden">
      <Helmet>
        <title>WorkSmart AI - Wellbeing</title>
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
          {reminderSettings && (
            <div className="slide-in-left">
              <ReminderSettings 
                settings={reminderSettings} 
                onSettingsChange={handleSettingsChange} 
              />
            </div>
          )}
          
          {/* Manager Wellbeing Overview */}
          <div className="slide-in-left">
            <ManagerWellbeingOverview />
          </div>


          
          {/* Mood Tracking */}
          <div className="slide-in-up">
            <MoodTracking onMoodSelect={handleMoodSelection} />
          </div>
          
          {/* Analytics Section */}
          <div className="slide-in-up" style={{ animationDelay: '0.1s' }}>
            <WellbeingCharts />
          </div>
          
          {/* Break Timer Section */}
          <div className="slide-in-up" style={{ animationDelay: '0.2s' }}>
            <BreakTimer />
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