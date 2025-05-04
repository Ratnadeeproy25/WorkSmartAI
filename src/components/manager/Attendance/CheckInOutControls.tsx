import React from 'react';

interface CheckInOutControlsProps {
  onCheckIn: () => void;
  onCheckOut: () => void;
  isCheckedIn: boolean;
}

const CheckInOutControls: React.FC<CheckInOutControlsProps> = ({
  onCheckIn,
  onCheckOut,
  isCheckedIn
}) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <button 
        className={`neo-button p-6 text-center ${!isCheckedIn ? 'primary' : ''}`}
        onClick={onCheckIn}
        disabled={isCheckedIn}
      >
        <i className="bi bi-box-arrow-in-right text-3xl mb-2"></i>
        <div className="text-lg font-medium">Check In</div>
      </button>
      <button 
        className={`neo-button p-6 text-center ${isCheckedIn ? 'primary' : ''}`}
        onClick={onCheckOut}
        disabled={!isCheckedIn}
      >
        <i className="bi bi-box-arrow-left text-3xl mb-2"></i>
        <div className="text-lg font-medium">Check Out</div>
      </button>
    </div>
  );
};

export default CheckInOutControls; 