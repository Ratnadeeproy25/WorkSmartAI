import React, { useState, ReactNode, useEffect } from 'react';
import { AttendanceStatus } from '../../admin/attendance-management/types';

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

  // Load calendar events for the current month
  useEffect(() => {
    const loadMonthEvents = () => {
      const events: CalendarEvent[] = [];
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      // Load attendance records
      for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const attendanceKey = `attendance_${dateStr}`;
        const attendanceRecord = localStorage.getItem(attendanceKey);

        if (attendanceRecord) {
          const record = JSON.parse(attendanceRecord);
          const checkInTime = new Date(record.checkIn);
          const isLate = checkInTime.getHours() >= 9 && checkInTime.getMinutes() > 30;
          
          events.push({
            date: dateStr,
            type: 'attendance',
            status: isLate ? 'late' : 'present',
            title: isLate ? 'Late Arrival' : 'Present',
            checkIn: record.checkIn,
            checkOut: record.checkOut,
            workHours: record.workHours
          });
        }
      }

      // Load leave records
      const leaveRequests = JSON.parse(localStorage.getItem('leaveRequests') || '[]');
      leaveRequests.forEach((leave: any) => {
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          if (d.getMonth() === month && d.getFullYear() === year) {
            events.push({
              date: d.toISOString().split('T')[0],
              type: 'leave',
              status: leave.status,
              title: `${leave.type} Leave`
            });
          }
        }
      });

      setCalendarEvents(events);
    };

    loadMonthEvents();
  }, [currentMonth]);

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
      
      days.push(
        <div 
          key={d} 
          className={`calendar-day ${todayClass} ${hasEventClass} ${isSelected} cursor-pointer hover:bg-gray-100`}
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
    </div>
  );
};

export default LeaveCalendar; 