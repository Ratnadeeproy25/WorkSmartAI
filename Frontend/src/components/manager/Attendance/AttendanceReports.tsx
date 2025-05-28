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
import { AttendanceReportsProps } from './types';

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

const AttendanceReports: React.FC<AttendanceReportsProps> = ({ weeklyHours, attendanceStats }) => {
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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-6">Attendance Reports</h3>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-sm text-blue-600 mb-1">On Time %</div>
          <div className="font-bold text-2xl text-blue-800">
            {attendanceStats?.onTimePercentage?.toFixed(1) || '0.0'}%
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-sm text-yellow-600 mb-1">Late %</div>
          <div className="font-bold text-2xl text-yellow-800">
            {attendanceStats?.latePercentage?.toFixed(1) || '0.0'}%
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-sm text-green-600 mb-1">Avg Hours</div>
          <div className="font-bold text-2xl text-green-800">
            {attendanceStats?.averageHours?.toFixed(1) || '0.0'}
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <h4 className="text-md font-medium mb-3">Weekly Work Hours</h4>
        <div className="overflow-hidden">
          <div className="flex items-end h-40 space-x-2">
            {weeklyHours.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-blue-500 rounded-t"
                  style={{ 
                    height: `${Math.min(100, (item.hours / 8) * 100)}%`,
                    backgroundColor: item.hours >= 8 ? '#10B981' : item.hours >= 5 ? '#3B82F6' : '#F59E0B'
                  }}
                ></div>
                <div className="text-xs font-medium text-gray-600 mt-1">{item.day}</div>
                <div className="text-xs text-gray-500">{item.hours.toFixed(1)}h</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReports; 