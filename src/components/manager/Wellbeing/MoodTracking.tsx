import React, { useState, useEffect } from 'react';
import { useWellbeingContext } from '../../../context/WellbeingContext';
import NotificationService from './NotificationService';
import { MoodType } from './types';

const MoodTracking: React.FC = () => {
  const { updateMood } = useWellbeingContext();
  const [activeMood, setActiveMood] = useState<MoodType | null>(null);
  const [note, setNote] = useState<string>('');
  const [showNoteInput, setShowNoteInput] = useState<boolean>(false);

  // Check for mood notifications
  useEffect(() => {
    const handleMoodNotification = () => {
      // If no mood selected yet, show prompt
      if (!activeMood) {
        // Create a visual prompt
        const moodPrompt = document.createElement('div');
        moodPrompt.className = 'fixed top-4 right-4 p-4 bg-blue-500 text-white rounded-lg shadow-lg z-50 max-w-sm';
        moodPrompt.innerHTML = `
          <div class="font-bold">Mood Check-in</div>
          <div>It's time to log your mood. How are you feeling today?</div>
          <div class="mt-2 flex justify-end">
            <button id="goToMoodSection" class="px-4 py-1 bg-white text-blue-500 rounded">Check in now</button>
          </div>
        `;
        
        document.body.appendChild(moodPrompt);
        
        // Add click event to scroll to mood section
        const moodBtn = document.getElementById('goToMoodSection');
        if (moodBtn) {
          moodBtn.addEventListener('click', () => {
            const moodSection = document.getElementById('mood');
            if (moodSection) {
              moodSection.scrollIntoView({ behavior: 'smooth' });
            }
            moodPrompt.remove();
          });
        }
        
        // Auto-remove after 10 seconds if no action taken
        setTimeout(() => {
          if (document.body.contains(moodPrompt)) {
            moodPrompt.remove();
          }
        }, 10000);
      }
    };
    
    NotificationService.addEventListener('mood', handleMoodNotification);
    
    return () => {
      NotificationService.removeEventListener('mood', handleMoodNotification);
    };
  }, [activeMood]);

  const handleMoodSelect = (mood: MoodType) => {
    setActiveMood(mood);
    updateMood(mood);
    
    // Show note input after mood selection
    setShowNoteInput(true);
    
    // Update timestamp in notification service to track when mood was recorded
    NotificationService.updateTimestamp('lastMood');
  };
  
  const handleNoteSubmit = () => {
    if (activeMood) {
      // Store mood entry with note - typically would go to API/persistence
      const moodEntry = {
        mood: activeMood,
        timestamp: new Date().toISOString(),
        note: note || undefined
      };
      
      console.log('Mood entry saved:', moodEntry);
      
      // Reset note field but keep the selected mood
      setNote('');
      setShowNoteInput(false);
    }
  };
  
  return (
    <div className="neo-box p-6" id="mood">
      <h2 className="text-2xl font-bold text-gray-700 mb-6">How are you feeling today?</h2>
      <div className="flex justify-around mb-6 mood-buttons">
        <button 
          className={`mood-btn ${activeMood === 'great' ? 'active' : ''}`} 
          onClick={() => handleMoodSelect('great')}
          data-mood="great"
        >
          <i className="bi bi-emoji-laughing text-2xl text-green-500"></i>
          <span className="block mt-2">Great</span>
        </button>
        <button 
          className={`mood-btn ${activeMood === 'good' ? 'active' : ''}`} 
          onClick={() => handleMoodSelect('good')}
          data-mood="good"
        >
          <i className="bi bi-emoji-smile text-2xl text-blue-500"></i>
          <span className="block mt-2">Good</span>
        </button>
        <button 
          className={`mood-btn ${activeMood === 'okay' ? 'active' : ''}`} 
          onClick={() => handleMoodSelect('okay')}
          data-mood="okay"
        >
          <i className="bi bi-emoji-neutral text-2xl text-yellow-500"></i>
          <span className="block mt-2">Okay</span>
        </button>
        <button 
          className={`mood-btn ${activeMood === 'bad' ? 'active' : ''}`} 
          onClick={() => handleMoodSelect('bad')}
          data-mood="bad"
        >
          <i className="bi bi-emoji-frown text-2xl text-red-500"></i>
          <span className="block mt-2">Not Great</span>
        </button>
      </div>
      
      {showNoteInput && (
        <div className="mt-4 slide-in-up">
          <label className="block text-gray-700 mb-2">Add a note about how you're feeling (optional)</label>
          <div className="flex">
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[#e0e5ec] rounded-lg p-3 shadow-[inset_5px_5px_10px_#a3b1c6,_inset_-5px_-5px_10px_#ffffff] transition-all duration-300 outline-none border-none mr-2"
              placeholder="What's on your mind today?"
              rows={3}
            />
          </div>
          <div className="mt-2 flex justify-end">
            <button 
              onClick={handleNoteSubmit}
              className="neo-button px-4 py-2"
            >
              Save Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodTracking; 