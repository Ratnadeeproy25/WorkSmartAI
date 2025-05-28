import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '../AdminSidebar';
import HeaderPanel from './HeaderPanel';
import RoleTabGroup from './RoleTabGroup';
import TypeTabGroup from './TypeTabGroup';

import RequestsList from './RequestsList';
import LeaveRequestModal from './LeaveRequestModal';
import ReimbursementRequestModal from './ReimbursementRequestModal';

import { Helmet } from 'react-helmet';
import axios from 'axios';
import { getAdminToken } from '../../../services/authService';
import { 
  ViewRole, 
  RequestType, 
  LeaveRequest, 
  ReimbursementRequest,
  PaginationInfo,
  RequestStatus,
  ApprovalLevel
} from './types';

// API URL constant
const API_URL = 'http://localhost:5000/api';

// Type imports
interface AdminRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  status: string;
  currentApprovalLevel: string;
  dateSubmitted: string;
  requestType: 'leave' | 'reimbursement' | 'manager-leave';
  
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

interface AdminRequestsResponse {
  data: AdminRequest[];
  pagination: {
    current: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
}

interface AdminStats {
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

// API Functions
const getAdminPendingRequests = async (filters: {
  role?: 'all' | 'employee' | 'manager';
  type?: 'all' | 'leave' | 'reimbursement' | 'manager-leave';
  page?: number;
  limit?: number;
} = {}): Promise<AdminRequestsResponse> => {
  try {
    const token = getAdminToken();
    if (!token) {
      throw new Error('Admin not authenticated');
    }
    
    const params = new URLSearchParams();
    
    if (filters.role && filters.role !== 'all') params.append('role', filters.role);
    if (filters.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await axios.get(`${API_URL}/admins/leave-reimbursement/pending?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Backend returns { success: true, data: Array, pagination: Object }
    if (response.data.success && response.data.data && response.data.pagination) {
      return {
        data: response.data.data,
        pagination: response.data.pagination
      };
    } else {
      console.error('❌ Unexpected response structure:', response.data);
      throw new Error('Invalid response structure from server');
    }
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    throw error;
  }
};

const getAllAdminRequests = async (filters: {
  role?: 'all' | 'employee' | 'manager';
  type?: 'all' | 'leave' | 'reimbursement' | 'manager-leave';
  status?: 'all' | 'pending' | 'manager-approved' | 'approved' | 'rejected';
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
} = {}): Promise<AdminRequestsResponse> => {
  try {
    const token = getAdminToken();
    if (!token) {
      throw new Error('Admin not authenticated');
    }
    
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== 'all') {
        params.append(key, value.toString());
      }
    });
    
    const response = await axios.get(`${API_URL}/admins/leave-reimbursement/all?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Backend returns { success: true, data: Array, pagination: Object }
    if (response.data.success && response.data.data && response.data.pagination) {
      return {
        data: response.data.data,
        pagination: response.data.pagination
      };
    } else {
      console.error('❌ Unexpected all requests response structure:', response.data);
      throw new Error('Invalid response structure from server');
    }
  } catch (error) {
    console.error('Error fetching all requests:', error);
    throw error;
  }
};

const getAdminStats = async (): Promise<AdminStats> => {
  try {
    const token = getAdminToken();
    if (!token) {
      throw new Error('Admin not authenticated');
    }
    
    const response = await axios.get(`${API_URL}/admins/leave-reimbursement/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Backend returns { success: true, data: { pending: {...}, approved: {...}, rejected: {...} } }
    if (response.data.success && response.data.data) {
      return response.data.data;
    } else {
      console.error('❌ Unexpected stats response structure:', response.data);
      throw new Error('Invalid stats response structure from server');
    }
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    throw error;
  }
};

const adminRequestAction = async (
  requestId: string, 
  action: 'approve' | 'reject',
  requestType: 'leave' | 'reimbursement' | 'manager-leave',
  comments?: string
): Promise<AdminRequest> => {
  try {
    const token = getAdminToken();
    if (!token) {
      throw new Error('Admin not authenticated');
    }
    
    let endpoint: string;
    
    if (requestType === 'leave') {
      endpoint = `/admins/leave/${requestId}/action`;
    } else if (requestType === 'reimbursement') {
      endpoint = `/admins/reimbursement/${requestId}/action`;
    } else if (requestType === 'manager-leave') {
      endpoint = `/manager-leave/${requestId}/admin-action`;
    } else {
      throw new Error(`Unknown request type: ${requestType}`);
    }
      
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



const LeaveReimbursementManagement: React.FC = () => {
  // State for data management
  const [pendingRequests, setPendingRequests] = useState<AdminRequest[]>([]);
  const [allRequests, setAllRequests] = useState<AdminRequest[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for UI management
  const [activeRole, setActiveRole] = useState<ViewRole>('all');
  const [activeType, setActiveType] = useState<RequestType>('all');
  const [currentView, setCurrentView] = useState<'pending' | 'all'>('pending');
  
  // State for pagination
  const [pendingPagination, setPendingPagination] = useState<PaginationInfo>({
    current: 1,
    total: 0,
    pages: 0,
    hasMore: false
  });
  const [allPagination, setAllPagination] = useState<PaginationInfo>({
    current: 1,
    total: 0,
    pages: 0,
    hasMore: false
  });
  
  // State for modals
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState<boolean>(false);
  const [isReimbursementModalOpen, setIsReimbursementModalOpen] = useState<boolean>(false);

  // Load data on component mount and when filters change
  useEffect(() => {
    loadData();
    loadStats();
  }, [activeRole, activeType, currentView]);

  // Load pending or all requests based on current view
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if admin is authenticated first
      const token = getAdminToken();
      if (!token) {
        setError('Please log in as an admin to access this page.');
        return;
      }

      const requestFilters = {
        role: activeRole === 'all' ? undefined : activeRole,
        type: activeType === 'all' ? undefined : 
              activeType === 'manager-leave' ? 'leave' : activeType, // Backend treats manager leaves as part of 'leave' type
        page: 1,
        limit: 10
      };

      if (currentView === 'pending') {
        const response = await getAdminPendingRequests(requestFilters);
        
        if (response && Array.isArray(response.data)) {
          setPendingRequests(response.data || []);
          setPendingPagination(response.pagination || { current: 1, total: 0, pages: 0, hasMore: false });
        } else {
          console.error('❌ Invalid pending requests data structure:', response);
          setError('Invalid data structure received from server');
          return;
        }
      } else {
        const response = await getAllAdminRequests({
          ...requestFilters,
          status: 'all'
        });
        
        if (response && Array.isArray(response.data)) {
          setAllRequests(response.data || []);
          setAllPagination(response.pagination || { current: 1, total: 0, pages: 0, hasMore: false });
    } else {
          console.error('❌ Invalid all requests data structure:', response);
          setError('Invalid data structure received from server');
          return;
        }
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in as an admin.');
      } else if (err.message === 'Admin not authenticated') {
        setError('Please log in as an admin to access this page.');
      } else if (err.message.includes('Invalid response structure')) {
        setError('Server returned invalid data. Please try refreshing the page.');
    } else {
        setError('Failed to load requests. Please try again.');
    }
    } finally {
      setLoading(false);
    }
  };

  // Load dashboard statistics
  const loadStats = async () => {
    try {
      // Check if admin is authenticated first
      const token = getAdminToken();
      if (!token) {
        return; // Skip loading stats if not authenticated
      }

      const statsData = await getAdminStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('Error loading stats:', err);
    }
  };

  // Handle role change
  const handleRoleChange = (role: ViewRole) => {
    setActiveRole(role);
  };

  // Handle type change
  const handleTypeChange = (type: RequestType) => {
    setActiveType(type);
  };

  // Handle view change (pending vs all)
  const handleViewChange = (view: 'pending' | 'all') => {
    setCurrentView(view);
  };

  // Request actions
  const handleApproveRequest = async (id: string) => {
    try {
      setLoading(true);
      const request = [...pendingRequests, ...allRequests].find(r => r.id === id);
      if (!request) return;

      await adminRequestAction(id, 'approve', request.requestType);
      
      // Refresh data
      await loadData();
      await loadStats();
      
      // Show success message
      alert('Request approved successfully');
    } catch (err) {
      console.error('Error approving request:', err);
      alert('Failed to approve request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      setLoading(true);
      const request = [...pendingRequests, ...allRequests].find(r => r.id === id);
      if (!request) return;

      const comments = prompt('Please provide a reason for rejection (optional):');
      await adminRequestAction(id, 'reject', request.requestType, comments || undefined);
      
      // Refresh data
      await loadData();
      await loadStats();
      
      // Show success message
      alert('Request rejected successfully');
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert('Failed to reject request. Please try again.');
    } finally {
      setLoading(false);
    }
  };







  // Modal actions - Note: These are for admin creating requests (typically not needed)
  const handleOpenLeaveModal = () => {
    setIsLeaveModalOpen(true);
  };

  const handleCloseLeaveModal = () => {
    setIsLeaveModalOpen(false);
  };

  const handleSubmitLeaveRequest = (leaveRequest: Partial<LeaveRequest>) => {
    // Admins typically don't create leave requests, but this can be implemented if needed
    handleCloseLeaveModal();
  };

  const handleOpenReimbursementModal = () => {
    setIsReimbursementModalOpen(true);
  };

  const handleCloseReimbursementModal = () => {
    setIsReimbursementModalOpen(false);
  };

  const handleSubmitReimbursementRequest = (reimbursementRequest: Partial<ReimbursementRequest>) => {
    // Admins typically don't create reimbursement requests, but this can be implemented if needed
    handleCloseReimbursementModal();
  };



  // Get display data based on current view
  const getCurrentRequests = () => {
    return currentView === 'pending' ? pendingRequests : allRequests;
  };

  const getCurrentPagination = () => {
    return currentView === 'pending' ? pendingPagination : allPagination;
  };

  // Transform AdminRequest to component format
  const transformToComponentFormat = (requests: AdminRequest[]): (LeaveRequest | ReimbursementRequest)[] => {
    if (!requests || requests.length === 0) {
      return [];
    }
    
    // Filter requests based on active type for manager-leave specific filtering
    let filteredRequests = requests;
    if (activeType === 'manager-leave') {
      filteredRequests = requests.filter(req => req.requestType === 'manager-leave');
    }
    
    const transformed = filteredRequests.map((req, index) => {
      // Base properties common to both types
      const baseRequest = {
        id: req.id,
        employeeId: req.employeeId,
        employeeName: req.employeeName,
        department: req.department,
        status: req.status as RequestStatus,
        currentApprovalLevel: req.currentApprovalLevel as ApprovalLevel,
        dateSubmitted: req.dateSubmitted,
        requestType: req.requestType,
        managerApproval: req.managerApproval,
        adminApproval: req.adminApproval,
        approvalHistory: req.approvalHistory
      };
      
      if (req.requestType === 'leave' || req.requestType === 'manager-leave') {
        const leaveRequest: LeaveRequest = {
          ...baseRequest,
          requestType: req.requestType as 'leave' | 'manager-leave',
          leaveType: req.leaveType || 'Unknown',
          startDate: req.startDate || '',
          endDate: req.endDate || '',
          reason: req.reason || '',
          totalDays: req.totalDays
        };
        
        return leaveRequest;
      } else if (req.requestType === 'reimbursement') {
        const reimbursementRequest: ReimbursementRequest = {
          ...baseRequest,
          requestType: 'reimbursement',
          expenseType: req.expenseType || 'Unknown',
          amount: req.amount || 0,
          date: req.date || '',
          description: req.description || '',
          receipts: req.receipts
        };
        
        return reimbursementRequest;
    } else {
        console.error('❌ Unknown request type:', req.requestType);
        return baseRequest as any;
      }
    });
    
    return transformed;
  };

  if (loading && getCurrentRequests().length === 0) {
    return (
      <div className="flex min-h-screen bg-[#e0e5ec]">
        <AdminSidebar />
        <div className="main-content flex-1 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading requests...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-[#e0e5ec]">
        <AdminSidebar />
        <div className="main-content flex-1 p-8">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-center">
              <div className="text-red-600 text-lg mb-4">{error}</div>
              
              {!getAdminToken() && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-700 mb-4">
                    Please log in as an admin to access this page.
                  </p>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p><strong>Admin Credentials:</strong></p>
                    <p>Email: admin@worksmartai.com</p>
                    <p>Password: admin123</p>
                  </div>
                  <button 
                    onClick={() => window.location.href = '/login'}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Go to Login Page
                  </button>
                </div>
              )}

              {getAdminToken() && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-700 mb-4">
                    There was an issue loading the data. Please try again.
                  </p>
                  <div className="space-x-2">
                    <button 
                      onClick={() => {
                        setError(null);
                        loadData();
                        loadStats();
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Retry
                    </button>
                    <button 
                      onClick={() => {
                        setError(null);
                        setPendingRequests([]);
                        setAllRequests([]);
                        setStats(null);
                        loadData();
                        loadStats();
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" />
        <style>{`
          * {
            font-family: 'Poppins', sans-serif;
          }
        `}</style>
      </Helmet>

      <div className="flex min-h-screen bg-[#e0e5ec]">
        <AdminSidebar />

        <div className="main-content flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <HeaderPanel 
              onNotificationsClick={() => {}}
            />

            {/* Navigation Tabs */}
            <div className="mb-6">
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => handleViewChange('pending')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'pending' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Pending Requests ({stats?.pending?.total || 0})
                </button>
                <button
                  onClick={() => handleViewChange('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Requests
                </button>
              </div>
            </div>

            {/* Role Selection Tabs */}
            <RoleTabGroup activeRole={activeRole} onRoleChange={handleRoleChange} />

            {/* Type Selection Tabs */}
            <TypeTabGroup activeType={activeType} onTypeChange={handleTypeChange} />

            {/* Requests List */}
                <RequestsList 
              title={`${currentView === 'pending' ? 'Pending' : 'All'} ${
                activeType === 'all' ? 'Requests' : 
                activeType === 'leave' ? 'Leave Requests' : 
                activeType === 'manager-leave' ? 'Manager Leave Requests' :
                'Reimbursement Requests'
              } (${activeRole === 'all' ? 'All Roles' : activeRole.charAt(0).toUpperCase() + activeRole.slice(1)})`}
              requests={transformToComponentFormat(getCurrentRequests())}
              type={activeType}
              onApprove={handleApproveRequest}
              onReject={handleRejectRequest}
              loading={loading}
            />

            {/* Pagination (if needed) */}
            {(getCurrentPagination()?.pages || 0) > 1 && (
              <div className="mt-6 flex justify-center">
                <div className="text-sm text-gray-600">
                  Showing page {getCurrentPagination()?.current || 1} of {getCurrentPagination()?.pages || 1} 
                  ({getCurrentPagination()?.total || 0} total requests)
            </div>
              </div>
            )}

            {/* Modals */}
            <LeaveRequestModal 
              isOpen={isLeaveModalOpen}
              onClose={handleCloseLeaveModal}
              onSubmit={handleSubmitLeaveRequest}
            />

            <ReimbursementRequestModal 
              isOpen={isReimbursementModalOpen}
              onClose={handleCloseReimbursementModal}
              onSubmit={handleSubmitReimbursementRequest}
            />


          </div>
        </div>
      </div>
    </>
  );
};

export default LeaveReimbursementManagement; 