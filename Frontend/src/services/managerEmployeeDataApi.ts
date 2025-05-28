import api from './api';

// Types for API responses
export interface Employee {
  _id: string;
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  profilePicture: string;
  phone: string;
  location: string;
}

export interface AttendanceRecord {
  id: string;
  employee: string;
  employeeId: string;
  department: string;
  position: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  workHours: string;
}

export interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  leave: number;
  totalEmployees?: number;
}

export interface LeaveRequest {
  id: string;
  employee: string;
  employeeId: string;
  department: string;
  type: string;
  startDate: string;
  endDate: string;
  dates: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface ReimbursementRequest {
  id: string;
  employee: string;
  employeeId: string;
  department: string;
  type: string;
  amount: number;
  date: string;
  description: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  receipts: any[];
  submittedAt: string;
}

export interface LeaveBalance {
  id: string;
  employee: string;
  employeeId: string;
  department: string;
  position: string;
  annual: number;
  sick: number;
  personal: number;
  totalAnnual: number;
  usedAnnual: number;
  totalSick: number;
  usedSick: number;
  totalPersonal: number;
  usedPersonal: number;
}

export interface WellbeingData {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  position: string;
  profilePicture: string;
  wellbeing: {
    stressLevel: number;
    workLifeBalance: number;
    satisfaction: number;
    teamCollaboration?: number;
    lastCheckIn: string;
    moodHistory?: any[];
    breakHistory?: any[];
    activityHistory?: any[];
    factors?: {
      stressFactors?: any;
      workLifeFactors?: any;
      satisfactionFactors?: any;
      collaborationFactors?: any;
    };
  };
}

export interface WellbeingStats {
  totalEmployees: number;
  goodStatus: number;
  warningStatus: number;
  criticalStatus: number;
}

export interface WellbeingTrends {
  stressTrend: number[];
  workLifeBalanceTrend: number[];
  satisfactionTrend: number[];
  collaborationTrend: number[];
  labels: string[];
}

export interface AttendanceFilters {
  date?: string;
  department?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// API functions
export const managerEmployeeDataApi = {
  // Get assigned employees
  getAssignedEmployees: async (): Promise<{ data: Employee[]; count: number }> => {
    const response = await api.get('/manager/employee-data/employees', { role: 'manager' } as any);
    return response.data;
  },

  // Attendance APIs
  getTeamAttendance: async (filters: AttendanceFilters = {}): Promise<{
    data: AttendanceRecord[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalRecords: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    stats: AttendanceStats;
  }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/manager/employee-data/attendance?${params.toString()}`, { role: 'manager' } as any);
    return response.data;
  },

  getAttendanceOverview: async (date?: string): Promise<{ data: AttendanceStats }> => {
    const params = date ? `?date=${date}` : '';
    const response = await api.get(`/manager/employee-data/attendance/overview${params}`, { role: 'manager' } as any);
    return response.data;
  },

  // Leave APIs
  getPendingLeaveRequests: async (): Promise<{ data: LeaveRequest[] }> => {
    const response = await api.get('/manager/employee-data/leave/pending', { role: 'manager' } as any);
    return response.data;
  },

  updateLeaveRequestStatus: async (requestId: string, status: 'approved' | 'rejected', comments?: string): Promise<{
    message: string;
    data: any;
  }> => {
    const response = await api.put(`/manager/employee-data/leave/${requestId}/status`, {
      status,
      comments
    }, { role: 'manager' } as any);
    return response.data;
  },

  getTeamLeaveBalances: async (): Promise<{ data: LeaveBalance[] }> => {
    const response = await api.get('/manager/employee-data/leave/balances', { role: 'manager' } as any);
    return response.data;
  },

  // Reimbursement APIs
  getPendingReimbursementRequests: async (): Promise<{ data: ReimbursementRequest[] }> => {
    const response = await api.get('/manager/employee-data/reimbursement/pending', { role: 'manager' } as any);
    return response.data;
  },

  updateReimbursementRequestStatus: async (requestId: string, status: 'approved' | 'rejected', rejectionReason?: string): Promise<{
    message: string;
    data: any;
  }> => {
    const response = await api.put(`/manager/employee-data/reimbursement/${requestId}/status`, {
      status,
      rejectionReason
    }, { role: 'manager' } as any);
    return response.data;
  },

  // Wellbeing APIs
  getTeamWellbeingData: async (): Promise<{
    data: WellbeingData[];
    stats: WellbeingStats;
  }> => {
    const response = await api.get('/manager/employee-data/wellbeing', { role: 'manager' } as any);
    return response.data;
  },

  getTeamWellbeingTrends: async (): Promise<{
    data: WellbeingTrends;
  }> => {
    const response = await api.get('/manager/employee-data/wellbeing/trends', { role: 'manager' } as any);
    return response.data;
  }
};

export default managerEmployeeDataApi; 