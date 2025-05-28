import React, { useState, useEffect } from 'react';
import { useWellbeingContext } from '../../../context/WellbeingContext';
import NotificationService from './NotificationService';
import { MoodType, MoodEntry } from './types';
import { recordManagerMood } from '../../../services/managerWellbeingService';

interface MoodTrackingProps {
  onMoodSelect?: (mood: MoodEntry) => void;
}

const MoodTracking: React.FC<MoodTrackingProps> = ({ onMoodSelect }) => {
  const { refreshWellbeingData } = useWellbeingContext();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Reset success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleMoodClick = async (mood: MoodType) => {
    setIsSubmitting(true);
    setError(null);
    
    // For "bad" moods, prompt for a note
    let note = '';
    if (mood === 'bad') {
      const userNote = prompt('Would you like to add a note about how you\'re feeling?');
      if (userNote) {
        note = userNote;
      }
    }

    try {
      // Create mood entry object
      const moodEntry: MoodEntry = {
        mood,
        timestamp: new Date().toISOString(),
        note
      };
      
      // Update timestamp in notification service
      NotificationService.updateTimestamp('lastMood');
      
      // Submit to backend using the dedicated service
      await recordManagerMood(mood, note);
      
      // Show wellness recommendations for not-great moods
      if (mood === 'bad' || mood === 'okay') {
        showWellnessRecommendations(mood);
      }
      
      // Call the parent callback if provided (for integration with WellbeingPage)
      if (onMoodSelect) {
        onMoodSelect(moodEntry);
      }
      
      // Refresh wellbeing data to get updated metrics from backend
      await refreshWellbeingData();
      
      setSuccess(true);
      setIsSubmitting(false);
      
    } catch (err: any) {
      console.error('Error recording mood:', err);
      setError(err.response?.data?.message || err.message || 'Failed to record mood');
      setIsSubmitting(false);
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
  
  return (
    <div className="p-6 bg-[#e0e5ec] rounded-xl shadow-[10px_10px_20px_#a3b1c6,_-10px_-10px_20px_#ffffff]" id="mood">
      <h2 className="text-2xl font-bold text-gray-700 mb-6">How are you feeling today?</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4 animate-pulse">
          <p>Mood recorded successfully! Your wellbeing metrics have been updated. Multiple positive entries will progressively improve your scores.</p>
        </div>
      )}
      
      <div className="flex justify-around flex-wrap mb-6">
        <button 
          onClick={() => handleMoodClick('great')}
          className="bg-[#e0e5ec] rounded-xl p-4 flex flex-col items-center gap-2 shadow-[5px_5px_10px_#a3b1c6,_-5px_-5px_10px_#ffffff] hover:shadow-[8px_8px_16px_#a3b1c6,_-8px_-8px_16px_#ffffff] hover:-translate-y-2 active:shadow-[inset_5px_5px_10px_#a3b1c6,_inset_-5px_-5px_10px_#ffffff] active:translate-y-0.5 transition-all duration-300 w-full max-w-[150px]"
          disabled={isSubmitting}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#10b981" className="bi bi-emoji-laughing" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M12.331 9.5a1 1 0 0 1 0 1A4.998 4.998 0 0 1 8 13a4.998 4.998 0 0 1-4.33-2.5A1 1 0 0 1 4.535 9h6.93a1 1 0 0 1 .866.5zM7 6.5c0 .828-.448 0-1 0s-1 .828-1 0S5.448 5 6 5s1 .672 1 1.5zm4 0c0 .828-.448 0-1 0s-1 .828-1 0S9.448 5 10 5s1 .672 1 1.5z"/>
          </svg>
          <span className="block mt-2">Great</span>
        </button>
        
        <button 
          onClick={() => handleMoodClick('good')}
          className="bg-[#e0e5ec] rounded-xl p-4 flex flex-col items-center gap-2 shadow-[5px_5px_10px_#a3b1c6,_-5px_-5px_10px_#ffffff] hover:shadow-[8px_8px_16px_#a3b1c6,_-8px_-8px_16px_#ffffff] hover:-translate-y-2 active:shadow-[inset_5px_5px_10px_#a3b1c6,_inset_-5px_-5px_10px_#ffffff] active:translate-y-0.5 transition-all duration-300 w-full max-w-[150px]"
          disabled={isSubmitting}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#3b82f6" className="bi bi-emoji-smile" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M4.285 9.567a.5.5 0 0 1 .683.183A3.498 3.498 0 0 0 8 11.5a3.498 3.498 0 0 0 3.032-1.75.5.5 0 1 1 .866.5A4.498 4.498 0 0 1 8 12.5a4.498 4.498 0 0 1-3.898-2.25.5.5 0 0 1 .183-.683zM7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5zm4 0c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5z"/>
          </svg>
          <span className="block mt-2">Good</span>
        </button>
        
        <button 
          onClick={() => handleMoodClick('okay')}
          className="bg-[#e0e5ec] rounded-xl p-4 flex flex-col items-center gap-2 shadow-[5px_5px_10px_#a3b1c6,_-5px_-5px_10px_#ffffff] hover:shadow-[8px_8px_16px_#a3b1c6,_-8px_-8px_16px_#ffffff] hover:-translate-y-2 active:shadow-[inset_5px_5px_10px_#a3b1c6,_inset_-5px_-5px_10px_#ffffff] active:translate-y-0.5 transition-all duration-300 w-full max-w-[150px]"
          disabled={isSubmitting}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#eab308" className="bi bi-emoji-neutral" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M4 10.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm3-4C7 5.672 6.552 5 6 5s-1 .672-1 1.5S5.448 8 6 8s1-.672 1-1.5zm4 0c0-.828-.448-1.5-1-1.5s-1 .672-1 1.5S9.448 8 10 8s1-.672 1-1.5z"/>
          </svg>
          <span className="block mt-2">Okay</span>
        </button>
        
        <button 
          onClick={() => handleMoodClick('bad')}
          className="bg-[#e0e5ec] rounded-xl p-4 flex flex-col items-center gap-2 shadow-[5px_5px_10px_#a3b1c6,_-5px_-5px_10px_#ffffff] hover:shadow-[8px_8px_16px_#a3b1c6,_-8px_-8px_16px_#ffffff] hover:-translate-y-2 active:shadow-[inset_5px_5px_10px_#a3b1c6,_inset_-5px_-5px_10px_#ffffff] active:translate-y-0.5 transition-all duration-300 w-full max-w-[150px]"
          disabled={isSubmitting}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#ef4444" className="bi bi-emoji-frown" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M4.285 12.433a.5.5 0 0 0 .683-.183A3.498 3.498 0 0 1 8 10.5c1.295 0 2.426.703 3.032 1.75a.5.5 0 0 0 .866-.5A4.498 4.498 0 0 0 8 9.5a4.5 4.5 0 0 0-3.898 2.25.5.5 0 0 0 .183.683zM7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5zm4 0c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5z"/>
          </svg>
          <span className="block mt-2">Not Great</span>
        </button>
      </div>
      
      {isSubmitting && (
        <div className="text-center text-gray-600">
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Recording your mood...
          </span>
        </div>
      )}
    </div>
  );
};

export default MoodTracking; 