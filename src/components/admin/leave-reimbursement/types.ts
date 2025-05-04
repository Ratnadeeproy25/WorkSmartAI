export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface Employee {
    id: string;
    name: string;
    department: string;
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
    dateSubmitted: string;
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
    dateSubmitted: string;
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

export type ViewRole = 'employee' | 'manager';
export type RequestType = 'leave' | 'reimbursement'; 