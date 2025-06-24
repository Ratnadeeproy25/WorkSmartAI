import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet';
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
import { getEmployeeById } from '../../../services/employeeService';
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
  const [approvedLeaveDates, setApprovedLeaveDates] = useState<Set<string>>(new Set());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | undefined>(undefined);
  const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(null);
  const [isLocationWithinWorkArea, setIsLocationWithinWorkArea] = useState<boolean>(false);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord | null>(null);
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours[]>([]);
  
  // Add loading states to prevent multiple simultaneous API calls
  const [isLoadingAttendance, setIsLoadingAttendance] = useState<boolean>(false);
  const [isCheckingIn, setIsCheckingIn] = useState<boolean>(false);
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);

  // Circuit breaker for API calls
  const circuitBreaker = useRef({
    isOpen: false,
    failureCount: 0,
    lastFailureTime: 0,
    threshold: 3, // Open circuit after 3 failures
    timeout: 30000 // Keep circuit breaker open for 30 seconds
  });

  // Use ref to store timer functions to avoid dependency issues
  const timerRef = useRef<{
    startWorkTimer: (startTime: Date) => void;
    stopWorkTimer: () => void;
  }>();

  // Load the current employee and their profile
  useEffect(() => {
    const employeeData = localStorage.getItem('employeeUserData');
    if (employeeData) {
      try {
        const parsedUser = JSON.parse(employeeData);
        setEmployee({
          id: parsedUser.id,
          name: parsedUser.name,
          email: parsedUser.email
        });
        setIsLoggedIn(true);
        
        // Load full employee profile with shift time and office location
        loadEmployeeProfile(parsedUser.id);
      } catch (error) {
        console.error('Error parsing employee data:', error);
        setError('Invalid session data. Please log in again.');
      }
    }
  }, []);

  // Function to load employee profile data
  const loadEmployeeProfile = async (employeeId: string) => {
    try {
      // Use the proper employee service to get complete employee data
      const profile = await getEmployeeById(employeeId);
      
      // Convert the employee data to the format expected by attendance system
      setEmployeeProfile({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        department: profile.department,
        position: profile.position,
        shiftTime: profile.shiftTime || { start: '09:00', end: '17:00' },
        officeLocation: profile.officeLocation || { lat: 0, lng: 0, address: { city: '', state: '', country: '' } }
      });
    } catch (error) {
      console.error('Error loading employee profile:', error);
      // Set a default profile to prevent errors
      setEmployeeProfile({
        id: employeeId,
        name: employee?.name || '',
        email: employee?.email || '',
        shiftTime: { start: '09:00', end: '17:00' },
        officeLocation: { lat: 0, lng: 0, address: { city: '', state: '', country: '' } }
      });
    }
  };

  // Function to validate if check-in time is within shift hours
  const isWithinShiftHours = (currentTime: Date, shiftTime?: { start: string; end: string }): { isValid: boolean; message?: string } => {
    if (!shiftTime) {
      return { isValid: true }; // If no shift time defined, allow any time
    }

    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // Parse shift start time
    const [startHour, startMinute] = shiftTime.start.split(':').map(Number);
    const shiftStartInMinutes = startHour * 60 + startMinute;

    // Parse shift end time
    const [endHour, endMinute] = shiftTime.end.split(':').map(Number);
    const shiftEndInMinutes = endHour * 60 + endMinute;

    // Allow check-in 30 minutes before shift start and 2 hours after shift start
    const earlyCheckInBuffer = 30; // minutes
    const lateCheckInBuffer = 120; // minutes (2 hours)

    const earliestCheckIn = shiftStartInMinutes - earlyCheckInBuffer;
    const latestCheckIn = shiftStartInMinutes + lateCheckInBuffer;

    if (currentTimeInMinutes < earliestCheckIn) {
      const earliestTime = `${Math.floor(earliestCheckIn / 60).toString().padStart(2, '0')}:${(earliestCheckIn % 60).toString().padStart(2, '0')}`;
      return { 
        isValid: false, 
        message: `Check-in too early. You can check in from ${earliestTime} onwards (30 minutes before your shift).` 
      };
    }

    if (currentTimeInMinutes > latestCheckIn) {
      const latestTime = `${Math.floor(latestCheckIn / 60).toString().padStart(2, '0')}:${(latestCheckIn % 60).toString().padStart(2, '0')}`;
      return { 
        isValid: false, 
        message: `Check-in too late. Latest check-in time is ${latestTime} (2 hours after shift start).` 
      };
    }

    return { isValid: true };
  };

  // Update location status with proper office location
  const updateLocationStatus = (location: LocationData) => {
    // Check if there's meaningful office location data (address OR coordinates)
    const hasAddress = employeeProfile?.officeLocation?.address && (
      employeeProfile.officeLocation.address.city || 
      employeeProfile.officeLocation.address.state || 
      employeeProfile.officeLocation.address.country
    );
    const hasCoordinates = employeeProfile?.officeLocation && (
      employeeProfile.officeLocation.lat !== 0 || employeeProfile.officeLocation.lng !== 0
    );

    if (!hasAddress && !hasCoordinates) {
      setLocationStatus('Remote');
      return;
    }

    // If employee has office location configured, show as "At Office"
    setLocationStatus('At Office');
  };

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
  }, [employeeProfile]);

  // Initialize timer functions in ref to avoid dependency issues
  useEffect(() => {
    const startWorkTimer = (startTime: Date) => {
      if (workTimer) {
        clearInterval(workTimer);
      }
      
      const timer = setInterval(() => {
        const now = new Date();
        const timeDiff = now.getTime() - startTime.getTime();
        const hours = timeDiff / (1000 * 60 * 60);
        setHoursWorked(hours.toFixed(2));
      }, 60000); // Update every minute
      
      setWorkTimer(timer);
    };

    const stopWorkTimer = () => {
      if (workTimer) {
        clearInterval(workTimer);
        setWorkTimer(null);
      }
    };

    timerRef.current = { startWorkTimer, stopWorkTimer };

    return () => {
      if (workTimer) {
        clearInterval(workTimer);
      }
    };
  }, [workTimer]);

  // Circuit breaker functions
  const checkCircuitBreaker = useCallback(() => {
    const breaker = circuitBreaker.current;
    
    if (breaker.isOpen) {
      const timeSinceLastFailure = Date.now() - breaker.lastFailureTime;
      if (timeSinceLastFailure > breaker.timeout) {
        // Reset circuit breaker
        breaker.isOpen = false;
        breaker.failureCount = 0;
        console.log('Circuit breaker reset');
      } else {
        throw new Error('Service temporarily unavailable. Please try again in a few moments.');
      }
    }
  }, []);

  const recordFailure = useCallback(() => {
    const breaker = circuitBreaker.current;
    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();
    
    if (breaker.failureCount >= breaker.threshold) {
      breaker.isOpen = true;
      console.log('Circuit breaker opened due to repeated failures');
    }
  }, []);

  const recordSuccess = useCallback(() => {
    const breaker = circuitBreaker.current;
    if (breaker.failureCount > 0) {
      breaker.failureCount = 0;
      console.log('Circuit breaker failure count reset');
    }
  }, []);

  // Memoize notification system
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } text-white max-w-sm`;
    notification.innerHTML = `
      <div class="flex items-start gap-2">
        <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'} mt-0.5"></i>
        <div class="flex-1">${message}</div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
          <i class="bi bi-x"></i>
        </button>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }, []);

  // Load attendance data with proper loading state management
  const loadAttendanceData = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingAttendance) {
      console.log('Attendance data already loading, skipping...');
      return;
    }

    try {
      // Check circuit breaker before making requests
      checkCircuitBreaker();

      setIsLoadingAttendance(true);
      setError(null); // Clear previous errors
      
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
      try {
        const attendanceData = await attendanceService.getTodayAttendance();
        
        if (attendanceData) {
          if (attendanceData.checkIn) {
            const checkInDate = new Date(attendanceData.checkIn);
            setCheckInTime(checkInDate);
            
            if (!attendanceData.checkOut) {
              // Still checked in, start timer
              timerRef.current?.startWorkTimer(checkInDate);
            } else {
              // Already checked out
              const checkOutDate = new Date(attendanceData.checkOut);
              setCheckOutTime(checkOutDate);
              setHoursWorked(attendanceData.workHours?.toFixed(2) || '0.00');
            }
          }
        }
        recordSuccess(); // Record successful API call
      } catch (attendanceError: any) {
        console.error('Error loading today\'s attendance:', attendanceError);
        recordFailure();
        
        // Don't fail the entire process for attendance data
        if (attendanceError.response?.status !== 401 && attendanceError.response?.status !== 403) {
          showNotification('Failed to load today\'s attendance data', 'error');
        }
      }
      
      // Load leave dates with error handling - but don't fail the whole process
      try {
        const leaveDatesList = await leaveService.getLeaveDates();
        setApprovedLeaveDates(new Set(leaveDatesList));
        recordSuccess(); // Record successful API call
      } catch (leaveError: any) {
        console.error('Error loading leave dates:', leaveError);
        recordFailure();
        
        // Don't fail the whole process for leave dates
        setApprovedLeaveDates(new Set()); // Set empty set as fallback
        
        // Only show notification for unexpected errors (not 404, auth issues)
        if (leaveError.response?.status !== 404 && 
            leaveError.response?.status !== 401 && 
            leaveError.response?.status !== 403 &&
            !leaveError.message?.includes('Access denied') &&
            !leaveError.message?.includes('Authentication failed')) {
          showNotification('Failed to load leave calendar', 'error');
        } else {
          console.log('Leave calendar not available or accessible, continuing without it');
        }
      }
      
      // Load attendance stats with error handling - but don't fail the whole process
      try {
        const { weeklyHours: hours, attendanceStats: stats } = await attendanceService.getAttendanceStats();
        setWeeklyHours(hours);
        setAttendanceStats(stats);
        recordSuccess(); // Record successful API call
      } catch (statsError: any) {
        console.error('Error loading attendance stats:', statsError);
        recordFailure();
        
        // Don't fail the whole process for stats
        setWeeklyHours([]);
        setAttendanceStats(undefined);
        showNotification('Failed to load attendance statistics', 'error');
      }
      
    } catch (err: any) {
      console.error('Error loading attendance data:', err);
      recordFailure();
      
      // Provide specific error messages based on error type
      let errorMessage = 'Failed to load attendance data';
      
      if (err.message === 'Service temporarily unavailable. Please try again in a few moments.') {
        errorMessage = err.message;
      } else if (err.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (err.status === 403) {
        errorMessage = 'Access denied. You don\'t have permission to view attendance data.';
      } else if (err.status === 0 || err.message?.includes('Network Error')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else if (err.status === 408 || err.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (err.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment before trying again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [isLoggedIn, employee, isLoadingAttendance]);

  // Memoize check-in handler with shift time and location validation
  const handleCheckIn = useCallback(async () => {
    if (isCheckingIn) return; // Prevent multiple simultaneous check-ins
    
    if (!isLoggedIn) {
      setError('Please log in first');
      return;
    }

    if (!currentLocation) {
      setError('Please enable location services to check in');
      return;
    }

    if (!employeeProfile) {
      setError('Employee profile not loaded. Please refresh the page.');
      return;
    }

    // Validate shift time
    const now = new Date();
    const shiftValidation = isWithinShiftHours(now, employeeProfile.shiftTime);
    if (!shiftValidation.isValid) {
      setError(shiftValidation.message || 'Check-in time is outside your shift hours');
      return;
    }

    // Validate location (only if office location is set)
    if (employeeProfile.officeLocation && employeeProfile.officeLocation.lat !== 0 && employeeProfile.officeLocation.lng !== 0) {
      // Check if employee has office location configured
      const hasAddress = employeeProfile.officeLocation.address && (
        employeeProfile.officeLocation.address.city || 
        employeeProfile.officeLocation.address.state || 
        employeeProfile.officeLocation.address.country
      );
      const hasCoordinates = employeeProfile.officeLocation.lat !== 0 || employeeProfile.officeLocation.lng !== 0;

      if (!hasAddress && !hasCoordinates) {
        setError('No office location configured. Please set your office location first.');
        return;
      }
    }
    
    try {
      // Check circuit breaker before making requests
      checkCircuitBreaker();
      
      setIsCheckingIn(true);
      setError(null); // Clear any previous errors
      
      // Call check-in API with basic location data (enhanced validation done above)
      await attendanceService.checkIn(currentLocation);
      
      setCheckInTime(now);
      
      // Start work timer
      timerRef.current?.startWorkTimer(now);
      
      recordSuccess(); // Record successful API call
      
      // Show success message with shift info
      const shiftInfo = employeeProfile.shiftTime 
        ? ` (Shift: ${employeeProfile.shiftTime.start} - ${employeeProfile.shiftTime.end})` 
        : '';
      showNotification(`Checked in successfully${shiftInfo}`, 'success');
    } catch (err: any) {
      recordFailure();
      
      let errorMessage = 'Failed to check in';
      
      if (err.message === 'Service temporarily unavailable. Please try again in a few moments.') {
        errorMessage = err.message;
      } else if (err.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait before trying again.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setIsCheckingIn(false);
    }
  }, [currentLocation, isLoggedIn, employeeProfile, isCheckingIn]);

  // Get current status based on check-in/out times and leave dates
  const getCurrentStatus = useCallback((): AttendanceStatus => {
    const today = new Date().toISOString().split('T')[0];
    if (approvedLeaveDates.has(today)) return 'leave';
    if (!checkInTime) return 'absent';
    if (checkOutTime) return 'present';
    return 'present';
  }, [checkInTime, checkOutTime, approvedLeaveDates]);

  // Memoize check-out handler with enhanced validation
  const handleCheckOut = useCallback(async () => {
    if (isCheckingOut) return; // Prevent multiple simultaneous check-outs
    
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

    if (!employeeProfile) {
      setError('Employee profile not loaded. Please refresh the page.');
      return;
    }

    try {
      // Check circuit breaker before making requests
      checkCircuitBreaker();
      
      setIsCheckingOut(true);
      setError(null); // Clear any previous errors
      
      // Call check-out API with basic location data (enhanced validation done above)
      const attendanceData = await attendanceService.checkOut(currentLocation);
      
      const now = new Date();
      setCheckOutTime(now);
      
      // Calculate actual work hours
      const workHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      setHoursWorked(workHours.toFixed(2));
      
      // Update from API response if available
      if (attendanceData.workHours) {
        setHoursWorked(attendanceData.workHours.toFixed(2));
      }
      
      // Stop work timer
      timerRef.current?.stopWorkTimer();
      
      recordSuccess(); // Record successful API call
      
      // Show success message with work hours
      showNotification(`Checked out successfully (${workHours.toFixed(2)} hours worked)`, 'success');
      
      // Refresh stats after a brief delay to avoid overwhelming the server
      setTimeout(async () => {
        try {
          const { weeklyHours: hours, attendanceStats: stats } = await attendanceService.getAttendanceStats();
          setWeeklyHours(hours);
          setAttendanceStats(stats);
          recordSuccess();
        } catch (err) {
          console.error('Error refreshing stats after check-out:', err);
          recordFailure();
          // Don't show error for stats refresh failure
        }
      }, 2000); // Increased delay to 2 seconds
    } catch (err: any) {
      recordFailure();
      
      let errorMessage = 'Failed to check out';
      
      if (err.message === 'Service temporarily unavailable. Please try again in a few moments.') {
        errorMessage = err.message;
      } else if (err.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait before trying again.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setIsCheckingOut(false);
    }
  }, [checkInTime, currentLocation, isLoggedIn, employeeProfile, isCheckingOut]);

  // Handle leave dates change
  const handleLeaveDatesChange = useCallback(async (dates: Set<string>) => {
    setLeaveDates(dates);
    // Note: This is a UI-only feature for now 
    // In a full implementation, this would call an API to request leave
  }, []);

  // Initialize location
  useEffect(() => {
    getLocation();
  }, [getLocation]);

  // Initialize
  useEffect(() => {
    getLocation();
  }, [getLocation]);

  // Load attendance data only after employee is confirmed to be logged in
  useEffect(() => {
    let mounted = true; // Track if component is still mounted
    
    const loadDataSafely = async () => {
      // Only load attendance data if logged in and employee data exists
      if (isLoggedIn && employee && mounted) {
        await loadAttendanceData();
      } else if (isLoggedIn && !employee && mounted) {
        setError('Employee data not found. Please refresh the page or log in again.');
      }
    };

    loadDataSafely();
    
    return () => {
      mounted = false;
      timerRef.current?.stopWorkTimer();
    };
  }, [isLoggedIn, employee]); // Remove loadAttendanceData from dependencies to prevent infinite loop

  // Update location status when employee profile or current location changes
  useEffect(() => {
    if (employeeProfile && currentLocation) {
      updateLocationStatus(currentLocation);
    }
  }, [employeeProfile, currentLocation]);

  // Update location check when location or profile changes
  useEffect(() => {
    if (currentLocation && employeeProfile?.officeLocation) {
      const isWithin = isWithinWorkLocation(currentLocation, employeeProfile.officeLocation);
      setIsLocationWithinWorkArea(isWithin);
    }
  }, [currentLocation, employeeProfile]);

  return (
    <>
      <Helmet>
        <title>WorkSmart AI - Employee Attendance</title>
      </Helmet>
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
                      {circuitBreaker.current.isOpen ? 'Service Temporarily Unavailable' : 'Attendance Data Error'}
                    </h4>
                    <p className="mb-3">{error}</p>
                    
                    {circuitBreaker.current.isOpen && (
                      <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-yellow-800 text-sm">
                          <i className="bi bi-shield-exclamation mr-2"></i>
                          The system is temporarily limiting requests to protect the server. 
                          Please wait a moment before trying again.
                        </p>
                        <div className="mt-2 text-xs text-yellow-600">
                          Circuit breaker will reset automatically in a few moments.
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setError(null);
                          if (isLoggedIn && employee && !circuitBreaker.current.isOpen) {
                            loadAttendanceData();
                          }
                        }}
                        disabled={circuitBreaker.current.isOpen || isLoadingAttendance}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          circuitBreaker.current.isOpen || isLoadingAttendance
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        <i className={`bi bi-${isLoadingAttendance ? 'arrow-repeat animate-spin' : 'arrow-clockwise'} mr-1`}></i>
                        {isLoadingAttendance ? 'Loading...' : 'Retry'}
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
                      
                      {circuitBreaker.current.isOpen && (
                        <button
                          onClick={() => {
                            // Reset circuit breaker manually
                            circuitBreaker.current.isOpen = false;
                            circuitBreaker.current.failureCount = 0;
                            setError(null);
                            showNotification('Circuit breaker reset. You can try again now.', 'info');
                          }}
                          className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
                        >
                          <i className="bi bi-bootstrap-reboot mr-1"></i>
                          Force Reset
                        </button>
                      )}
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
            
            {isLoadingAttendance && !error && (
              <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="animate-spin">
                    <i className="bi bi-arrow-repeat"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold">Loading Attendance Data</h4>
                    <p className="text-sm">Please wait while we fetch your attendance information...</p>
                  </div>
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
                shiftTime={employeeProfile?.shiftTime}
                officeLocation={employeeProfile?.officeLocation}
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
                approvedLeaveDates={approvedLeaveDates}
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
    </>
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