import React from 'react';
import { AttendanceStats } from './AttendanceSection';

interface AttendanceOverviewProps {
  stats: AttendanceStats;
}

const AttendanceOverview: React.FC<AttendanceOverviewProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Attendance Stats */}
      <div className="lg:col-span-2">
        <div className="neo-box p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Attendance Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="neo-box p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.present}</div>
              <div className="text-sm text-gray-600">Present Today</div>
            </div>
            <div className="neo-box p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
              <div className="text-sm text-gray-600">Absent Today</div>
            </div>
            <div className="neo-box p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
              <div className="text-sm text-gray-600">Late Today</div>
            </div>
            <div className="neo-box p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.leave}</div>
              <div className="text-sm text-gray-600">On Leave</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <div className="neo-box p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              className="neo-button p-3 w-full text-center primary"
              onClick={() => alert('Exporting attendance data...')}
            >
              <i className="bi bi-download mr-2"></i>
              Export Data
            </button>
            <button 
              className="neo-button p-3 w-full text-center"
              onClick={() => alert(`Sending reminders to ${stats.absent} absent employees...`)}
            >
              <i className="bi bi-bell mr-2"></i>
              Send Reminders
            </button>
            <button 
              className="neo-button p-3 w-full text-center"
              onClick={() => alert('Generating attendance report...')}
            >
              <i className="bi bi-file-earmark-text mr-2"></i>
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceOverview; 