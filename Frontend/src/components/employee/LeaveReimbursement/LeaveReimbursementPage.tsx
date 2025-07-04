import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Sidebar from '../Sidebar';
import PageHeader from './PageHeader';
import LeaveRequestForm from './LeaveRequestForm';
import LeaveHistory from './LeaveHistory';
import LeaveBalanceDisplay from './LeaveBalanceDisplay';
import ReimbursementRequestForm from './ReimbursementRequestForm';
import ReimbursementHistory from './ReimbursementHistory';
import ReimbursementSummary from './ReimbursementSummary';
import '../../../styles/employee/leave-reimbursement.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import {
  LeaveRequest,
  LeaveBalance,
  ReimbursementRequest,
  ReimbursementSummary as ReimbursementSummaryType,
  ReceiptInfo
} from './types';
import * as leaveService from '../../../services/leaveService';
import * as reimbursementService from '../../../services/reimbursementService';
import { useLeaveBalance } from '../../../contexts/LeaveBalanceContext';

const LeaveReimbursementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leave' | 'reimbursement'>('leave');
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [reimbursementRequests, setReimbursementRequests] = useState<ReimbursementRequest[]>([]);
  const { leaveBalances, fetchLeaveBalances, isLoading: balancesLoading } = useLeaveBalance();
  const [reimbursementSummaryData, setReimbursementSummaryData] = useState<ReimbursementSummaryType>({
    totalSubmitted: 0,
    totalApproved: 0,
    totalPending: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  // Memoize reimbursement summary calculation
  const reimbursementSummary = useMemo<ReimbursementSummaryType>(() => 
    reimbursementSummaryData, [reimbursementSummaryData]
  );

  // Memoize tab change handler
  const handleTabChange = useCallback((tab: 'leave' | 'reimbursement') => {
    setActiveTab(tab);
  }, []);

  // Fetch leave requests data
  const fetchLeaveRequests = useCallback(async () => {
    try {
      const requests = await leaveService.getLeaveRequests();
      setLeaveRequests(requests);
    } catch (err) {
      console.error('Error fetching leave requests:', err);
      setError('Failed to load leave requests');
    }
  }, []);

  // Fetch reimbursement requests data
  const fetchReimbursementRequests = useCallback(async () => {
    try {
      const requests = await reimbursementService.getReimbursementRequests();
      setReimbursementRequests(requests);
    } catch (err) {
      console.error('Error fetching reimbursement requests:', err);
      setError('Failed to load reimbursement requests');
    }
  }, []);

  // Fetch reimbursement summary data
  const fetchReimbursementSummary = useCallback(async () => {
    try {
      const summary = await reimbursementService.getReimbursementSummary();
      setReimbursementSummaryData(summary);
    } catch (err) {
      console.error('Error fetching reimbursement summary:', err);
      setError('Failed to load reimbursement summary');
    }
  }, []);

  // Memoize notification system
  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }, []);

  // Memoize leave request submission handler
  const handleLeaveRequestSubmit = useCallback(async (leaveRequest: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => {
    try {
      await leaveService.requestLeave(leaveRequest);
      
      // Refresh the list of leave requests
      await fetchLeaveRequests();
      
      // Refresh leave balances - ensure we await to get immediate update
      await fetchLeaveBalances();
      
      // Show success notification
      showNotification('Leave request submitted successfully', 'success');
      
      // Clear any existing error
      setError(null);
      
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to submit leave request';
      setError(errorMessage);
      console.error('Leave request error:', err);
      showNotification(errorMessage, 'error');
      
      // Re-throw to handle in the form component
      throw err;
    }
  }, [fetchLeaveRequests, fetchLeaveBalances, showNotification]);

  // Memoize reimbursement request submission handler
  const handleReimbursementRequestSubmit = useCallback(async (
    reimbursementRequest: Omit<ReimbursementRequest, 'id' | 'createdAt' | 'status'>
  ) => {
    try {
      // Create form data for submission
      const formData = new FormData();
      formData.append('type', reimbursementRequest.type);
      formData.append('amount', reimbursementRequest.amount.toString());
      formData.append('date', reimbursementRequest.date);
      formData.append('description', reimbursementRequest.description);
      
      // Submit the request
      await reimbursementService.submitReimbursementRequest(formData);
      
      // Refresh reimbursement data
      fetchReimbursementRequests();
      fetchReimbursementSummary();
      
      // Show success notification
      showNotification('Reimbursement request submitted successfully', 'success');
      
      // Clear any existing error
      setError(null);
      
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to submit reimbursement request';
      setError(errorMessage);
      console.error('Reimbursement request error:', err);
      showNotification(errorMessage, 'error');
      
      // Re-throw to handle in the form component
      throw err;
    }
  }, [fetchReimbursementRequests, fetchReimbursementSummary, showNotification]);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch all required data
        await Promise.all([
          fetchLeaveRequests(),
          fetchReimbursementRequests(),
          fetchReimbursementSummary()
        ]);

      // Check URL hash to determine active tab
      if (location.hash === '#reimbursementSection') {
        setActiveTab('reimbursement');
      } else if (location.hash === '#leaveSection') {
        setActiveTab('leave');
      }
    } catch (err) {
        setError('Failed to load data. Please try again later.');
        console.error('Load data error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [
    location.hash, 
    fetchLeaveRequests, 
    fetchReimbursementRequests, 
    fetchReimbursementSummary
  ]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Helmet>
        <title>WorkSmart AI - Leave & Reimbursements</title>
      </Helmet>
      <Sidebar activeSection="leave-reimbursement" />
      
      <div className="flex-1 ml-64 px-4 py-8 md:px-8">
        <PageHeader 
          title="Leave & Reimbursements" 
          description="View and manage your leave requests and expense reimbursements"
        />
        
        {/* Tab Navigation */}
        <div className="neo-tabs mt-6">
              <button 
            className={`neo-tab ${activeTab === 'leave' ? 'active' : ''}`}
                onClick={() => handleTabChange('leave')}
              >
            <i className="bi bi-calendar-check mr-2"></i>
                Leave Requests
              </button>
              <button 
            className={`neo-tab ${activeTab === 'reimbursement' ? 'active' : ''}`}
                onClick={() => handleTabChange('reimbursement')}
              >
            <i className="bi bi-cash-stack mr-2"></i>
            Reimbursements
              </button>
            </div>
        
        {/* Error notification */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4">
            <span className="block sm:inline">{error}</span>
            <span 
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setError(null)}
            >
              <i className="bi bi-x"></i>
            </span>
          </div>
        )}
        
        {/* Loading state */}
        {(loading || balancesLoading) ? (
          <div className="flex items-center justify-center h-64">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {/* Leave Tab Content */}
            {activeTab === 'leave' && (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <LeaveRequestForm onSubmit={handleLeaveRequestSubmit} leaveBalances={leaveBalances} />
                  <LeaveHistory leaveRequests={leaveRequests} />
                </div>
                <div>
                  <LeaveBalanceDisplay 
                    leaveBalances={leaveBalances} 
                    onBalanceReset={fetchLeaveBalances}
                  />
                </div>
              </div>
            )}
            
            {/* Reimbursement Tab Content */}
            {activeTab === 'reimbursement' && (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
            <ReimbursementRequestForm onSubmit={handleReimbursementRequestSubmit} />
            <ReimbursementHistory reimbursementRequests={reimbursementRequests} />
                </div>
                <div>
            <ReimbursementSummary summary={reimbursementSummary} />
          </div>
        </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LeaveReimbursementPage; 