import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AttendanceFilters from './AttendanceFilters';
import AttendanceOverview from './AttendanceOverview';
import AttendanceTable from './AttendanceTable';

export interface AttendanceRecord {
  id: number;
  employee: string;
  department: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  workHours: string;
}

export type AttendanceStats = {
  present: number;
  absent: number;
  late: number;
  leave: number;
};

// Mock data for employees attendance
const mockAttendanceData: AttendanceRecord[] = [
  {
    id: 1,
    employee: 'John Doe',
    department: 'Development',
    date: '2024-03-20',
    checkIn: '9:00 AM',
    checkOut: '6:00 PM',
    status: 'present',
    workHours: '9h'
  },
  {
    id: 2,
    employee: 'Jane Smith',
    department: 'Design',
    date: '2024-03-20',
    checkIn: '9:45 AM',
    checkOut: '6:30 PM',
    status: 'late',
    workHours: '8h 45m'
  },
  {
    id: 3,
    employee: 'Mike Johnson',
    department: 'Marketing',
    date: '2024-03-20',
    checkIn: '-',
    checkOut: '-',
    status: 'absent',
    workHours: '0h'
  },
  {
    id: 4,
    employee: 'Sarah Wilson',
    department: 'Development',
    date: '2024-03-20',
    checkIn: '8:55 AM',
    checkOut: '6:00 PM',
    status: 'present',
    workHours: '9h 5m'
  },
  {
    id: 5,
    employee: 'Tom Brown',
    department: 'HR',
    date: '2024-03-20',
    checkIn: '-',
    checkOut: '-',
    status: 'leave',
    workHours: '0h'
  }
];

const AttendanceSection: React.FC = () => {
  const [attendanceData] = useState<AttendanceRecord[]>(mockAttendanceData);
  const [filteredData, setFilteredData] = useState<AttendanceRecord[]>(mockAttendanceData);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    present: 0,
    absent: 0,
    late: 0,
    leave: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Memoize attendance statistics calculation
  useEffect(() => {
    const stats = attendanceData.reduce((acc, record) => {
      acc[record.status]++;
      return acc;
    }, { present: 0, absent: 0, late: 0, leave: 0 } as AttendanceStats);

    setAttendanceStats(stats);
  }, [attendanceData]);

  // Memoize filter handler
  const handleFilter = useCallback((
    dateRange: string,
    department: string,
    status: string,
    searchTerm: string
  ) => {
    let filtered = [...attendanceData];

    if (dateRange) {
      // In a real app, implement proper date filtering
      // This is simplified for demonstration
      filtered = filtered.filter(record => record.date === dateRange);
    }

    if (department) {
      filtered = filtered.filter(record => record.department === department);
    }

    if (status) {
      filtered = filtered.filter(record => record.status === status as any);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(record =>
        record.employee.toLowerCase().includes(term) ||
        record.department.toLowerCase().includes(term)
      );
    }

    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [attendanceData]);

  // Memoize pagination calculations
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const currentRecords = filteredData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

    return {
      totalPages,
      currentRecords
    };
  }, [filteredData, currentPage, itemsPerPage]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  return (
    <>
      <AttendanceFilters onFilter={handleFilter} />
      <AttendanceOverview stats={attendanceStats} />
      <AttendanceTable 
        records={paginationData.currentRecords} 
        currentPage={currentPage}
        totalPages={paginationData.totalPages}
        onPageChange={handlePageChange}
      />
    </>
  );
};

export default React.memo(AttendanceSection); 