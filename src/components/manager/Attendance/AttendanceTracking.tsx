import React, { useState, useEffect, useCallback } from 'react';
import CheckInOutControls from './CheckInOutControls';
import CurrentStatus from './CurrentStatus';
import { LocationData } from '../../employee/Attendance/types';

interface ManagerAttendanceRecord {
  date: string;
  checkIn: string;
  checkOut?: string;
  workHours?: number;
  location: LocationData;
  managerId: string;
}

const AttendanceTracking: React.FC = () => {
  const [workHours, setWorkHours] = useState(0);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
  const [workTimer, setWorkTimer] = useState<NodeJS.Timeout | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [managerId, setManagerId] = useState<string>('');

  // Initialize manager ID
  useEffect(() => {
    const storedManager = localStorage.getItem('currentManager');
    if (storedManager) {
      const manager = JSON.parse(storedManager);
      setManagerId(manager.id);
    }
  }, []);

  // Get current location
  const getLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        error => {
          console.error('Error getting location:', error);
          setError('Please enable location services to check in/out');
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      setError('Geolocation is not supported by this browser');
    }
  }, []);

  // Start work timer
  const startWorkTimer = useCallback((startTime: Date) => {
    if (workTimer) {
      clearInterval(workTimer);
    }
    
    const timer = setInterval(() => {
      const now = new Date();
      const hoursWorked = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      setWorkHours(hoursWorked);
    }, 1000);
    
    setWorkTimer(timer);
  }, [workTimer]);

  // Stop work timer
  const stopWorkTimer = useCallback(() => {
    if (workTimer) {
      clearInterval(workTimer);
      setWorkTimer(null);
    }
  }, [workTimer]);

  // Handle check in
  const handleCheckIn = useCallback(() => {
    if (!currentLocation) {
      setError('Please enable location services to check in');
      return;
    }

    const now = new Date();
    setCheckInTime(now);
    setCheckedIn(true);
    setError(null);
    
    try {
      // Save to localStorage
      const attendance: ManagerAttendanceRecord = {
        date: now.toISOString().split('T')[0],
        checkIn: now.toISOString(),
        location: currentLocation,
        managerId: managerId
      };
      
      localStorage.setItem(`manager_attendance_${attendance.date}`, JSON.stringify(attendance));
      
      // Start work timer
      startWorkTimer(now);
      
      showNotification('Checked in successfully', 'success');
    } catch (err) {
      setError('Failed to save check-in data');
      console.error('Check-in error:', err);
    }
  }, [currentLocation, managerId, startWorkTimer]);

  // Handle check out
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
    setCheckedIn(false);
    setError(null);
    
    try {
      // Calculate work hours
      const workHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      setWorkHours(workHours);
      
      // Update attendance record
      const today = now.toISOString().split('T')[0];
      const attendanceKey = `manager_attendance_${today}`;
      const existingRecord = localStorage.getItem(attendanceKey);
      
      if (!existingRecord) {
        setError('Could not find check-in record');
        return;
      }

      const attendance = JSON.parse(existingRecord) as ManagerAttendanceRecord;
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
      const weeklyHoursKey = `manager_weeklyHours_${managerId}_${getWeekNumber(now)}`;
      const existingWeeklyHours = JSON.parse(localStorage.getItem(weeklyHoursKey) || '0');
      localStorage.setItem(weeklyHoursKey, JSON.stringify(existingWeeklyHours + workHours));
      
    } catch (err) {
      setError('Failed to save check-out data');
      console.error('Check-out error:', err);
      // Revert state changes on error
      setCheckOutTime(null);
      setCheckedIn(true);
      setWorkHours(0);
    }
  }, [checkInTime, currentLocation, managerId, stopWorkTimer]);

  // Show notification
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

  // Get week number
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Initialize location
  useEffect(() => {
    getLocation();
  }, [getLocation]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (workTimer) {
        clearInterval(workTimer);
      }
    };
  }, [workTimer]);

  return (
    <div className="neo-box p-6">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Attendance Tracking</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Check-in/out Controls */}
      <CheckInOutControls 
        onCheckIn={handleCheckIn} 
        onCheckOut={handleCheckOut} 
        isCheckedIn={checkedIn} 
      />

      {/* Current Status */}
      <CurrentStatus 
        workHours={workHours}
        isCheckedIn={checkedIn}
        checkInTime={checkInTime}
        checkOutTime={checkOutTime}
        location={currentLocation}
      />
    </div>
  );
};

export default AttendanceTracking; 