import React, { useState, useEffect } from 'react';
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
import attendanceService from '../../../services/attendanceService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AttendanceReportsProps {
  weeklyHours?: WeeklyHours[];
  attendanceStats?: AttendanceStats;
}

const AttendanceReports: React.FC<AttendanceReportsProps> = ({
  weeklyHours: initialWeeklyHours,
  attendanceStats: initialAttendanceStats
}) => {
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours[]>(initialWeeklyHours || []);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>(initialAttendanceStats || {
    onTimePercentage: 0,
    latePercentage: 0,
    averageHours: 0
  });
  const [loading, setLoading] = useState<boolean>(!initialWeeklyHours);
  const [error, setError] = useState<string | null>(null);
  
  // Format percentage for display
  const formatPercentage = (value: number): string => {
    return value.toFixed(1);
  };
  
  // Format hours for display
  const formatHours = (value: number): string => {
    return value.toFixed(1);
  };

  // Fetch attendance data
  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await attendanceService.getAttendanceStats(month, year);
      setWeeklyHours(data.weeklyHours);
      setAttendanceStats(data.attendanceStats);
    } catch (err) {
      console.error("Error fetching attendance data:", err);
      setError("Failed to load attendance data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when month/year changes
  useEffect(() => {
    if (!initialWeeklyHours || !initialAttendanceStats) {
      fetchAttendanceData();
    }
  }, [month, year, initialWeeklyHours, initialAttendanceStats]);

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
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.raw.toFixed(1)} hours`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: Math.max(...(weeklyHours.length ? weeklyHours.map(day => day.hours) : [0]), 9) + 1,
        grid: {
          display: false
        },
        ticks: {
          callback: function(value: any) {
            return `${value}h`;
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  // Handle month change
  const handleMonthChange = async (newMonth: number) => {
    setMonth(newMonth);
    // We'll fetch data when the month changes via the useEffect
  };

  // Calculate efficiency score based on stats
  const calculateEfficiencyScore = (): number => {
    const onTimeWeight = 0.5;
    const avgHoursWeight = 0.5;
    
    // Normalize average hours (assuming 8 hours is ideal)
    const normalizedHours = Math.min(attendanceStats.averageHours / 8, 1);
    
    // Normalize on-time percentage
    const normalizedOnTime = attendanceStats.onTimePercentage / 100;
    
    // Calculate weighted score
    return (normalizedHours * avgHoursWeight + normalizedOnTime * onTimeWeight) * 100;
  };
  
  const efficiencyScore = calculateEfficiencyScore();

  return (
    <div className="neo-box p-8 mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">Attendance Reports</h2>
        <div className="flex space-x-2">
          <select 
            className="neo-input p-2 text-sm" 
            value={month}
            onChange={(e) => handleMonthChange(parseInt(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(year, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {loading && (
        <div className="text-center py-4">
          <div className="spinner"></div>
          <p className="mt-2 text-gray-600">Loading attendance data...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-4 text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && (
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
                  <span className="font-semibold text-green-600">{formatPercentage(attendanceStats.onTimePercentage)}%</span>
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
                  <span className="font-semibold text-red-600">{formatPercentage(attendanceStats.latePercentage)}%</span>
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
                  <span className="font-semibold text-gray-700">{formatHours(attendanceStats.averageHours)}h</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-bar-fill bg-blue-500" 
                    style={{ width: `${(attendanceStats.averageHours / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Efficiency Score</span>
                  <span className="font-semibold text-purple-600">{formatPercentage(efficiencyScore)}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-bar-fill bg-purple-500" 
                    style={{ width: `${efficiencyScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceReports; 