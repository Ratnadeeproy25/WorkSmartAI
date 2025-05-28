import React, { useState, useEffect, useRef } from 'react';
import { BreakHistoryEntry } from './types';
import NotificationService from './NotificationService';

interface BreakTimerProps {
  onBreakComplete: (duration: number, breakType: string) => void;
  breakHistory?: BreakHistoryEntry[];
}

const BreakTimer: React.FC<BreakTimerProps> = ({ onBreakComplete, breakHistory: propBreakHistory = [] }) => {
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes in seconds by default
  const [isActive, setIsActive] = useState<boolean>(false);
  const [breakDuration, setBreakDuration] = useState<number>(5); // minutes
  const [breakHistory, setBreakHistory] = useState<BreakHistoryEntry[]>(propBreakHistory);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [breakType, setBreakType] = useState<string>('regular');

  // Update internal state when prop changes
  useEffect(() => {
    if (propBreakHistory && propBreakHistory.length > 0) {
      setBreakHistory(propBreakHistory);
    }
  }, [propBreakHistory]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Start timer
  const startTimer = () => {
    setIsActive(true);
    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          completeBreak();
          return breakDuration * 60;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  // Pause timer
  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsActive(false);
  };

  // Reset timer
  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsActive(false);
    setTimeLeft(breakDuration * 60);
  };

  // Complete break
  const completeBreak = () => {
    pauseTimer();
    
    // Show notification
    NotificationService.showNotification('Break Time!', 'Time to take a break!');
    
    // Update timestamp in the notification service
    NotificationService.updateTimestamp('lastBreak');
    
    // Send to backend via onBreakComplete with type
    onBreakComplete(breakDuration, breakType);
    
    // Add to local break history if not coming from API
    if (propBreakHistory.length === 0) {
      const newBreakEntry: BreakHistoryEntry = {
        timestamp: new Date().toISOString(),
        duration: breakDuration,
        type: breakType || 'regular'
      };
      
      setBreakHistory(prev => [newBreakEntry, ...prev].slice(0, 5));
    }
  };

  // Handle duration change
  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDuration = parseInt(e.target.value);
    setBreakDuration(newDuration);
    if (!isActive) {
      setTimeLeft(newDuration * 60);
    }
  };

  // Handle break type change
  const handleBreakTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBreakType(e.target.value);
  };

  // Initialize timer based on selected duration
  useEffect(() => {
    // Reset timer to match selected duration
    if (!isActive) {
      setTimeLeft(breakDuration * 60);
    }
    
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [breakDuration]);

  // Format break duration for display
  const formatBreakDuration = (minutes: number): string => {
    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  };

  // Format date for display
  const formatBreakDate = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, timestamp);
      return 'Invalid date';
    }
  };

  return (
    <div className="p-6 bg-[#e0e5ec] rounded-xl shadow-[10px_10px_20px_#a3b1c6,_-10px_-10px_20px_#ffffff]" id="break">
      <h2 className="text-2xl font-bold text-gray-700 mb-6">Break Timer</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="text-center mb-6">
            <div className="text-4xl font-bold mb-4">{formatTime(timeLeft)}</div>
            <div className="flex justify-center gap-4">
              <button 
                onClick={startTimer} 
                disabled={isActive}
                className={`bg-[#e0e5ec] rounded-lg px-6 py-3 shadow-[5px_5px_10px_#a3b1c6,_-5px_-5px_10px_#ffffff] hover:shadow-[8px_8px_16px_#a3b1c6,_-8px_-8px_16px_#ffffff] transition-all duration-300 flex items-center gap-2 ${isActive ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-2'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-play-fill" viewBox="0 0 16 16">
                  <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
                </svg>
                <span>Start</span>
              </button>
              <button 
                onClick={pauseTimer}
                disabled={!isActive}
                className={`bg-[#e0e5ec] rounded-lg px-6 py-3 shadow-[5px_5px_10px_#a3b1c6,_-5px_-5px_10px_#ffffff] hover:shadow-[8px_8px_16px_#a3b1c6,_-8px_-8px_16px_#ffffff] transition-all duration-300 flex items-center gap-2 ${!isActive ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-2'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pause-fill" viewBox="0 0 16 16">
                  <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/>
                </svg>
                <span>Pause</span>
              </button>
              <button 
                onClick={resetTimer}
                className="bg-[#e0e5ec] rounded-lg px-6 py-3 shadow-[5px_5px_10px_#a3b1c6,_-5px_-5px_10px_#ffffff] hover:shadow-[8px_8px_16px_#a3b1c6,_-8px_-8px_16px_#ffffff] hover:-translate-y-2 transition-all duration-300 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-counterclockwise" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/>
                  <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/>
                </svg>
                <span>Reset</span>
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Break Duration</label>
              <select 
                value={breakDuration}
                onChange={handleDurationChange}
                className="w-full bg-[#e0e5ec] rounded-lg p-3 shadow-[inset_5px_5px_10px_#a3b1c6,_inset_-5px_-5px_10px_#ffffff] transition-all duration-300 outline-none border-none"
              >
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Break Type</label>
              <select 
                id="break-type-selector"
                value={breakType}
                onChange={handleBreakTypeChange}
                className="w-full bg-[#e0e5ec] rounded-lg p-3 shadow-[inset_5px_5px_10px_#a3b1c6,_inset_-5px_-5px_10px_#ffffff] transition-all duration-300 outline-none border-none"
              >
                <option value="regular">Regular</option>
                <option value="mindfulness">Mindfulness</option>
                <option value="exercise">Exercise</option>
                <option value="social">Social</option>
              </select>
            </div>
            <button 
              onClick={completeBreak}
              className="w-full mt-4 bg-[#e0e5ec] rounded-lg px-6 py-4 shadow-[5px_5px_10px_#a3b1c6,_-5px_-5px_10px_#ffffff] hover:shadow-[8px_8px_16px_#a3b1c6,_-8px_-8px_16px_#ffffff] hover:-translate-y-2 transition-all duration-300 flex items-center justify-center gap-2 text-blue-600 font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-check-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
              </svg>
              Complete Break Now
            </button>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-700 mb-4">Break History</h3>
          <div className="space-y-4 overflow-y-auto max-h-96">
            {breakHistory && breakHistory.length > 0 ? (
              breakHistory.map((breakItem, index) => (
                <div 
                  key={index} 
                  className="p-4 bg-[#e0e5ec] rounded-lg shadow-[5px_5px_10px_#a3b1c6,_-5px_-5px_10px_#ffffff] hover:shadow-[8px_8px_16px_#a3b1c6,_-8px_-8px_16px_#ffffff] hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-700">
                        {breakItem.type && typeof breakItem.type === 'string' 
                          ? breakItem.type.charAt(0).toUpperCase() + breakItem.type.slice(1) 
                          : 'Regular'} Break
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatBreakDate(breakItem.timestamp)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Duration: {formatBreakDuration(breakItem.duration)}
                      </div>
                    </div>
                    <span className="text-green-600 bg-green-100 p-1 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-4 bg-[#e0e5ec] rounded-lg shadow-[inset_5px_5px_10px_#a3b1c6,_inset_-5px_-5px_10px_#ffffff] p-6">
                <div className="flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No break history yet</p>
                  <p className="text-sm mt-2">Complete a break to see it here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakTimer; 