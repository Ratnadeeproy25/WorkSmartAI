import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { Person } from './WellbeingManagement';

interface SummaryChartsProps {
  filteredPeople: Person[];
}

const SummaryCharts: React.FC<SummaryChartsProps> = ({ filteredPeople }) => {
  const departmentChartRef = useRef<HTMLCanvasElement | null>(null);
  const roleChartRef = useRef<HTMLCanvasElement | null>(null);
  const departmentChartInstance = useRef<Chart | null>(null);
  const roleChartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    updateSummaryCharts();
    
    return () => {
      // Cleanup charts on unmount
      if (departmentChartInstance.current) {
        departmentChartInstance.current.destroy();
      }
      if (roleChartInstance.current) {
        roleChartInstance.current.destroy();
      }
    };
  }, [filteredPeople]);

  const updateSummaryCharts = () => {
    if (!departmentChartRef.current || !roleChartRef.current) return;

    // Department summary
    const deptCounts: Record<string, number> = {};
    filteredPeople.forEach(p => {
      const dept = p.department;
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    const deptLabels = Object.keys(deptCounts);
    const deptData = deptLabels.map(l => deptCounts[l]);

    // Role summary
    const roleCounts = { employee: 0, manager: 0 };
    filteredPeople.forEach(p => {
      if (p.role === 'employee') roleCounts.employee++;
      else if (p.role === 'manager') roleCounts.manager++;
    });

    // Draw/Update Department Chart
    const deptCtx = departmentChartRef.current.getContext('2d');
    if (departmentChartInstance.current) {
      departmentChartInstance.current.destroy();
    }
    
    departmentChartInstance.current = new Chart(deptCtx!, {
      type: 'bar',
      data: {
        labels: deptLabels,
        datasets: [{
          label: 'People',
          data: deptData,
          backgroundColor: ['#3b82f6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#F472B6'],
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });

    // Draw/Update Role Chart
    const roleCtx = roleChartRef.current.getContext('2d');
    if (roleChartInstance.current) {
      roleChartInstance.current.destroy();
    }
    
    roleChartInstance.current = new Chart(roleCtx!, {
      type: 'pie',
      data: {
        labels: ['Employee', 'Manager'],
        datasets: [{
          data: [roleCounts.employee, roleCounts.manager],
          backgroundColor: ['#10B981', '#3b82f6'],
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="neo-box p-4">
        <h3 className="text-base font-semibold text-gray-700 mb-3">Department Summary</h3>
        <div className="h-60">
          <canvas ref={departmentChartRef} id="departmentSummaryChart"></canvas>
        </div>
      </div>
      <div className="neo-box p-4">
        <h3 className="text-base font-semibold text-gray-700 mb-3">Role Summary</h3>
        <div className="h-60">
          <canvas ref={roleChartRef} id="roleSummaryChart"></canvas>
        </div>
      </div>
    </div>
  );
};

export default SummaryCharts; 