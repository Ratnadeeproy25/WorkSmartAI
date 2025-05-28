import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AttendanceFilters from './AttendanceFilters';
import AttendanceOverview from './AttendanceOverview';
import AttendanceTable from './AttendanceTable';
import { managerEmployeeDataApi, AttendanceRecord, AttendanceStats, AttendanceFilters as AttendanceFiltersType } from '../../../services/managerEmployeeDataApi';

const AttendanceSection: React.FC = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    present: 0,
    absent: 0,
    late: 0,
    leave: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AttendanceFiltersType>({
    page: 1,
    limit: 5
  });
  const itemsPerPage = 5;

  // Fetch attendance data
  const fetchAttendanceData = useCallback(async (newFilters: AttendanceFiltersType = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const combinedFilters = { ...filters, ...newFilters, page: newFilters.page || currentPage, limit: itemsPerPage };
      const response = await managerEmployeeDataApi.getTeamAttendance(combinedFilters);
      
      setAttendanceData(response.data);
      setAttendanceStats(response.stats);
      setTotalPages(response.pagination.totalPages);
      setCurrentPage(response.pagination.currentPage);
    } catch (err: any) {
      console.error('Error fetching attendance data:', err);
      setError(err.message || 'Failed to fetch attendance data');
      setAttendanceData([]);
      setAttendanceStats({ present: 0, absent: 0, late: 0, leave: 0 });
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  // Initial data fetch
  useEffect(() => {
    fetchAttendanceData();
  }, []);

  // Memoize filter handler
  const handleFilter = useCallback((
    dateRange: string,
    department: string,
    status: string,
    searchTerm: string
  ) => {
    const newFilters: AttendanceFiltersType = {
      date: dateRange || undefined,
      department: department || undefined,
      status: status || undefined,
      search: searchTerm || undefined,
      page: 1, // Reset to first page when filtering
      limit: itemsPerPage
    };
    
    setFilters(newFilters);
    setCurrentPage(1);
    fetchAttendanceData(newFilters);
  }, [fetchAttendanceData]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    fetchAttendanceData({ ...filters, page: newPage });
  }, [filters, fetchAttendanceData]);

  // Error display component
  if (error && !loading) {
    return (
      <div className="neo-box p-8 text-center">
        <div className="text-red-600 mb-4">
          <i className="bi bi-exclamation-triangle text-4xl"></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Error Loading Attendance Data</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          className="neo-button p-3 text-blue-600"
          onClick={() => fetchAttendanceData()}
        >
          <i className="bi bi-arrow-clockwise mr-2"></i>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      <AttendanceFilters onFilter={handleFilter} />
      <AttendanceOverview stats={attendanceStats} loading={loading} />
      <AttendanceTable 
        records={attendanceData} 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        loading={loading}
      />
    </>
  );
};

export default React.memo(AttendanceSection); 