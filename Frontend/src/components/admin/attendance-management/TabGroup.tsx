import React from 'react';

export type TabType = 'employee' | 'manager' | 'reports';

interface TabGroupProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabGroup: React.FC<TabGroupProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex flex-wrap gap-4 mb-8">
      <button 
        id="employeeTab" 
        className={`tab-button ${activeTab === 'employee' ? 'active' : ''}`}
        onClick={() => onTabChange('employee')}
      >
        <i className="bi bi-people"></i>
        Employee Attendance
      </button>
      <button 
        id="managerTab" 
        className={`tab-button ${activeTab === 'manager' ? 'active' : ''}`}
        onClick={() => onTabChange('manager')}
      >
        <i className="bi bi-person-badge"></i>
        Manager Attendance
      </button>
      <button 
        id="reportsTab" 
        className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
        onClick={() => onTabChange('reports')}
      >
        <i className="bi bi-graph-up"></i>
        Reports & Analytics
      </button>
    </div>
  );
};

export default TabGroup; 