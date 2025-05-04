import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from '../Sidebar';
import AttendanceHeader from './AttendanceHeader';
import CheckInOutControls from './CheckInOutControls';
import CurrentStatus from './CurrentStatus';
import LeaveBalanceSummary from './LeaveBalanceSummary';
import LeaveCalendar from './LeaveCalendar';
import AttendanceReports from './AttendanceReports';
import { AttendanceRecord, LocationData, LeaveBalance, WeeklyHours, AttendanceStats, Employee } from './types';
import { AttendanceStatus } from '../../admin/attendance-management/types';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../../styles/employee/attendance.css';

const AttendancePage: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
  const [hoursWorked, setHoursWorked] = useState<string>('0.00');
  const [locationStatus, setLocationStatus] = useState<string>('-');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [workTimer, setWorkTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [leaveDates, setLeaveDates] = useState<Set<string>>(new Set());

  // Mock data for the components
  const leaveBalances: LeaveBalance[] = useMemo(() => [
    { type: 'Annual Leave', used: 5, total: 20, remaining: 15, color: '#3b82f6' },
    { type: 'Sick Leave', used: 2, total: 10, remaining: 8, color: '#ef4444' },
    { type: 'Personal Leave', used: 2, total: 5, remaining: 3, color: '#10b981' }
  ], []);

  const weeklyHours: WeeklyHours[] = useMemo(() => [
    { day: 'Mon', hours: 7.5 },
    { day: 'Tue', hours: 8.0 },
    { day: 'Wed', hours: 7.0 },
    { day: 'Thu', hours: 8.5 },
    { day: 'Fri', hours: 7.5 }
  ], []);

  const attendanceStats: AttendanceStats = useMemo(() => ({
    onTimePercentage: 85,
    latePercentage: 15,
    averageHours: 7.5
  }), []);

  // Mock current employee for demo
  useEffect(() => {
    if (!localStorage.getItem('currentEmployee')) {
      localStorage.setItem('currentEmployee', JSON.stringify({ 
        id: 'EMP001', 
        name: 'John Doe', 
        email: 'john@example.com' 
      }));
    }
    
    const currentEmployee = JSON.parse(localStorage.getItem('currentEmployee') || '{}');
    setEmployee(currentEmployee);
  }, []);

  // Get current status based on check-in/out times and leave dates
  const getCurrentStatus = useCallback((): AttendanceStatus => {
    const today = new Date().toISOString().split('T')[0];
    if (leaveDates.has(today)) return 'leave';
    if (!checkInTime) return 'absent';
    if (checkOutTime) return 'present';
    return 'present';
  }, [checkInTime, checkOutTime, leaveDates]);

  // Memoize location update function
  const updateLocationStatus = useCallback((location: LocationData) => {
    const officeLocation = { lat: 0, lng: 0 }; // Replace with actual office coordinates
    const distance = calculateDistance(location, officeLocation);
    const isInOffice = distance <= 0.1; // Within 100 meters of office

    setLocationStatus(isInOffice ? 'At Office' : 'Remote');
  }, []);

  // Memoize location fetching
  const getLocation = useCallback(() => {
    setIsLoading(true);
    setError(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          updateLocationStatus(location);
          setIsLoading(false);
        },
        error => {
          console.error('Error getting location:', error);
          setError('Please enable location services to check in/out');
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      setError('Geolocation is not supported by this browser');
      setIsLoading(false);
    }
  }, [updateLocationStatus]);

  // Memoize work timer functions
  const startWorkTimer = useCallback((startTime: Date) => {
    if (workTimer) {
      clearInterval(workTimer);
    }
    
    const timer = setInterval(() => {
      const now = new Date();
      const hoursWorked = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      setHoursWorked(hoursWorked.toFixed(2));
    }, 1000);
    
    setWorkTimer(timer);
  }, [workTimer]);

  const stopWorkTimer = useCallback(() => {
    if (workTimer) {
      clearInterval(workTimer);
      setWorkTimer(null);
    }
  }, [workTimer]);

  // Memoize check-in handler
  const handleCheckIn = useCallback(() => {
    if (!currentLocation) {
      setError('Please enable location services to check in');
      return;
    }

    const now = new Date();
    setCheckInTime(now);
    setError(null);
    
    try {
      // Save to localStorage
      const attendance: AttendanceRecord = {
        date: now.toISOString().split('T')[0],
        checkIn: now.toISOString(),
        location: currentLocation,
        employeeId: employee?.id || ''
      };
      
      localStorage.setItem(`attendance_${attendance.date}`, JSON.stringify(attendance));
      
      // Start work timer
      startWorkTimer(now);
      
      showNotification('Checked in successfully', 'success');
    } catch (err) {
      setError('Failed to save check-in data');
      console.error('Check-in error:', err);
    }
  }, [currentLocation, employee]);

  // Memoize check-out handler
  const handleCheckOut = useCallback(() => {
    if (!checkInTime) {
      setError('You need to check in first');
      return;
    }

    if (!currentLocation) {
      setError('Please enable location services to check out');
      return;
    }

    const now = new Date();
    const checkInDate = new Date(checkInTime);
    
    // Validate check-out time
    if (now.getTime() - checkInDate.getTime() < 60000) { // 1 minute minimum
      setError('Check-out time must be at least 1 minute after check-in');
      return;
    }

    setCheckOutTime(now);
    setError(null);
    
    try {
      // Calculate work hours
      const workHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      setHoursWorked(workHours.toFixed(2));
      
      // Update attendance record
      const today = now.toISOString().split('T')[0];
      const attendanceKey = `attendance_${today}`;
      const existingRecord = localStorage.getItem(attendanceKey);
      
      if (!existingRecord) {
        setError('Could not find check-in record');
        return;
      }

      const attendance = JSON.parse(existingRecord) as AttendanceRecord;
      attendance.checkOut = now.toISOString();
      attendance.workHours = workHours;
      attendance.location = {
        ...attendance.location,
        checkOutLocation: currentLocation
      };
      
      localStorage.setItem(attendanceKey, JSON.stringify(attendance));
      
      // Stop work timer
      stopWorkTimer();
      
      showNotification('Checked out successfully', 'success');
      
      // Update weekly hours in localStorage
      const weeklyHoursKey = `weeklyHours_${employee?.id}_${getWeekNumber(now)}`;
      const existingWeeklyHours = JSON.parse(localStorage.getItem(weeklyHoursKey) || '0');
      localStorage.setItem(weeklyHoursKey, JSON.stringify(existingWeeklyHours + workHours));
      
    } catch (err) {
      setError('Failed to save check-out data');
      console.error('Check-out error:', err);
      // Revert state changes on error
      setCheckOutTime(null);
      setHoursWorked('0.00');
    }
  }, [checkInTime, currentLocation, employee, stopWorkTimer]);

  // Memoize notification system
  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }, []);

  // Load saved requests and leave dates from localStorage
  useEffect(() => {
    try {
      // Load leave dates
      const savedLeaveDates = localStorage.getItem('leaveDates');
      if (savedLeaveDates) {
        setLeaveDates(new Set(JSON.parse(savedLeaveDates)));
      }

      // Check if already checked in today
      const today = new Date().toISOString().split('T')[0];
      const attendance = JSON.parse(localStorage.getItem(`attendance_${today}`) || '{}') as AttendanceRecord;
      if (attendance && attendance.checkIn) {
        if (!attendance.checkOut) {
          setCheckInTime(new Date(attendance.checkIn));
          startWorkTimer(new Date(attendance.checkIn));
        } else if (attendance.checkOut) {
          setCheckInTime(new Date(attendance.checkIn));
          setCheckOutTime(new Date(attendance.checkOut));
          setHoursWorked(attendance.workHours?.toFixed(2) || '0.00');
        }
      }
      
      return () => {
        stopWorkTimer();
      };
    } catch (err) {
      setError('Failed to load saved data');
      console.error('Load data error:', err);
    }
  }, [startWorkTimer, stopWorkTimer]);

  // Initialize location
  useEffect(() => {
    getLocation();
  }, [getLocation]);

  return (
    <div className="min-h-screen bg-[#e0e5ec]">
      <Sidebar />
      <div className="main-content p-6">
        <div className="max-w-7xl mx-auto">
          <AttendanceHeader />
          
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <CurrentStatus 
              hoursWorked={hoursWorked} 
              status={getCurrentStatus()}
              locationStatus={locationStatus}
              checkInTime={checkInTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            />
            <CheckInOutControls 
              onCheckIn={handleCheckIn} 
              onCheckOut={handleCheckOut} 
              isCheckedIn={!!checkInTime && !checkOutTime}
              isCheckedOut={!!checkOutTime}
            />
            <LeaveBalanceSummary leaveBalances={leaveBalances} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LeaveCalendar 
              leaveDates={leaveDates}
              onLeaveDatesChange={setLeaveDates}
            />
            <AttendanceReports
              weeklyHours={weeklyHours}
              attendanceStats={attendanceStats}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate distance between two points
const calculateDistance = (point1: LocationData, point2: LocationData) => {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

// Helper function to get week number
const getWeekNumber = (date: Date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

export default AttendancePage; 