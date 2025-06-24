import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Sidebar from '../Sidebar';
import PageHeader from './PageHeader';
import WellbeingOverview from './WellbeingOverview';
import MoodTracker from './MoodTracker';
import WellbeingAnalytics from './WellbeingAnalytics';
import BreakTimer from './BreakTimer';
import WellbeingTips from './WellbeingTips';
import WellbeingInsights from './WellbeingInsights';
import ReminderSettingsComponent from './ReminderSettings';
import NotificationService from './NotificationService';
import { WellbeingMetrics, MoodEntry, ActivityEntry, ReminderSettings, Insight } from './types';
import * as wellbeingService from '../../../services/wellbeingService';
import '../../../styles/employee/wellbeing.css';

const WellbeingPage: React.FC = () => {
  const [wellbeingMetrics, setWellbeingMetrics] = useState<WellbeingMetrics>({
    workLifeBalance: {
      score: 85,
      history: [82, 84, 85, 83, 85],
      factors: {
        workHours: 7.5,
        breaksCount: 4,
        afterHoursWork: 0.5,
        focusTime: 5.2
      }
    },
    stressLevel: {
      score: 90,
      history: [88, 89, 90, 90, 90],
      factors: {
        deadlinePressure: 'Low',
        workload: 'Moderate',
        teamSupport: 'High',
        workEnvironment: 'Positive'
      }
    },
    jobSatisfaction: {
      score: 88,
      history: [85, 86, 87, 88, 88],
      factors: {
        roleClarity: 'High',
        skillUtilization: 'Optimal',
        growthOpportunities: 'Good',
        teamDynamics: 'Excellent',
        taskCompletionRate: '85%'
      }
    },
    teamCollaboration: {
      score: 92,
      history: [90, 91, 91, 92, 92],
      factors: {
        communicationQuality: 'Excellent',
        peerSupport: 'High',
        conflictResolution: 'Good',
        teamworkEfficiency: 'High'
      }
    }
  });

  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [activityHistory, setActivityHistory] = useState<ActivityEntry[]>([]);
  const [breakHistory, setBreakHistory] = useState<any[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [insightsLoading, setInsightsLoading] = useState<boolean>(true);
  
  // Add the reminder settings state
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    breaks: {
      enabled: true,
      interval: 60,
      smartReminders: true
    },
    mood: {
      enabled: true,
      frequency: 'daily',
      time: '09:00',
      smartReminders: true
    },
    activities: {
      enabled: true,
      frequency: 'daily',
      time: '12:00',
      days: [1, 3, 5] // Mon, Wed, Fri
    }
  });

  // Load data from API
  useEffect(() => {
    const fetchWellbeingData = async () => {
      try {
        setLoading(true);
        const data = await wellbeingService.getWellbeingData();
        
        if (data) {
          setWellbeingMetrics(data.wellbeingMetrics);
          setMoodHistory(data.moodHistory || []);
          setActivityHistory(data.activityHistory || []);
          setBreakHistory(data.breakHistory || []);
          setReminderSettings(data.reminderSettings);
        }
      } catch (error) {
        console.error('Error fetching wellbeing data:', error);
        showNotification('Failed to load wellbeing data', 'error');
      } finally {
        setLoading(false);
      }

      // Request notification permission
      if ('Notification' in window) {
        Notification.requestPermission();
      }
    };

    fetchWellbeingData();
  }, []);

  // Fetch insights
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setInsightsLoading(true);
        const data = await wellbeingService.getWellbeingInsights();
        
        if (data && data.insights) {
          setInsights(data.insights);
        }
      } catch (error) {
        console.error('Error fetching wellbeing insights:', error);
      } finally {
        setInsightsLoading(false);
      }
    };

    // Only fetch insights if we're not loading the main data
    if (!loading) {
      fetchInsights();
    }
  }, [loading]);
  
  // Initialize notification service when reminder settings change
  useEffect(() => {
    NotificationService.init(reminderSettings);
    
    // Sync updated settings with backend
    if (!loading) {
      const updateSettings = async () => {
        try {
          await wellbeingService.updateReminderSettings(reminderSettings);
        } catch (error) {
          console.error('Error updating reminder settings:', error);
        }
      };
      
      updateSettings();
    }
  }, [reminderSettings, loading]);

  // Save wellbeing metrics to API
  const syncWithDashboard = async () => {
    try {
      await wellbeingService.updateWellbeingMetrics(wellbeingMetrics);
    } catch (error) {
      console.error('Error updating wellbeing metrics:', error);
      showNotification('Failed to sync wellbeing metrics', 'error');
    }
  };

  // Update metrics when they change
  useEffect(() => {
    if (!loading) {
      syncWithDashboard();
    }
  }, [wellbeingMetrics, loading]);

  // Track mood
  const handleMoodSelection = async (mood: MoodEntry) => {
    try {
      await wellbeingService.recordMood(mood.mood, mood.note);
      
      const updatedMoodHistory = [...moodHistory, mood];
      setMoodHistory(updatedMoodHistory);
      
      // Update the timestamp for mood tracking
      NotificationService.updateTimestamp('lastMood');
      
      // Show wellness recommendations for not-great moods
      if (mood.mood === 'bad' || mood.mood === 'okay') {
        showWellnessRecommendations(mood.mood);
      }
      
      showNotification('Mood tracked successfully', 'success');
      
      // Refresh data to get updated metrics
      await refreshWellbeingData();
    } catch (error) {
      console.error('Error recording mood:', error);
      showNotification('Failed to record mood', 'error');
    }
  };

  // Helper function to refresh all wellbeing data
  const refreshWellbeingData = async () => {
    try {
      console.log('Refreshing wellbeing data...');
      
      // Fetch wellbeing data
      const data = await wellbeingService.getWellbeingData();
      if (data) {
        setWellbeingMetrics(data.wellbeingMetrics);
        setMoodHistory(data.moodHistory || []);
        setActivityHistory(data.activityHistory || []);
        
        // Update break history with proper logging
        if (data.breakHistory) {
          console.log('Received break history:', data.breakHistory);
          setBreakHistory(data.breakHistory);
        } else {
          console.log('No break history received');
        }
      }
      
      // Fetch insights
      const insightsData = await wellbeingService.getWellbeingInsights();
      if (insightsData && insightsData.insights) {
        setInsights(insightsData.insights);
      }
    } catch (error) {
      console.error('Error refreshing wellbeing data:', error);
    }
  };

  // Show wellness recommendations
  const showWellnessRecommendations = (mood: 'okay' | 'bad') => {
    const recommendations = {
      okay: [
        'Take a short break and try some deep breathing exercises',
        'Go for a quick walk to refresh your mind',
        'Chat with a colleague or friend'
      ],
      bad: [
        'Consider taking a proper break to recharge',
        'Try a meditation session to calm your mind',
        'Speak with your supervisor about any concerns',
        'Use our wellness resources for support'
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
  
  // Handler for reminder settings changes
  const handleReminderSettingsChange = (newSettings: ReminderSettings) => {
    setReminderSettings(newSettings);
  };
  
  // Handler for break completion
  const handleBreakComplete = async (duration: number, breakType: string = 'regular') => {
    try {
      console.log(`Recording break: ${duration} minutes, type: ${breakType}`);
      
      // Record break with both duration and type
      const response = await wellbeingService.recordBreak(duration, breakType);
      
      // Update the timestamp for break tracking
      NotificationService.updateTimestamp('lastBreak');
      
      // Display success notification
      showNotification('Break completed successfully', 'success');
      
      // Refresh data to get updated metrics including break history
      await refreshWellbeingData();
    } catch (error) {
      console.error('Error recording break:', error);
      showNotification('Failed to record break', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#e0e5ec]">
      <Helmet>
        <title>WorkSmart AI - Employee Wellbeing</title>
      </Helmet>
      <Sidebar />
      <div className="main-content p-6">
        <div className="max-w-7xl mx-auto">
          <PageHeader />
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Display wellbeing insights */}
              {!insightsLoading && insights.length > 0 && (
                <WellbeingInsights insights={insights} />
              )}
              
              {/* Add the Reminder Settings component */}
              <ReminderSettingsComponent 
                settings={reminderSettings}
                onSettingsChange={handleReminderSettingsChange}
              />
              
              <WellbeingOverview metrics={wellbeingMetrics} />
              
              <MoodTracker onMoodSelect={handleMoodSelection} />
              
              <WellbeingAnalytics 
                wlbHistory={wellbeingMetrics.workLifeBalance.history} 
                stressFactors={wellbeingMetrics.stressLevel.factors}
              />
              
              <BreakTimer 
                onBreakComplete={handleBreakComplete} 
                breakHistory={breakHistory.slice(0, 5)}
              />
              
              <WellbeingTips />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WellbeingPage; 