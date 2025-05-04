export interface LocationData {
  lat: number;
  lng: number;
  checkOutLocation?: {
    lat: number;
    lng: number;
  };
}

export interface AttendanceRecord {
  date: string;
  checkIn: string;
  checkOut?: string;
  workHours?: number;
  location: LocationData;
  employeeId: string;
}

export interface LeaveBalance {
  type: string;
  used: number;
  total: number;
  remaining: number;
  color: string;
}

export interface WeeklyHours {
  day: string;
  hours: number;
}

export interface AttendanceStats {
  onTimePercentage: number;
  latePercentage: number;
  averageHours: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
} 