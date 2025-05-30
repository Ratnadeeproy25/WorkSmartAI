import api from './api';
import { AttendanceRecord, LocationData, WeeklyHours, AttendanceStats } from '../components/employee/Attendance/types';

const BASE_URL = '/attendance';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Retry helper with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry for certain errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Extend window interface to support user-specific caches
declare global {
  interface Window {
    userAttendanceCaches?: {
      [userId: string]: {
        todayAttendance: AttendanceRecord | null;
        stats: { weeklyHours: WeeklyHours[], attendanceStats: AttendanceStats } | null;
        leaveBalances: any[] | null;
        cacheExpiry: number;
      };
    };
  }
}

// User-specific cache instead of global cache
const getUserSpecificCache = () => {
  // Try to get user data from different possible storage keys
  let user = null;
  
  // Try employeeUserData first (primary key for employees)
  const employeeData = localStorage.getItem('employeeUserData');
  if (employeeData) {
    try {
      user = JSON.parse(employeeData);
    } catch (e) {
      console.error('Error parsing employeeUserData:', e);
    }
  }
  
  // Fallback to currentUser if employeeUserData not found
  if (!user) {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        user = JSON.parse(currentUser);
      } catch (e) {
        console.error('Error parsing currentUser:', e);
      }
    }
  }
  
  const userId = user?.id || user?.email || 'anonymous';
  
  if (!window.userAttendanceCaches) {
    window.userAttendanceCaches = {};
  }
  
  if (!window.userAttendanceCaches[userId]) {
    window.userAttendanceCaches[userId] = {
      todayAttendance: null as AttendanceRecord | null,
      stats: null as { weeklyHours: WeeklyHours[], attendanceStats: AttendanceStats } | null,
      leaveBalances: null as any[] | null,
      cacheExpiry: 0
    };
  }
  
  return window.userAttendanceCaches[userId];
};

// Helper to clear cache when it's potentially invalidated
const invalidateCache = () => {
  const cache = getUserSpecificCache();
  cache.todayAttendance = null;
  cache.stats = null;
};

// Clear all user caches (to be called on logout)
export const clearAllUserCaches = () => {
  if (window.userAttendanceCaches) {
    window.userAttendanceCaches = {};
  }
};

// Clear specific user cache (to be called when switching users)
export const clearUserCache = (userId?: string) => {
  let targetUserId = userId;
  
  if (!targetUserId) {
    // Use the same logic as getUserSpecificCache
    let user = null;
    
    const employeeData = localStorage.getItem('employeeUserData');
    if (employeeData) {
      try {
        user = JSON.parse(employeeData);
      } catch (e) {
        console.error('Error parsing employeeUserData:', e);
      }
    }
    
    if (!user) {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        try {
          user = JSON.parse(currentUser);
        } catch (e) {
          console.error('Error parsing currentUser:', e);
        }
      }
    }
    
    targetUserId = user?.id || user?.email || 'anonymous';
  }
  
  if (window.userAttendanceCaches && targetUserId && window.userAttendanceCaches[targetUserId]) {
    delete window.userAttendanceCaches[targetUserId];
  }
};

