import api from './api';
import { Manager, ManagerFormData } from '../components/admin/manager-management/types';

// Define interface for API responses
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Manager profile interface
export interface ManagerProfile {
  name: string;
  role: string;
  employeeId: string;
  profilePicture: string;
  status: 'available' | 'away' | 'busy';
  contactInfo: {
    email: string;
    phone: string;
    location: string;
    teamSize: string;
  };
  department: string;
}

// Dashboard-related interfaces
export interface DashboardMetrics {
  totalEmployees: number;
  attendanceRate: string;
  activeTasks: number;
  pendingRequests: number;
}

export interface TeamMember {
  id: string;
  name: string;
  position: string;
  status: 'Active' | 'On Leave' | 'Absent';
  performance: number;
  avatar: string;
  lastActive: string;
  email: string;
}

export interface ChartDataset {
  label?: string;
  data: number[];
  borderColor?: string | string[];
  backgroundColor?: string | string[];
  borderWidth?: number;
  tension?: number;
  fill?: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
  isEmpty?: boolean;
  error?: boolean;
  summary?: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    blocked: number;
  };
}

export interface DashboardData {
  manager: {
    name: string;
    department: string;
    position: string;
  };
  metrics: DashboardMetrics;
  chartData: {
    performance: ChartData;
    taskDistribution: ChartData;
    attendance: ChartData;
    productivity: ChartData;
  };
  teamMembers: TeamMember[];
  recentTasks: any[];
}

// Get all managers
export const getAllManagers = async (): Promise<Manager[]> => {
  try {
    const response = await api.get<ApiResponse<Manager[]>>('/managers');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching managers:', error);
    throw error;
  }
};

// Create new manager
export const createManager = async (managerData: ManagerFormData): Promise<Manager> => {
  try {
    const response = await api.post<ApiResponse<Manager>>('/managers', {
      ...managerData,
      status: 'Active'
    });
    return response.data.data;
  } catch (error) {
    console.error('Error creating manager:', error);
    throw error;
  }
};

// Update manager
export const updateManager = async (id: string, managerData: ManagerFormData): Promise<Manager> => {
  try {
    const response = await api.put<ApiResponse<Manager>>(`/managers/${id}`, managerData);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating manager with ID ${id}:`, error);
    throw error;
  }
};

// Delete manager
export const deleteManager = async (id: string): Promise<void> => {
  try {
    await api.delete<ApiResponse<{}>>(`/managers/${id}`);
  } catch (error) {
    console.error(`Error deleting manager with ID ${id}:`, error);
    throw error;
  }
};

// Toggle manager status
export const toggleManagerStatus = async (id: string): Promise<Manager> => {
  try {
    const response = await api.patch<ApiResponse<Manager>>(`/managers/${id}/toggle-status`);
    return response.data.data;
  } catch (error) {
    console.error(`Error toggling status for manager with ID ${id}:`, error);
    throw error;
  }
};

// Get all departments
export const getAllDepartments = async (): Promise<string[]> => {
  try {
    const response = await api.get<ApiResponse<string[]>>('/managers/departments');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
};

// Generate new manager ID
export const generateManagerId = async (): Promise<string> => {
  try {
    const response = await api.get<ApiResponse<{id: string}>>('/managers/generate-id');
    return response.data.data.id;
  } catch (error) {
    console.error('Error generating manager ID:', error);
    throw error;
  }
};

// Get manager profile by email
export const getManagerProfile = async (email: string): Promise<ManagerProfile> => {
  try {
    const response = await api.get<ApiResponse<ManagerProfile>>(`/managers/profile?email=${encodeURIComponent(email)}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching manager profile:', error);
    throw error;
  }
};

// Get manager by ID
export const getManagerById = async (id: string): Promise<Manager> => {
  try {
    const response = await api.get<ApiResponse<Manager>>(`/managers/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching manager by ID:', error);
    throw error;
  }
};

// Update manager contact information
export const updateManagerContactInfo = async (email: string, phone: string, location: string): Promise<{contactInfo: {email: string, phone: string, location: string, teamSize: string}}> => {
  try {
    const response = await api.patch<ApiResponse<{contactInfo: {email: string, phone: string, location: string, teamSize: string}}>>(
      `/managers/profile/${encodeURIComponent(email)}/contact`,
      { phone, location }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error updating manager contact info:', error);
    throw error;
  }
};

// Update manager password
export const updateManagerPassword = async (email: string, currentPassword: string, newPassword: string): Promise<void> => {
  try {
    await api.patch<ApiResponse<void>>(
      `/managers/profile/${encodeURIComponent(email)}/password`,
      { currentPassword, newPassword }
    );
  } catch (error) {
    console.error('Error updating manager password:', error);
    throw error;
  }
};

// Update manager profile picture
export const updateManagerProfilePicture = async (email: string, profilePicture: string): Promise<{profilePicture: string}> => {
  try {
    // Check if the image data is valid
    if (!profilePicture || !email) {
      throw new Error('Email and profile picture are required');
    }
    
    // Make the API request with additional timeout settings
    const response = await api.patch<ApiResponse<{profilePicture: string}>>(
      `/managers/profile/${encodeURIComponent(email)}/picture`,
      { profilePicture },
      {
        timeout: 30000, // 30 seconds timeout for large images
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    // Validate the response
    if (!response.data?.success || !response.data?.data?.profilePicture) {
      throw new Error('Invalid response from server');
    }
    
    return response.data.data;
  } catch (error: any) {
    // Enhanced error logging
    console.error('Error updating manager profile picture:', error);
    
    // Throw a more descriptive error message
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(error.response.data?.message || `Server error: ${error.response.status}`);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('Network error: No response received from server. Please check your connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw error;
    }
  }
};

// Dashboard API Methods

// Get complete manager dashboard data
export const getManagerDashboardData = async (): Promise<DashboardData> => {
  try {
    const response = await api.get<ApiResponse<DashboardData>>('/manager/dashboard');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching manager dashboard data:', error);
    throw error;
  }
};

// Get team members assigned to the manager
export const getTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    const response = await api.get<ApiResponse<TeamMember[]>>('/manager/dashboard/team-members');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }
};

// Get chart data for dashboard
export const getDashboardChartData = async (): Promise<{
  performance: ChartData;
  taskDistribution: ChartData;
  attendance: ChartData;
  productivity: ChartData;
}> => {
  try {
    const response = await api.get<ApiResponse<{
      performance: ChartData;
      taskDistribution: ChartData;
      attendance: ChartData;
      productivity: ChartData;
    }>>('/manager/dashboard/charts');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching dashboard chart data:', error);
    throw error;
  }
}; 