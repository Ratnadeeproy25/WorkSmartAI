import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Chart from 'chart.js/auto';
import { ChartOptions } from 'chart.js';

interface PerformanceChartProps {
  initialRange?: 'week' | 'month' | 'quarter';
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ initialRange = 'week' }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [range, setRange] = useState<'week' | 'month' | 'quarter'>(initialRange);

  // Memoize chart data
  const chartData = useMemo(() => ({
    week: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      productivity: [85, 87, 86, 89, 92, 91, 88],
      engagement: [80, 82, 84, 83, 86, 85, 83]
    },
    month: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      productivity: [86, 88, 90, 89],
      engagement: [82, 84, 85, 83]
    },
    quarter: {
      labels: ['Jan', 'Feb', 'Mar'],
      productivity: [85, 88, 92],
      engagement: [80, 83, 87]
    }
  }), []);

  // Memoize chart options with proper typing
  const chartOptions = useMemo<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
  }), []);

  // Memoize chart data preparation
  const preparedChartData = useMemo(() => ({
    labels: chartData[range].labels,
    datasets: [
      {
        label: 'Productivity',
        data: chartData[range].productivity,
        borderColor: '#3b82f6',
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.1)'
      },
      {
        label: 'Engagement',
        data: chartData[range].engagement,
        borderColor: '#10b981',
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(16, 185, 129, 0.1)'
      }
    ]
  }), [range, chartData]);

  // Memoize range change handler
  const handleRangeChange = useCallback((newRange: 'week' | 'month' | 'quarter') => {
    setRange(newRange);
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;

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
  }, [range, preparedChartData, chartOptions]);

  return (
    <div className="neo-box p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Organization Performance</h3>
      <div className="flex justify-end gap-2 mb-4">
        <button 
          className={`neo-button p-2 text-sm ${range === 'week' ? 'primary' : ''}`} 
          onClick={() => handleRangeChange('week')}
        >
          Week
        </button>
        <button 
          className={`neo-button p-2 text-sm ${range === 'month' ? 'primary' : ''}`} 
          onClick={() => handleRangeChange('month')}
        >
          Month
        </button>
        <button 
          className={`neo-button p-2 text-sm ${range === 'quarter' ? 'primary' : ''}`} 
          onClick={() => handleRangeChange('quarter')}
        >
          Quarter
        </button>
      </div>
      <div className="h-64">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default React.memo(PerformanceChart); 