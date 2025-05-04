import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface WellbeingData {
  id: number;
  name: string;
  department: string;
  position: string;
  wellbeing: {
    stressLevel: number;
    workLifeBalance: number;
    satisfaction: number;
    lastCheckIn: string;
  };
}

// Mock wellbeing data
const wellbeingData: WellbeingData[] = [
  {
    id: 1,
    name: 'John Doe',
    department: 'Development',
    position: 'Senior Developer',
    wellbeing: {
      stressLevel: 75,
      workLifeBalance: 82,
      satisfaction: 88,
      lastCheckIn: '2024-03-15'
    }
  },
  {
    id: 2,
    name: 'Jane Smith',
    department: 'Design',
    position: 'UI/UX Designer',
    wellbeing: {
      stressLevel: 65,
      workLifeBalance: 78,
      satisfaction: 85,
      lastCheckIn: '2024-03-15'
    }
  },
  {
    id: 3,
    name: 'Mike Johnson',
    department: 'Marketing',
    position: 'Marketing Manager',
    wellbeing: {
      stressLevel: 85,
      workLifeBalance: 75,
      satisfaction: 80,
      lastCheckIn: '2024-03-15'
    }
  }
];

// Helper function to determine status based on stress level
const getStatusClass = (score: number): string => {
  if (score >= 80) return 'status-good';
  if (score >= 60) return 'status-warning';
  return 'status-critical';
};

const WellbeingSection: React.FC = () => {
  // Calculate statistics
  const totalEmployees = wellbeingData.length;
  const goodStatus = wellbeingData.filter(e => e.wellbeing.stressLevel < 60).length;
  const warningStatus = wellbeingData.filter(e => e.wellbeing.stressLevel >= 60 && e.wellbeing.stressLevel < 80).length;
  const criticalStatus = wellbeingData.filter(e => e.wellbeing.stressLevel >= 80).length;

  // Refs for charts
  const stressChartRef = useRef<HTMLCanvasElement>(null);
  const wlbChartRef = useRef<HTMLCanvasElement>(null);
  
  // Initialize charts
  useEffect(() => {
    if (stressChartRef.current && wlbChartRef.current) {
      // Destroy previous charts if they exist
      const stressChartInstance = Chart.getChart(stressChartRef.current);
      const wlbChartInstance = Chart.getChart(wlbChartRef.current);
      
      if (stressChartInstance) {
        stressChartInstance.destroy();
      }
      
      if (wlbChartInstance) {
        wlbChartInstance.destroy();
      }

      // Stress Level Trend Chart
      new Chart(stressChartRef.current.getContext('2d')!, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          datasets: [{
            label: 'Average Stress Level',
            data: [75, 72, 70, 68, 65],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
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
              max: 100,
              ticks: {
                callback: function(value) {
                  return value + '%';
                }
              }
            }
          }
        }
      });

      // Work-Life Balance Trend Chart
      new Chart(wlbChartRef.current.getContext('2d')!, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          datasets: [{
            label: 'Average Work-Life Balance',
            data: [78, 80, 82, 85, 88],
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
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
              max: 100,
              ticks: {
                callback: function(value) {
                  return value + '%';
                }
              }
            }
          }
        }
      });
    }
  }, []);

  return (
    <>
      {/* Team Overview */}
      <div className="neo-box p-6">
        <h2 className="text-2xl font-bold text-gray-700 mb-6">Team Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="neo-box p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalEmployees}</div>
            <div className="text-sm text-gray-600">Total Employees</div>
          </div>
          <div className="neo-box p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{goodStatus}</div>
            <div className="text-sm text-gray-600">Good Status</div>
          </div>
          <div className="neo-box p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{warningStatus}</div>
            <div className="text-sm text-gray-600">Warning Status</div>
          </div>
          <div className="neo-box p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{criticalStatus}</div>
            <div className="text-sm text-gray-600">Critical Status</div>
          </div>
        </div>
      </div>

      {/* Employee Wellbeing Status */}
      <div className="neo-box p-6">
        <h2 className="text-2xl font-bold text-gray-700 mb-6">Employee Wellbeing Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wellbeingData.map(employee => (
            <div className="neo-box p-4" key={employee.id}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">{employee.name}</h3>
                  <p className="text-sm text-gray-600">{employee.position}</p>
                  <p className="text-sm text-gray-500">{employee.department}</p>
                </div>
                <div className={`h-3 w-3 rounded-full ${getStatusClass(employee.wellbeing.stressLevel)}`}></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xl font-bold text-blue-600">{employee.wellbeing.stressLevel}%</div>
                  <div className="text-sm text-gray-600">Stress Level</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-green-600">{employee.wellbeing.workLifeBalance}%</div>
                  <div className="text-sm text-gray-600">Work-Life Balance</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wellbeing Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="neo-box p-6">
          <h3 className="text-xl font-bold text-gray-700 mb-4">Stress Level Trends</h3>
          <div className="h-64">
            <canvas ref={stressChartRef}></canvas>
          </div>
        </div>
        <div className="neo-box p-6">
          <h3 className="text-xl font-bold text-gray-700 mb-4">Work-Life Balance Trends</h3>
          <div className="h-64">
            <canvas ref={wlbChartRef}></canvas>
          </div>
        </div>
      </div>
    </>
  );
};

export default WellbeingSection; 