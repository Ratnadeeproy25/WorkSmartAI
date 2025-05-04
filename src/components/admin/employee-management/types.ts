export interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  status: 'Active' | 'Inactive';
}

export interface EmployeeFormData {
  id: string;
  name: string;
  department: string;
  position: string;
}

export interface ValidationErrors {
  employeeId?: string;
  employeeName?: string;
} 