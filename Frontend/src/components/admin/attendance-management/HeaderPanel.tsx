import React from 'react';

interface HeaderPanelProps {
  onEndDay?: () => void;
  isProcessingEndDay?: boolean;
}

const HeaderPanel: React.FC<HeaderPanelProps> = ({ onEndDay, isProcessingEndDay = false }) => {
  return (
    <div className="section-header">
      <div className="flex justify-between items-center">
        <div>
          <h1>Attendance Management</h1>
          <p>Monitor and manage employee attendance records</p>
        </div>
        {onEndDay && (
          <button
            onClick={onEndDay}
            disabled={isProcessingEndDay}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              isProcessingEndDay
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105 shadow-lg hover:shadow-xl'
            }`}
          >
            {isProcessingEndDay ? (
              <>
                <i className="bi bi-arrow-repeat animate-spin mr-2"></i>
                Processing...
              </>
            ) : (
              <>
                <i className="bi bi-calendar-x mr-2"></i>
                End Day
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default HeaderPanel; 