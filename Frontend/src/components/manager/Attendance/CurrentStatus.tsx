import React from 'react';
import { CurrentStatusProps } from './types';

const CurrentStatus: React.FC<CurrentStatusProps> = ({ 
  hoursWorked,
  status,
  locationStatus,
  checkInTime
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Current Status</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-gray-600">Status</div>
          <span className={`px-2 py-1 rounded-full text-sm font-medium
            ${status === 'present' ? 'bg-green-100 text-green-800' : 
              status === 'late' ? 'bg-yellow-100 text-yellow-800' : 
              status === 'absent' ? 'bg-red-100 text-red-800' : 
              'bg-blue-100 text-blue-800'}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-gray-600">Hours Worked</div>
          <span className="text-gray-800 font-medium">{hoursWorked} hrs</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-gray-600">Location</div>
          <span className="text-gray-800 font-medium">{locationStatus}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-gray-600">Check-in Time</div>
          <span className="text-gray-800 font-medium">{checkInTime || '-'}</span>
        </div>
      </div>
    </div>
  );
};

export default CurrentStatus; 