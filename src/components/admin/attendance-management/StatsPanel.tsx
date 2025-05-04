import React from 'react';
import { AttendanceStats } from './types';

interface StatsPanelProps {
  stats: AttendanceStats;
  type: 'employee' | 'manager';
  onExportData: () => void;
  onSendReminder: () => void;
  onGenerateReport: () => void;
}

const StatsPanel: React.FC<StatsPanelProps> = ({
  stats,
  type,
  onExportData,
  onSendReminder,
  onGenerateReport
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 mb-6">
      {/* Attendance Stats */}
      <div className="lg:col-span-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stats-card">
            <div className="value text-green-600" id={`${type}Present`}>
              {stats.present}
            </div>
            <div className="label">Present Today</div>
          </div>
          <div className="stats-card">
            <div className="value text-red-600" id={`${type}Absent`}>
              {stats.absent}
            </div>
            <div className="label">Absent Today</div>
          </div>
          <div className="stats-card">
            <div className="value text-yellow-600" id={`${type}Late`}>
              {stats.late}
            </div>
            <div className="label">Late Today</div>
          </div>
          <div className="stats-card">
            <div className="value text-blue-600" id={`${type}Leave`}>
              {stats.leave}
            </div>
            <div className="label">On Leave</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <div className="neo-box p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              className="action-button w-full" 
              id={`export${type === 'employee' ? 'Employee' : 'Manager'}Data`}
              onClick={onExportData}
            >
              <i className="bi bi-download"></i>
              <span>Export Data</span>
            </button>
            <button 
              className="action-button w-full" 
              id={`send${type === 'employee' ? 'Employee' : 'Manager'}Reminder`}
              onClick={onSendReminder}
            >
              <i className="bi bi-bell"></i>
              <span>Send Reminders</span>
            </button>
            <button 
              className="action-button w-full" 
              id={`generate${type === 'employee' ? 'Employee' : 'Manager'}Report`}
              onClick={onGenerateReport}
            >
              <i className="bi bi-file-earmark-text"></i>
              <span>Generate Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel; 