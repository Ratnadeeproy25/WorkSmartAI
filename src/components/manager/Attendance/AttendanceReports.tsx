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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AttendanceStats {
  onTimePercentage: number;
  latePercentage: number;
  averageHours: number;
}

interface WeeklyHours {
  day: string;
  hours: number;
}

const AttendanceReports: React.FC = () => {
  // Sample data for manager dashboard
  const weeklyHours: WeeklyHours[] = [
    { day: 'Mon', hours: 7.5 },
    { day: 'Tue', hours: 8.0 },
    { day: 'Wed', hours: 7.0 },
    { day: 'Thu', hours: 8.5 },
    { day: 'Fri', hours: 7.5 }
  ];

  const teamAttendanceStats: AttendanceStats = {
    onTimePercentage: 92,
    latePercentage: 8,
    averageHours: 7.8
  };

  const weeklyChartData = {
    labels: weeklyHours.map(day => day.day),
    datasets: [{
      label: 'Team Average Hours',
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
    <div className="neo-box p-8">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Team Attendance Reports</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Summary */}
        <div className="neo-box p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Weekly Team Summary</h3>
          <div className="chart-container" style={{ height: '250px' }}>
            <Bar data={weeklyChartData} options={weeklyChartOptions} />
          </div>
        </div>
        
        {/* Attendance Stats */}
        <div className="neo-box p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Team Attendance Statistics</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">On-Time Arrivals</span>
                <span className="font-semibold text-green-600">{teamAttendanceStats.onTimePercentage}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill bg-green-500" 
                  style={{ width: `${teamAttendanceStats.onTimePercentage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Late Arrivals</span>
                <span className="font-semibold text-red-600">{teamAttendanceStats.latePercentage}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill bg-red-500" 
                  style={{ width: `${teamAttendanceStats.latePercentage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Average Work Hours</span>
                <span className="font-semibold text-gray-700">{teamAttendanceStats.averageHours}h</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill bg-blue-500" 
                  style={{ width: `${(teamAttendanceStats.averageHours / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional Manager-specific reports */}
      <div className="neo-box p-6 mt-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Team Efficiency Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="neo-box p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">95%</div>
            <div className="text-sm text-gray-600">Productivity</div>
          </div>
          <div className="neo-box p-4 text-center">
            <div className="text-2xl font-bold text-green-600">98%</div>
            <div className="text-sm text-gray-600">Attendance Rate</div>
          </div>
          <div className="neo-box p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">3.2%</div>
            <div className="text-sm text-gray-600">Absenteeism</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReports; 