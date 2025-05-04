import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { AdminSidebar } from '../dashboard';
import TabGroup, { TabType } from './TabGroup';
import HeaderPanel from './HeaderPanel';
import FilterPanel from './FilterPanel';
import StatsPanel from './StatsPanel';
import AttendanceTable from './AttendanceTable';
import AnalyticsPanel from './AnalyticsPanel';
import { 
  AttendanceRecord, 
  AttendanceStats, 
  DateRange, 
  FilterOptions 
} from './types';

const AttendanceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('employee');
  const [employeeAttendance, setEmployeeAttendance] = useState<AttendanceRecord[]>([]);
  const [managerAttendance, setManagerAttendance] = useState<AttendanceRecord[]>([]);
  const [employeeStats, setEmployeeStats] = useState<AttendanceStats>({
    present: 0,
    absent: 0,
    late: 0,
    leave: 0
  });
  const [managerStats, setManagerStats] = useState<AttendanceStats>({
    present: 0,
    absent: 0,
    late: 0,
    leave: 0
  });
  const [employeeFilterOptions, setEmployeeFilterOptions] = useState<FilterOptions>({
    dateRange: {
      startDate: '',
      endDate: ''
    },
    department: '',
    status: '',
    searchQuery: ''
  });
  const [managerFilterOptions, setManagerFilterOptions] = useState<FilterOptions>({
    dateRange: {
      startDate: '',
      endDate: ''
    },
    department: '',
    status: '',
    searchQuery: ''
  });

  useEffect(() => {
    // Load sample employee attendance data
    const sampleEmployeeData: AttendanceRecord[] = [
      {
        id: 1,
        name: 'John Doe',
        department: 'Development',
        date: '2024-03-20',
        checkIn: '9:00 AM',
        checkOut: '6:00 PM',
        status: 'present',
        workHours: '9h'
      },
      {
        id: 2,
        name: 'Jane Smith',
        department: 'Design',
        date: '2024-03-20',
        checkIn: '9:45 AM',
        checkOut: '6:30 PM',
        status: 'late',
        workHours: '8h 45m'
      },
      {
        id: 3,
        name: 'Mike Johnson',
        department: 'Marketing',
        date: '2024-03-20',
        checkIn: '-',
        checkOut: '-',
        status: 'absent',
        workHours: '0h'
      },
      {
        id: 4,
        name: 'Sarah Wilson',
        department: 'Development',
        date: '2024-03-20',
        checkIn: '8:55 AM',
        checkOut: '6:00 PM',
        status: 'present',
        workHours: '9h 5m'
      },
      {
        id: 5,
        name: 'Tom Brown',
        department: 'HR',
        date: '2024-03-20',
        checkIn: '-',
        checkOut: '-',
        status: 'leave',
        workHours: '0h'
      }
    ];
    setEmployeeAttendance(sampleEmployeeData);

    // Load sample manager attendance data
    const sampleManagerData: AttendanceRecord[] = [
      {
        id: 1,
        name: 'Alex Manager',
        department: 'Development',
        date: '2024-03-20',
        checkIn: '8:30 AM',
        checkOut: '6:30 PM',
        status: 'present',
        workHours: '10h'
      },
      {
        id: 2,
        name: 'Sarah Lead',
        department: 'Design',
        date: '2024-03-20',
        checkIn: '9:15 AM',
        checkOut: '6:45 PM',
        status: 'late',
        workHours: '9h 30m'
      }
    ];
    setManagerAttendance(sampleManagerData);
  }, []);

  // Calculate statistics whenever attendance data changes
  useEffect(() => {
    const employeeStats = employeeAttendance.reduce((acc, record) => {
      acc[record.status]++;
      return acc;
    }, { present: 0, absent: 0, late: 0, leave: 0 } as AttendanceStats);
    
    setEmployeeStats(employeeStats);
  }, [employeeAttendance]);

  useEffect(() => {
    const managerStats = managerAttendance.reduce((acc, record) => {
      acc[record.status]++;
      return acc;
    }, { present: 0, absent: 0, late: 0, leave: 0 } as AttendanceStats);
    
    setManagerStats(managerStats);
  }, [managerAttendance]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleEmployeeDateRangeChange = (dateRange: DateRange) => {
    setEmployeeFilterOptions({
      ...employeeFilterOptions,
      dateRange
    });
  };

  const handleEmployeeDepartmentChange = (department: string) => {
    setEmployeeFilterOptions({
      ...employeeFilterOptions,
      department
    });
  };

  const handleEmployeeStatusChange = (status: string) => {
    setEmployeeFilterOptions({
      ...employeeFilterOptions,
      status
    });
  };

  const handleEmployeeSearchChange = (query: string) => {
    setEmployeeFilterOptions({
      ...employeeFilterOptions,
      searchQuery: query
    });
  };

  const handleManagerDateRangeChange = (dateRange: DateRange) => {
    setManagerFilterOptions({
      ...managerFilterOptions,
      dateRange
    });
  };

  const handleManagerDepartmentChange = (department: string) => {
    setManagerFilterOptions({
      ...managerFilterOptions,
      department
    });
  };

  const handleManagerStatusChange = (status: string) => {
    setManagerFilterOptions({
      ...managerFilterOptions,
      status
    });
  };

  const handleManagerSearchChange = (query: string) => {
    setManagerFilterOptions({
      ...managerFilterOptions,
      searchQuery: query
    });
  };

  // Action handlers
  const handleViewAttendance = (id: number) => {
    alert(`Viewing attendance details for ID: ${id}`);
  };

  const handleEditAttendance = (id: number) => {
    alert(`Editing attendance record for ID: ${id}`);
  };

  const handleDeleteAttendance = (id: number) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      alert(`Deleted attendance record for ID: ${id}`);
    }
  };

  const handleExportData = () => {
    alert('Exporting attendance data...');
  };

  const handleSendReminder = () => {
    alert('Sending reminders to absent personnel...');
  };

  const handleGenerateReport = () => {
    alert('Generating attendance report...');
  };

  return (
    <>
      <Helmet>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" />
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>{`
          * {
            font-family: 'Poppins', sans-serif;
          }
          .chart-container {
            position: relative;
            height: 280px;
            width: 100%;
          }
          @media (max-width: 768px) {
            .chart-container {
              height: 220px;
            }
          }
          .tab-button {
            border-radius: 16px;
            padding: 1rem 2rem;
            background: #e0e5ec;
            box-shadow: 5px 5px 10px #bec3c9,
                      -5px -5px 10px #ffffff;
            transition: all 0.3s ease;
            cursor: pointer;
            font-weight: 500;
            color: #4b5563;
            position: relative;
            overflow: hidden;
          }
          .tab-button:hover {
            transform: translateY(-2px);
            box-shadow: 7px 7px 15px #bec3c9,
                      -7px -7px 15px #ffffff;
            color: #2563eb;
          }
          .tab-button.active {
            background: #2563eb;
            color: white;
            box-shadow: 5px 5px 10px #1d4ed8,
                      -5px -5px 10px #3b82f6;
          }
          .tab-button.active::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: #ffffff;
            border-radius: 0 0 16px 16px;
          }
          .tab-button i {
            margin-right: 0.5rem;
            font-size: 1.25rem;
          }
          .section-header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 2rem;
            border-radius: 24px;
            margin-bottom: 2rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          .section-header h1 {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
          }
          .section-header p {
            font-size: 1.125rem;
            opacity: 0.9;
          }
          .stats-card {
            background: white;
            border-radius: 16px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            transition: all 0.3s ease;
          }
          .stats-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          }
          .stats-card .value {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
          }
          .stats-card .label {
            font-size: 0.875rem;
            color: #6b7280;
          }
          .action-button {
            background: white;
            border-radius: 12px;
            padding: 1rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .action-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          }
          .action-button i {
            font-size: 1.5rem;
            color: #2563eb;
          }
          .action-button span {
            font-weight: 500;
            color: #1f2937;
          }
          .table-container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            overflow: hidden;
          }
          .table-header {
            background: #f3f4f6;
            padding: 1rem;
            border-bottom: 1px solid #e5e7eb;
          }
          .table-row {
            padding: 1rem;
            border-bottom: 1px solid #e5e7eb;
            transition: all 0.3s ease;
          }
          .table-row:hover {
            background: #f9fafb;
          }
          .status-badge {
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
          }
          .status-badge i {
            font-size: 0.75rem;
          }
          .status-badge.status-present {
            background-color: #d1fae5;
            color: #065f46;
          }
          .status-badge.status-absent {
            background-color: #fee2e2;
            color: #991b1b;
          }
          .status-badge.status-late {
            background-color: #fef3c7;
            color: #92400e;
          }
          .status-badge.status-leave {
            background-color: #dbeafe;
            color: #1e40af;
          }
          .date-range-container {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .date-input-container {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .date-input-container label {
            font-size: 0.75rem;
            width: 3rem;
            color: #6b7280;
          }
          .neo-input {
            border-radius: 16px;
            background: #e0e5ec;
            box-shadow: inset 5px 5px 10px #bec3c9,
                        inset -5px -5px 10px #ffffff;
            transition: all 0.3s ease;
            outline: none;
            border: none;
            padding: 0.75rem 1rem;
            width: 100%;
            font-size: 0.875rem;
          }
          .neo-input:focus {
            box-shadow: inset 7px 7px 15px #bec3c9,
                        inset -7px -7px 15px #ffffff;
          }
          .neo-select {
            border-radius: 16px;
            background: #e0e5ec;
            box-shadow: inset 5px 5px 10px #bec3c9,
                        inset -5px -5px 10px #ffffff;
            transition: all 0.3s ease;
            outline: none;
            border: none;
            padding: 0.75rem 1rem;
            width: 100%;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%234b5563' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 1rem center;
            background-size: 1rem;
          }
          .neo-select:focus {
            box-shadow: inset 7px 7px 15px #bec3c9,
                        inset -7px -7px 15px #ffffff;
          }
        `}</style>
      </Helmet>

      <div className="flex min-h-screen bg-[#e0e5ec]">
        <AdminSidebar />

        <div className="main-content flex-1 p-8">
          <div className="container-fluid">
            {/* Header */}
            <HeaderPanel />

            {/* Tabs */}
            <TabGroup activeTab={activeTab} onTabChange={handleTabChange} />

            {/* Employee Attendance Section */}
            <div id="employeeSection" className={`tab-content ${activeTab === 'employee' ? 'active' : ''}`} style={{ display: activeTab === 'employee' ? 'block' : 'none' }}>
              {/* Filters and Search */}
              <FilterPanel 
                filterOptions={employeeFilterOptions}
                onDateRangeChange={handleEmployeeDateRangeChange}
                onDepartmentChange={handleEmployeeDepartmentChange}
                onStatusChange={handleEmployeeStatusChange}
                onSearchChange={handleEmployeeSearchChange}
              />

              {/* Attendance Overview */}
              <StatsPanel 
                stats={employeeStats}
                type="employee"
                onExportData={handleExportData}
                onSendReminder={handleSendReminder}
                onGenerateReport={handleGenerateReport}
              />

              {/* Employee Attendance Records Table */}
              <AttendanceTable 
                attendanceData={employeeAttendance}
                type="employee"
                onView={handleViewAttendance}
                onEdit={handleEditAttendance}
                onDelete={handleDeleteAttendance}
              />
            </div>

            {/* Manager Attendance Section */}
            <div id="managerSection" className={`tab-content ${activeTab === 'manager' ? 'active' : ''}`} style={{ display: activeTab === 'manager' ? 'block' : 'none' }}>
              {/* Filters and Search */}
              <FilterPanel 
                filterOptions={managerFilterOptions}
                onDateRangeChange={handleManagerDateRangeChange}
                onDepartmentChange={handleManagerDepartmentChange}
                onStatusChange={handleManagerStatusChange}
                onSearchChange={handleManagerSearchChange}
              />

              {/* Manager Attendance Overview */}
              <StatsPanel 
                stats={managerStats}
                type="manager"
                onExportData={handleExportData}
                onSendReminder={handleSendReminder}
                onGenerateReport={handleGenerateReport}
              />

              {/* Manager Attendance Records Table */}
              <AttendanceTable 
                attendanceData={managerAttendance}
                type="manager"
                onView={handleViewAttendance}
                onEdit={handleEditAttendance}
                onDelete={handleDeleteAttendance}
              />
            </div>

            {/* Reports & Analytics Section */}
            <div id="reportsSection" className={`tab-content ${activeTab === 'reports' ? 'active' : ''}`} style={{ display: activeTab === 'reports' ? 'block' : 'none' }}>
              <AnalyticsPanel />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AttendanceManagement; 