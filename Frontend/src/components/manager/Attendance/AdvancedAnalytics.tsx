import React from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdvancedAnalytics: React.FC = () => {
  // Team attendance patterns data
  const teamPatternsData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'On-Time Rate',
        data: [92, 90, 94, 96, 95, 97],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Late Rate',
        data: [8, 10, 6, 4, 5, 3],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // Department comparison data
  const departmentData = {
    labels: ['Engineering', 'Marketing', 'Support', 'HR', 'Finance'],
    datasets: [
      {
        label: 'Average Hours',
        data: [7.9, 7.6, 8.1, 7.8, 7.5],
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#6366f1',
          '#ec4899'
        ],
        borderRadius: 8
      }
    ]
  };

  // Forecast data
  const forecastData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Expected Attendance',
        data: [96, 97, 95, 98],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: '#3b82f6',
        borderWidth: 2,
        pointBackgroundColor: '#3b82f6',
        tension: 0.4
      }
    ]
  };

  // Chart options
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          }
        }
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10
      }
    }
  };

  const forecastOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          }
        }
      }
    }
  };

  return (
    <div className="neo-box p-8">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Advanced Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Team Attendance Patterns */}
        <div className="neo-box p-4">
          <h3 className="font-medium mb-4 text-gray-700">Team Attendance Patterns</h3>
          <div className="chart-container" style={{ height: '250px' }}>
            <Line data={teamPatternsData} options={lineChartOptions} />
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>Positive trend in on-time attendance over the last quarter.</p>
          </div>
        </div>
        
        {/* Department Comparison */}
        <div className="neo-box p-4">
          <h3 className="font-medium mb-4 text-gray-700">Department Comparison</h3>
          <div className="chart-container" style={{ height: '250px' }}>
            <Bar data={departmentData} options={barChartOptions} />
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>Support team shows highest average working hours.</p>
          </div>
        </div>
        
        {/* Attendance Forecast */}
        <div className="neo-box p-4">
          <h3 className="font-medium mb-4 text-gray-700">Attendance Forecast</h3>
          <div className="chart-container" style={{ height: '250px' }}>
            <Line data={forecastData} options={forecastOptions} />
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>Projected 98% attendance for next week.</p>
          </div>
        </div>
      </div>
      
      {/* Insights and Recommendations */}
      <div className="neo-box p-6 mt-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="neo-box p-4">
            <h4 className="font-medium text-blue-600 mb-2">Strengths</h4>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Overall attendance rate is excellent at 96%</li>
              <li>On-time arrivals improving consistently</li>
              <li>Support team shows high engagement</li>
            </ul>
          </div>
          <div className="neo-box p-4">
            <h4 className="font-medium text-amber-600 mb-2">Recommendations</h4>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Consider flexible start times for Marketing team</li>
              <li>Monitor Finance team's work-life balance</li>
              <li>Recognize Support team's high attendance rate</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;

 