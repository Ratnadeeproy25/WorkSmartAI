import React, { useEffect, useRef, useState } from 'react';
import Chart from './ChartConfig';
import { getDepartmentData } from '../../../services/adminDashboardService';

const DepartmentChart: React.FC = () => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [departmentData, setDepartmentData] = useState<{
    labels: string[];
    data: number[];
    colors: string[];
  }>({
    labels: [],
    data: [],
    colors: []
  });
  const [loading, setLoading] = useState(true);
  
  // Fetch department data from backend
  const fetchDepartmentData = async () => {
    try {
      const data = await getDepartmentData();
      setDepartmentData(data);
    } catch (error: any) {
      console.error('Error fetching department data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentData();
  }, []);
  
  useEffect(() => {
    if (!chartRef.current || loading) return;
    
    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: departmentData.labels,
        datasets: [{
          data: departmentData.data,
          backgroundColor: departmentData.colors
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [departmentData, loading]);

  return (
    <div className="neo-box p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Department Distribution</h3>
      <div className="h-64">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default DepartmentChart; 