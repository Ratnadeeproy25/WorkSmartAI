import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import PageHeader from './PageHeader';
import WellbeingOverview from './WellbeingOverview';
import MoodTracker from './MoodTracker';
import WellbeingAnalytics from './WellbeingAnalytics';
import BreakTimer from './BreakTimer';
import WellnessActivities from './WellnessActivities';
import WellbeingTips from './WellbeingTips';
import ReminderSettingsComponent from './ReminderSettings';
import NotificationService from './NotificationService';
import { WellbeingMetrics, MoodEntry, ActivityEntry, ReminderSettings } from './types';
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
        teamDynamics: 'Excellent'
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

  // Load saved data from localStorage
  useEffect(() => {
    const savedMetrics = localStorage.getItem('wellbeingMetrics');
    if (savedMetrics) {
      setWellbeingMetrics(JSON.parse(savedMetrics));
    }

    const savedMoodHistory = localStorage.getItem('moodHistory');
    if (savedMoodHistory) {
      setMoodHistory(JSON.parse(savedMoodHistory));
    }

    const savedActivityHistory = localStorage.getItem('activityHistory');
    if (savedActivityHistory) {
      setActivityHistory(JSON.parse(savedActivityHistory));
    }
    
    // Load saved reminder settings
    const savedReminderSettings = localStorage.getItem('reminderSettings');
    if (savedReminderSettings) {
      setReminderSettings(JSON.parse(savedReminderSettings));
    }

    // Request notification permission
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);
  
  // Initialize notification service when reminder settings change
  useEffect(() => {
    NotificationService.init(reminderSettings);
    localStorage.setItem('reminderSettings', JSON.stringify(reminderSettings));
  }, [reminderSettings]);

  // Save wellbeing metrics to localStorage
  const syncWithDashboard = () => {
    localStorage.setItem('wellbeingMetrics', JSON.stringify(wellbeingMetrics));
  };

  // Update metrics when they change
  useEffect(() => {
    syncWithDashboard();
  }, [wellbeingMetrics]);

  // Track mood
  const handleMoodSelection = (mood: MoodEntry) => {
    const updatedMoodHistory = [...moodHistory, mood];
    setMoodHistory(updatedMoodHistory);
    localStorage.setItem('moodHistory', JSON.stringify(updatedMoodHistory));
    
    // Update the timestamp for mood tracking
    NotificationService.updateTimestamp('lastMood');
    
    // Show wellness recommendations for not-great moods
    if (mood.mood === 'bad' || mood.mood === 'okay') {
      showWellnessRecommendations(mood.mood);
    }
    
    showNotification('Mood tracked successfully', 'success');
  };

  // Add activity to history
  const handleActivityCompletion = (activityKey: string) => {
    const newActivity = {
      activity: activityKey,
      timestamp: new Date().toISOString()
    };
    
    const updatedActivityHistory = [...activityHistory, newActivity];
    setActivityHistory(updatedActivityHistory);
    localStorage.setItem('activityHistory', JSON.stringify(updatedActivityHistory));
    
    // Update the timestamp for activity tracking
    NotificationService.updateTimestamp('lastActivity');
    
    showNotification('Activity completed successfully', 'success');
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
  const handleBreakComplete = () => {
    // Update metrics when a break is completed
    const updatedMetrics = {...wellbeingMetrics};
    updatedMetrics.workLifeBalance.factors.breaksCount += 1;
    setWellbeingMetrics(updatedMetrics);
    
    // Update the timestamp for break tracking
    NotificationService.updateTimestamp('lastBreak');
  };

  return (
    <div className="min-h-screen bg-[#e0e5ec]">
      <Sidebar />
      <div className="main-content p-6">
        <div className="max-w-7xl mx-auto">
          <PageHeader />
          
          <div className="space-y-8">
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
            
            <BreakTimer onBreakComplete={handleBreakComplete} />
            
            <WellnessActivities onActivityComplete={handleActivityCompletion} />
            
            <WellbeingTips />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WellbeingPage; 