// Debug function to test authentication and basic API connectivity
export const debugCheckIn = async (location: LocationData): Promise<any> => {
  try {
    console.log('Debug: Testing check-in with location:', location);
    
    // Check if user data exists
    const userData = localStorage.getItem('employeeUserData');
    console.log('Debug: Employee user data exists:', !!userData);
    
    if (userData) {
      const user = JSON.parse(userData);
      console.log('Debug: Employee user:', { id: user.id, name: user.name, email: user.email });
    }
    
    // Check if token exists
    const token = localStorage.getItem('employeeToken');
    console.log('Debug: Employee token exists:', !!token);
    
    // Test a simple authenticated request first
    try {
      const response = await api.get('/attendance/today');
      console.log('Debug: Auth test successful, current attendance:', response.data);
    } catch (authError: any) {
      console.error('Debug: Auth test failed:', authError.response?.status, authError.response?.data);
      throw new Error(`Authentication test failed: ${authError.response?.data?.message || authError.message}`);
    }
    
    // Now try the actual check-in
    const response = await api.post<ApiResponse<AttendanceRecord>>(`${BASE_URL}/check-in`, { location });
    console.log('Debug: Check-in successful:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('Debug: Check-in failed:', error);
    throw error;
  }
};

// Check in employee with retry logic
export const checkIn = async (location: LocationData): Promise<AttendanceRecord> => {
  return retryWithBackoff(async () => {
    // Validate location data before sending
    if (!location || !location.lat || !location.lng) {
      throw new Error('Location data is required for check-in. Please enable location services.');
    }

    // Validate location coordinates
    if (isNaN(location.lat) || isNaN(location.lng)) {
      throw new Error('Invalid location coordinates. Please try getting your location again.');
    }

    console.log('Attempting check-in with location:', location);

    const response = await api.post<ApiResponse<AttendanceRecord>>(`${BASE_URL}/check-in`, { location });
    
    // Update user-specific cache with new attendance record
    const cache = getUserSpecificCache();
    cache.todayAttendance = response.data.data;
    
    // Invalidate stats which will change after check-in
    cache.stats = null;
    
    return response.data.data;
  }, 2, 1000); // 2 retries with 1 second base delay
};

// Check out employee
export const checkOut = async (location: LocationData): Promise<AttendanceRecord> => {
  try {
    const response = await api.put<ApiResponse<AttendanceRecord>>(`${BASE_URL}/check-out`, { location });
    
    // Update user-specific cache with updated attendance record
    const cache = getUserSpecificCache();
    cache.todayAttendance = response.data.data;
    
    // Invalidate stats which will change after check-out
    cache.stats = null;
    
    return response.data.data;
  } catch (error) {
    console.error('Error checking out:', error);
    throw error;
  }
};

// Get today's attendance
export const getTodayAttendance = async (): Promise<AttendanceRecord | null> => {
  try {
    console.log('🔄 Getting today\'s attendance...');
    
    // Get user data for cache key generation
    const userData = localStorage.getItem('employeeUserData');
    if (!userData) {
      console.warn('❌ No employee user data found in localStorage');
      throw new Error('Please log in to view attendance data');
    }
    
    let user;
    try {
      user = JSON.parse(userData);
    } catch (parseError) {
      console.error('❌ Error parsing employee data:', parseError);
      throw new Error('Invalid session data. Please log in again.');
    }
    
    console.log(`👤 Fetching attendance for employee: ${user.name} (${user.id})`);
    
    // Check if we have a valid cached response for this specific user
    const cache = getUserSpecificCache();
    const now = Date.now();
    
    // Only use cache if it's less than 5 minutes old
    if (cache.todayAttendance && (now - cache.cacheExpiry) < 5 * 60 * 1000) {
      console.log('📋 Using cached attendance data');
      return cache.todayAttendance;
    } else if (cache.todayAttendance) {
      console.log('🗑️ Cache expired, fetching fresh data');
    } else {
      console.log('📝 No cached data, fetching from server');
    }
    
    // Make API request
    console.log('🌐 Making API request to /attendance/today');
    const response = await api.get<ApiResponse<AttendanceRecord | null>>(`${BASE_URL}/today`);
    
    console.log('✅ API response received:', response.status, response.data.success);
    
    // Validate response structure
    if (!response.data || typeof response.data.success !== 'boolean') {
      console.error('❌ Invalid API response structure:', response.data);
      throw new Error('Invalid response from server');
    }
    
    if (!response.data.success) {
      console.error('❌ API returned unsuccessful response:', response.data.message);
      throw new Error(response.data.message || 'Failed to fetch attendance data');
    }
    
    // Update user-specific cache
    cache.todayAttendance = response.data.data;
    cache.cacheExpiry = now;
    
    console.log('💾 Updated cache with fresh attendance data');
    
    return response.data.data;
    
  } catch (error: any) {
    console.error('❌ Error getting today\'s attendance:', error);
    
    // Clear potentially corrupted cache
    const cache = getUserSpecificCache();
    cache.todayAttendance = null;
    cache.cacheExpiry = 0;
    
    // Provide specific error handling
    if (error.status === 401) {
      throw new Error('Session expired. Please log in again.');
    } else if (error.status === 403) {
      throw new Error('Access denied. You don\'t have permission to view attendance data.');
    } else if (error.status === 0 || error.message?.includes('Network Error')) {
      throw new Error('Unable to connect to server. Please check your internet connection.');
    } else if (error.status === 408 || error.message?.includes('timeout')) {
      throw new Error('Request timed out. Please try again.');
    }
    
    // Re-throw original error or create a new one
    throw error.message ? error : new Error('Failed to fetch attendance data');
  }
};

// Get attendance for a specific date
export const getAttendanceByDate = async (date: string): Promise<AttendanceRecord> => {
  try {
    const response = await api.get<ApiResponse<AttendanceRecord>>(`${BASE_URL}/date/${date}`);
    return response.data.data;
  } catch (error) {
    console.error('Error getting attendance by date:', error);
    throw error;
  }
};

// Get attendance for a date range
export const getAttendanceByRange = async (startDate: string, endDate: string): Promise<AttendanceRecord[]> => {
  try {
    const response = await api.get<ApiResponse<AttendanceRecord[]>>(`${BASE_URL}/range`, {
      params: { startDate, endDate }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error getting attendance range:', error);
    throw error;
  }
};

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
  weeklyHours: Array<{
    day: string;
    date: string;
    hours: number;
  }>;
}

// Get attendance statistics
export const getAttendanceStats = async (month?: number, year?: number): Promise<{
  weeklyHours: WeeklyHours[];
  attendanceStats: AttendanceStats;
}> => {
  try {
    // Check if we have cached stats and if they're still valid (less than 30 minutes old)
    const now = Date.now();
    const cache = getUserSpecificCache();
    if (cache.stats && now - cache.cacheExpiry < 30 * 60 * 1000) {
      return cache.stats;
    }
    
    const response = await api.get<ApiResponse<AttendanceStatsResponse>>(`${BASE_URL}/stats`, {
      params: { month, year }
    });
    
    const data = response.data.data;
    
    // Format the response to match the frontend data structure
    const weeklyHours: WeeklyHours[] = data.weeklyHours.map((item) => ({
      day: item.day,
      hours: item.hours
    }));
    
    const attendanceStats: AttendanceStats = {
      onTimePercentage: data.onTimePercentage,
      latePercentage: data.latePercentage,
      averageHours: data.averageHours
    };
    
    const result = {
      weeklyHours,
      attendanceStats
    };
    
    // Update user-specific cache
    cache.stats = result;
    cache.cacheExpiry = now;
    
    return result;
  } catch (error) {
    console.error('Error getting attendance stats:', error);
    throw error;
  }
};

// Format date for API calls
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Add type for admin all attendance response
export interface AdminAttendanceResponse {
  data: any[];
  stats: { present: number; absent: number; late: number; leave: number };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Get all users' attendance records (Admin)
export const getAllAttendanceRecords = async (filters: {
  date?: string;
  department?: string;
  status?: string;
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
} = {}): Promise<AdminAttendanceResponse> => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    const response = await api.get<ApiResponse<AdminAttendanceResponse>>(`${BASE_URL}/all?${params.toString()}`);
    return response.data as unknown as AdminAttendanceResponse;
  } catch (error) {
    console.error('Error fetching all attendance records:', error);
    throw error;
  }
};

// Analytics interfaces
export interface AttendanceAnalytics {
  totalRecords: number;
  dateRange: { start: string; end: string };
  overallStats: {
    total: number;
    present: number;
    late: number;
    absent: number;
    leave: number;
    attendanceRate: number;
    punctualityRate: number;
  };
  dailyTrends: Array<{
    date: string;
    day: string;
    present: number;
    late: number;
    absent: number;
    leave: number;
  }>;
  departmentStats: Array<{
    department: string;
    totalEmployees: number;
    attendanceRate: number;
    present: number;
    late: number;
    absent: number;
    leave: number;
  }>;
  statusDistribution: {
    present: number;
    late: number;
    absent: number;
    leave: number;
  };
  monthlyTrends: Array<{
    month: number;
    year: number;
    present: number;
    late: number;
    absent: number;
    leave: number;
  }>;
  weeklyPatterns: Array<{
    day: string;
    present: number;
    late: number;
    absent: number;
    leave: number;
  }>;
}

export interface DepartmentAttendanceStats {
  month: number;
  year: number;
  departments: Array<{
    department: string;
    totalEmployees: number;
    attendanceRate: number;
    present: number;
    late: number;
    absent: number;
    leave: number;
    averageWorkHours: number;
  }>;
}

export interface AttendanceTrendsData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    tension: number;
  }>;
}

