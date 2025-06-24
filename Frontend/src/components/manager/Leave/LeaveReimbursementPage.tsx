import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import Sidebar from '../Sidebar';
import LeaveReimbursementHeader from './LeaveReimbursementHeader';
import LeaveRequestForm from './LeaveRequestForm';
import LeaveHistory from './LeaveHistory';
import LeaveBalance from './LeaveBalance';
import ReimbursementRequestForm from './ReimbursementRequestForm';
import ReimbursementHistory from './ReimbursementHistory';
import ReimbursementSummary from './ReimbursementSummary';
import '../../../styles/NeomorphicUI.css';
import '../../../styles/manager/index.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import * as managerLeaveService from '../../../services/managerLeaveService';
import * as reimbursementService from '../../../services/reimbursementService';
import { useManagerLeaveBalance } from '../../../contexts/ManagerLeaveBalanceContext';
import { 
  LeaveRequest, 
  ReimbursementRequest, 
  ReimbursementSummary as ReimbursementSummaryType 
} from '../../../components/employee/LeaveReimbursement/types';

const LeaveReimbursementPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [activeTab, setActiveTab] = useState<'leave' | 'reimbursement'>('leave');
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [reimbursementRequests, setReimbursementRequests] = useState<ReimbursementRequest[]>([]);
  const [reimbursementSummary, setReimbursementSummary] = useState<ReimbursementSummaryType>({
    totalSubmitted: 0,
    totalApproved: 0,
    totalPending: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { leaveBalances, fetchLeaveBalances, isLoading: balancesLoading } = useManagerLeaveBalance();
  
  // Handle sidebar and window resizing
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Check URL hash on page load
    if (window.location.hash === '#reimbursementSection') {
      setActiveTab('reimbursement');
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleTabChange = (tab: 'leave' | 'reimbursement') => {
    setActiveTab(tab);
    
    // Update URL hash for bookmarking
    window.location.hash = tab === 'reimbursement' ? '#reimbursementSection' : '';
  };
  
  // Fetch leave requests
  const fetchLeaveRequests = useCallback(async () => {
    try {
      const requests = await managerLeaveService.getManagerLeaveRequests();
      setLeaveRequests(requests);
    } catch (err) {
      console.error('Error fetching manager leave requests:', err);
      setError('Failed to load leave requests');
    }
  }, []);

  // Fetch reimbursement requests
  const fetchReimbursementRequests = useCallback(async () => {
    try {
      const requests = await reimbursementService.getReimbursementRequests();
      setReimbursementRequests(requests);
    } catch (err) {
      console.error('Error fetching reimbursement requests:', err);
      setError('Failed to load reimbursement requests');
    }
  }, []);

  // Fetch reimbursement summary
  const fetchReimbursementSummary = useCallback(async () => {
    try {
      const summary = await reimbursementService.getReimbursementSummary();
      setReimbursementSummary(summary);
    } catch (err) {
      console.error('Error fetching reimbursement summary:', err);
      setError('Failed to load reimbursement summary');
    }
  }, []);
  
  // Handle leave request submission
  const handleLeaveRequestSubmit = useCallback(async (leaveRequest: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => {
    try {
      await managerLeaveService.requestManagerLeave(leaveRequest);
      // Refresh data
      fetchLeaveRequests();
      fetchLeaveBalances();
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to submit manager leave request';
      setError(errorMessage);
      throw err;
    }
  }, [fetchLeaveRequests, fetchLeaveBalances]);

  // Handle reimbursement request submission
  const handleReimbursementRequestSubmit = useCallback(async (
    formData: FormData
  ) => {
    try {
      await reimbursementService.submitReimbursementRequest(formData);
      // Refresh data
      fetchReimbursementRequests();
      fetchReimbursementSummary();
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to submit reimbursement request';
      setError(errorMessage);
      throw err;
    }
  }, [fetchReimbursementRequests, fetchReimbursementSummary]);

  // Load all data on initial render
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchLeaveRequests(),
          fetchReimbursementRequests(),
          fetchReimbursementSummary(),
          fetchLeaveBalances()
        ]);
        setError(null);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchLeaveRequests, fetchReimbursementRequests, fetchReimbursementSummary, fetchLeaveBalances]);

  return (
    <div className="manager-leave-container bg-[#e0e5ec] min-h-screen w-full overflow-x-hidden">
      <Helmet>
        <title>WorkSmart AI - Leave & Reimbursements</title>
      </Helmet>
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && window.innerWidth <= 1024 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`sidebar fixed h-full transition-all duration-300 z-50 ${sidebarOpen ? '' : '-translate-x-full'}`}>
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <div 
        className="main-content transition-all duration-300 py-6 px-4 md:px-6" 
        style={{ marginLeft: sidebarOpen && window.innerWidth > 1024 ? '250px' : '0' }}
      >
        <div className="max-w-7xl mx-auto fade-in">
          {/* Sidebar Toggle for Mobile */}
          {!sidebarOpen && (
            <button 
              className="fixed top-4 left-4 z-20 neo-button p-3 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open Sidebar"
            >
              <i className="bi bi-list text-2xl"></i>
            </button>
          )}
          
          {/* Header */}
          <LeaveReimbursementHeader />

          {/* Error notification */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              <span className="block sm:inline">{error}</span>
              <span 
                className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
                onClick={() => setError(null)}
              >
                <i className="bi bi-x"></i>
              </span>
            </div>
          )}
          
          {/* Loading state */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex flex-wrap gap-4 mb-8 slide-in-left">
                <button 
                  className={`tab-button ${activeTab === 'leave' ? 'active' : ''}`}
                  onClick={() => handleTabChange('leave')}
                >
                  Leave Requests
                </button>
                <button 
                  className={`tab-button ${activeTab === 'reimbursement' ? 'active' : ''}`}
                  onClick={() => handleTabChange('reimbursement')}
                >
                  Reimbursement Requests
                </button>
              </div>

              {/* Leave Requests Section */}
              <div className={`space-y-8 ${activeTab === 'leave' ? '' : 'hidden'}`}>
                <div className="slide-in-up">
                  <LeaveRequestForm 
                    onSubmit={handleLeaveRequestSubmit} 
                    leaveBalances={leaveBalances} 
                  />
                </div>
                <div className="slide-in-up" style={{ animationDelay: '0.1s' }}>
                  <LeaveHistory leaveRequests={leaveRequests} />
                </div>
                <div className="slide-in-up" style={{ animationDelay: '0.2s' }}>
                  <LeaveBalance leaveBalances={leaveBalances} onBalanceReset={fetchLeaveBalances} />
                </div>
              </div>

              {/* Reimbursement Requests Section */}
              <div className={`space-y-8 ${activeTab === 'reimbursement' ? '' : 'hidden'}`}>
                <div className="slide-in-up">
                  <ReimbursementRequestForm onSubmit={handleReimbursementRequestSubmit} />
                </div>
                <div className="slide-in-up" style={{ animationDelay: '0.1s' }}>
                  <ReimbursementHistory reimbursementRequests={reimbursementRequests} />
                </div>
                <div className="slide-in-up" style={{ animationDelay: '0.2s' }}>
                  <ReimbursementSummary summary={reimbursementSummary} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveReimbursementPage; 