import axios from 'axios';
import { API_URL } from '../config/constants';

export interface AdminRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  status: string;
  currentApprovalLevel: string;
  dateSubmitted: string;
  requestType: 'leave' | 'reimbursement';
  
  // Leave specific fields
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  totalDays?: number;
  
  // Reimbursement specific fields
  expenseType?: string;
  amount?: number;
  date?: string;
  description?: string;
  receipts?: string[];
  
  // Approval fields
  managerApproval?: {
    approvedBy: string;
    approvedAt: string;
    comments?: string;
  };
  adminApproval?: {
    approvedBy: string;
    approvedAt: string;
    comments?: string;
  };
  approvalHistory?: any[];
}

export interface AdminRequestsResponse {
  data: AdminRequest[];
  pagination: {
    current: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
}

export interface AdminStats {
  pending: {
    employee: { leaves: number; reimbursements: number; total: number };
    manager: { leaves: number; reimbursements: number; total: number };
    total: number;
  };
  approved: {
    employee: { leaves: number; reimbursements: number; total: number };
    manager: { leaves: number; reimbursements: number; total: number };
    total: number;
  };
  rejected: {
    employee: { leaves: number; reimbursements: number; total: number };
    manager: { leaves: number; reimbursements: number; total: number };
    total: number;
  };
}

export interface BulkActionRequest {
  requestIds: string[];
  action: 'approve' | 'reject';
  comments?: string;
}

// Get pending requests awaiting admin approval
export const getAdminPendingRequests = async (filters: {
  role?: 'all' | 'employee' | 'manager';
  type?: 'all' | 'leave' | 'reimbursement';
  page?: number;
  limit?: number;
} = {}): Promise<AdminRequestsResponse> => {
  try {
    const token = localStorage.getItem('authToken');
    const params = new URLSearchParams();
    
    if (filters.role) params.append('role', filters.role);
    if (filters.type) params.append('type', filters.type);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const response = await axios.get(`${API_URL}/admins/leave-reimbursement/pending?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    throw error;
  }
};

// Get all requests with filters
export const getAllAdminRequests = async (filters: {
  role?: 'all' | 'employee' | 'manager';
  type?: 'all' | 'leave' | 'reimbursement';
  status?: 'all' | 'pending' | 'manager-approved' | 'approved' | 'rejected';
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
} = {}): Promise<AdminRequestsResponse> => {
  try {
    const token = localStorage.getItem('authToken');
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const response = await axios.get(`${API_URL}/admins/leave-reimbursement/all?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching all requests:', error);
    throw error;
  }
};

// Get dashboard statistics
export const getAdminStats = async (): Promise<AdminStats> => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${API_URL}/admins/leave-reimbursement/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    throw error;
  }
};

// Approve or reject a single request
export const adminRequestAction = async (
  requestId: string, 
  action: 'approve' | 'reject',
  requestType: 'leave' | 'reimbursement',
  comments?: string
): Promise<AdminRequest> => {
  try {
    const token = localStorage.getItem('authToken');
    const endpoint = requestType === 'leave' 
      ? `/admins/leave/${requestId}/action`
      : `/admins/reimbursement/${requestId}/action`;
      
    const response = await axios.put(`${API_URL}${endpoint}`, {
      action,
      comments
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error ${action}ing request:`, error);
    throw error;
  }
};

// Bulk approve or reject requests
export const adminBulkAction = async (data: BulkActionRequest): Promise<{ success: boolean; message: string }> => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.post(`${API_URL}/admins/leave-reimbursement/bulk-action`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error performing bulk action:', error);
    throw error;
  }
};

// Get request history
export const getRequestHistory = async (
  requestId: string, 
  requestType: 'leave' | 'reimbursement'
): Promise<any[]> => {
  try {
    const token = localStorage.getItem('authToken');
    const endpoint = requestType === 'leave' 
      ? `/admins/leave/history?requestId=${requestId}`
      : `/admins/reimbursement/history?requestId=${requestId}`;
      
    const response = await axios.get(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching request history:', error);
    throw error;
  }
}; 