export interface MonthlyAttendanceStats {
  year: number;
  months: Array<{
    month: string;
    monthNumber: number;
    attendanceRate: number;
    present: number;
    late: number;
    absent: number;
    leave: number;
    total: number;
  }>;
  chartData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      tension: number;
      fill: boolean;
      backgroundColor: string;
    }>;
  };
}

export interface AttendanceDistribution {
  distribution: {
    present: number;
    late: number;
    absent: number;
    leave: number;
  };
  percentages: {
    present: number;
    late: number;
    absent: number;
    leave: number;
  };
  total: number;
  chartData: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor: string[];
    }>;
  };
}

// @desc    Get comprehensive attendance analytics
export const getAttendanceAnalytics = async (filters: {
  startDate?: string;
  endDate?: string;
  department?: string;
  role?: string;
} = {}): Promise<AttendanceAnalytics> => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get<ApiResponse<AttendanceAnalytics>>(
      `${BASE_URL}/analytics?${params.toString()}`
    );
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch attendance analytics');
    }
  } catch (error: any) {
    console.error('Error fetching attendance analytics:', error);
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please log in as admin.');
    }
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch attendance analytics');
  }
};

// @desc    Get department-wise attendance statistics
export const getDepartmentAttendanceStats = async (filters: {
  month?: number;
  year?: number;
} = {}): Promise<DepartmentAttendanceStats> => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get<ApiResponse<DepartmentAttendanceStats>>(
      `${BASE_URL}/analytics/departments?${params.toString()}`
    );
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch department attendance statistics');
    }
  } catch (error: any) {
    console.error('Error fetching department attendance stats:', error);
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please log in as admin.');
    }
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch department attendance statistics');
  }
};

