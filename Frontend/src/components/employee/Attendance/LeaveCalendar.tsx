import React, { useState, ReactNode, useEffect, useCallback } from 'react';
import { AttendanceStatus } from '../../admin/attendance-management/types';
import attendanceService from '../../../services/attendanceService';
import leaveService from '../../../services/leaveService';

interface LeaveCalendarProps {
  leaveDates: Set<string>;
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

const LeaveCalendar: React.FC<LeaveCalendarProps> = ({ leaveDates, onLeaveDatesChange }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load calendar events for the current month
  const loadMonthEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const events: CalendarEvent[] = [];
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1; // API uses 1-indexed months

      // Load attendance records
      const startDate = formatDate(year, month - 1, 1); // Convert back to 0-indexed for formatting
      const endDate = formatDate(year, month - 1, getDaysInMonth(currentMonth));
      
      const attendanceRecords = await attendanceService.getAttendanceByRange(startDate, endDate);

      attendanceRecords.forEach(record => {
        const recordDate = new Date(record.date);
        const checkInTime = record.checkIn ? new Date(record.checkIn) : null;
        // Only check lateness if there's a check-in time
        const isLate = checkInTime ? 
          checkInTime.getHours() >= 9 && checkInTime.getMinutes() > 30 : 
          false;
        
        // Determine the status - use record.status if available, or determine based on check-in time
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

      // Load leave records
      const leaveRequests = await leaveService.getLeaveRequests();
      
      leaveRequests.forEach(leave => {
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          if (d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear()) {
            events.push({
              date: d.toISOString().split('T')[0],
              type: 'leave',
              status: leave.status,
              title: `${leave.type}`
            });
          }
        }
      });

      setCalendarEvents(events);
    } catch (err) {
      console.error('Error loading calendar events:', err);
      setError('Failed to load calendar events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    loadMonthEvents();
  }, [currentMonth, loadMonthEvents]);

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
      const isSelected = leaveDates.has(date) ? 'selected' : '';
      const weekendClass = isWeekend(currentDate) ? 'weekend' : '';
      
      days.push(
        <div 
          key={d} 
          className={`calendar-day ${todayClass} ${hasEventClass} ${isSelected} ${weekendClass} cursor-pointer hover:bg-gray-100`}
          onClick={() => handleDateClick(date)}
          title={event ? getTooltipContent(event) : ''}
        >
          <div className="date-container">
            <div className="date-number">{d}</div>
            {event && (
              <div 
                className={`indicator-dot ${getStatusColor(event)}`}
                title={getTooltipContent(event)}
              />
            )}
            {leaveDates.has(date) && (
              <div className="indicator-dot bg-purple-500" title="Selected for leave"/>
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
          <span className="text-xs text-gray-600">Selected for Leave</span>
        </div>
      </div>
          
          {leaveDates.size > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700 mb-2">Selected Leave Days: {leaveDates.size}</h4>
              <p className="text-xs text-blue-600">
                These days are selected for leave requests. Click on a date to add or remove it from your selection.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LeaveCalendar; 