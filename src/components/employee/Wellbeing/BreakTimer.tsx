import React, { useState, useEffect, useRef } from 'react';
import { BreakHistoryEntry } from './types';
import NotificationService from './NotificationService';

interface BreakTimerProps {
  onBreakComplete: () => void;
}

const BreakTimer: React.FC<BreakTimerProps> = ({ onBreakComplete }) => {
  const [timeLeft, setTimeLeft] = useState<number>(1500); // 25 minutes in seconds
  const [isActive, setIsActive] = useState<boolean>(false);
  const [breakInterval, setBreakInterval] = useState<number>(30); // minutes
  const [breakDuration, setBreakDuration] = useState<number>(5); // minutes
  const [breakHistory, setBreakHistory] = useState<BreakHistoryEntry[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    setTimeLeft(breakInterval * 60);
  };

  // Complete break
  const completeBreak = () => {
    pauseTimer();
    
    // Add break to history
    const newBreak: BreakHistoryEntry = {
      timestamp: new Date().toISOString(),
      duration: breakDuration,
      type: 'Focus Break'
    };
    
    const updatedHistory = [newBreak, ...breakHistory].slice(0, 5); // Keep only the last 5 breaks
    setBreakHistory(updatedHistory);
    localStorage.setItem('breakHistory', JSON.stringify(updatedHistory));
    
    // Show notification
    NotificationService.showNotification('Break Time!', 'Time to take a break!');
    
    // Update timestamp in the notification service
    NotificationService.updateTimestamp('lastBreak');
    
    onBreakComplete();
  };

  // Handle interval change
  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newInterval = parseInt(e.target.value);
    setBreakInterval(newInterval);
    if (!isActive) {
      setTimeLeft(newInterval * 60);
    }
  };

  // Handle duration change
  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBreakDuration(parseInt(e.target.value));
  };

  // Load saved history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('breakHistory');
    if (savedHistory) {
      setBreakHistory(JSON.parse(savedHistory));
    }
    
    // Initialize timer to the selected interval
    setTimeLeft(breakInterval * 60);
    
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

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
              <label className="block text-gray-700 mb-2">Break Interval</label>
              <select 
                value={breakInterval}
                onChange={handleIntervalChange}
                className="w-full bg-[#e0e5ec] rounded-lg p-3 shadow-[inset_5px_5px_10px_#a3b1c6,_inset_-5px_-5px_10px_#ffffff] transition-all duration-300 outline-none border-none"
              >
                <option value={30}>Every 30 minutes</option>
                <option value={45}>Every 45 minutes</option>
                <option value={60}>Every 60 minutes</option>
              </select>
            </div>
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
              </select>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-700 mb-4">Break History</h3>
          <div className="space-y-4">
            {breakHistory.length > 0 ? (
              breakHistory.map((breakItem, index) => (
                <div 
                  key={index} 
                  className="p-4 bg-[#e0e5ec] rounded-lg shadow-[5px_5px_10px_#a3b1c6,_-5px_-5px_10px_#ffffff] hover:shadow-[8px_8px_16px_#a3b1c6,_-8px_-8px_16px_#ffffff] hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-700">{breakItem.type} Break</div>
                      <div className="text-sm text-gray-600">
                        {new Date(breakItem.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span className="text-green-600">✓</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-4">No break history yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakTimer; 