// @desc    Get attendance trends over time
export const getAttendanceTrends = async (filters: {
  period?: 'week' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
} = {}): Promise<AttendanceTrendsData> => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get<ApiResponse<AttendanceTrendsData>>(
      `${BASE_URL}/analytics/trends?${params.toString()}`
    );
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch attendance trends');
    }
  } catch (error: any) {
    console.error('Error fetching attendance trends:', error);
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please log in as admin.');
    }
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch attendance trends');
  }
};

// @desc    Get monthly attendance statistics
export const getMonthlyAttendanceStats = async (filters: {
  year?: number;
} = {}): Promise<MonthlyAttendanceStats> => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get<ApiResponse<MonthlyAttendanceStats>>(
      `${BASE_URL}/analytics/monthly?${params.toString()}`
    );
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch monthly attendance statistics');
    }
  } catch (error: any) {
    console.error('Error fetching monthly attendance stats:', error);
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please log in as admin.');
    }
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch monthly attendance statistics');
  }
};

// @desc    Get attendance status distribution
export const getAttendanceDistribution = async (filters: {
  startDate?: string;
  endDate?: string;
  department?: string;
} = {}): Promise<AttendanceDistribution> => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get<ApiResponse<AttendanceDistribution>>(
      `${BASE_URL}/analytics/distribution?${params.toString()}`
    );
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch attendance distribution');
    }
  } catch (error: any) {
    console.error('Error fetching attendance distribution:', error);
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please log in as admin.');
    }
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch attendance distribution');
  }
};

// Create the attendanceService object after all functions are declared
const attendanceService = {
  checkIn,
  checkOut,
  getTodayAttendance,
  getAttendanceByDate,
  getAttendanceByRange,
  getAttendanceStats,
  formatDate,
  getAllAttendanceRecords,
  clearAllUserCaches,
  clearUserCache,
  debugCheckIn,
  // Analytics functions
  getAttendanceAnalytics,
  getDepartmentAttendanceStats,
  getAttendanceTrends,
  getMonthlyAttendanceStats,
  getAttendanceDistribution
};

export default attendanceService; 