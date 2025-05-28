import React, { useState, useEffect } from 'react';
import { useWellbeingContext } from '../../../context/WellbeingContext';
import NotificationService from './NotificationService';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import WellbeingService from '../../../services/wellbeingService';
import { getManagerAuthHeaders } from '../../../services/authService';

interface BreakHistoryItem {
  id: string;
  type: string;
  startTime: string;
  duration: number;
  completed: boolean;
}

interface BreakResponse {
  breakId: string;
  message: string;
  startTime: string;
}

interface BreakHistoryResponse {
  breakHistory: Array<{
    _id: string;
    type: string;
    startTime: string;
    duration: number;
    endTime?: string;
  }>;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const BreakTimer: React.FC = () => {
  const { refreshWellbeingData } = useWellbeingContext();
  const { userId, token } = useAuth();
  const [timeLeft, setTimeLeft] = useState(5 * 60); // Default 5 minutes in seconds
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const [breakDuration, setBreakDuration] = useState<number>(5);
  const [breakType, setBreakType] = useState<string>('regular');
  const [breakHistory, setBreakHistory] = useState<BreakHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBreakId, setCurrentBreakId] = useState<string | null>(null);
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Start timer and record break in backend
  const startTimer = async () => {
    if (!timerId) {
      setLoading(true);
      setError(null);
      
      try {
        if (!token || !userId) {
          setError('Authentication required');
          setLoading(false);
          return;
        }
        
        // Start break in backend - direct API call with auth headers
        const response = await axios.post(
          `${API_URL}/manager/wellbeing/breaks/start`, 
          { 
            type: breakType,
            duration: breakDuration
          },
          { headers: getManagerAuthHeaders() }
        );
        
        // Save the break ID for ending later
        const data = response.data as BreakResponse;
        const breakId = data.breakId;
        setCurrentBreakId(breakId);
        
        // Start the timer
        const id = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              if (breakId) {
                endBreak(breakId);
              }
              clearInterval(id);
              setTimerId(null);
              return breakDuration * 60; // Reset to break duration
            }
            return prev - 1;
          });
        }, 1000);
        
        setTimerId(id);
        setLoading(false);
        
      } catch (err: any) {
        console.error('Error starting break:', err);
        setError(err.response?.data?.message || 'Failed to start break');
        setLoading(false);
      }
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
    setTimeLeft(breakDuration * 60); // Reset to break duration
  };
  
  // End break in backend
  const endBreak = async (breakId: string) => {
    if (!breakId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (!token || !userId) {
        setError('Authentication required');
        setLoading(false);
        return;
      }
      
      // End break in backend - direct API call with auth headers
      await axios.post(
        `${API_URL}/manager/wellbeing/breaks/${breakId}/end`, 
        {},
        { headers: getManagerAuthHeaders() }
      );
      
      // Update notification timestamp
      NotificationService.updateTimestamp('lastBreak');
      
      // Show notification
      NotificationService.showNotification('Break Complete!', 'Your break has been recorded.');
      
      // Refresh wellbeing data to get updated metrics
      await refreshWellbeingData();
      
      // Refresh break history
      fetchBreakHistory();
      
      setCurrentBreakId(null);
      setLoading(false);
      
    } catch (err: any) {
      console.error('Error ending break:', err);
      setError(err.response?.data?.message || 'Failed to end break');
      setLoading(false);
    }
  };
  
  // Complete break manually
  const completeBreak = async () => {
    if (currentBreakId) {
      await endBreak(currentBreakId);
    } else {
      // If no active break, start and immediately end one
      try {
        setLoading(true);
        if (!token || !userId) {
          setError('Authentication required');
          setLoading(false);
          return;
        }
        
        // Start a new break - direct API call with auth headers
        const response = await axios.post(
          `${API_URL}/manager/wellbeing/breaks/start`,
          { type: breakType, duration: breakDuration },
          { headers: getManagerAuthHeaders() }
        );
        
        const data = response.data as BreakResponse;
        const breakId = data.breakId;
        
        // Immediately end it
        await axios.post(
          `${API_URL}/manager/wellbeing/breaks/${breakId}/end`,
          {},
          { headers: getManagerAuthHeaders() }
        );
        
        // Show notification
        NotificationService.showNotification('Break Complete!', 'Your break has been recorded.');
        
        // Refresh data
        await refreshWellbeingData();
        fetchBreakHistory();
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error completing break:', err);
        setError(err.response?.data?.message || 'Failed to complete break');
        setLoading(false);
      }
    }
  };
  
  // Handle break duration change
  const handleBreakDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const duration = parseInt(e.target.value);
    setBreakDuration(duration);
    if (!timerId) {
      setTimeLeft(duration * 60);
    }
  };
  
  // Handle break type change
  const handleBreakTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBreakType(e.target.value);
  };
  
  // Load break history from backend
  const fetchBreakHistory = async () => {
    if (!token || !userId) return;
    
    try {
      setError(null);
      
      // Direct API call with auth headers
      const response = await axios.get(
        `${API_URL}/manager/wellbeing/history?type=breaks`,
        { 
          headers: getManagerAuthHeaders(),
          params: { 
            managerId: userId // Explicitly request data for current manager
          }
        }
      );
      
      const data = response.data as { breakHistory?: Array<any> };
      
      if (data && Array.isArray(data.breakHistory)) {
        // Format break history for UI
        const formattedHistory = data.breakHistory
          .filter(item => item) // Filter out null/undefined entries
          .map((breakItem) => ({
            id: breakItem._id,
            type: breakItem.type || 'regular',
            startTime: breakItem.startTime,
            duration: breakItem.duration || 5,
            completed: !!breakItem.endTime
          }))
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()) // Sort newest first
          .slice(0, 5); // Show only last 5 breaks
        
        setBreakHistory(formattedHistory);
      } else {
        setBreakHistory([]);
      }
    } catch (err: any) {
      console.error('Error fetching break history:', err);
      setError(err.response?.data?.message || 'Failed to fetch break history');
      // Set empty history on error so UI doesn't break
      setBreakHistory([]);
    }
  };
  
  // Format break date for display
  const formatBreakDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Format break duration for display
  const formatBreakDuration = (minutes: number): string => {
    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  };
  
  useEffect(() => {
    // Try to fetch break history
    fetchBreakHistory().catch(err => {
      console.error('Error in initial break history fetch:', err);
      // Set empty history on error
      setBreakHistory([]);
    });
    
    // Initialize timer to the selected duration
    setTimeLeft(breakDuration * 60);
    
    // Cleanup on unmount
    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [token, userId, breakDuration]);
  
  return (
    <div className="p-6 bg-[#e0e5ec] rounded-xl shadow-[10px_10px_20px_#a3b1c6,_-10px_-10px_20px_#ffffff]" id="break">
      <h2 className="text-2xl font-bold text-gray-700 mb-6">Break Timer</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="text-center mb-6">
            <div className="text-4xl font-bold mb-4">{formatTime(timeLeft)}</div>
            <div className="flex justify-center gap-4">
              <button 
                onClick={startTimer} 
                disabled={!!timerId || loading}
                className={`bg-[#e0e5ec] rounded-lg px-6 py-3 shadow-[5px_5px_10px_#a3b1c6,_-5px_-5px_10px_#ffffff] hover:shadow-[8px_8px_16px_#a3b1c6,_-8px_-8px_16px_#ffffff] transition-all duration-300 flex items-center gap-2 ${(!!timerId || loading) ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-2'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-play-fill" viewBox="0 0 16 16">
                  <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
                </svg>
                <span>Start</span>
              </button>
              <button 
                onClick={pauseTimer}
                disabled={!timerId}
                className={`bg-[#e0e5ec] rounded-lg px-6 py-3 shadow-[5px_5px_10px_#a3b1c6,_-5px_-5px_10px_#ffffff] hover:shadow-[8px_8px_16px_#a3b1c6,_-8px_-8px_16px_#ffffff] transition-all duration-300 flex items-center gap-2 ${!timerId ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-2'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pause-fill" viewBox="0 0 16 16">
                  <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/>
                </svg>
                <span>Pause</span>
              </button>
              <button 
                onClick={resetTimer}
                disabled={!timerId}
                className={`bg-[#e0e5ec] rounded-lg px-6 py-3 shadow-[5px_5px_10px_#a3b1c6,_-5px_-5px_10px_#ffffff] hover:shadow-[8px_8px_16px_#a3b1c6,_-8px_-8px_16px_#ffffff] transition-all duration-300 flex items-center gap-2 ${!timerId ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-2'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-clockwise" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                  <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
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
                onChange={handleBreakDurationChange}
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
                        {breakItem.type.charAt(0).toUpperCase() + breakItem.type.slice(1)} Break
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatBreakDate(breakItem.startTime)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Duration: {formatBreakDuration(breakItem.duration)}
                      </div>
                    </div>
                    {breakItem.completed && (
                      <span className="text-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                          <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-8">
                <div className="flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No break history yet</p>
                  <p className="text-sm mt-2">Start your first break to see it here</p>
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