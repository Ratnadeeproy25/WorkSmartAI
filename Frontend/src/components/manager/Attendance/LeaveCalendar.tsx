import React, { useState, useEffect } from 'react';
import { AttendanceStatus } from '../../admin/attendance-management/types';
import { LocationData } from '../../employee/Attendance/types';
import { LeaveCalendarProps } from './types';

interface CalendarEvent {
  date: string;
  type: 'attendance' | 'leave';
  status: AttendanceStatus | 'approved' | 'pending' | 'rejected';
  title: string;
  checkIn?: string;
  checkOut?: string;
  workHours?: number;
  location?: LocationData;
}

const LeaveCalendar: React.FC<LeaveCalendarProps> = ({ 
  leaveDates,
  onLeaveDatesChange
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [managerId, setManagerId] = useState<string>('');

  // Initialize manager ID
  useEffect(() => {
    const storedManager = localStorage.getItem('currentManager');
    if (storedManager) {
      const manager = JSON.parse(storedManager);
      setManagerId(manager.id);
    }
  }, []);

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
        const attendanceKey = `manager_attendance_${dateStr}`;
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
            workHours: record.workHours,
            location: record.location
          });
        }
      }

      // Load leave records
      const leaveRequests = JSON.parse(localStorage.getItem('manager_leaveRequests') || '[]');
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

  // Generate days for the current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };
  
  const days = getDaysInMonth(currentMonth);
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Format date to YYYY-MM-DD for comparison
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Check if a date is a leave date
  const isLeaveDate = (date: Date) => {
    return leaveDates.has(formatDate(date));
  };
  
  // Toggle leave date selection
  const toggleLeaveDate = (date: Date) => {
    const formattedDate = formatDate(date);
    const newLeaveDates = new Set(leaveDates);
    
    if (newLeaveDates.has(formattedDate)) {
      newLeaveDates.delete(formattedDate);
    } else {
      newLeaveDates.add(formattedDate);
    }
    
    onLeaveDatesChange(newLeaveDates);
  };
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };
  
  // Check if date is in the past
  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Leave Calendar</h3>
        
        <div className="flex space-x-2">
          <button 
            onClick={goToPreviousMonth} 
            className="p-1 rounded hover:bg-gray-100"
          >
            &lt;
          </button>
          <div className="text-gray-700">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </div>
          <button 
            onClick={goToNextMonth} 
            className="p-1 rounded hover:bg-gray-100"
          >
            &gt;
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {/* Weekday headers */}
        {weekdays.map((day, index) => (
          <div key={index} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((day, index) => (
          <div key={index} className="aspect-square">
            {day && (
              <button
                onClick={() => toggleLeaveDate(day)}
                disabled={isPastDate(day)}
                className={`w-full h-full flex items-center justify-center text-sm rounded 
                  ${isLeaveDate(day) ? 'bg-blue-100 text-blue-800' : 
                    isToday(day) ? 'bg-yellow-50 text-yellow-800 font-medium' : 
                    isPastDate(day) ? 'text-gray-400' : 
                    'hover:bg-gray-100'}`}
              >
                {day.getDate()}
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-500">
        Click on dates to request leave
      </div>
    </div>
  );
};

export default LeaveCalendar; 