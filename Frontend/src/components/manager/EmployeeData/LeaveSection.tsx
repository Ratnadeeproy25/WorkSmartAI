import React, { useState, useEffect, useCallback } from 'react';
import { managerEmployeeDataApi, LeaveRequest, ReimbursementRequest, LeaveBalance } from '../../../services/managerEmployeeDataApi';

const LeaveSection: React.FC = () => {
  // State for leave requests
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loadingLeave, setLoadingLeave] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  // State for reimbursement requests
  const [reimbursementRequests, setReimbursementRequests] = useState<ReimbursementRequest[]>([]);
  const [loadingReimbursement, setLoadingReimbursement] = useState(false);
  const [reimbursementError, setReimbursementError] = useState<string | null>(null);

  // State for team leave balance
  const [teamLeaveBalance, setTeamLeaveBalance] = useState<LeaveBalance[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [balancesLastUpdated, setBalancesLastUpdated] = useState<Date | null>(null);
  const [previousBalanceMap, setPreviousBalanceMap] = useState<Map<string, {annual: number, sick: number, personal: number}>>(new Map());
  const [highlightedEmployees, setHighlightedEmployees] = useState<Set<string>>(new Set());

  // Notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    show: boolean;
  }>({ message: '', type: 'info', show: false });

  // Show notification helper
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type, show: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  }, []);

  // Fetch pending leave requests
  const fetchLeaveRequests = useCallback(async () => {
    setLoadingLeave(true);
    setLeaveError(null);
    try {
      const response = await managerEmployeeDataApi.getPendingLeaveRequests();
      setLeaveRequests(response.data);
    } catch (error: any) {
      console.error('Error fetching leave requests:', error);
      setLeaveError(error.message || 'Failed to fetch leave requests');
    } finally {
      setLoadingLeave(false);
    }
  }, []);

  // Fetch pending reimbursement requests
  const fetchReimbursementRequests = useCallback(async () => {
    setLoadingReimbursement(true);
    setReimbursementError(null);
    try {
      const response = await managerEmployeeDataApi.getPendingReimbursementRequests();
      setReimbursementRequests(response.data);
    } catch (error: any) {
      console.error('Error fetching reimbursement requests:', error);
      setReimbursementError(error.message || 'Failed to fetch reimbursement requests');
    } finally {
      setLoadingReimbursement(false);
    }
  }, []);

  // Fetch team leave balances
  const fetchTeamLeaveBalances = useCallback(async () => {
    setLoadingBalance(true);
    setBalanceError(null);
    try {
      const response = await managerEmployeeDataApi.getTeamLeaveBalances();
      setTeamLeaveBalance(response.data);
      setBalancesLastUpdated(new Date());
    } catch (error: any) {
      console.error('Error fetching team leave balances:', error);
      setBalanceError(error.message || 'Failed to fetch team leave balances');
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchLeaveRequests();
    fetchReimbursementRequests();
    fetchTeamLeaveBalances();
  }, [fetchLeaveRequests, fetchReimbursementRequests, fetchTeamLeaveBalances]);

  // Auto-refresh team leave balances periodically to catch admin approvals
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if not currently loading and user is on the page
      if (!loadingBalance && !document.hidden) {
        fetchTeamLeaveBalances();
      }
    }, 10000); // Refresh every 10 seconds for faster updates

    return () => clearInterval(interval);
  }, [fetchTeamLeaveBalances, loadingBalance]);

  // Track balance changes for highlighting
  useEffect(() => {
    const changedEmployees = new Set<string>();
    const newBalanceMap = new Map<string, {annual: number, sick: number, personal: number}>();
    
    teamLeaveBalance.forEach(employee => {
      const current = { annual: employee.annual, sick: employee.sick, personal: employee.personal };
      newBalanceMap.set(employee.id, current);
      
      const previous = previousBalanceMap.get(employee.id);
      if (previous && (
        previous.annual !== current.annual ||
        previous.sick !== current.sick ||
        previous.personal !== current.personal
      )) {
        changedEmployees.add(employee.id);
      }
    });
    
    if (changedEmployees.size > 0) {
      setHighlightedEmployees(changedEmployees);
      setTimeout(() => setHighlightedEmployees(new Set()), 3000); // Clear highlights after 3 seconds
    }
    
    setPreviousBalanceMap(newBalanceMap);
  }, [teamLeaveBalance]); // Removed previousBalanceMap from dependencies to prevent infinite loop

  const handleApproveLeave = async (id: string) => {
    try {
      const response = await managerEmployeeDataApi.updateLeaveRequestStatus(id, 'approved');
      showNotification(
        'Leave request approved and forwarded to admin for final approval. Team balances will update after admin approval.',
        'success'
      );
      
      // Refresh all relevant data
      await Promise.all([
        fetchLeaveRequests(),
        fetchTeamLeaveBalances()
      ]);
    } catch (error: any) {
      console.error('Error approving leave request:', error);
      showNotification(
        `Failed to approve leave request: ${error.message || 'Unknown error'}`,
        'error'
      );
    }
  };

  const handleRejectLeave = async (id: string) => {
    try {
      const comments = prompt('Please provide a reason for rejection (optional):');
      const response = await managerEmployeeDataApi.updateLeaveRequestStatus(id, 'rejected', comments || undefined);
      showNotification(
        'Leave request rejected successfully.',
        'success'
      );
      
      // Refresh all relevant data
      await Promise.all([
        fetchLeaveRequests(),
        fetchTeamLeaveBalances()
      ]);
    } catch (error: any) {
      console.error('Error rejecting leave request:', error);
      showNotification(
        `Failed to reject leave request: ${error.message || 'Unknown error'}`,
        'error'
      );
    }
  };

  const handleApproveReimbursement = async (id: string) => {
    try {
      const response = await managerEmployeeDataApi.updateReimbursementRequestStatus(id, 'approved');
      showNotification(
        'Reimbursement request approved and forwarded to admin for final approval.',
        'success'
      );
      
      // Refresh the requests list
      fetchReimbursementRequests();
    } catch (error: any) {
      console.error('Error approving reimbursement request:', error);
      showNotification(
        `Failed to approve reimbursement request: ${error.message || 'Unknown error'}`,
        'error'
      );
    }
  };

  const handleRejectReimbursement = async (id: string) => {
    try {
      const rejectionReason = prompt('Please provide a reason for rejection (optional):');
      const response = await managerEmployeeDataApi.updateReimbursementRequestStatus(id, 'rejected', rejectionReason || undefined);
      showNotification(
        'Reimbursement request rejected successfully.',
        'success'
      );
      
      // Refresh the requests list
      fetchReimbursementRequests();
    } catch (error: any) {
      console.error('Error rejecting reimbursement request:', error);
      showNotification(
        `Failed to reject reimbursement request: ${error.message || 'Unknown error'}`,
        'error'
      );
    }
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="neo-box p-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="h-6 bg-gray-300 rounded w-16"></div>
      </div>
      <div className="mt-4">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-8 bg-gray-300 rounded w-20"></div>
        <div className="h-8 bg-gray-300 rounded w-20"></div>
      </div>
    </div>
  );

  return (
    <>
      {/* Notification */}
      {notification.show && (
        <div className={`notification mb-6 p-4 rounded-lg border ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : notification.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <i className={`bi ${
                notification.type === 'success' 
                  ? 'bi-check-circle' 
                  : notification.type === 'error'
                  ? 'bi-exclamation-triangle'
                  : 'bi-info-circle'
              } text-lg`}></i>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Process Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <i className="bi bi-info-circle text-blue-600 text-lg"></i>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800 mb-1">Approval Process</h4>
            <p className="text-sm text-blue-700">
              When you approve a request, it will be forwarded to admin for final approval. 
              Only after admin approval will leave balances be deducted and reimbursements be processed.
              Team leave balances shown below reflect the current centralized system and will update in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Pending Leave Requests */}
      <div className="neo-box p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Pending Leave Requests</h3>
        <div className="space-y-4">
          {loadingLeave ? (
            Array.from({ length: 3 }).map((_, index) => (
              <LoadingSkeleton key={index} />
            ))
          ) : leaveError ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">
                <i className="bi bi-exclamation-triangle text-2xl"></i>
              </div>
              <p className="text-gray-600 mb-4">{leaveError}</p>
              <button 
                className="neo-button p-3 text-blue-600"
                onClick={fetchLeaveRequests}
              >
                <i className="bi bi-arrow-clockwise mr-2"></i>
                Try Again
              </button>
            </div>
          ) : leaveRequests.length > 0 ? (
            leaveRequests.map((request) => (
              <div className="neo-box p-4" key={request.id}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-700">{request.employee}</div>
                    <div className="text-sm text-gray-600">{request.type} - {request.dates}</div>
                  </div>
                  <span className="status-badge status-pending">Pending</span>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p>{request.reason}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button 
                    className="neo-button p-2 text-green-600"
                    onClick={() => handleApproveLeave(request.id)}
                    title="Approve and forward to admin for final approval"
                  >
                    <i className="bi bi-check-lg"></i>
                    <span>Approve</span>
                  </button>
                  <button 
                    className="neo-button p-2 text-red-600"
                    onClick={() => handleRejectLeave(request.id)}
                    title="Reject this request (final rejection)"
                  >
                    <i className="bi bi-x-lg"></i>
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No pending leave requests.</p>
          )}
        </div>
      </div>

      {/* Pending Reimbursement Requests */}
      <div className="neo-box p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Pending Reimbursement Requests</h3>
        <div className="space-y-4">
          {loadingReimbursement ? (
            Array.from({ length: 2 }).map((_, index) => (
              <LoadingSkeleton key={index} />
            ))
          ) : reimbursementError ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">
                <i className="bi bi-exclamation-triangle text-2xl"></i>
              </div>
              <p className="text-gray-600 mb-4">{reimbursementError}</p>
              <button 
                className="neo-button p-3 text-blue-600"
                onClick={fetchReimbursementRequests}
              >
                <i className="bi bi-arrow-clockwise mr-2"></i>
                Try Again
              </button>
            </div>
          ) : reimbursementRequests.length > 0 ? (
            reimbursementRequests.map((request) => (
              <div className="neo-box p-4" key={request.id}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-700">{request.employee}</div>
                    <div className="text-sm text-gray-600">{request.type} - {request.date}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium">${request.amount.toFixed(2)}</div>
                    <span className="status-badge status-pending">Pending</span>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p>{request.reason}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button 
                    className="neo-button p-2 text-green-600"
                    onClick={() => handleApproveReimbursement(request.id)}
                    title="Approve and forward to admin for final approval"
                  >
                    <i className="bi bi-check-lg"></i>
                    <span>Approve</span>
                  </button>
                  <button 
                    className="neo-button p-2 text-red-600"
                    onClick={() => handleRejectReimbursement(request.id)}
                    title="Reject this request (final rejection)"
                  >
                    <i className="bi bi-x-lg"></i>
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No pending reimbursement requests.</p>
          )}
        </div>
      </div>

      {/* Team Leave Balance */}
      <div className="neo-box p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Team Leave Balance</h3>
            {balancesLastUpdated && (
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {balancesLastUpdated.toLocaleTimeString()} 
                {' '} • Auto-refreshes every 10s
              </p>
            )}
          </div>
          <button
            onClick={fetchTeamLeaveBalances}
            className="neo-button text-sm py-1 px-3 flex items-center gap-1"
            disabled={loadingBalance}
            title="Refresh team leave balances"
          >
            {loadingBalance ? (
              <>
                <i className="bi bi-arrow-repeat animate-spin"></i>
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise"></i>
                <span>Refresh</span>
              </>
            )}
          </button>
        </div>
        {loadingBalance ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="neo-box p-4 animate-pulse" key={index}>
                <div className="h-4 bg-gray-300 rounded w-24 mb-3"></div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-300 rounded w-12"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-300 rounded w-10"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-300 rounded w-8"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : balanceError ? (
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <i className="bi bi-exclamation-triangle text-2xl"></i>
            </div>
            <p className="text-gray-600 mb-4">{balanceError}</p>
            <button 
              className="neo-button p-3 text-blue-600"
              onClick={fetchTeamLeaveBalances}
            >
              <i className="bi bi-arrow-clockwise mr-2"></i>
              Try Again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamLeaveBalance.map((employee) => (
              <div 
                className={`neo-box p-4 transition-all duration-500 ${
                  highlightedEmployees.has(employee.id) 
                    ? 'shadow-lg scale-105 ring-2 ring-green-400 bg-green-50' 
                    : ''
                }`} 
                key={employee.id}
              >
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  {employee.employee}
                  {highlightedEmployees.has(employee.id) && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full animate-pulse">
                      Updated
                    </span>
                  )}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Annual Leave:</span>
                    <span className="text-sm font-medium text-blue-600">{employee.annual} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sick Leave:</span>
                    <span className="text-sm font-medium text-green-600">{employee.sick} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Personal Leave:</span>
                    <span className="text-sm font-medium text-purple-600">{employee.personal} days</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default LeaveSection; 