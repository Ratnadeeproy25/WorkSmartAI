import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import AdminSidebar from '../AdminSidebar';
import HeaderPanel from './HeaderPanel';
import RoleTabGroup from './RoleTabGroup';
import TypeTabGroup from './TypeTabGroup';
import BulkActionsPanel from './BulkActionsPanel';
import FilterPanel from './FilterPanel';
import RequestsList from './RequestsList';
import LeaveRequestModal from './LeaveRequestModal';
import ReimbursementRequestModal from './ReimbursementRequestModal';
import RequestHistoryModal from './RequestHistoryModal';
import { Helmet } from 'react-helmet';
import { 
  Employee, 
  ViewRole, 
  RequestType, 
  LeaveRequest, 
  ReimbursementRequest,
  HistoryItem,
  RequestWithHistory
} from './types';

// Mock data
const mockEmployees: Employee[] = [
  { id: 'EMP001', name: 'John Doe', department: 'Development' },
  { id: 'EMP002', name: 'Sarah Wilson', department: 'Marketing' },
  { id: 'EMP003', name: 'Michael Brown', department: 'Design' },
  { id: 'EMP004', name: 'Emily Davis', department: 'HR' }
];

const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 'LR001',
    employeeId: 'EMP001',
    employeeName: 'John Doe',
    department: 'Development',
    leaveType: 'Annual Leave',
    startDate: 'Dec 15, 2023',
    endDate: 'Dec 20, 2023',
    reason: 'Family vacation',
    status: 'pending',
    dateSubmitted: 'Dec 10, 2023'
  },
  {
    id: 'LR002',
    employeeId: 'EMP002',
    employeeName: 'Sarah Wilson',
    department: 'Marketing',
    leaveType: 'Sick Leave',
    startDate: 'Dec 10, 2023',
    endDate: 'Dec 12, 2023',
    reason: 'Medical appointment',
    status: 'approved',
    dateSubmitted: 'Dec 5, 2023'
  }
];

const mockReimbursementRequests: ReimbursementRequest[] = [
  {
    id: 'RR001',
    employeeId: 'EMP003',
    employeeName: 'Mike Johnson',
    department: 'Marketing',
    expenseType: 'Travel Expense',
    amount: 250.00,
    date: 'Dec 5, 2023',
    description: 'Client meeting travel expenses',
    status: 'pending',
    dateSubmitted: 'Dec 1, 2023'
  },
  {
    id: 'RR002',
    employeeId: 'EMP004',
    employeeName: 'Emily Davis',
    department: 'Development',
    expenseType: 'Training Expense',
    amount: 500.00,
    date: 'Dec 1, 2023',
    description: 'Professional certification course',
    status: 'approved',
    dateSubmitted: 'Nov 25, 2023'
  }
];

const mockRequestHistory: Record<string, HistoryItem[]> = {
  'LR001': [
    {
      id: 'H001',
      date: 'Dec 15, 2023',
      time: '10:30 AM',
      status: 'pending',
      description: 'Status Change',
      person: 'Request submitted by John Doe'
    }
  ],
  'LR002': [
    {
      id: 'H002',
      date: 'Dec 15, 2023',
      time: '10:30 AM',
      status: 'pending',
      description: 'Status Change',
      person: 'Request submitted by Sarah Wilson'
    },
    {
      id: 'H003',
      date: 'Dec 15, 2023',
      time: '11:45 AM',
      status: 'approved',
      description: 'Manager Review',
      person: 'Approved by Sarah Wilson'
    }
  ],
  'RR001': [
    {
      id: 'H004',
      date: 'Dec 1, 2023',
      time: '09:15 AM',
      status: 'pending',
      description: 'Status Change',
      person: 'Request submitted by Mike Johnson'
    }
  ],
  'RR002': [
    {
      id: 'H005',
      date: 'Nov 25, 2023',
      time: '14:20 PM',
      status: 'pending',
      description: 'Status Change',
      person: 'Request submitted by Emily Davis'
    },
    {
      id: 'H006',
      date: 'Nov 27, 2023',
      time: '11:30 AM',
      status: 'approved',
      description: 'Manager Review',
      person: 'Approved by Mike Johnson'
    }
  ]
};

