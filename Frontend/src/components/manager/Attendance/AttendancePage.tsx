import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import AttendanceHeader from './AttendanceHeader';
import CurrentStatus from './CurrentStatus';
import AttendanceReports from './AttendanceReports';
import CheckInOutControls from './CheckInOutControls';
import LeaveCalendar from './LeaveCalendar';
import managerAttendanceService from '../../../services/managerAttendanceService';
import leaveService from '../../../services/leaveService';
import { AttendanceStatus } from '../../admin/attendance-management/types';
import { AttendanceRecord, LocationData, LeaveBalance, WeeklyHours, AttendanceStats, Employee } from '../../employee/Attendance/types';
import * as authService from '../../../services/authService';

const AttendancePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
  const [hoursWorked, setHoursWorked] = useState<string>('0.00');
  const [locationStatus, setLocationStatus] = useState<string>('-');
  const [manager, setManager] = useState<Employee | null>(null);
  const [workTimer, setWorkTimer] = useState<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leaveDates, setLeaveDates] = useState<Set<string>>(new Set());
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    onTimePercentage: 0,
    latePercentage: 0,
    averageHours: 0
  });
  const [isLocationWithinWorkArea, setIsLocationWithinWorkArea] = useState<boolean>(false);

  // Load the current manager
  useEffect(() => {
    // Check if we have a valid manager auth token
    const token = authService.getManagerToken();
    if (!token) {
      setError('You need to be logged in as a manager to access this page');
      setIsLoggedIn(false);
      navigate('/login');
      return;
    }
    // Check if we have a manager user in localStorage
    const managerData = localStorage.getItem('managerUserData');
    if (managerData) {
      try {
        const parsedUser = JSON.parse(managerData);
        if (parsedUser.role !== 'manager') {
          setError('Access denied. Only managers can access this page.');
          setIsLoggedIn(false);
          navigate('/login');
          return;
        }
        setManager({
          id: parsedUser._id || parsedUser.id,
          name: parsedUser.name,
          email: parsedUser.email
        });
        setIsLoggedIn(true);
      } catch (err) {
        console.error('Error parsing manager user data:', err);
        setError('Error loading manager profile. Please login again.');
        setIsLoggedIn(false);
        navigate('/login');
      }
    } else {
      setError('You need to be logged in as a manager to access this page');
      setIsLoggedIn(false);
      navigate('/login');
    }
  }, [navigate]);

  // Get current status based on check-in/out times and leave dates
  const getCurrentStatus = (): AttendanceStatus => {
    const today = new Date().toISOString().split('T')[0];
    if (leaveDates.has(today)) return 'leave';
    if (!checkInTime) return 'absent';
    if (checkOutTime) return 'present';
    return 'present';
  };

  // Location update function
  const updateLocationStatus = (location: LocationData) => {
    const officeLocation = { lat: 0, lng: 0 }; // Replace with actual office coordinates
    const distance = calculateDistance(location, officeLocation);
    const isInOffice = distance <= 0.1; // Within 100 meters of office

    setLocationStatus(isInOffice ? 'At Office' : 'Remote');
  };

  // Get location
  const getLocation = () => {
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
          
          // Check if location is within work area
          if (manager?.officeLocation) {
            const isWithin = isWithinWorkLocation(location, manager.officeLocation);
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
  };

  // Work timer functions
  const startWorkTimer = (startTime: Date) => {
    if (workTimer) {
      clearInterval(workTimer);
    }
    
    const timer = setInterval(() => {
      const now = new Date();
      const hoursWorked = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      setHoursWorked(hoursWorked.toFixed(2));
    }, 1000);
    
    setWorkTimer(timer);
  };

  const stopWorkTimer = () => {
    if (workTimer) {
      clearInterval(workTimer);
      setWorkTimer(null);
    }
  };

  // Load attendance data
  const loadAttendanceData = async () => {
    if (!isLoggedIn) {
      setError('Authentication required. Please log in first.');
      return;
    }
    
    setLoadingData(true);
    
    try {
      setError(null);
      
      // Load today's attendance
      try {
        const attendanceData = await managerAttendanceService.getTodayAttendance();
        
        if (attendanceData) {
          if (attendanceData.checkIn) {
            setCheckInTime(new Date(attendanceData.checkIn));
            
            if (!attendanceData.checkOut) {
              // Still checked in, start timer
              startWorkTimer(new Date(attendanceData.checkIn));
            } else {
              // Already checked out
              setCheckOutTime(new Date(attendanceData.checkOut));
              setHoursWorked(attendanceData.workHours?.toFixed(2) || '0.00');
            }
          }
        }
      } catch (attendanceError: any) {
        console.error('Error loading today\'s attendance:', attendanceError);
        if (attendanceError.message?.includes('Manager not found')) {
          setError('User profile error: Unable to find manager record. Please contact admin.');
        }
        // Continue with other data loading
      }
      
      try {
        // Load leave balances
        const balances = await leaveService.getLeaveBalance();
        setLeaveBalances(balances);
      } catch (leaveError) {
        console.error('Error loading leave balances:', leaveError);
        // Continue with other data loading
      }
      
      try {
        // Load leave dates
        const leaveDatesList = await leaveService.getLeaveDates();
        setLeaveDates(new Set(leaveDatesList));
      } catch (leaveDatesError) {
        console.error('Error loading leave dates:', leaveDatesError);
        // Continue with other data loading
      }
      
      try {
        // Load attendance stats
        const { weeklyHours: hours, attendanceStats: stats } = await managerAttendanceService.getAttendanceStats();
        setWeeklyHours(hours);
        setAttendanceStats(stats);
      } catch (statsError: any) {
        console.error('Error loading attendance stats:', statsError);
        if (statsError.message?.includes('Manager not found')) {
          setError('User profile error: Unable to find manager record. Please contact admin.');
        }
        // Continue with other data loading
      }
    } catch (err: any) {
      console.error('Error loading attendance data:', err);
      if (err.message?.includes('Manager not found')) {
        setError('User profile error: Unable to find manager record. Please contact admin.');
      } else {
        setError('Failed to load attendance data. Please refresh the page or try again later.');
      }
    } finally {
      setLoadingData(false);
    }
  };

  // Check-in handler
  const handleCheckIn = async () => {
    if (!isLoggedIn) {
      setError('Please log in first');
      return;
    }

    if (!currentLocation) {
      getLocation(); // Try to get location again
      setError('Please enable location services to check in');
      return;
    }

    try {
      setError(null);
      
      // Call check-in API
      await managerAttendanceService.checkIn(currentLocation);
      
      const now = new Date();
      setCheckInTime(now);
      
      // Start work timer
      startWorkTimer(now);
      
      showNotification('Checked in successfully', 'success');
      
      // Refresh attendance data to get updated records
      loadAttendanceData();
    } catch (err: any) {
      console.error('Check-in error:', err);
      if (err.message?.includes('Manager not found')) {
        setError('User profile error: Unable to find manager record. Please contact admin.');
      } else {
        const errorMessage = err.message || 'Failed to check in. Please try again.';
        setError(errorMessage);
      }
    }
  };

  // Check-out handler
  const handleCheckOut = async () => {
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
      const attendanceData = await managerAttendanceService.checkOut(currentLocation);
      
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
      try {
        const { weeklyHours: hours, attendanceStats: stats } = await managerAttendanceService.getAttendanceStats();
        setWeeklyHours(hours);
        setAttendanceStats(stats);
      } catch (statsError) {
        console.error('Error refreshing attendance stats:', statsError);
      }
    } catch (err: any) {
      console.error('Check-out error:', err);
      if (err.message?.includes('Manager not found')) {
        setError('User profile error: Unable to find manager record. Please contact admin.');
      } else {
        setError(err.response?.data?.message || 'Failed to check out');
      }
    }
  };

  // Handle leave dates change
  const handleLeaveDatesChange = async (dates: Set<string>) => {
    setLeaveDates(dates);
    // In a full implementation, this would call an API to request leave
  };

  // Notification system
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Simple notification system
    alert(`${type.toUpperCase()}: ${message}`);
  };

  // Initialize
  useEffect(() => {
    getLocation();
    
    // Only load attendance data if logged in
    if (isLoggedIn) {
      loadAttendanceData();
    }
      
    return () => {
      stopWorkTimer();
    };
  }, [isLoggedIn]);

  // Update location check when location or profile changes
  useEffect(() => {
    if (currentLocation && manager?.officeLocation) {
      const isWithin = isWithinWorkLocation(currentLocation, manager.officeLocation);
      setIsLocationWithinWorkArea(isWithin);
    }
  }, [currentLocation, manager]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <div className="ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          <AttendanceHeader />
          
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          {loadingData && (
            <div className="mb-4 p-4 bg-blue-100 text-blue-700 rounded-lg">
              Loading attendance data...
            </div>
          )}
          
          {!isLoggedIn ? (
            <div className="mb-6 p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Authentication Required</h3>
              <p className="mb-4">You need to be logged in as a manager to use the attendance system</p>
              <button 
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={() => navigate('/login')}
              >
                Go to Login Page
              </button>
            </div>
          ) : (
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
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <AttendanceReports
                  weeklyHours={weeklyHours}
                  attendanceStats={attendanceStats}
                />
                <LeaveCalendar 
                  leaveDates={leaveDates}
                  onLeaveDatesChange={handleLeaveDatesChange}
                />
              </div>
            </>
          )}
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