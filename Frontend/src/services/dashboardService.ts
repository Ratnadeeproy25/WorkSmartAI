import api from './api';
import { useAuth } from '../context/AuthContext';

// Define interfaces for dashboard data
export interface PerformanceData {
  labels: string[];
  datasets: {
    label?: string;
    data: number[];
    borderColor: string;
    tension: number;
    fill: boolean;
    backgroundColor: string;
  }[];
}

export interface TaskData {
  id: string;
  title: string;
  dueDate: string;
  progress: number;
  subtasksCompleted: string;
  timeLeft: string;
  priority: string;
}

export interface LeaveData {
  balances: {
    annualLeave: { total: number; used: number };
    sickLeave: { total: number; used: number };
    personalLeave: { total: number; used: number };
  };
  recentRequests: {
    id: string;
    type: string;
    startDate: string;
    endDate: string;
    days: number;
    status: string;
  }[];
}

export interface ReimbursementData {
  recentRequests: {
    id: string;
    type: string;
    description: string;
    amount: number;
    status: string;
  }[];
  summary: {
    pending: { amount: number; count: number };
    approved: { amount: number; count: number };
  };
}

export interface TaskStatistics {
  completionRate: number;
  tasksThisWeek: number;
  dueToday: number;
  inProgress: number;
}

export interface DashboardData {
  performanceData: PerformanceData;
  tasks: TaskData[];
  leaveData: LeaveData;
  reimbursementData: ReimbursementData;
}

// Define interface for API responses
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Get dashboard data
export const getDashboardData = async (employeeId: string): Promise<DashboardData> => {
  try {
    const response = await api.get<ApiResponse<DashboardData>>(`/dashboard/${employeeId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

// Get task statistics
export const getTaskStatistics = async (employeeId: string): Promise<TaskStatistics> => {
  try {
    const response = await api.get<ApiResponse<TaskStatistics>>(`/dashboard/${employeeId}/task-statistics`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching task statistics:', error);
    throw error;
  }
};