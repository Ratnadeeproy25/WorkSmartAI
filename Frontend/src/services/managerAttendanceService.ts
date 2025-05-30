import axios from 'axios';
import { AttendanceRecord, LocationData, WeeklyHours, AttendanceStats } from '../components/employee/Attendance/types';
import { getAuthHeaders } from './authService';
import api from './api'; // Import the api instance that has proper authorization handling

// Use the same base URL structure as api.ts
const BASE_URL = '/manager/attendance';

// Define response interface to fix typescript errors
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Improved error handling helper
const handleApiError = (error: any, defaultMessage: string) => {
  // console.error(defaultMessage, error);
  
  // Check if it's a "Manager not found" error
  if (error.response && error.response.data) {
    if (error.response.data.message === 'Manager not found') {
      throw new Error('Manager not found: Your user profile was not found in the system');
    }
    throw error.response.data;
  }
  
  // Check for network or connection errors
  if (error.message && error.message.includes('Network Error')) {
    throw new Error('Network error: Please check your internet connection');
  }
  
  throw new Error(defaultMessage);
};

// Check in manager
const checkIn = async (location: LocationData): Promise<AttendanceRecord> => {
  try {
    // Use the api instance to make requests instead of axios directly
    const response = await api.post<ApiResponse<AttendanceRecord>>(
      `${BASE_URL}/check-in`,
      { location }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to check in');
    }
    
    return response.data.data;
  } catch (error: any) {
    return handleApiError(error, 'Failed to check in. Please try again.');
  }
};

// Check out manager
const checkOut = async (location: LocationData): Promise<AttendanceRecord> => {
  try {
    const response = await api.put<ApiResponse<AttendanceRecord>>(
      `${BASE_URL}/check-out`,
      { location }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to check out');
    }
    
    return response.data.data;
  } catch (error: any) {
    return handleApiError(error, 'Failed to check out. Please try again.');
  }
};

// Get manager's attendance for today
const getTodayAttendance = async (): Promise<AttendanceRecord | null> => {
  try {
    const response = await api.get<ApiResponse<AttendanceRecord | null>>(
      `${BASE_URL}/today`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to get today\'s attendance');
    }
    
    return response.data.data;
  } catch (error: any) {
    // If 404, it means no attendance record for today (not an error)
    if (error.response && error.response.status === 404) {
      return null;
    }
    return handleApiError(error, 'Failed to get today\'s attendance. Please try again.');
  }
};

// Get manager's attendance for a specific date
const getAttendanceByDate = async (date: string): Promise<AttendanceRecord | null> => {
  try {
    const response = await api.get<ApiResponse<AttendanceRecord | null>>(
      `${BASE_URL}/date/${date}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to get attendance for date');
    }
    
    return response.data.data;
  } catch (error: any) {
    // If 404, it means no attendance record for that date (not an error)
    if (error.response && error.response.status === 404) {
      return null;
    }
    return handleApiError(error, 'Failed to get attendance for date. Please try again.');
  }
};

// Get manager's attendance for a date range
const getAttendanceByRange = async (startDate: string, endDate: string): Promise<AttendanceRecord[]> => {
  try {
    const response = await api.get<ApiResponse<AttendanceRecord[]>>(
      `${BASE_URL}/range`,
      { params: { startDate, endDate } }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to get attendance for range');
    }
    
    return response.data.data;
  } catch (error: any) {
    return handleApiError(error, 'Failed to get attendance for range. Please try again.');
  }
};

// Define stats response interface
interface AttendanceStatsResponse {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  totalWorkHours: number;
  averageHours: number;
  onTimePercentage: number;
  latePercentage: number;
  weeklyHours: WeeklyHours[];
}

// Get manager's attendance statistics
const getAttendanceStats = async (month?: number, year?: number): Promise<{
  weeklyHours: WeeklyHours[],
  attendanceStats: AttendanceStats
}> => {
  try {
    const response = await api.get<ApiResponse<AttendanceStatsResponse>>(
      `${BASE_URL}/stats`,
      { params: { month, year } }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to get attendance statistics');
    }
    
    const data = response.data.data;
    
    return {
      weeklyHours: data.weeklyHours || [],
      attendanceStats: {
        onTimePercentage: data.onTimePercentage || 0,
        latePercentage: data.latePercentage || 0,
        averageHours: data.averageHours || 0
      }
    };
  } catch (error: any) {
    return handleApiError(error, 'Failed to get attendance statistics. Please try again.');
  }
};

// Define team data interface
interface TeamAttendanceData {
  date: string;
  teamSize: number;
  summary: {
    presentCount: number;
    lateCount: number;
    absentCount: number;
    leaveCount: number;
    presentPercentage: number;
    latePercentage: number;
    absentPercentage: number;
    leavePercentage: number;
  };
  records: any[];
}

// Get team attendance overview
const getTeamAttendance = async (date?: string): Promise<TeamAttendanceData> => {
  try {
    const response = await api.get<ApiResponse<TeamAttendanceData>>(
      `${BASE_URL}/team`,
      { params: { date } }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to get team attendance');
    }
    
    return response.data.data;
  } catch (error: any) {
    return handleApiError(error, 'Failed to get team attendance. Please try again.');
  }
};

// Define team stats interface
interface TeamAttendanceStats {
  month: number;
  year: number;
  teamSize: number;
  departmentStats: any[];
  employeeStats: any[];
}

// Get team attendance statistics
const getTeamAttendanceStats = async (month?: number, year?: number): Promise<TeamAttendanceStats> => {
  try {
    const response = await api.get<ApiResponse<TeamAttendanceStats>>(
      `${BASE_URL}/team/stats`,
      { params: { month, year } }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to get team attendance statistics');
    }
    
    return response.data.data;
  } catch (error: any) {
    return handleApiError(error, 'Failed to get team attendance statistics. Please try again.');
  }
};

const managerAttendanceService = {
  checkIn,
  checkOut,
  getTodayAttendance,
  getAttendanceByDate,
  getAttendanceByRange,
  getAttendanceStats,
  getTeamAttendance,
  getTeamAttendanceStats
};

export default managerAttendanceService; 