import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { WeeklyHours, AttendanceStats } from './types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AttendanceReportsProps {
  weeklyHours: WeeklyHours[];
  attendanceStats: AttendanceStats;
}

const AttendanceReports: React.FC<AttendanceReportsProps> = ({
  weeklyHours,
  attendanceStats
}) => {
  const weeklyChartData = {
    labels: weeklyHours.map(day => day.day),
    datasets: [{
      label: 'Hours Worked',
      data: weeklyHours.map(day => day.hours),
      backgroundColor: '#2563eb',
      borderRadius: 8
    }]
  };

  const weeklyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        grid: {
          display: false
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="neo-box p-8 mt-8">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Attendance Reports</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Summary */}
        <div className="neo-box p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Weekly Summary</h3>
          <div className="chart-container" style={{ height: '250px' }}>
            <Bar data={weeklyChartData} options={weeklyChartOptions} />
          </div>
        </div>
        
        {/* Attendance Stats */}
        <div className="neo-box p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Attendance Statistics</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">On-Time Arrivals</span>
                <span className="font-semibold text-green-600">{attendanceStats.onTimePercentage}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill bg-green-500" 
                  style={{ width: `${attendanceStats.onTimePercentage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Late Arrivals</span>
                <span className="font-semibold text-red-600">{attendanceStats.latePercentage}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill bg-red-500" 
                  style={{ width: `${attendanceStats.latePercentage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Average Work Hours</span>
                <span className="font-semibold text-gray-700">{attendanceStats.averageHours}h</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill bg-blue-500" 
                  style={{ width: `${(attendanceStats.averageHours / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReports; 