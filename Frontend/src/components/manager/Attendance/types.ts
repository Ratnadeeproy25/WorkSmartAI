import { AttendanceStatus } from '../../admin/attendance-management/types';
import { WeeklyHours, AttendanceStats, LocationData } from '../../employee/Attendance/types';

export interface CurrentStatusProps {
  hoursWorked: string;
  status: AttendanceStatus;
  locationStatus: string;
  checkInTime?: string;
  shiftTime?: { start: string; end: string };
  officeLocation?: { 
    lat: number; 
    lng: number; 
    address?: { city: string; state: string; country: string } 
  };
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

export interface EnhancedManagerCheckInData extends LocationData {
  managerId: string;
  shiftTime?: {
    start: string;
    end: string;
  };
  officeLocation?: {
    lat: number;
    lng: number;
    address?: {
      city: string;
      state: string;
      country: string;
    };
  };
}

export interface EnhancedManagerCheckOutData extends LocationData {
  managerId: string;
  checkInTime: Date;
  shiftTime?: {
    start: string;
    end: string;
  };
  officeLocation?: {
    lat: number;
    lng: number;
    address?: {
      city: string;
      state: string;
      country: string;
    };
  };
} 