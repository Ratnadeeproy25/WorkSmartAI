import React, { useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { AttendanceStatus } from '../../admin/attendance-management/types';
import attendanceService from '../../../services/attendanceService';
import leaveService from '../../../services/leaveService';

interface LeaveCalendarProps {
  leaveDates: Set<string>; // User-selected dates for leave requests
  approvedLeaveDates?: Set<string>; // Approved leave dates (read-only)
  onLeaveDatesChange: (dates: Set<string>) => void;
}

interface CalendarEvent {
  date: string;
  type: 'leave' | 'attendance';
  status: AttendanceStatus | 'approved' | 'pending' | 'rejected';
  title: string;
  checkIn?: string;
  checkOut?: string;
  workHours?: number;
}

// Cache interface for month data
interface MonthCache {
  [monthKey: string]: {
    events: CalendarEvent[];
    timestamp: number;
  };
}

const LeaveCalendar: React.FC<LeaveCalendarProps> = ({ leaveDates, approvedLeaveDates, onLeaveDatesChange }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Add cache for month data to prevent repeated API calls
  const cacheRef = useRef<MonthCache>({});
  const loadingRef = useRef<Set<string>>(new Set()); // Track which months are currently loading
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  // Get cache key for a given month
  const getCacheKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth()}`;
  };

  // Check if cached data is still valid
  const isCacheValid = (cacheEntry: { events: CalendarEvent[]; timestamp: number }) => {
    return Date.now() - cacheEntry.timestamp < CACHE_DURATION;
  };

  // Load calendar events for the current month with caching and debouncing
  const loadMonthEvents = useCallback(async (targetMonth?: Date) => {
    const monthToLoad = targetMonth || currentMonth;
    const cacheKey = getCacheKey(monthToLoad);
    
    // Check if this month is already being loaded
    if (loadingRef.current.has(cacheKey)) {
      // console.log(`Already loading data for ${cacheKey}, skipping...`);
      return;
    }

    // Check cache first
    const cachedData = cacheRef.current[cacheKey];
    if (cachedData && isCacheValid(cachedData)) {
      // console.log(`Using cached data for ${cacheKey}`);
      setCalendarEvents(cachedData.events);
      setLoading(false);
      setError(null);
      return;
    }

    // Clear any existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the API calls to prevent rapid successive calls
    debounceRef.current = setTimeout(async () => {
      // Double-check if still needed after debounce
      if (loadingRef.current.has(cacheKey)) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        loadingRef.current.add(cacheKey); // Mark as loading

        const events: CalendarEvent[] = [];
        const year = monthToLoad.getFullYear();
        const month = monthToLoad.getMonth() + 1; // API uses 1-indexed months

        // Load attendance records with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        );

        try {
          const startDate = formatDate(year, month - 1, 1);
          const endDate = formatDate(year, month - 1, getDaysInMonth(monthToLoad));
          
          const attendanceRecords = await Promise.race([
            attendanceService.getAttendanceByRange(startDate, endDate),
            timeoutPromise
          ]) as any[];

          attendanceRecords.forEach(record => {
            const recordDate = new Date(record.date);
            const checkInTime = record.checkIn ? new Date(record.checkIn) : null;
            const isLate = checkInTime ? 
              checkInTime.getHours() >= 9 && checkInTime.getMinutes() > 30 : 
              false;
            
            const attendanceStatus = record.status || (isLate ? 'late' : 'present');
              
            events.push({
              date: recordDate.toISOString().split('T')[0],
              type: 'attendance',
              status: attendanceStatus as AttendanceStatus,
              title: attendanceStatus === 'late' ? 'Late Arrival' : 'Present',
              checkIn: record.checkIn,
              checkOut: record.checkOut,
              workHours: record.workHours
            });
          });
        } catch (attendanceError) {
          // console.error('Error loading attendance records:', attendanceError);
          // Continue loading other data even if attendance fails
        }

        // Load leave records with timeout
        try {
          const leaveRequests = await Promise.race([
            leaveService.getLeaveRequests(),
            timeoutPromise
          ]) as any[];
          
          if (leaveRequests && leaveRequests.length > 0) {
            leaveRequests.forEach(leave => {
              const startDate = new Date(leave.startDate);
              const endDate = new Date(leave.endDate);
              
              for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                if (d.getMonth() === monthToLoad.getMonth() && d.getFullYear() === monthToLoad.getFullYear()) {
                  events.push({
                    date: d.toISOString().split('T')[0],
                    type: 'leave',
                    status: leave.status,
                    title: `${leave.type}`
                  });
                }
              }
            });
          } else {
            // console.log('No leave requests found for calendar display');
          }
        } catch (leaveError: any) {
          // console.error('Error loading leave records:', leaveError);
          
          // Don't show error for specific cases where it's expected
          if (leaveError.response?.status !== 404 && !leaveError.message?.includes('Access denied')) {
            // console.warn('Leave calendar may not be available:', leaveError.message);
          }
          // Continue even if leave data fails - calendar will show attendance only
        }

        // Cache the results
        cacheRef.current[cacheKey] = {
          events,
          timestamp: Date.now()
        };

        setCalendarEvents(events);
        
        // Clean up old cache entries (keep only last 3 months)
        const cacheKeys = Object.keys(cacheRef.current);
        if (cacheKeys.length > 3) {
          const sortedKeys = cacheKeys.sort().slice(0, -3);
          sortedKeys.forEach(key => delete cacheRef.current[key]);
        }
        
      } catch (err: any) {
        // console.error('Error loading calendar events:', err);
        
        let errorMessage = 'Failed to load calendar events.';
        if (err.message === 'Request timeout') {
          errorMessage = 'Request timed out. The server may be overloaded. Please try again later.';
        } else if (err.status === 429) {
          errorMessage = 'Too many requests. Please wait a moment before trying again.';
        } else if (err.status === 0 || err.message?.includes('Network Error')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
        loadingRef.current.delete(cacheKey); // Mark as no longer loading
      }
    }, 300); // 300ms debounce
  }, [currentMonth]);

  // Use effect with proper cleanup and month change detection
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (mounted) {
        await loadMonthEvents(currentMonth);
      }
    };

    loadData();

    return () => {
      mounted = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [currentMonth.getFullYear(), currentMonth.getMonth()]); // Only depend on year and month

  // Function to get days in month
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Function to get day of week for first day of month
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Format date to YYYY-MM-DD
  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Handle date click for leave selection
  const handleDateClick = (date: string) => {
    // Don't allow selecting dates that are already approved leave dates
    if (approvedLeaveDates?.has(date)) {
      // console.log('Cannot select date that already has approved leave:', date);
      return;
    }

    // Don't allow selecting dates in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    if (selectedDate < today) {
      // console.log('Cannot select dates in the past:', date);
      return;
    }

    const newLeaveDates = new Set(leaveDates);
    if (newLeaveDates.has(date)) {
      newLeaveDates.delete(date);
    } else {
      newLeaveDates.add(date);
    }
    onLeaveDatesChange(newLeaveDates);
  };

  // Get event for a specific date
  const getEventForDate = (date: string): CalendarEvent | undefined => {
    return calendarEvents.find(event => event.date === date);
  };

  // Get status color based on event status
  const getStatusColor = (event: CalendarEvent) => {
    if (event.type === 'attendance') {
      switch (event.status) {
        case 'present': return 'bg-green-500';
        case 'late': return 'bg-yellow-500';
        case 'absent': return 'bg-red-500';
        default: return 'bg-gray-500';
      }
    } else {
      switch (event.status) {
        case 'approved': return 'bg-blue-500';
        case 'pending': return 'bg-yellow-500';
        case 'rejected': return 'bg-red-500';
        default: return 'bg-gray-500';
      }
    }
  };

  // Format time for tooltip
  const formatTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get tooltip content
  const getTooltipContent = (event: CalendarEvent) => {
    if (event.type === 'attendance') {
      return `${event.title}
Check-in: ${event.checkIn ? formatTime(event.checkIn) : 'N/A'}
Check-out: ${event.checkOut ? formatTime(event.checkOut) : 'N/A'}
Hours: ${event.workHours?.toFixed(2) || 'N/A'}`;
    }
    return `${event.title} (${event.status})`;
  };

  // Is date today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  // Is date a weekend
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  };

  // Render calendar
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Create blank cells for days before the first day of the month
    const blanks: ReactNode[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      blanks.push(
        <div key={`blank-${i}`} className="calendar-day empty"></div>
      );
    }
    
    // Create cells for days of the month
    const days: ReactNode[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = formatDate(year, month, d);
      const event = getEventForDate(date);
      const currentDate = new Date(year, month, d);
      const todayClass = isToday(currentDate) ? 'today' : '';
      const hasEventClass = event ? 'has-event' : '';
      const isUserSelected = leaveDates.has(date) ? 'selected' : '';
      const isApprovedLeave = approvedLeaveDates?.has(date) ? 'approved-leave' : '';
      const weekendClass = isWeekend(currentDate) ? 'weekend' : '';
      const isPastDate = currentDate < new Date() ? 'past-date' : '';
      
      days.push(
        <div 
          key={d} 
          className={`calendar-day ${todayClass} ${hasEventClass} ${isUserSelected} ${isApprovedLeave} ${weekendClass} ${isPastDate} cursor-pointer hover:bg-gray-100`}
          onClick={() => handleDateClick(date)}
          title={
            event ? getTooltipContent(event) : 
            approvedLeaveDates?.has(date) ? 'Approved Leave Day' :
            leaveDates.has(date) ? 'Selected for Leave Request' :
            isPastDate ? 'Past Date' : 
            'Click to select for leave request'
          }
        >
          <div className="date-container">
            <div className="date-number">{d}</div>
            {event && (
              <div 
                className={`indicator-dot ${getStatusColor(event)}`}
                title={getTooltipContent(event)}
              />
            )}
            {/* Show blue dot for approved leave dates */}
            {approvedLeaveDates?.has(date) && !event && (
              <div className="indicator-dot bg-blue-500" title="Approved Leave Day"/>
            )}
            {/* Show purple dot for user-selected dates */}
            {leaveDates.has(date) && !approvedLeaveDates?.has(date) && (
              <div className="indicator-dot bg-purple-500" title="Selected for leave request"/>
            )}
          </div>
        </div>
      );
    }
    
    return [...blanks, ...days];
  };

  // Try to reload data if error occurs
  const handleRetry = () => {
    loadMonthEvents();
  };

  return (
    <div className="neo-box p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-700">Attendance & Leave Calendar</h3>
        <div className="flex space-x-2">
          <button className="neo-button p-2" onClick={prevMonth}>
            <i className="bi bi-chevron-left"></i>
          </button>
          <div className="flex items-center px-4 font-medium">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <button className="neo-button p-2" onClick={nextMonth}>
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
      
      {loading && (
        <div className="text-center py-8">
          <div className="spinner"></div>
          <p className="mt-3 text-gray-600">Loading calendar...</p>
        </div>
      )}
      
      {error && (
        <div className="text-center py-4 neo-box bg-red-50 p-4">
          <p className="text-red-600 mb-2">{error}</p>
          <button 
            onClick={handleRetry}
            className="neo-button px-4 py-2 mt-2 bg-blue-500 text-white"
          >
            Try Again
          </button>
        </div>
      )}
      
      {!loading && !error && (
        <>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <div key={index} className="text-center text-gray-600 font-medium text-sm">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {renderCalendar()}
      </div>
      
      <div className="mt-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-xs text-gray-600">Present</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-xs text-gray-600">Late</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-xs text-gray-600">Approved Leave</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span className="text-xs text-gray-600">Selected for Request</span>
        </div>
      </div>
          
          {leaveDates.size > 0 && (
            <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="text-sm font-medium text-purple-700 mb-2">
                <i className="bi bi-calendar-check mr-2"></i>
                Selected Dates for Leave Request: {leaveDates.size}
              </h4>
              <p className="text-xs text-purple-600 mb-2">
                These dates are selected for submitting a new leave request. Click on a date to add or remove it from your selection.
              </p>
              <p className="text-xs text-gray-500">
                Note: You cannot select dates that already have approved leave or dates in the past.
              </p>
            </div>
          )}
          
          {approvedLeaveDates && approvedLeaveDates.size > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-700 mb-2">
                <i className="bi bi-calendar-event mr-2"></i>
                Approved Leave Days: {approvedLeaveDates.size}
              </h4>
              <p className="text-xs text-blue-600">
                These are your approved leave dates. They are shown with blue indicators and cannot be modified.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LeaveCalendar; 