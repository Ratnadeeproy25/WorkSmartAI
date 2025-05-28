import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Sidebar from '../Sidebar';
import AttendanceHeader from './AttendanceHeader';
import CheckInOutControls from './CheckInOutControls';
import CurrentStatus from './CurrentStatus';
import LeaveCalendar from './LeaveCalendar';
import AttendanceReports from './AttendanceReports';
import LeaveRequestForm from './LeaveRequestForm';
import AttendanceDebugTool from './AttendanceDebugTool';
import { AttendanceRecord, LocationData, LeaveBalance, WeeklyHours, AttendanceStats, Employee } from './types';
import { AttendanceStatus } from '../../admin/attendance-management/types';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../../styles/employee/attendance.css';
import attendanceService from '../../../services/attendanceService';
import leaveService from '../../../services/leaveService';
import { login } from '../../../services/authService';

const AttendancePage: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
  const [hoursWorked, setHoursWorked] = useState<string>('0.00');
  const [locationStatus, setLocationStatus] = useState<string>('-');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [workTimer, setWorkTimer] = useState<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leaveDates, setLeaveDates] = useState<Set<string>>(new Set());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | undefined>(undefined);
  const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(null);
  const [isLocationWithinWorkArea, setIsLocationWithinWorkArea] = useState<boolean>(false);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord | null>(null);
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours[]>([]);

  // Load the current employee
  useEffect(() => {
    const employeeData = localStorage.getItem('employeeUserData');
    if (employeeData) {
      const parsedUser = JSON.parse(employeeData);
      setEmployee({
        id: parsedUser.id,
        name: parsedUser.name,
        email: parsedUser.email
      });
      setIsLoggedIn(true);
    }
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
          
          // Check if location is within work area if employee profile is loaded
          if (employeeProfile?.officeLocation) {
            const isWithin = isWithinWorkLocation(location, employeeProfile.officeLocation);
            setIsLocationWithinWorkArea(isWithin);
          }
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
  }, [updateLocationStatus, employeeProfile]);

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

  // Load attendance data
  const loadAttendanceData = useCallback(async () => {
    setError(null); // Clear previous errors
    
    try {
      // Check if user is logged in first
      if (!isLoggedIn) {
        setError('Please log in to view attendance data');
        return;
      }

      // Validate employee data
      if (!employee || !employee.id) {
        setError('Employee data not found. Please log in again.');
        return;
      }
      
      // Load today's attendance with better error handling
      const attendanceData = await attendanceService.getTodayAttendance();
      
      if (attendanceData) {
        if (attendanceData.checkIn) {
          const checkInDate = new Date(attendanceData.checkIn);
          setCheckInTime(checkInDate);
          
          if (!attendanceData.checkOut) {
            // Still checked in, start timer
            startWorkTimer(checkInDate);
          } else {
            // Already checked out
            const checkOutDate = new Date(attendanceData.checkOut);
            setCheckOutTime(checkOutDate);
            setHoursWorked(attendanceData.workHours?.toFixed(2) || '0.00');
          }
        }
      }
      
      // Load leave dates with error handling
      try {
      const leaveDatesList = await leaveService.getLeaveDates();
      setLeaveDates(new Set(leaveDatesList));
      } catch (leaveError: any) {
        console.error('Error loading leave dates:', leaveError);
        // Don't fail the whole process for leave dates
        setLeaveDates(new Set()); // Set empty set as fallback
      }
      
      // Load attendance stats with error handling
      try {
      const { weeklyHours: hours, attendanceStats: stats } = await attendanceService.getAttendanceStats();
      setWeeklyHours(hours);
      setAttendanceStats(stats);
      } catch (statsError: any) {
        console.error('Error loading attendance stats:', statsError);
        // Don't fail the whole process for stats
        setWeeklyHours([]);
        setAttendanceStats(undefined);
      }
      
    } catch (err: any) {
      console.error('Error loading attendance data:', err);
      
      // Provide specific error messages based on error type
      let errorMessage = 'Failed to load attendance data';
      
      if (err.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (err.status === 403) {
        errorMessage = 'Access denied. You don\'t have permission to view attendance data.';
      } else if (err.status === 0 || err.message?.includes('Network Error')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else if (err.status === 408 || err.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  }, [startWorkTimer, isLoggedIn, employee]);

  // Memoize check-in handler
  const handleCheckIn = useCallback(async () => {
    if (!isLoggedIn) {
      setError('Please log in first');
      return;
    }

    if (!currentLocation) {
      setError('Please enable location services to check in');
      return;
    }

    if (employeeProfile?.officeLocation && !isLocationWithinWorkArea) {
      setError('You are not at your designated work location');
      return;
    }
    
    try {
      // Call check-in API
      await attendanceService.checkIn(currentLocation);
      
      const now = new Date();
      setCheckInTime(now);
      
      // Start work timer
      startWorkTimer(now);
      
      showNotification('Checked in successfully', 'success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to check in');
    }
  }, [currentLocation, startWorkTimer, isLoggedIn, employeeProfile, isLocationWithinWorkArea]);

  // Memoize check-out handler
  const handleCheckOut = useCallback(async () => {
    if (!isLoggedIn) {
      setError('Please log in first');
      return;
    }

    if (!checkInTime) {
      setError('You need to check in first');
      return;
    }

    if (!currentLocation) {
      setError('Please enable location services to check out');
      return;
    }

    try {
      // Call check-out API
      const attendanceData = await attendanceService.checkOut(currentLocation);
      
      const now = new Date();
      setCheckOutTime(now);
      
      // Update work hours
      if (attendanceData.workHours) {
        setHoursWorked(attendanceData.workHours.toFixed(2));
      }
      
      // Stop work timer
      stopWorkTimer();
      
      showNotification('Checked out successfully', 'success');
      
      // Refresh stats
      const { weeklyHours: hours, attendanceStats: stats } = await attendanceService.getAttendanceStats();
      setWeeklyHours(hours);
      setAttendanceStats(stats);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to check out');
    }
  }, [checkInTime, currentLocation, stopWorkTimer, isLoggedIn]);

  // Handle leave dates change
  const handleLeaveDatesChange = useCallback(async (dates: Set<string>) => {
    setLeaveDates(dates);
    // Note: This is a UI-only feature for now 
    // In a full implementation, this would call an API to request leave
  }, []);

  // Memoize notification system
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } text-white`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }, []);

  // Initialize
  useEffect(() => {
    getLocation();
  }, [getLocation]);

  // Load attendance data only after employee is confirmed to be logged in
  useEffect(() => {
    // Only load attendance data if logged in and employee data exists
    if (isLoggedIn && employee) {
      loadAttendanceData();
    } else if (isLoggedIn && !employee) {
      setError('Employee data not found. Please refresh the page or log in again.');
      }
      
      return () => {
        stopWorkTimer();
      };
  }, [loadAttendanceData, stopWorkTimer, isLoggedIn, employee]);

  // Update location check when location or profile changes
  useEffect(() => {
    if (currentLocation && employeeProfile?.officeLocation) {
      const isWithin = isWithinWorkLocation(currentLocation, employeeProfile.officeLocation);
      setIsLocationWithinWorkArea(isWithin);
    }
  }, [currentLocation, employeeProfile]);

  return (
    <div className="min-h-screen bg-[#e0e5ec]">
      <Sidebar />
      <div className="main-content p-6">
        <div className="max-w-7xl mx-auto">
          <AttendanceHeader />
          
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <i className="bi bi-exclamation-triangle"></i>
                    Attendance Data Error
                  </h4>
                  <p className="mb-3">{error}</p>
                  
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        setError(null);
                        if (isLoggedIn && employee) {
                          loadAttendanceData();
                        }
                      }}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      <i className="bi bi-arrow-clockwise mr-1"></i>
                      Retry
                    </button>
                    
                    <button
                      onClick={() => {
                        setError(null);
                        // Force re-fetch employee data
                        const employeeData = localStorage.getItem('employeeUserData');
                        if (employeeData) {
                          const parsedUser = JSON.parse(employeeData);
                          setEmployee({
                            id: parsedUser.id,
                            name: parsedUser.name,
                            email: parsedUser.email
                          });
                          setIsLoggedIn(true);
                        }
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      <i className="bi bi-person-refresh mr-1"></i>
                      Refresh Session
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={() => setError(null)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            </div>
          )}
          
          {!isLoggedIn && (
            <div className="mb-6 p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Authentication Required</h3>
              <p className="mb-4">You need to be logged in to use the attendance system</p>
            </div>
          )}
          
          {isLoggedIn && (
            <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LeaveCalendar 
              leaveDates={leaveDates}
                  onLeaveDatesChange={handleLeaveDatesChange}
            />
            <AttendanceReports
              weeklyHours={weeklyHours}
              attendanceStats={attendanceStats}
            />
          </div>
            </>
          )}
          
          {/* Debug Tool - Remove in production */}
          <AttendanceDebugTool />
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
  return R * c;
};

// Helper function to check if user is within allowed work location
const isWithinWorkLocation = (userLocation: LocationData, officeLocation: LocationData, maxDistanceKm = 0.5) => {
  if (!officeLocation || !officeLocation.lat || !officeLocation.lng) {
    return true; // If no office location defined, don't restrict check-in
  }
  
  // Calculate distance using Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = (userLocation.lat - officeLocation.lat) * Math.PI / 180;
  const dLon = (userLocation.lng - officeLocation.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(officeLocation.lat * Math.PI / 180) * Math.cos(userLocation.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance <= maxDistanceKm;
};

export default AttendancePage; 