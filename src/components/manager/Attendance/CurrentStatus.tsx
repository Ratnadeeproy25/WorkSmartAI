import React, { useState, useEffect, useCallback } from 'react';
import { LocationData } from '../../employee/Attendance/types';

interface CurrentStatusProps {
  workHours: number;
  isCheckedIn: boolean;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  location: LocationData | null;
}

const CurrentStatus: React.FC<CurrentStatusProps> = ({
  workHours,
  isCheckedIn,
  checkInTime,
  checkOutTime,
  location
}) => {
  const [locationStatus, setLocationStatus] = useState<string>('-');
  const [distanceFromOffice, setDistanceFromOffice] = useState<number>(0);
  
  // Calculate distance from office
  const calculateDistance = useCallback((point1: LocationData, point2: LocationData) => {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Update location status
  useEffect(() => {
    if (location) {
      const officeLocation = { lat: 0, lng: 0 }; // Replace with actual office coordinates
      const distance = calculateDistance(location, officeLocation);
      setDistanceFromOffice(distance);
      setLocationStatus(distance <= 0.1 ? 'At Office' : 'Remote');
    }
  }, [location, calculateDistance]);
  
  // Get time since check-in
  const getTimeSince = () => {
    if (!checkInTime) return 'Not checked in';
    
    const now = new Date();
    const timeDiff = now.getTime() - checkInTime.getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };
  
  // Get current status
  const getCurrentStatus = () => {
    if (!isCheckedIn) return 'Not Present';
    if (checkOutTime) return 'Checked Out';
    return 'Present';
  };
  
  return (
    <div className="neo-box bg-[#f4f7fa] rounded-2xl shadow-neomorphic p-4 mb-4 max-w-xs font-sans">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Current Status</h3>
      {/* Status Indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full mr-2 ${isCheckedIn ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          <span className={`font-bold text-base ${isCheckedIn ? 'text-green-600' : 'text-gray-500'}`}>{getCurrentStatus()}</span>
        </div>
        <span className="text-gray-500 text-sm">
          {isCheckedIn ? `Since ${checkInTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not checked in'}
        </span>
      </div>
      <div className="space-y-3">
        {/* Working Hours */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">Working Hours</span>
          </div>
          <span className="font-bold text-gray-800">{workHours.toFixed(2)}h</span>
        </div>
        {/* Location Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm">Location</span>
          </div>
          <span className="font-bold text-gray-800">{locationStatus}</span>
        </div>
        {/* Work Hours Today (duplicate for visual, can be removed if not needed) */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm">Work Hours Today</span>
          <span className="font-bold text-gray-800">{workHours.toFixed(2)}h</span>
        </div>
        {/* Check Out Time */}
        {checkOutTime && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Check Out Time</span>
            <span className="font-bold text-gray-800">
              {checkOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
        {/* Time Since Check-in */}
        {isCheckedIn && !checkOutTime && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Time Since Check-in</span>
            <span className="font-bold text-gray-800">{getTimeSince()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentStatus; 