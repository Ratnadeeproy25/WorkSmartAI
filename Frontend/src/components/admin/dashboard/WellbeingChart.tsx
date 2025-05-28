import React, { useEffect, useRef, useState } from 'react';
import Chart from './ChartConfig';
import { getWellbeingData } from '../../../services/adminDashboardService';

const WellbeingChart: React.FC = () => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [wellbeingData, setWellbeingData] = useState<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      fill: boolean;
      backgroundColor: string;
      borderColor: string;
      pointBackgroundColor: string;
      pointBorderColor: string;
      pointHoverBackgroundColor: string;
      pointHoverBorderColor: string;
    }>;
  }>({
    labels: [],
    datasets: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch wellbeing data from backend
  const fetchWellbeingData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWellbeingData();
      
      // Validate data structure
      if (data && data.labels && data.datasets) {
        setWellbeingData(data);
      } else {
        // Fallback data if API returns invalid structure
        setWellbeingData({
          labels: [
            'Stress Level',
            'Work-Life Balance',
            'Satisfaction',
            'Collaboration',
            'Innovation',
            'Communication'
          ],
          datasets: [{
            label: 'Current Score',
            data: [85, 88, 92, 78, 90, 85],
            fill: true,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: '#3b82f6',
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#3b82f6'
          }]
        });
      }
    } catch (error: any) {
      console.error('Error fetching wellbeing data:', error);
      setError(error.message || 'Failed to fetch wellbeing data');
      
      // Set fallback data on error
      setWellbeingData({
        labels: [
          'Stress Level',
          'Work-Life Balance',
          'Satisfaction',
          'Collaboration',
          'Innovation',
          'Communication'
        ],
        datasets: [{
          label: 'Current Score',
          data: [85, 88, 92, 78, 90, 85],
          fill: true,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: '#3b82f6',
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#3b82f6'
        }]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWellbeingData();
  }, []);
  
  useEffect(() => {
    if (!chartRef.current || loading || !wellbeingData.labels.length) return;
    
    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'radar',
      data: wellbeingData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        elements: {
          line: {
            borderWidth: 3
          }
        },
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.r}%`;
              }
            }
          }
        },
        scales: {
          r: {
            angleLines: {
              display: true
            },
            suggestedMin: 0,
            suggestedMax: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [wellbeingData, loading]);

  return (
    <div className="neo-box p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Organization Wellbeing</h3>
        {loading && (
          <div className="flex items-center text-gray-500">
            <i className="bi bi-arrow-repeat animate-spin mr-2"></i>
            Loading...
          </div>
        )}
        {error && (
          <button 
            onClick={fetchWellbeingData}
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
              <p>Loading wellbeing data...</p>
            </div>
          </div>
        ) : (
          <canvas ref={chartRef}></canvas>
        )}
      </div>
    </div>
  );
};

export default WellbeingChart; 