import React from 'react';
import { CheckInOutControlsProps } from './types';

const CheckInOutControls: React.FC<CheckInOutControlsProps> = ({
  onCheckIn,
  onCheckOut,
  isCheckedIn,
  isCheckedOut
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Check In/Out</h3>
      
      <div className="space-y-4">
        <button
          onClick={onCheckIn}
          disabled={isCheckedIn || isCheckedOut}
          className={`w-full py-3 rounded-lg font-medium ${
            isCheckedIn || isCheckedOut
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isCheckedIn ? 'Already Checked In' : 'Check In'}
        </button>
        
        <button
          onClick={onCheckOut}
          disabled={!isCheckedIn || isCheckedOut}
          className={`w-full py-3 rounded-lg font-medium ${
            !isCheckedIn || isCheckedOut
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-red-500 text-white hover:bg-red-600'
          }`}
        >
          {isCheckedOut ? 'Already Checked Out' : 'Check Out'}
        </button>
        
        <div className="text-center text-sm text-gray-500 mt-2">
          {isCheckedIn && !isCheckedOut 
            ? 'You are currently checked in' 
            : isCheckedOut
              ? 'You are checked out for today'
              : 'Please check in to start recording your attendance'}
        </div>
      </div>
    </div>
  );
};

export default CheckInOutControls; 