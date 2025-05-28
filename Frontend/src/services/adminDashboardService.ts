import axios from 'axios';
import { getAdminToken } from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Interface definitions
interface DashboardMetrics {
  totalEmployees: number;
  attendanceRate: string;
  pendingRequests: number;
}

interface PerformanceData {
  labels: string[];
  productivity: number[];
  engagement: number[];
}

interface DepartmentData {
  labels: string[];
  data: number[];
  colors: string[];
}

interface AttendanceData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    tension: number;
  }>;
}

interface WellbeingData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    fill: boolean;
    backgroundColor: string;
    borderColor: string;
    pointBackgroundColor: string;
    pointBorderColor: string;
    pointHoverBackgroundColor: string;
    pointHoverBorderColor: string;
  }>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = getAdminToken();
  if (!token) {
    throw new Error('No admin authentication token found. Please log in as admin.');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Dashboard Metrics API
export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  try {
    const response = await axios.get<ApiResponse<DashboardMetrics>>(
      `${API_URL}/admin/dashboard/metrics`,
      { headers: getAuthHeaders() }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch dashboard metrics');
    }
  } catch (error: any) {
    console.error('Error fetching dashboard metrics:', error);
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please log in as admin.');
    }
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch dashboard metrics');
  }
};

// Performance Data API
export const getPerformanceData = async (range: 'week' | 'month' | 'quarter' = 'week'): Promise<PerformanceData> => {
  try {
    const response = await axios.get<ApiResponse<PerformanceData>>(
      `${API_URL}/admin/dashboard/performance`,
      { 
        headers: getAuthHeaders(),
        params: { range }
      }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch performance data');
    }
  } catch (error: any) {
    console.error('Error fetching performance data:', error);
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please log in as admin.');
    }
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch performance data');
  }
};

// Department Data API
export const getDepartmentData = async (): Promise<DepartmentData> => {
  try {
    const response = await axios.get<ApiResponse<DepartmentData>>(
      `${API_URL}/admin/dashboard/departments`,
      { headers: getAuthHeaders() }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch department data');
    }
  } catch (error: any) {
    console.error('Error fetching department data:', error);
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please log in as admin.');
    }
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch department data');
  }
};

// Attendance Trends API
export const getAttendanceTrends = async (): Promise<AttendanceData> => {
  try {
    const response = await axios.get<ApiResponse<AttendanceData>>(
      `${API_URL}/admin/dashboard/attendance-trends`,
      { headers: getAuthHeaders() }
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

// Wellbeing Data API
export const getWellbeingData = async (): Promise<WellbeingData> => {
  try {
    const response = await axios.get<ApiResponse<WellbeingData>>(
      `${API_URL}/admin/dashboard/wellbeing`,
      { headers: getAuthHeaders() }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch wellbeing data');
    }
  } catch (error: any) {
    console.error('Error fetching wellbeing data:', error);
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please log in as admin.');
    }
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch wellbeing data');
  }
};

// Comprehensive dashboard data fetch (for initial load)
export const getAllDashboardData = async () => {
  try {
    const [metrics, performance, departments, attendance, wellbeing] = await Promise.allSettled([
      getDashboardMetrics(),
      getPerformanceData('week'),
      getDepartmentData(),
      getAttendanceTrends(),
      getWellbeingData()
    ]);

    return {
      metrics: metrics.status === 'fulfilled' ? metrics.value : null,
      performance: performance.status === 'fulfilled' ? performance.value : null,
      departments: departments.status === 'fulfilled' ? departments.value : null,
      attendance: attendance.status === 'fulfilled' ? attendance.value : null,
      wellbeing: wellbeing.status === 'fulfilled' ? wellbeing.value : null,
      errors: [
        metrics.status === 'rejected' ? metrics.reason.message : null,
        performance.status === 'rejected' ? performance.reason.message : null,
        departments.status === 'rejected' ? departments.reason.message : null,
        attendance.status === 'rejected' ? attendance.reason.message : null,
        wellbeing.status === 'rejected' ? wellbeing.reason.message : null
      ].filter(Boolean)
    };
  } catch (error: any) {
    console.error('Error fetching all dashboard data:', error);
    throw new Error(error.message || 'Failed to fetch dashboard data');
  }
};

// Health check for admin dashboard APIs
export const checkDashboardApiHealth = async (): Promise<boolean> => {
  try {
    const token = getAdminToken();
    if (!token) {
      return false;
    }

    // Simple test call to metrics endpoint
    await axios.get(`${API_URL}/admin/dashboard/metrics`, {
      headers: getAuthHeaders(),
      timeout: 5000
    });

    return true;
  } catch (error) {
    console.error('Dashboard API health check failed:', error);
    return false;
  }
};

export default {
  getDashboardMetrics,
  getPerformanceData,
  getDepartmentData,
  getAttendanceTrends,
  getWellbeingData,
  getAllDashboardData,
  checkDashboardApiHealth
}; 