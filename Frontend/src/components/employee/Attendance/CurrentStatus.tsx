import React, { useMemo } from 'react';
import { AttendanceStatus } from '../../admin/attendance-management/types';

interface CurrentStatusProps {
  hoursWorked: string;
  status: AttendanceStatus;
  locationStatus: string;
  checkInTime?: string;
}

const CurrentStatus: React.FC<CurrentStatusProps> = ({ 
  hoursWorked, 
  status, 
  locationStatus,
  checkInTime
}) => {
  // Calculate work hours percentage (assuming 8 hours is full day)
  const workHoursPercentage = useMemo(() => {
    const hours = parseFloat(hoursWorked);
    return Math.min((hours / 8) * 100, 100);
  }, [hoursWorked]);

  // Get status color based on attendance status
  const getStatusColor = useMemo(() => {
    switch (status) {
      case 'present':
        return 'text-green-600';
      case 'late':
        return 'text-yellow-600';
      case 'absent':
        return 'text-red-600';
      case 'leave':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  }, [status]);

  return (
    <div className="neo-box p-6 mb-6">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Current Status</h3>
      
      {/* Status Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className={`status-indicator status-${status}`}></span>
          <span className={`text-lg font-medium ${getStatusColor}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        {checkInTime && (
          <span className="text-gray-600">Since {checkInTime}</span>
        )}
      </div>
      
      {/* Status Details */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <i className="bi bi-clock-history text-blue-500 text-xl mr-2"></i>
            <span className="text-gray-600">Working Hours</span>
          </div>
          <span className="text-lg font-medium text-gray-700">{hoursWorked}h</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <i className="bi bi-geo-alt text-yellow-500 text-xl mr-2"></i>
            <span className="text-gray-600">Location</span>
          </div>
          <span className="text-lg font-medium text-gray-700">{locationStatus}</span>
        </div>
      </div>
      
      {/* Progress Bars */}
      <div className="mt-6">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Work Hours Today</span>
            <span className="font-semibold text-gray-700">{hoursWorked}h</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-bar-fill bg-blue-500" 
              style={{ width: `${workHoursPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CurrentStatus); 