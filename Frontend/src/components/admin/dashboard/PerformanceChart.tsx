import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Chart from 'chart.js/auto';
import { ChartOptions } from 'chart.js';
import { getPerformanceData } from '../../../services/adminDashboardService';

interface PerformanceChartProps {
  initialRange?: 'week' | 'month' | 'quarter';
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ initialRange = 'week' }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [range, setRange] = useState<'week' | 'month' | 'quarter'>(initialRange);
  const [chartData, setChartData] = useState<{
    labels: string[];
    productivity: number[];
    engagement: number[];
  }>({
    labels: [],
    productivity: [],
    engagement: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch performance data from backend
  const fetchPerformanceData = useCallback(async (timeRange: 'week' | 'month' | 'quarter') => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPerformanceData(timeRange);
      
      // Validate data structure
      if (data && data.labels && data.productivity && data.engagement) {
        setChartData(data);
      } else {
        // Fallback data based on range
        const fallbackData = getFallbackData(timeRange);
        setChartData(fallbackData);
      }
    } catch (error: any) {
      console.error('Error fetching performance data:', error);
      setError(error.message || 'Failed to fetch performance data');
      
      // Set fallback data on error
      const fallbackData = getFallbackData(timeRange);
      setChartData(fallbackData);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get fallback data based on time range
  const getFallbackData = (timeRange: 'week' | 'month' | 'quarter') => {
    switch (timeRange) {
      case 'week':
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          productivity: [85, 87, 86, 89, 92, 91, 88],
          engagement: [80, 82, 84, 83, 86, 85, 83]
        };
      case 'month':
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          productivity: [86, 88, 90, 89],
          engagement: [82, 84, 85, 83]
        };
      case 'quarter':
        return {
          labels: ['Jan', 'Feb', 'Mar'],
          productivity: [85, 88, 92],
          engagement: [80, 83, 87]
        };
      default:
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          productivity: [85, 87, 86, 89, 92, 91, 88],
          engagement: [80, 82, 84, 83, 86, 85, 83]
        };
    }
  };

  // Memoize chart options with proper typing
  const chartOptions = useMemo<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const
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
  }), []);

  // Memoize chart data preparation
  const preparedChartData = useMemo(() => ({
    labels: chartData.labels,
    datasets: [
      {
        label: 'Productivity',
        data: chartData.productivity,
        borderColor: '#3b82f6',
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.1)'
      },
      {
        label: 'Engagement',
        data: chartData.engagement,
        borderColor: '#10b981',
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(16, 185, 129, 0.1)'
      }
    ]
  }), [chartData]);

  // Memoize range change handler
  const handleRangeChange = useCallback((newRange: 'week' | 'month' | 'quarter') => {
    setRange(newRange);
    fetchPerformanceData(newRange);
  }, [fetchPerformanceData]);

  // Initial data fetch
  useEffect(() => {
    fetchPerformanceData(range);
  }, []);

  useEffect(() => {
    if (!chartRef.current || loading || !chartData.labels.length) return;

    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: preparedChartData,
      options: chartOptions
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [preparedChartData, chartOptions, loading]);

  return (
    <div className="neo-box p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Organization Performance</h3>
        <div className="flex items-center gap-2">
          {loading && (
            <div className="flex items-center text-gray-500 mr-2">
              <i className="bi bi-arrow-repeat animate-spin mr-1"></i>
              Loading...
            </div>
          )}
          {error && (
            <button 
              onClick={() => fetchPerformanceData(range)}
              className="text-blue-600 hover:text-blue-800 text-sm mr-2"
              title="Retry loading data"
            >
              <i className="bi bi-arrow-clockwise mr-1"></i>
              Retry
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-700 text-sm">
            <i className="bi bi-exclamation-triangle mr-2"></i>
            {error} - Showing sample data
          </p>
        </div>
      )}
      
      <div className="flex justify-end gap-2 mb-4">
        <button 
          className={`neo-button p-2 text-sm ${range === 'week' ? 'primary' : ''}`} 
          onClick={() => handleRangeChange('week')}
          disabled={loading}
        >
          Week
        </button>
        <button 
          className={`neo-button p-2 text-sm ${range === 'month' ? 'primary' : ''}`} 
          onClick={() => handleRangeChange('month')}
          disabled={loading}
        >
          Month
        </button>
        <button 
          className={`neo-button p-2 text-sm ${range === 'quarter' ? 'primary' : ''}`} 
          onClick={() => handleRangeChange('quarter')}
          disabled={loading}
        >
          Quarter
        </button>
      </div>
      
      <div className="h-64">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">
              <i className="bi bi-arrow-repeat animate-spin text-2xl mb-2"></i>
              <p>Loading performance data...</p>
            </div>
          </div>
        ) : (
          <canvas ref={chartRef}></canvas>
        )}
      </div>
    </div>
  );
};

export default React.memo(PerformanceChart); 