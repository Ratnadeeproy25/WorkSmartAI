import React, { useState } from 'react';
import { WellnessActivity } from './types';
import NotificationService from './NotificationService';

interface WellnessActivitiesProps {
  onActivityComplete: (activityKey: string) => void;
}

const WellnessActivities: React.FC<WellnessActivitiesProps> = ({ onActivityComplete }) => {
  const [activeActivity, setActiveActivity] = useState<string | null>(null);
  
  const activities: Record<string, WellnessActivity> = {
    stretch: {
      id: 'stretch',
      title: 'Quick Stretch',
      description: 'Simple desk exercises to relieve tension',
      duration: '5 minutes'
    },
    breathing: {
      id: 'breathing',
      title: 'Mindful Breathing',
      description: '2-minute breathing exercise',
      duration: '2 minutes'
    },
    eyeRest: {
      id: 'eye-rest',
      title: 'Eye Rest',
      description: '20-20-20 rule exercise',
      duration: '1 minute'
    }
  };

  const startActivity = (activityId: string) => {
    setActiveActivity(activityId);
    const activity = activities[activityId];
    
    // In a real app, we'd have a timer and instructions display
    alert(`Starting ${activity.title}\n\nDuration: ${activity.duration}\n\nFollow the instructions that would be displayed here.`);
    
    // Simulate activity completion
    setTimeout(() => {
      completeActivity(activityId);
    }, 3000); // In a real app, this would be the actual duration
  };

  const completeActivity = (activityId: string) => {
    setActiveActivity(null);
    onActivityComplete(activityId);
  };

  return (
    <div className="p-6 bg-[#e0e5ec] rounded-xl shadow-[10px_10px_20px_#a3b1c6,_-10px_-10px_20px_#ffffff]" id="activities">
      <h2 className="text-2xl font-bold text-gray-700 mb-6">Wellness Activities</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.values(activities).map((activity) => (
          <div 
            key={activity.id}
            className="p-5 bg-[#e0e5ec] rounded-xl shadow-[5px_5px_10px_#a3b1c6,_-5px_-5px_10px_#ffffff] hover:shadow-[8px_8px_16px_#a3b1c6,_-8px_-8px_16px_#ffffff] hover:-translate-y-2 transition-all duration-300"
          >
            <h3 className="text-lg font-medium text-gray-700 mb-2">{activity.title}</h3>
            <p className="text-gray-600 mb-3">{activity.description}</p>
            <button 
              onClick={() => startActivity(activity.id)}
              disabled={activeActivity !== null}
              className={`w-full bg-[#e0e5ec] p-2 rounded-lg shadow-[5px_5px_10px_#a3b1c6,_-5px_-5px_10px_#ffffff] hover:shadow-[8px_8px_16px_#a3b1c6,_-8px_-8px_16px_#ffffff] hover:-translate-y-1 transition-all duration-300 ${
                activeActivity !== null ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Start Activity
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WellnessActivities; 