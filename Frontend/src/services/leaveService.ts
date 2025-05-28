import api from './api';
import { LeaveBalance } from '../components/employee/Attendance/types';
import { LeaveRequest as EmployeeLeaveRequest, LeaveType, DurationType, LeaveStatus } from '../components/employee/LeaveReimbursement/types';

const BASE_URL = '/leave';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

interface ApiLeaveRequest {
  _id: string;
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvalDate?: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

// Request leave
export const requestLeave = async (
  leaveRequest: Omit<EmployeeLeaveRequest, 'id' | 'createdAt' | 'status'>
): Promise<EmployeeLeaveRequest> => {
  try {
    // Map frontend leave types to backend format (ensure consistency)
    const leaveTypeMap: Record<string, string> = {
      'annual': 'Annual Leave',
      'sick': 'Sick Leave',
      'personal': 'Personal Leave',
      'maternity': 'Other',
      'paternity': 'Other',
      'bereavement': 'Other'
    };
    
    // Ensure leave type is in the format expected by the backend
    const mappedType = leaveTypeMap[leaveRequest.type.toLowerCase()] || 'Other';
    
    // Only send the fields expected by the backend
    const requestPayload = {
      type: mappedType, // Use the mapped type instead of the original
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      reason: leaveRequest.reason,
    };
    
    const response = await api.post<ApiResponse<ApiLeaveRequest>>(`${BASE_URL}/request`, requestPayload);
    
    // Transform API response to match frontend types
    // Map backend types back to frontend types
    const backendToFrontendMap: Record<string, LeaveType> = {
      'Annual Leave': 'annual',
      'Sick Leave': 'sick',
      'Personal Leave': 'personal',
      'Other': 'maternity' // Default to maternity for 'Other'
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
    console.error('Error requesting leave:', error);
    
    // Format error message for better user experience
    let errorMessage = 'Failed to submit leave request';
    
    // Check for specific backend error messages
    if (error.data && error.data.message) {
      errorMessage = error.data.message;
      
      // Map backend leave type back to frontend format for error messages
      Object.entries({
        'Annual Leave': 'annual',
        'Sick Leave': 'sick',
        'Personal Leave': 'personal'
      }).forEach(([backendType, frontendType]) => {
        if (errorMessage.includes(backendType)) {
          errorMessage = errorMessage.replace(backendType, frontendType);
        }
      });
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

// Get all leave requests
export const getLeaveRequests = async (
  status?: LeaveStatus
): Promise<EmployeeLeaveRequest[]> => {
  try {
    const response = await api.get<ApiResponse<ApiLeaveRequest[]>>(BASE_URL, {
      params: status ? { status } : undefined,
    });
    
    // Transform API response to match frontend types
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
    console.error('Error getting leave requests:', error);
    throw error;
  }
};

// Get leave request by ID
export const getLeaveById = async (id: string): Promise<EmployeeLeaveRequest> => {
  try {
    const response = await api.get<ApiResponse<ApiLeaveRequest>>(`${BASE_URL}/${id}`);
    const leave = response.data.data;
    
    // Transform API response to match frontend types
    return {
      id: leave._id,
      type: leave.type as LeaveType,
      duration: getDurationType(leave.startDate, leave.endDate),
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason,
      status: leave.status as LeaveStatus,
      createdAt: leave.createdAt
    };
  } catch (error) {
    console.error('Error getting leave request:', error);
    throw error;
  }
};

// Cancel leave request
export const cancelLeave = async (id: string): Promise<void> => {
  try {
    await api.put<ApiResponse<null>>(`${BASE_URL}/${id}/cancel`);
  } catch (error) {
    console.error('Error cancelling leave request:', error);
    throw error;
  }
};

// Get leave balance
export const getLeaveBalance = async (year?: number): Promise<LeaveBalance[]> => {
  try {
    const response = await api.get<ApiResponse<LeaveBalance[]>>(`${BASE_URL}/balance`, {
      params: year ? { year } : undefined,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error getting leave balance:', error);
    throw error;
  }
};

// Get leave dates for calendar
export const getLeaveDates = async (
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
    console.error('Error getting leave dates:', error);
    throw error;
  }
};

// Reset leave balance for the current year
export const resetLeaveBalance = async (): Promise<LeaveBalance[]> => {
  try {
    const response = await api.post<ApiResponse<LeaveBalance[]>>(`${BASE_URL}/balance/reset`);
    return response.data.data;
  } catch (error) {
    console.error('Error resetting leave balance:', error);
    throw error;
  }
};

// Helper function to determine duration type
const getDurationType = (startDate: string, endDate: string): DurationType => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Set hours to 0 for date comparison
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  if (start.getTime() === end.getTime()) {
    // Same day - determine if half or full day
    // For now, we'll default to full-day as our API doesn't store this info yet
    return 'full-day';
  } else {
    return 'multiple-days';
  }
};

const leaveService = {
  requestLeave,
  getLeaveRequests,
  getLeaveById,
  cancelLeave,
  getLeaveBalance,
  getLeaveDates,
  resetLeaveBalance,
};

export default leaveService; 