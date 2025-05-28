import api from './api';
import { LeaveBalance } from '../components/employee/Attendance/types';
import { LeaveRequest as ManagerLeaveRequest, LeaveType, DurationType, LeaveStatus } from '../components/employee/LeaveReimbursement/types';

const BASE_URL = '/manager-leave';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

interface ApiManagerLeaveRequest {
  _id: string;
  managerId: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  totalDays: number;
  createdAt: string;
  updatedAt: string;
  adminApproval?: any;
  approvalHistory?: any[];
}

// Request leave as manager
export const requestManagerLeave = async (
  leaveRequest: Omit<ManagerLeaveRequest, 'id' | 'createdAt' | 'status'>
): Promise<ManagerLeaveRequest> => {
  try {
    // Map frontend leave types to backend format
    const leaveTypeMap: Record<string, string> = {
      'annual': 'Annual Leave',
      'sick': 'Sick Leave',
      'personal': 'Personal Leave',
      'maternity': 'Other',
      'paternity': 'Other',
      'bereavement': 'Other'
    };
    
    const mappedType = leaveTypeMap[leaveRequest.type.toLowerCase()] || 'Other';
    
    const requestPayload = {
      type: mappedType,
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      reason: leaveRequest.reason,
    };
    
    const response = await api.post<ApiResponse<ApiManagerLeaveRequest>>(`${BASE_URL}/request`, requestPayload);
    
    // Transform API response to match frontend types
    const backendToFrontendMap: Record<string, LeaveType> = {
      'Annual Leave': 'annual',
      'Sick Leave': 'sick',
      'Personal Leave': 'personal',
      'Other': 'maternity'
    };
    
    return {
      id: response.data.data._id,
      type: backendToFrontendMap[response.data.data.type] || 'other' as LeaveType,
      duration: getDurationType(response.data.data.startDate, response.data.data.endDate),
      startDate: response.data.data.startDate,
      endDate: response.data.data.endDate,
      reason: response.data.data.reason,
      status: response.data.data.status as LeaveStatus,
      createdAt: response.data.data.createdAt
    };
  } catch (error: any) {
    console.error('Error requesting manager leave:', error);
    
    let errorMessage = 'Failed to submit leave request';
    
    if (error.data && error.data.message) {
      errorMessage = error.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

// Get all manager leave requests
export const getManagerLeaveRequests = async (
  status?: LeaveStatus
): Promise<ManagerLeaveRequest[]> => {
  try {
    const response = await api.get<ApiResponse<ApiManagerLeaveRequest[]>>(BASE_URL, {
      params: status ? { status } : undefined,
    });
    
    return response.data.data.map(leave => ({
      id: leave._id,
      type: leave.type as LeaveType,
      duration: getDurationType(leave.startDate, leave.endDate),
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason,
      status: leave.status as LeaveStatus,
      createdAt: leave.createdAt
    }));
  } catch (error) {
    console.error('Error getting manager leave requests:', error);
    throw error;
  }
};

// Get manager leave balance (uses regular leave balance endpoint)
export const getManagerLeaveBalance = async (year?: number): Promise<LeaveBalance[]> => {
  try {
    const response = await api.get<ApiResponse<LeaveBalance[]>>(`/leave/balance`, {
      params: year ? { year } : undefined,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error getting manager leave balance:', error);
    throw error;
  }
};

// Reset manager leave balance for the current year (uses regular leave balance endpoint)
export const resetManagerLeaveBalance = async (): Promise<LeaveBalance[]> => {
  try {
    const response = await api.post<ApiResponse<LeaveBalance[]>>(`/leave/balance/reset`);
    return response.data.data;
  } catch (error) {
    console.error('Error resetting manager leave balance:', error);
    throw error;
  }
};

// Get manager leave dates for calendar
export const getManagerLeaveDates = async (
  year?: number,
  month?: number
): Promise<string[]> => {
  try {
    const response = await api.get<ApiResponse<string[]>>(`${BASE_URL}/calendar`, {
      params: { 
        year: year || new Date().getFullYear(),
        month: month
      },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error getting manager leave dates:', error);
    throw error;
  }
};

// Helper function to determine duration type
const getDurationType = (startDate: string, endDate: string): DurationType => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  if (start.getTime() === end.getTime()) {
    return 'full-day';
  } else {
    return 'multiple-days';
  }
};

const managerLeaveService = {
  requestManagerLeave,
  getManagerLeaveRequests,
  getManagerLeaveBalance,
  resetManagerLeaveBalance,
  getManagerLeaveDates,
};

export default managerLeaveService; 