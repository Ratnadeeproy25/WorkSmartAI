import api from './api';
import { 
  ReimbursementRequest, 
  ReimbursementSummary,
  ReceiptInfo,
  ExpenseType,
  ExpenseStatus
} from '../components/employee/LeaveReimbursement/types';

const BASE_URL = '/reimbursement';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

interface ApiReimbursementRequest {
  _id: string;
  employeeId: string;
  type: ExpenseType;
  amount: number;
  date: string | Date;
  description: string;
  receipts: {
    name: string;
    path: string;
    size: number;
    type: string;
  }[];
  status: ExpenseStatus;
  createdAt: string;
  updatedAt: string;
}

// Get all reimbursement requests
export const getReimbursementRequests = async (status?: string): Promise<ReimbursementRequest[]> => {
  try {
    const response = await api.get<ApiResponse<ApiReimbursementRequest[]>>(`${BASE_URL}`, {
      params: status ? { status } : undefined,
    });
    
    // Transform API response to match frontend types
    const requests = response.data.data.map(request => ({
      id: request._id,
      type: request.type,
      amount: request.amount,
      date: new Date(request.date).toISOString().split('T')[0],
      description: request.description,
      receipts: request.receipts.map(receipt => ({
        name: receipt.name,
        size: receipt.size,
        type: receipt.type
      })),
      status: request.status,
      createdAt: request.createdAt
    }));
    
    return requests;
  } catch (error) {
    console.error('Error getting reimbursement requests:', error);
    throw error;
  }
};

// Get reimbursement by ID
export const getReimbursementById = async (id: string): Promise<ReimbursementRequest> => {
  try {
    const response = await api.get<ApiResponse<ApiReimbursementRequest>>(`${BASE_URL}/${id}`);
    
    // Transform API response to match frontend types
    const request = response.data.data;
    return {
      id: request._id,
      type: request.type,
      amount: request.amount,
      date: new Date(request.date).toISOString().split('T')[0],
      description: request.description,
      receipts: request.receipts.map(receipt => ({
        name: receipt.name,
        size: receipt.size,
        type: receipt.type
      })),
      status: request.status,
      createdAt: request.createdAt
    };
  } catch (error) {
    console.error('Error getting reimbursement by ID:', error);
    throw error;
  }
};

// Get reimbursement summary
export const getReimbursementSummary = async (): Promise<ReimbursementSummary> => {
  try {
    const response = await api.get<ApiResponse<ReimbursementSummary>>(`${BASE_URL}/summary`);
    return response.data.data;
  } catch (error) {
    console.error('Error getting reimbursement summary:', error);
    throw error;
  }
};

// Submit a reimbursement request
export const submitReimbursementRequest = async (
  formData: FormData
): Promise<ReimbursementRequest> => {
  try {
    const response = await api.post<ApiResponse<ApiReimbursementRequest>>(
      `${BASE_URL}/request`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    // Transform API response to match frontend types
    const request = response.data.data;
    return {
      id: request._id,
      type: request.type,
      amount: request.amount,
      date: new Date(request.date).toISOString().split('T')[0],
      description: request.description,
      receipts: request.receipts.map(receipt => ({
        name: receipt.name,
        size: receipt.size,
        type: receipt.type
      })),
      status: request.status,
      createdAt: request.createdAt
    };
  } catch (error: any) {
    console.error('Error submitting reimbursement request:', error);
    // Format error message for better user experience
    const errorMessage = error.message || 'Failed to submit reimbursement request';
    throw new Error(errorMessage);
  }
};

// Cancel a reimbursement request
export const cancelReimbursementRequest = async (id: string): Promise<void> => {
  try {
    await api.delete<ApiResponse<void>>(`${BASE_URL}/${id}`);
  } catch (error) {
    console.error('Error cancelling reimbursement request:', error);
    throw error;
  }
};

// Upload a receipt
export const uploadReceipt = async (file: File): Promise<ReceiptInfo> => {
  try {
    const formData = new FormData();
    formData.append('receipt', file);
    
    const response = await api.post<ApiResponse<ReceiptInfo>>(
      `${BASE_URL}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Error uploading receipt:', error);
    throw error;
  }
}; 