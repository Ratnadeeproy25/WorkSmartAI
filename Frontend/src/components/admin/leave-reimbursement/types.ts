export type RequestStatus = 'pending' | 'manager-approved' | 'approved' | 'rejected';
export type ApprovalLevel = 'manager' | 'admin' | 'completed';

export interface Employee {
    id: string;
    name: string;
    department: string;
    role?: string;
}

export interface ApprovalInfo {
    approvedBy: string | { _id: string; name: string };
    approvedAt: string;
    comments?: string;
}

export interface LeaveRequest {
    id: string;
    employeeId: string;
    employeeName: string;
    department: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: RequestStatus;
    currentApprovalLevel: ApprovalLevel;
    dateSubmitted: string;
    requestType: 'leave' | 'manager-leave';
    totalDays?: number;
    managerApproval?: ApprovalInfo;
    adminApproval?: ApprovalInfo;
    approvalHistory?: any[];
}

export interface ManagerLeaveRequest {
    id: string;
    employeeId: string; // Actually managerId in backend
    employeeName: string; // Manager name
    department: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: RequestStatus;
    currentApprovalLevel: ApprovalLevel;
    dateSubmitted: string;
    requestType: 'manager-leave';
    totalDays?: number;
    adminApproval?: ApprovalInfo;
    approvalHistory?: any[];
    isManagerRequest?: boolean;
}

export interface ReimbursementRequest {
    id: string;
    employeeId: string;
    employeeName: string;
    department: string;
    expenseType: string;
    amount: number;
    date: string;
    description: string;
    status: RequestStatus;
    currentApprovalLevel: ApprovalLevel;
    dateSubmitted: string;
    requestType: 'reimbursement';
    receipts?: string[];
    managerApproval?: ApprovalInfo;
    adminApproval?: ApprovalInfo;
    approvalHistory?: any[];
}

export interface HistoryItem {
    id: string;
    date: string;
    time: string;
    status: RequestStatus;
    description: string;
    person?: string;
}

export interface RequestWithHistory {
    request: LeaveRequest | ReimbursementRequest;
    history: HistoryItem[];
}

export type ViewRole = 'employee' | 'manager' | 'all';
export type RequestType = 'leave' | 'reimbursement' | 'manager-leave' | 'all';

export interface FilterOptions {
    role: ViewRole;
    type: RequestType;
    status: RequestStatus | 'all';
    startDate?: string;
    endDate?: string;
    page: number;
    limit: number;
}

export interface PaginationInfo {
    current: number;
    total: number;
    pages: number;
    hasMore: boolean;
} 