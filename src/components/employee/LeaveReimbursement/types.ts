export type LeaveType = 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'bereavement';
export type DurationType = 'half-day' | 'full-day' | 'multiple-days';
export type LeaveStatus = 'approved' | 'pending' | 'rejected';

export interface LeaveRequest {
  id: string;
  type: LeaveType;
  duration: DurationType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
}

export interface LeaveBalance {
  type: string;
  used: number;
  total: number;
  remaining: number;
  color: string;
}

export type ExpenseType = 'travel' | 'meals' | 'office-supplies' | 'training' | 'other';
export type ExpenseStatus = 'approved' | 'pending' | 'rejected';

export interface ReceiptInfo {
  name: string;
  size: number;
  type: string;
}

export interface ReimbursementRequest {
  id: string;
  type: ExpenseType;
  amount: number;
  date: string;
  description: string;
  receipts: ReceiptInfo[];
  status: ExpenseStatus;
  createdAt: string;
}

export interface ReimbursementSummary {
  totalSubmitted: number;
  totalApproved: number;
  totalPending: number;
} 