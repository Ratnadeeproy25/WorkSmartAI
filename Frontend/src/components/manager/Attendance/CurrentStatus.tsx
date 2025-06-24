import React from 'react';
import { AttendanceStatus } from '../../admin/attendance-management/types';

interface CurrentStatusProps {
  hoursWorked: string;
  status: AttendanceStatus;
  locationStatus: string;
  checkInTime?: string;
  shiftTime?: { start: string; end: string };
  officeLocation?: { 
    lat: number; 
    lng: number; 
    address?: { city: string; state: string; country: string } 
  };
}

const CurrentStatus: React.FC<CurrentStatusProps> = ({ 
  hoursWorked, 
  status, 
  locationStatus, 
  checkInTime,
  shiftTime,
  officeLocation
}) => {
  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100';
      case 'absent': return 'text-red-600 bg-red-100';
      case 'leave': return 'text-blue-600 bg-blue-100';
      case 'late': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLocationColor = (locationStatus: string) => {
    if (locationStatus === 'At Office') return 'text-green-600 bg-green-100';
    if (locationStatus === 'Remote') return 'text-blue-600 bg-blue-100';
    return 'text-blue-600 bg-blue-100';
  };

  const formatOfficeLocation = () => {
    if (!officeLocation) return 'Remote';
    
    // Check if there's meaningful location data
    const hasAddress = officeLocation.address && (
      officeLocation.address.city || 
      officeLocation.address.state || 
      officeLocation.address.country
    );
    const hasCoordinates = officeLocation.lat !== 0 || officeLocation.lng !== 0;
    
    if (hasAddress || hasCoordinates) {
      return 'Office'; // They have an office location set
    }
    
    return 'Remote'; // No office location set, working remotely
  };

  const getOfficeLocationDetails = () => {
    if (!officeLocation) return '';
    
    // First try to show address if available
    if (officeLocation.address && (officeLocation.address.city || officeLocation.address.state || officeLocation.address.country)) {
      const parts = [
        officeLocation.address.city,
        officeLocation.address.state,
        officeLocation.address.country
      ].filter(Boolean);
      
      if (parts.length > 0) {
        return parts.join(", ");
      }
    }
    
    // Fallback to coordinates if no address
    if (officeLocation.lat !== 0 || officeLocation.lng !== 0) {
      return `${officeLocation.lat.toFixed(4)}, ${officeLocation.lng.toFixed(4)}`;
    }
    
    return 'No specific office location set';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <i className="bi bi-person-check text-blue-600"></i>
        Manager Status
      </h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Status:</span>
          <span className={`px-3 py-1 rounded-full font-medium ${getStatusColor(status)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Location:</span>
          <span className={`px-3 py-1 rounded-full font-medium ${getLocationColor(locationStatus)}`}>
            <i className="bi bi-geo-alt mr-1"></i>
            {locationStatus}
          </span>
        </div>
        
        {checkInTime && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Check-in Time:</span>
            <span className="font-medium text-blue-600">
              <i className="bi bi-clock mr-1"></i>
              {checkInTime}
            </span>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Hours Worked:</span>
          <span className="font-bold text-2xl text-green-600">{hoursWorked}h</span>
        </div>

        {/* Shift Information */}
        {shiftTime && (
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 font-medium">
                <i className="bi bi-calendar-event mr-1"></i>
                Today's Shift:
              </span>
              <span className="font-medium text-indigo-600">
                {shiftTime.start} - {shiftTime.end}
              </span>
            </div>
          </div>
        )}

        {/* Office Location Information */}
        <div className="border-t pt-3 mt-3">
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-600 font-medium">
                <i className="bi bi-building mr-1"></i>
                Work Type:
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                formatOfficeLocation() === 'Office' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                <i className={`bi ${formatOfficeLocation() === 'Office' ? 'bi-building' : 'bi-house'} mr-1`}></i>
                {formatOfficeLocation()}
              </span>
            </div>
            {getOfficeLocationDetails() && (
              <div className="text-xs text-gray-500 mt-1">
                <i className="bi bi-geo-alt mr-1"></i>
                {getOfficeLocationDetails()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentStatus; 