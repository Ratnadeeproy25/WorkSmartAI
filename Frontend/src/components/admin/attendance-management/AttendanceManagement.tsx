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
import attendanceService from '../../../services/attendanceService';
import { getAllDepartments } from '../../../services/managerService';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isProcessingEndDay, setIsProcessingEndDay] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching attendance data...');
        console.log('Employee filter options:', employeeFilterOptions);
        console.log('Manager filter options:', managerFilterOptions);
        
        // Fetch employee attendance
        const empRes = await attendanceService.getAllAttendanceRecords({
          ...employeeFilterOptions,
          role: 'employee',
          page: 1,
          limit: 100,
        });
        
        console.log('Employee attendance response:', empRes);
        
        setEmployeeAttendance((empRes.data || []).map((record: any) => ({
          id: record.employeeId?.id || record.employeeId?._id || record._id || Math.random().toString(),
          name: record.employeeId?.name || 'Unknown Employee',
          department: record.employeeId?.department || 'Unknown Department',
          date: record.date ? new Date(record.date).toISOString().split('T')[0] : '',
          checkIn: record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
          checkOut: record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
          status: record.status,
          workHours: record.workHours ? `${Math.floor(record.workHours)}h${Math.round((record.workHours % 1) * 60) > 0 ? ' ' + Math.round((record.workHours % 1) * 60) + 'm' : ''}` : '0h',
        })));
        setEmployeeStats(empRes.stats || { present: 0, absent: 0, late: 0, leave: 0 });

        // Fetch manager attendance
        const mgrRes = await attendanceService.getAllAttendanceRecords({
          ...managerFilterOptions,
          role: 'manager',
          page: 1,
          limit: 100,
        });
        
        console.log('Manager attendance response:', mgrRes);
        console.log('Manager attendance data count:', mgrRes.data?.length || 0);
        
        setManagerAttendance((mgrRes.data || []).map((record: any) => ({
          id: record.employeeId?.id || record.employeeId?._id || record._id || Math.random().toString(),
          name: record.employeeId?.name || 'Unknown Manager',
          department: record.employeeId?.department || 'Unknown Department',
          date: record.date ? new Date(record.date).toISOString().split('T')[0] : '',
          checkIn: record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
          checkOut: record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
          status: record.status,
          workHours: record.workHours ? `${Math.floor(record.workHours)}h${Math.round((record.workHours % 1) * 60) > 0 ? ' ' + Math.round((record.workHours % 1) * 60) + 'm' : ''}` : '0h',
        })));
        setManagerStats(mgrRes.stats || { present: 0, absent: 0, late: 0, leave: 0 });
        
        console.log('Manager attendance records processed:', managerAttendance.length);
      } catch (err: any) {
        console.error('Error fetching attendance data:', err);
        setError(err.message || 'Failed to fetch attendance data');
        setEmployeeAttendance([]);
        setManagerAttendance([]);
        setEmployeeStats({ present: 0, absent: 0, late: 0, leave: 0 });
        setManagerStats({ present: 0, absent: 0, late: 0, leave: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchAttendanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeFilterOptions, managerFilterOptions]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const deptList = await getAllDepartments();
        setDepartments(deptList);
      } catch (err) {
        setDepartments([]);
      }
    };
    fetchDepartments();
  }, []);

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
  const handleViewAttendance = (id: string) => {
    alert(`Viewing attendance details for ID: ${id}`);
  };

  const handleEditAttendance = (id: string) => {
    alert(`Editing attendance record for ID: ${id}`);
  };

  const handleDeleteAttendance = (id: string) => {
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

  const handleEndDay = async () => {
    if (!window.confirm('Are you sure you want to end the day? This will automatically mark all users who haven\'t checked in as absent (or on leave if they have approved leave requests). This action cannot be undone.')) {
      return;
    }

    setIsProcessingEndDay(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await attendanceService.endDay();
      
      if (response.success) {
        setSuccessMessage(
          `Day ended successfully! Processed ${response.data.processed} users:\n` +
          `• ${response.data.marked_absent} marked as absent\n` +
          `• ${response.data.marked_leave} marked as on leave\n` +
          `• ${response.data.already_present} already had attendance records`
        );
        
        // Refresh attendance data to show updated records
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        throw new Error(response.message || 'Failed to end day');
      }
    } catch (err: any) {
      console.error('Error ending day:', err);
      setError(err.response?.data?.message || err.message || 'Failed to end day. Please try again.');
    } finally {
      setIsProcessingEndDay(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>WorkSmart AI - Attendance Management (Admin)</title>
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
            <HeaderPanel onEndDay={handleEndDay} isProcessingEndDay={isProcessingEndDay} />

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
                departments={departments}
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
                departments={departments}
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

            {loading && <div>Loading attendance data...</div>}
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <i className="bi bi-exclamation-triangle text-red-500 mt-0.5"></i>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Error</h4>
                    <p>{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>
            )}
            
            {isProcessingEndDay && (
              <div className="mb-4 p-4 bg-blue-100 border border-blue-300 text-blue-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <i className="bi bi-arrow-repeat animate-spin text-blue-500"></i>
                  <div>
                    <h4 className="font-semibold">Processing End of Day</h4>
                    <p>Checking all users and updating attendance records. This may take a few moments...</p>
                  </div>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <i className="bi bi-check-circle text-green-500 mt-0.5"></i>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Success</h4>
                    <pre className="whitespace-pre-wrap text-sm">{successMessage}</pre>
                    <p className="text-xs mt-2 text-green-600">Page will refresh in 3 seconds...</p>
                  </div>
                  <button
                    onClick={() => setSuccessMessage(null)}
                    className="text-green-500 hover:text-green-700 ml-2"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AttendanceManagement; 