import React, { useEffect, useState } from 'react';
import NotificationService from './NotificationService';

interface WellnessActivity {
  id: string;
  title: string;
  description: string;
  duration: string;
  steps: string[];
}

const WellnessActivities: React.FC = () => {
  const [showActivityPrompt, setShowActivityPrompt] = useState<boolean>(false);
  const [activeActivity, setActiveActivity] = useState<string | null>(null);
  const [activityCompleted, setActivityCompleted] = useState<boolean>(false);

  const activities: Record<string, WellnessActivity> = {
    'meditation': {
      id: 'meditation',
      title: 'Leadership Meditation',
      description: '5-minute mindfulness for leaders',
      duration: '5 minutes',
      steps: [
        'Find a quiet space',
        'Sit comfortably',
        'Focus on your breath',
        'Visualize your team\'s success'
      ]
    },
    'decision-making': {
      id: 'decision-making',
      title: 'Decision Making Exercise',
      description: 'Improve clarity in decision making',
      duration: '3 minutes',
      steps: [
        'Identify a current decision',
        'List pros and cons',
        'Consider team impact',
        'Make a clear choice'
      ]
    },
    'team-building': {
      id: 'team-building',
      title: 'Team Building Activity',
      description: 'Quick team engagement exercise',
      duration: '5 minutes',
      steps: [
        'Identify a team strength',
        'Plan a recognition moment',
        'Consider team feedback',
        'Schedule a team check-in'
      ]
    }
  };

  // Listen for activity notifications
  useEffect(() => {
    const handleActivityNotification = () => {
      // If no activity is active, show a suggestion prompt
      if (!activeActivity && !activityCompleted) {
        setShowActivityPrompt(true);
        
        // Create notification on page
        const activityPrompt = document.createElement('div');
        activityPrompt.className = 'fixed top-4 right-4 p-4 bg-blue-500 text-white rounded-lg shadow-lg z-50 max-w-sm';
        activityPrompt.innerHTML = `
          <div class="font-bold">Wellness Activity</div>
          <div>It's time for your scheduled wellness activity. Would you like to start one now?</div>
          <div class="mt-2 flex justify-end">
            <button id="goToActivitiesSection" class="px-4 py-1 bg-white text-blue-500 rounded">View Activities</button>
          </div>
        `;
        
        document.body.appendChild(activityPrompt);
        
        // Add click event to scroll to activities section
        const activitiesBtn = document.getElementById('goToActivitiesSection');
        if (activitiesBtn) {
          activitiesBtn.addEventListener('click', () => {
            const activitiesSection = document.getElementById('activities');
            if (activitiesSection) {
              activitiesSection.scrollIntoView({ behavior: 'smooth' });
            }
            activityPrompt.remove();
          });
        }
        
        // Auto-remove after 10 seconds if no action taken
        setTimeout(() => {
          if (document.body.contains(activityPrompt)) {
            activityPrompt.remove();
          }
        }, 10000);
      }
    };
    
    NotificationService.addEventListener('activity', handleActivityNotification);
    
    return () => {
      NotificationService.removeEventListener('activity', handleActivityNotification);
    };
  }, [activeActivity, activityCompleted]);

  const startActivity = (activityId: string) => {
    const activity = activities[activityId];
    if (!activity) return;

    setActiveActivity(activityId);
    setActivityCompleted(false);
    setShowActivityPrompt(false);

    // Show activity steps in a modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50';
    modal.innerHTML = `
      <div class="bg-[#e0e5ec] rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-bold text-gray-700 mb-2">${activity.title}</h3>
        <p class="text-gray-600 mb-4">Duration: ${activity.duration}</p>
        
        <div class="mb-4">
          <h4 class="font-medium text-gray-700 mb-2">Steps:</h4>
          <ol class="list-decimal list-inside text-gray-600">
            ${activity.steps.map(step => `<li class="mb-1">${step}</li>`).join('')}
          </ol>
        </div>
        
        <div class="flex justify-end">
          <button id="completeActivity" class="bg-green-500 text-white rounded-lg px-4 py-2 mr-2">
            Mark Complete
          </button>
          <button id="cancelActivity" class="bg-gray-300 text-gray-700 rounded-lg px-4 py-2">
            Cancel
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle complete button
    const completeBtn = document.getElementById('completeActivity');
    if (completeBtn) {
      completeBtn.addEventListener('click', () => {
        setActivityCompleted(true);
        
        // Update timestamp in notification service
        NotificationService.updateTimestamp('lastActivity');
        
        // Show completion alert/toast
        NotificationService.showNotification(
          'Activity Completed', 
          `Great job! You completed the ${activity.title} activity.`
        );
        
        modal.remove();
      });
    }
    
    // Handle cancel button
    const cancelBtn = document.getElementById('cancelActivity');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        setActiveActivity(null);
        modal.remove();
      });
    }
  };

  return (
    <div className="neo-box p-6" id="activities">
      <h2 className="text-2xl font-bold text-gray-700 mb-6">Manager Wellness Activities</h2>
      
      {showActivityPrompt && (
        <div className="neo-box p-4 mb-6 bg-blue-50">
          <div className="flex items-center">
            <div className="mr-4 text-blue-500">
              <i className="bi bi-info-circle text-2xl"></i>
            </div>
            <div>
              <p className="text-gray-700">
                It's time for your scheduled wellness activity. Choose one of the activities below to complete.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="neo-box p-4">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Leadership Meditation</h3>
          <p className="text-gray-600 mb-3">5-minute mindfulness for leaders</p>
          <button 
            className="neo-button w-full p-2" 
            onClick={() => startActivity('meditation')}
          >
            Start Activity
          </button>
        </div>
        <div className="neo-box p-4">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Decision Making Exercise</h3>
          <p className="text-gray-600 mb-3">Improve clarity in decision making</p>
          <button 
            className="neo-button w-full p-2" 
            onClick={() => startActivity('decision-making')}
          >
            Start Activity
          </button>
        </div>
        <div className="neo-box p-4">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Team Building Activity</h3>
          <p className="text-gray-600 mb-3">Quick team engagement exercise</p>
          <button 
            className="neo-button w-full p-2" 
            onClick={() => startActivity('team-building')}
          >
            Start Activity
          </button>
        </div>
      </div>
    </div>
  );
};

export default WellnessActivities; 