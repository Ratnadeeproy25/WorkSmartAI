import React, { useState, useEffect, useCallback } from 'react';
import CheckInOutControls from './CheckInOutControls';
import CurrentStatus from './CurrentStatus';
import { LocationData } from '../../employee/Attendance/types';
import { AttendanceTrackingProps } from './types';
import { AttendanceStatus } from '../../admin/attendance-management/types';
import managerAttendanceService from '../../../services/managerAttendanceService';
import { getManagerById } from '../../../services/managerService';

interface ManagerAttendanceRecord {
  date: string;
  checkIn: string;
  checkOut?: string;
  workHours?: number;
  location: LocationData;
  managerId: string;
}

interface Manager {
  id: string;
  name: string;
  email: string;
  department?: string;
  position?: string;
  shiftTime?: { start: string; end: string };
  officeLocation?: { 
    lat: number; 
    lng: number; 
    address?: { city: string; state: string; country: string } 
  };
}

const AttendanceTracking: React.FC<AttendanceTrackingProps> = ({ teamData }) => {
  const [workHours, setWorkHours] = useState(0);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
  const [workTimer, setWorkTimer] = useState<NodeJS.Timeout | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('-');
  const [error, setError] = useState<string | null>(null);
  const [managerId, setManagerId] = useState<string>('');
  const [manager, setManager] = useState<Manager | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  // Initialize manager ID and load profile
  useEffect(() => {
    const storedManager = localStorage.getItem('managerUserData');
    if (storedManager) {
      const managerData = JSON.parse(storedManager);
      setManagerId(managerData.id);
      loadManagerProfile(managerData.id);
    }
  }, []);

  // Function to load manager profile data
  const loadManagerProfile = async (managerId: string) => {
    try {
      const profile = await getManagerById(managerId);
      setManager({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        department: profile.department,
        position: profile.position,
        shiftTime: profile.shiftTime || { start: '09:00', end: '17:00' },
        officeLocation: profile.officeLocation || { lat: 0, lng: 0, address: { city: '', state: '', country: '' } }
      });
    } catch (error) {
      console.error('Error loading manager profile:', error);
      setManager({
        id: managerId,
        name: '',
        email: '',
        shiftTime: { start: '09:00', end: '17:00' },
        officeLocation: { lat: 0, lng: 0, address: { city: '', state: '', country: '' } }
      });
    }
  };

  // Load today's attendance status
  useEffect(() => {
    const loadTodayAttendance = async () => {
      try {
        const attendance = await managerAttendanceService.getTodayAttendance();
        if (attendance) {
          if (attendance.checkIn) {
            setCheckInTime(new Date(attendance.checkIn));
            setCheckedIn(true);
            
            if (!attendance.checkOut) {
              // Still checked in, start timer
              startWorkTimer(new Date(attendance.checkIn));
            } else {
              // Already checked out
              setCheckOutTime(new Date(attendance.checkOut));
              setCheckedIn(false);
              if (attendance.workHours) {
                setWorkHours(attendance.workHours);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error loading today\'s attendance:', err);
        // Don't show error for missing attendance record
      }
    };

    if (managerId) {
      loadTodayAttendance();
    }
  }, [managerId]);

  // Get current location
  const getLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          updateLocationStatus(location);
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
  }, [manager]);

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

  // Handle check in using backend API
  const handleCheckIn = useCallback(async () => {
    if (!currentLocation) {
      setError('Please enable location services to check in');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const attendance = await managerAttendanceService.checkIn(currentLocation);
      
      const now = new Date();
      setCheckInTime(now);
      setCheckedIn(true);
      
      // Start work timer
      startWorkTimer(now);
      
      showNotification('Checked in successfully', 'success');
    } catch (err: any) {
      console.error('Check-in error:', err);
      setError(err.message || 'Failed to check in. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentLocation, startWorkTimer]);

  // Handle check out using backend API
  const handleCheckOut = useCallback(async () => {
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

    setLoading(true);
    setError(null);
    
    try {
      const attendance = await managerAttendanceService.checkOut(currentLocation);
      
      setCheckOutTime(now);
      setCheckedIn(false);
      
      // Update work hours from backend response
      if (attendance.workHours) {
        setWorkHours(attendance.workHours);
      }
      
      // Stop work timer
      stopWorkTimer();
      
      showNotification('Checked out successfully', 'success');
    } catch (err: any) {
      console.error('Check-out error:', err);
      setError(err.message || 'Failed to check out. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [checkInTime, currentLocation, stopWorkTimer]);

  // Show notification
  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white z-50`;
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

  // Update location status when manager profile or current location changes
  useEffect(() => {
    if (manager && currentLocation) {
      updateLocationStatus(currentLocation);
    }
  }, [manager, currentLocation]);

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

  // Update location status with proper office location
  const updateLocationStatus = (location: LocationData) => {
    // Check if there's meaningful office location data (address OR coordinates)
    const hasAddress = manager?.officeLocation?.address && (
      manager.officeLocation.address.city || 
      manager.officeLocation.address.state || 
      manager.officeLocation.address.country
    );
    const hasCoordinates = manager?.officeLocation && (
      manager.officeLocation.lat !== 0 || manager.officeLocation.lng !== 0
    );

    if (!hasAddress && !hasCoordinates) {
      setLocationStatus('Remote');
      return;
    }

    // If manager has office location configured, show as "At Office"
    setLocationStatus('At Office');
  };

  // Get current status based on check-in/out times
  const getCurrentStatus = (): AttendanceStatus => {
    if (!checkInTime) return 'absent';
    if (checkOutTime) return 'present';
    return 'present';
  };

  // If no team data is available yet
  if (!teamData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-lg font-semibold mb-4">Team Attendance</h3>
        <div className="text-center text-gray-500 py-8">
          <p>Loading team attendance data...</p>
        </div>
      </div>
    );
  }

  const { records } = teamData;

  // Filter records based on selected status
  const filteredRecords = filterStatus === 'all' 
    ? records 
    : records.filter((record: any) => record.status === filterStatus);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Manager Personal Attendance Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Your Attendance</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div className="flex items-center space-x-4 mb-4">
          <CheckInOutControls 
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            isCheckedIn={checkedIn}
            isCheckedOut={!checkedIn}
          />
          
          <div className="text-sm text-gray-600">
            {loading && (
              <p className="text-blue-600">Processing...</p>
            )}
            {!currentLocation && (
              <p className="text-orange-600">Getting location...</p>
            )}
            {checkedIn && checkInTime && (
              <p>Checked in at: {checkInTime.toLocaleTimeString()}</p>
            )}
            {!checkedIn && checkOutTime && (
              <p>Checked out at: {checkOutTime.toLocaleTimeString()}</p>
            )}
            {workHours > 0 && (
              <p>Work hours: {workHours.toFixed(2)}h</p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <CurrentStatus 
          hoursWorked={workHours.toFixed(2)} 
          status={getCurrentStatus()}
          locationStatus={locationStatus}
          checkInTime={checkInTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          shiftTime={manager?.shiftTime}
          officeLocation={manager?.officeLocation}
        />
      </div>

      {/* Team Attendance Section */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Team Attendance</h3>
        
        <div className="flex space-x-2">
          <select 
            className="border border-gray-300 rounded px-3 py-1 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
            <option value="leave">On Leave</option>
          </select>
        </div>
      </div>
      
      {filteredRecords.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>No attendance records found for the selected filter</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.map((record: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{record.name}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">
                    {record.department || 'N/A'}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${record.status === 'present' ? 'bg-green-100 text-green-800' : 
                        record.status === 'late' ? 'bg-yellow-100 text-yellow-800' : 
                        record.status === 'absent' ? 'bg-red-100 text-red-800' : 
                        'bg-blue-100 text-blue-800'}`}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">
                    {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">
                    {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">
                    {record.workHours ? record.workHours.toFixed(2) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracking; 