import React from 'react';

const StatusSummary: React.FC = () => {
  return (
    <>
      <div className="neo-box p-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Your Status</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <i className="bi bi-clock-history text-blue-500 text-xl mr-2"></i>
              <span className="text-gray-600">Status</span>
            </div>
            <span className="text-lg font-medium text-green-600">Present</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <i className="bi bi-calendar-check text-green-500 text-xl mr-2"></i>
              <span className="text-gray-600">Working Hours</span>
            </div>
            <span id="hoursWorked" className="text-lg font-medium text-gray-700">5.5</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <i className="bi bi-geo-alt text-yellow-500 text-xl mr-2"></i>
              <span className="text-gray-600">Location</span>
            </div>
            <span id="locationStatus" className="text-lg font-medium text-gray-700">-</span>
          </div>
        </div>
      </div>

      <div className="neo-box p-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Leave Balance</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Annual Leave</span>
              <span className="font-semibold text-gray-700">15/20 days</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill bg-blue-500" style={{ width: '75%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Sick Leave</span>
              <span className="font-semibold text-gray-700">8/10 days</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill bg-red-500" style={{ width: '80%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Personal Leave</span>
              <span className="font-semibold text-gray-700">3/5 days</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill bg-green-500" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StatusSummary; 