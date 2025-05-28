import { AttendanceStatus } from '../../admin/attendance-management/types';
import { WeeklyHours, AttendanceStats } from '../../employee/Attendance/types';

export interface CurrentStatusProps {
  hoursWorked: string;
  status: AttendanceStatus;
  locationStatus: string;
  checkInTime?: string;
}

export interface CheckInOutControlsProps {
  onCheckIn: () => void;
  onCheckOut: () => void;
  isCheckedIn: boolean;
  isCheckedOut: boolean;
}

export interface StatusSummaryProps {
  teamData: any;
}

export interface AttendanceReportsProps {
  weeklyHours: WeeklyHours[];
  attendanceStats: AttendanceStats;
}

export interface AttendanceTrackingProps {
  teamData: any;
}

export interface LeaveCalendarProps {
  leaveDates: Set<string>;
  onLeaveDatesChange: (dates: Set<string>) => void;
} 