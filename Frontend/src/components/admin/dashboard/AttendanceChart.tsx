import React, { useEffect, useRef, useState } from 'react';
import Chart from './ChartConfig';
import { getAttendanceTrends } from '../../../services/adminDashboardService';

const AttendanceChart: React.FC = () => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [attendanceData, setAttendanceData] = useState<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      tension: number;
    }>;
  }>({
    labels: [],
    datasets: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch attendance trends data from backend
  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAttendanceTrends();
      
      // Validate data structure
      if (data && data.labels && data.datasets) {
        setAttendanceData(data);
      } else {
        // Fallback data if API returns invalid structure
        setAttendanceData({
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [
            {
              label: 'Present',
              data: [95, 92, 94, 96],
              borderColor: '#10b981',
              tension: 0.4
            },
            {
              label: 'Late',
              data: [3, 5, 4, 2],
              borderColor: '#f59e0b',
              tension: 0.4
            },
            {
              label: 'Absent',
              data: [2, 3, 2, 2],
              borderColor: '#ef4444',
              tension: 0.4
            }
          ]
        });
      }
    } catch (error: any) {
      console.error('Error fetching attendance data:', error);
      setError(error.message || 'Failed to fetch attendance data');
      
      // Set fallback data on error
      setAttendanceData({
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
          {
            label: 'Present',
            data: [95, 92, 94, 96],
            borderColor: '#10b981',
            tension: 0.4
          },
          {
            label: 'Late',
            data: [3, 5, 4, 2],
            borderColor: '#f59e0b',
            tension: 0.4
          },
          {
            label: 'Absent',
            data: [2, 3, 2, 2],
            borderColor: '#ef4444',
            tension: 0.4
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);
  
  useEffect(() => {
    if (!chartRef.current || loading || !attendanceData.labels.length) return;
    
    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: attendanceData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y}%`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [attendanceData, loading]);

  return (
    <div className="neo-box p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Attendance Trends</h3>
        {loading && (
          <div className="flex items-center text-gray-500">
            <i className="bi bi-arrow-repeat animate-spin mr-2"></i>
            Loading...
          </div>
        )}
        {error && (
          <button 
            onClick={fetchAttendanceData}
            className="text-blue-600 hover:text-blue-800 text-sm"
            title="Retry loading data"
          >
            <i className="bi bi-arrow-clockwise mr-1"></i>
            Retry
          </button>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-700 text-sm">
            <i className="bi bi-exclamation-triangle mr-2"></i>
            {error} - Showing sample data
          </p>
        </div>
      )}
      
      <div className="h-64">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">
              <i className="bi bi-arrow-repeat animate-spin text-2xl mb-2"></i>
              <p>Loading attendance data...</p>
            </div>
          </div>
        ) : (
          <canvas ref={chartRef}></canvas>
        )}
      </div>
    </div>
  );
};

export default AttendanceChart; 