const LeaveReimbursementManagement: React.FC = () => {
  // State for data management
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [reimbursementRequests, setReimbursementRequests] = useState<ReimbursementRequest[]>([]);
  
  // State for UI management
  const [activeRole, setActiveRole] = useState<ViewRole>('employee');
  const [activeType, setActiveType] = useState<RequestType>('leave');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  
  // State for modals
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState<boolean>(false);
  const [isReimbursementModalOpen, setIsReimbursementModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [currentHistoryItems, setCurrentHistoryItems] = useState<HistoryItem[]>([]);

  // Load data from localStorage on component mount
  useEffect(() => {
    const storedLeaveRequests = localStorage.getItem('leaveRequests');
    const storedReimbursementRequests = localStorage.getItem('reimbursementRequests');
    const storedActiveRole = localStorage.getItem('leaveReimbursementActiveRole');
    
    if (storedLeaveRequests) {
      setLeaveRequests(JSON.parse(storedLeaveRequests));
    } else {
      setLeaveRequests(mockLeaveRequests);
    }
    
    if (storedReimbursementRequests) {
      setReimbursementRequests(JSON.parse(storedReimbursementRequests));
    } else {
      setReimbursementRequests(mockReimbursementRequests);
    }
    
    if (storedActiveRole) {
      setActiveRole(storedActiveRole as ViewRole);
    }
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('leaveRequests', JSON.stringify(leaveRequests));
    localStorage.setItem('reimbursementRequests', JSON.stringify(reimbursementRequests));
    localStorage.setItem('leaveReimbursementActiveRole', activeRole);
  }, [leaveRequests, reimbursementRequests, activeRole]);

  // Handle role change
  const handleRoleChange = (role: ViewRole) => {
    setActiveRole(role);
  };

  // Handle type change
  const handleTypeChange = (type: RequestType) => {
    setActiveType(type);
  };

  // Request actions
  const handleApproveRequest = (id: string) => {
    if (activeType === 'leave') {
      setLeaveRequests(prev => prev.map(request => 
        request.id === id ? { ...request, status: 'approved' } : request
      ));
    } else {
      setReimbursementRequests(prev => prev.map(request => 
        request.id === id ? { ...request, status: 'approved' } : request
      ));
    }
  };

  const handleRejectRequest = (id: string) => {
    if (activeType === 'leave') {
      setLeaveRequests(prev => prev.map(request => 
        request.id === id ? { ...request, status: 'rejected' } : request
      ));
    } else {
      setReimbursementRequests(prev => prev.map(request => 
        request.id === id ? { ...request, status: 'rejected' } : request
      ));
    }
  };

  const handleRevokeRequest = (id: string) => {
    if (activeType === 'leave') {
      setLeaveRequests(prev => prev.map(request => 
        request.id === id ? { ...request, status: 'pending' } : request
      ));
    } else {
      setReimbursementRequests(prev => prev.map(request => 
        request.id === id ? { ...request, status: 'pending' } : request
      ));
    }
  };

  const handleCommentRequest = (id: string) => {
    // Implement comment functionality
    console.log('Comment request:', id);
  };

  const handleShowHistory = (id: string) => {
    // Get history for the selected request
    const history = mockRequestHistory[id] || [];
    setCurrentHistoryItems(history);
    setIsHistoryModalOpen(true);
  };

  // Bulk actions
  const handleBulkApprove = () => {
    if (activeType === 'leave') {
      setLeaveRequests(prev => prev.map(request => 
        selectedRequests.includes(request.id) ? { ...request, status: 'approved' } : request
      ));
    } else {
      setReimbursementRequests(prev => prev.map(request => 
        selectedRequests.includes(request.id) ? { ...request, status: 'approved' } : request
      ));
    }
    setSelectedRequests([]);
  };

  const handleBulkReject = () => {
    if (activeType === 'leave') {
      setLeaveRequests(prev => prev.map(request => 
        selectedRequests.includes(request.id) ? { ...request, status: 'rejected' } : request
      ));
    } else {
      setReimbursementRequests(prev => prev.map(request => 
        selectedRequests.includes(request.id) ? { ...request, status: 'rejected' } : request
      ));
    }
    setSelectedRequests([]);
  };

  const handleBulkExport = () => {
    // Implement export functionality
    console.log('Export selected requests:', selectedRequests);
  };

  // Filter actions
  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleApplyFilters = (filters: any) => {
    console.log('Apply filters:', filters);
    // Implement filter logic here
  };

  const handleResetFilters = () => {
    console.log('Reset filters');
    // Implement reset filter logic here
  };

  // Modal actions
  const handleOpenLeaveModal = () => {
    setIsLeaveModalOpen(true);
  };

  const handleCloseLeaveModal = () => {
    setIsLeaveModalOpen(false);
  };

  const handleSubmitLeaveRequest = (leaveRequest: Partial<LeaveRequest>) => {
    // Use default employee data for new requests
    const employee = employees[0];
    
    const newLeaveRequest: LeaveRequest = {
      id: uuidv4(),
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department,
      leaveType: leaveRequest.leaveType || '',
      startDate: leaveRequest.startDate || '',
      endDate: leaveRequest.endDate || '',
      reason: leaveRequest.reason || '',
      status: 'pending',
      dateSubmitted: new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    };
    
    setLeaveRequests(prev => [...prev, newLeaveRequest]);
  };

  const handleOpenReimbursementModal = () => {
    setIsReimbursementModalOpen(true);
  };

  const handleCloseReimbursementModal = () => {
    setIsReimbursementModalOpen(false);
  };

  const handleSubmitReimbursementRequest = (reimbursementRequest: Partial<ReimbursementRequest>) => {
    // Use default employee data for new requests
    const employee = employees[0];
    
    const newReimbursementRequest: ReimbursementRequest = {
      id: uuidv4(),
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department,
      expenseType: reimbursementRequest.expenseType || '',
      amount: reimbursementRequest.amount || 0,
      date: reimbursementRequest.date || '',
      description: reimbursementRequest.description || '',
      status: 'pending',
      dateSubmitted: new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    };
    
    setReimbursementRequests(prev => [...prev, newReimbursementRequest]);
  };

  const handleCloseHistoryModal = () => {
    setIsHistoryModalOpen(false);
  };

  // Helper functions to get pending and approved requests based on the active type
  const getPendingRequests = () => {
    if (activeType === 'leave') {
      return leaveRequests.filter(request => request.status === 'pending');
    } else {
      return reimbursementRequests.filter(request => request.status === 'pending');
    }
  };

  const getApprovedRequests = () => {
    if (activeType === 'leave') {
      return leaveRequests.filter(request => request.status === 'approved');
    } else {
      return reimbursementRequests.filter(request => request.status === 'approved');
    }
  };

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
              onNotificationsClick={() => console.log('Notifications clicked')}
            />

            {/* Role Selection Tabs */}
            <RoleTabGroup activeRole={activeRole} onRoleChange={handleRoleChange} />

            {/* Employee View */}
            <div className={`space-y-8 ${activeRole !== 'employee' && 'hidden'}`}>
              {/* Employee Tabs */}
              <TypeTabGroup activeType={activeType} onTypeChange={handleTypeChange} />

              {/* Employee Section Content */}
              <div className="space-y-8">
                {/* Bulk Actions */}
                <BulkActionsPanel 
                  onBulkApprove={handleBulkApprove}
                  onBulkReject={handleBulkReject}
                  onBulkExport={handleBulkExport}
                  onToggleFilters={handleToggleFilters}
                  hasSelectedItems={selectedRequests.length > 0}
                />

                {/* Advanced Filters */}
                <FilterPanel 
                  requestType={activeType}
                  onApplyFilters={handleApplyFilters}
                  onResetFilters={handleResetFilters}
                  isVisible={showFilters}
                />

                {/* Pending Requests */}
                <RequestsList 
                  title={`Pending ${activeType === 'leave' ? 'Leave' : 'Reimbursement'} Requests`}
                  requests={getPendingRequests()}
                  type={activeType}
                  onApprove={handleApproveRequest}
                  onReject={handleRejectRequest}
                  onComment={handleCommentRequest}
                  onShowHistory={handleShowHistory}
                  onBulkSelect={setSelectedRequests}
                  enableSelection={true}
                />

                {/* Approved Requests */}
                <RequestsList 
                  title={`Approved ${activeType === 'leave' ? 'Leave' : 'Reimbursement'} Requests`}
                  requests={getApprovedRequests()}
                  type={activeType}
                  onApprove={handleApproveRequest}
                  onReject={handleRejectRequest}
                  onComment={handleCommentRequest}
                  onShowHistory={handleShowHistory}
                  onRevoke={handleRevokeRequest}
                />
              </div>
            </div>

            {/* Manager View */}
            <div className={`space-y-8 ${activeRole !== 'manager' && 'hidden'}`}>
              {/* Manager Tabs */}
              <TypeTabGroup activeType={activeType} onTypeChange={handleTypeChange} />

              {/* Manager Section Content */}
              <div className="space-y-8">
                {/* Bulk Actions */}
                <BulkActionsPanel 
                  onBulkApprove={handleBulkApprove}
                  onBulkReject={handleBulkReject}
                  onBulkExport={handleBulkExport}
                  onToggleFilters={handleToggleFilters}
                  hasSelectedItems={selectedRequests.length > 0}
                />

                {/* Advanced Filters */}
                <FilterPanel 
                  requestType={activeType}
                  onApplyFilters={handleApplyFilters}
                  onResetFilters={handleResetFilters}
                  isVisible={showFilters}
                />

                {/* Pending Requests */}
                <RequestsList 
                  title={`Pending ${activeType === 'leave' ? 'Leave' : 'Reimbursement'} Requests`}
                  requests={getPendingRequests()}
                  type={activeType}
                  onApprove={handleApproveRequest}
                  onReject={handleRejectRequest}
                  onComment={handleCommentRequest}
                  onShowHistory={handleShowHistory}
                  onBulkSelect={setSelectedRequests}
                  enableSelection={true}
                />

                {/* Approved Requests */}
                <RequestsList 
                  title={`Approved ${activeType === 'leave' ? 'Leave' : 'Reimbursement'} Requests`}
                  requests={getApprovedRequests()}
                  type={activeType}
                  onApprove={handleApproveRequest}
                  onReject={handleRejectRequest}
                  onComment={handleCommentRequest}
                  onShowHistory={handleShowHistory}
                  onRevoke={handleRevokeRequest}
                />
              </div>
            </div>

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

            <RequestHistoryModal 
              isOpen={isHistoryModalOpen}
              onClose={handleCloseHistoryModal}
              history={currentHistoryItems}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default LeaveReimbursementManagement; 