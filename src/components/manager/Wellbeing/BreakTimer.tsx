import React, { useState, useEffect } from 'react';
import { useWellbeingContext } from '../../../context/WellbeingContext';
import NotificationService from './NotificationService';

interface BreakHistoryItem {
  id: number;
  time: string;
  completed: boolean;
}

const BreakTimer: React.FC = () => {
  const { managerWellbeing, updateWellbeing } = useWellbeingContext();
  const [timeLeft, setTimeLeft] = useState(1500); // 25 minutes in seconds
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const [breakInterval, setBreakInterval] = useState('30');
  const [breakDuration, setBreakDuration] = useState('5');
  const [breakHistory, setBreakHistory] = useState<BreakHistoryItem[]>([]);
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Start timer
  const startTimer = () => {
    if (!timerId) {
      const id = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            addBreakHistory();
            clearInterval(id);
            setTimerId(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setTimerId(id);
    }
  };
  
  // Pause timer
  const pauseTimer = () => {
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
  };
  
  // Reset timer
  const resetTimer = () => {
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
    setTimeLeft(1500); // Reset to 25 minutes
  };
  
  // Add a break to history
  const addBreakHistory = () => {
    const now = new Date();
    const newBreak = {
      id: Date.now(),
      time: now.toLocaleTimeString(),
      completed: true
    };
    setBreakHistory(prev => [newBreak, ...prev]);
    
    // Update focus time based on breaks
    if (managerWellbeing) {
      const breaksCount = parseInt(breakInterval) / 15;
      const duration = parseInt(breakDuration);
      const focusTime = 8 - (duration * breaksCount / 60);
      
      updateWellbeing({
        workLifeBalance: {
          ...managerWellbeing.workLifeBalance,
          factors: {
            ...managerWellbeing.workLifeBalance.factors,
            breaksCount,
            focusTime
          }
        }
      });
    }
    
    // Update break timestamp in notification service
    NotificationService.updateTimestamp('lastBreak');
    
    // Show notification
    NotificationService.showNotification('Break Time!', 'Time to take a break!');
  };
  
  // Handle break interval change
  const handleBreakIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBreakInterval(e.target.value);
    
    if (managerWellbeing) {
      const breaksCount = parseInt(e.target.value) / 15;
      updateWellbeing({
        workLifeBalance: {
          ...managerWellbeing.workLifeBalance,
          factors: {
            ...managerWellbeing.workLifeBalance.factors,
            breaksCount
          }
        }
      });
    }
  };
  
  // Handle break duration change
  const handleBreakDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBreakDuration(e.target.value);
    
    if (managerWellbeing) {
      const breaksCount = parseInt(breakInterval) / 15;
      const duration = parseInt(e.target.value);
      const focusTime = 8 - (duration * breaksCount / 60);
      
      updateWellbeing({
        workLifeBalance: {
          ...managerWellbeing.workLifeBalance,
          factors: {
            ...managerWellbeing.workLifeBalance.factors,
            focusTime
          }
        }
      });
    }
  };
  
  // Setup notification listener
  useEffect(() => {
    // Add event listener for break notifications
    const handleBreakNotification = () => {
      // Only show prompt if not already on break
      if (!timerId) {
        // Display a visual indicator that it's time for a break
        const breakPrompt = document.createElement('div');
        breakPrompt.className = 'fixed top-4 right-4 p-4 bg-blue-500 text-white rounded-lg shadow-lg z-50 max-w-sm';
        breakPrompt.innerHTML = `
          <div class="font-bold">Break Time!</div>
          <div>It's time to take a break. Would you like to start your break timer?</div>
          <div class="mt-2 flex justify-end">
            <button id="startBreakNow" class="px-4 py-1 bg-white text-blue-500 rounded">Start Now</button>
          </div>
        `;
        
        document.body.appendChild(breakPrompt);
        
        // Add click event to start break
        const startBtn = document.getElementById('startBreakNow');
        if (startBtn) {
          startBtn.addEventListener('click', () => {
            startTimer();
            breakPrompt.remove();
          });
        }
        
        // Auto-remove after 10 seconds if no action taken
        setTimeout(() => {
          if (document.body.contains(breakPrompt)) {
            breakPrompt.remove();
          }
        }, 10000);
      }
    };
    
    NotificationService.addEventListener('break', handleBreakNotification);
    
    // Clean up
    return () => {
      NotificationService.removeEventListener('break', handleBreakNotification);
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [timerId]);
  
  return (
    <div className="neo-box p-6" id="break">
      <h2 className="text-2xl font-bold text-gray-700 mb-6">Break Timer</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="text-center mb-6">
            <div className="timer-display" id="timer">{formatTime(timeLeft)}</div>
            <div className="timer-buttons">
              <button 
                id="startTimer" 
                className="neo-button px-6 py-3" 
                onClick={startTimer}
                disabled={!!timerId}
              >
                <i className="bi bi-play-fill"></i> Start
              </button>
              <button 
                id="pauseTimer" 
                className="neo-button px-6 py-3" 
                onClick={pauseTimer}
                disabled={!timerId}
              >
                <i className="bi bi-pause-fill"></i> Pause
              </button>
              <button 
                id="resetTimer" 
                className="neo-button px-6 py-3" 
                onClick={resetTimer}
              >
                <i className="bi bi-arrow-counterclockwise"></i> Reset
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Break Interval</label>
              <select 
                id="breakInterval" 
                className="neo-input"
                value={breakInterval}
                onChange={handleBreakIntervalChange}
              >
                <option value="30">Every 30 minutes</option>
                <option value="45">Every 45 minutes</option>
                <option value="60">Every 60 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Break Duration</label>
              <select 
                id="breakDuration" 
                className="neo-input"
                value={breakDuration}
                onChange={handleBreakDurationChange}
              >
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
              </select>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-700 mb-4">Break History</h3>
          <div className="space-y-4" id="breakHistory">
            {breakHistory.length === 0 ? (
              <div className="text-gray-500 text-center py-4">No breaks taken yet</div>
            ) : (
              breakHistory.map(item => (
                <div className="neo-box p-4" key={item.id}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-700">Break Completed</div>
                      <div className="text-sm text-gray-600">{item.time}</div>
                    </div>
                    <span className="text-green-600">✓</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakTimer; 