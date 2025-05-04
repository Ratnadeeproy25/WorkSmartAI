export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

export interface AttendanceRecord {
  id: number;
  name: string;
  department: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
  workHours: string;
}

export interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  leave: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface FilterOptions {
  dateRange: DateRange;
  department: string;
  status: string;
  searchQuery: string;
} 