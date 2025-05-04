import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
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

const LeaveReimbursementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leave' | 'reimbursement'>('leave');
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [reimbursementRequests, setReimbursementRequests] = useState<ReimbursementRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  // Mock data for the leave balances
  const leaveBalances: LeaveBalance[] = useMemo(() => [
    { type: 'Annual Leave', used: 5, total: 20, remaining: 15, color: '#3b82f6' },
    { type: 'Sick Leave', used: 2, total: 10, remaining: 8, color: '#ef4444' },
    { type: 'Personal Leave', used: 2, total: 5, remaining: 3, color: '#10b981' }
  ], []);

  // Memoize reimbursement summary calculation
  const reimbursementSummary = useMemo<ReimbursementSummaryType>(() => ({
    totalSubmitted: reimbursementRequests.reduce(
      (total, req) => total + req.amount, 0
    ),
    totalApproved: reimbursementRequests
      .filter(req => req.status === 'approved')
      .reduce((total, req) => total + req.amount, 0),
    totalPending: reimbursementRequests
      .filter(req => req.status === 'pending')
      .reduce((total, req) => total + req.amount, 0)
  }), [reimbursementRequests]);

  // Memoize tab change handler
  const handleTabChange = useCallback((tab: 'leave' | 'reimbursement') => {
    setActiveTab(tab);
  }, []);

  // Memoize leave request submission handler
  const handleLeaveRequestSubmit = useCallback((leaveRequest: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => {
    try {
      const newRequest: LeaveRequest = {
        ...leaveRequest,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      
      const updatedRequests = [...leaveRequests, newRequest];
      setLeaveRequests(updatedRequests);
      localStorage.setItem('leaveRequests', JSON.stringify(updatedRequests));
      
      showNotification('Leave request submitted successfully', 'success');
    } catch (err) {
      setError('Failed to submit leave request');
      console.error('Leave request error:', err);
    }
  }, [leaveRequests]);

  // Memoize reimbursement request submission handler
  const handleReimbursementRequestSubmit = useCallback((
    reimbursementRequest: Omit<ReimbursementRequest, 'id' | 'createdAt' | 'status'> & { receipt: File[] }
  ) => {
    try {
      const { receipt, ...rest } = reimbursementRequest;
      
      const receipts: ReceiptInfo[] = Array.from(receipt).map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }));
      
      const newRequest: ReimbursementRequest = {
        ...rest,
        receipts,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      
      const updatedRequests = [...reimbursementRequests, newRequest];
      setReimbursementRequests(updatedRequests);
      localStorage.setItem('reimbursementRequests', JSON.stringify(updatedRequests));
      
      showNotification('Reimbursement request submitted successfully', 'success');
    } catch (err) {
      setError('Failed to submit reimbursement request');
      console.error('Reimbursement request error:', err);
    }
  }, [reimbursementRequests]);

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

  // Load saved requests from localStorage
  useEffect(() => {
    try {
      const savedLeaveRequests = localStorage.getItem('leaveRequests');
      if (savedLeaveRequests) {
        setLeaveRequests(JSON.parse(savedLeaveRequests));
      } else {
        // Mock data for leave requests if none exist
        const mockLeaveRequests: LeaveRequest[] = [
          {
            id: '1',
            type: 'annual',
            duration: 'multiple-days',
            startDate: '2023-12-15',
            endDate: '2023-12-20',
            reason: 'Family vacation',
            status: 'approved',
            createdAt: '2023-12-01T09:00:00.000Z'
          },
          {
            id: '2',
            type: 'sick',
            duration: 'full-day',
            startDate: '2023-12-10',
            endDate: '2023-12-10',
            reason: 'Doctor\'s appointment',
            status: 'pending',
            createdAt: '2023-12-02T10:30:00.000Z'
          },
          {
            id: '3',
            type: 'personal',
            duration: 'full-day',
            startDate: '2023-11-25',
            endDate: '2023-11-25',
            reason: 'Personal errands',
            status: 'approved',
            createdAt: '2023-11-15T11:45:00.000Z'
          }
        ];
        setLeaveRequests(mockLeaveRequests);
        localStorage.setItem('leaveRequests', JSON.stringify(mockLeaveRequests));
      }

      const savedReimbursementRequests = localStorage.getItem('reimbursementRequests');
      if (savedReimbursementRequests) {
        setReimbursementRequests(JSON.parse(savedReimbursementRequests));
      } else {
        // Mock data for reimbursement requests if none exist
        const mockReimbursementRequests: ReimbursementRequest[] = [
          {
            id: '1',
            type: 'travel',
            amount: 250.00,
            date: '2023-12-05',
            description: 'Client meeting travel expenses',
            receipts: [{ name: 'receipt1.pdf', size: 1024 * 1024, type: 'application/pdf' }],
            status: 'approved',
            createdAt: '2023-12-01T09:00:00.000Z'
          },
          {
            id: '2',
            type: 'office-supplies',
            amount: 75.50,
            date: '2023-11-28',
            description: 'Printer paper and ink cartridges',
            receipts: [{ name: 'receipt2.jpg', size: 500 * 1024, type: 'image/jpeg' }],
            status: 'pending',
            createdAt: '2023-11-25T10:30:00.000Z'
          },
          {
            id: '3',
            type: 'training',
            amount: 350.00,
            date: '2023-11-15',
            description: 'Online course subscription',
            receipts: [{ name: 'receipt3.png', size: 800 * 1024, type: 'image/png' }],
            status: 'approved',
            createdAt: '2023-11-10T11:45:00.000Z'
          }
        ];
        setReimbursementRequests(mockReimbursementRequests);
        localStorage.setItem('reimbursementRequests', JSON.stringify(mockReimbursementRequests));
      }

      // Check URL hash to determine active tab
      if (location.hash === '#reimbursementSection') {
        setActiveTab('reimbursement');
      } else if (location.hash === '#leaveSection') {
        setActiveTab('leave');
      }
    } catch (err) {
      setError('Failed to load saved requests');
      console.error('Load requests error:', err);
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-[#e0e5ec]">
      <Sidebar />
      <div className="main-content p-6">
        <div className="max-w-7xl mx-auto">
          <PageHeader />

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="mb-8 border-b border-gray-200">
            <div className="flex space-x-8">
              <button 
                className={`py-4 px-1 font-medium text-base relative ${
                  activeTab === 'leave' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => handleTabChange('leave')}
              >
                Leave Requests
              </button>
              <button 
                className={`py-4 px-1 font-medium text-base relative ${
                  activeTab === 'reimbursement' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => handleTabChange('reimbursement')}
              >
                Reimbursement Requests
              </button>
            </div>
          </div>

          {/* Leave Requests Section */}
          <div className={`space-y-8 ${activeTab === 'leave' ? '' : 'hidden'}`}>
            <LeaveRequestForm onSubmit={handleLeaveRequestSubmit} />
            <LeaveHistory leaveRequests={leaveRequests} />
            <LeaveBalanceDisplay leaveBalances={leaveBalances} />
          </div>

          {/* Reimbursement Requests Section */}
          <div className={`space-y-8 ${activeTab === 'reimbursement' ? '' : 'hidden'}`}>
            <ReimbursementRequestForm onSubmit={handleReimbursementRequestSubmit} />
            <ReimbursementHistory reimbursementRequests={reimbursementRequests} />
            <ReimbursementSummary summary={reimbursementSummary} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LeaveReimbursementPage); 