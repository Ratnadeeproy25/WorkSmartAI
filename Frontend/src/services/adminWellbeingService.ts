import api from './api';

// Define interfaces for API responses
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  totalCount?: number;
  employeeCount?: number;
  managerCount?: number;
}

export interface WellbeingData {
  stressLevel: number;
  workLifeBalance: number;
  satisfaction: number;
  teamCollaboration?: number;
  lastCheckIn: string;
  moodHistory?: any[];
  breakHistory?: any[];
  activityHistory?: any[];
}

export interface Person {
  id: string;
  name: string;
  role: 'employee' | 'manager';
  department: string;
  position: string;
  email: string;
  wellbeing: WellbeingData;
}

export interface WellbeingStatistics {
  averageStressLevel: number;
  averageWorkLifeBalance: number;
  averageSatisfaction: number;
  averageTeamCollaboration: number;
  wellbeingTrends: {
    improving: number;
    stable: number;
    declining: number;
  };
  roleBreakdown: {
    employee: { count: number; avgWellbeing: number };
    manager: { count: number; avgWellbeing: number };
  };
}

export interface TrendData {
  date: string;
  value: number;
}

export interface WellbeingTrends {
  stressLevel: TrendData[];
  workLifeBalance: TrendData[];
  satisfaction: TrendData[];
  teamCollaboration: TrendData[];
}

export interface UserDetails {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'employee' | 'manager';
    department: string;
    position: string;
  };
  wellbeingData: any;
}

// Get all users' wellbeing data
export const getAllWellbeingData = async (): Promise<Person[]> => {
  try {
    const response = await api.get('/admin/wellbeing');
    return (response.data as ApiResponse<Person[]>).data;
  } catch (error) {
    console.error('Error fetching wellbeing data:', error);
    throw error;
  }
};

// Get wellbeing statistics
export const getWellbeingStatistics = async (): Promise<WellbeingStatistics> => {
  try {
    const response = await api.get('/admin/wellbeing/stats');
    return (response.data as ApiResponse<WellbeingStatistics>).data;
  } catch (error) {
    console.error('Error fetching wellbeing statistics:', error);
    throw error;
  }
};

// Get wellbeing trends
export const getWellbeingTrends = async (timeframe: string = '30'): Promise<WellbeingTrends> => {
  try {
    const response = await api.get('/admin/wellbeing/trends', {
      params: { timeframe }
    });
    return (response.data as ApiResponse<WellbeingTrends>).data;
  } catch (error) {
    console.error('Error fetching wellbeing trends:', error);
    throw error;
  }
};

// Get specific user's detailed wellbeing data
export const getUserWellbeingDetails = async (userId: string): Promise<UserDetails> => {
  try {
    const response = await api.get(`/admin/wellbeing/user/${userId}`);
    return (response.data as ApiResponse<UserDetails>).data;
  } catch (error) {
    console.error('Error fetching user wellbeing details:', error);
    throw error;
  }
};

const adminWellbeingService = {
  getAllWellbeingData,
  getWellbeingStatistics,
  getWellbeingTrends,
  getUserWellbeingDetails
};

export default adminWellbeingService; 