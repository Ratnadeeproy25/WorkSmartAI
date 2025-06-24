export interface Employee {
  id: string;
  name: string;
  email: string;
  password: string;
  department: string;
  position: string;
  status: 'Active' | 'Inactive';
  shiftTime?: {
    start: string;
    end: string;
  };
  officeLocation?: {
    lat: number;
    lng: number;
    address?: {
      city: string;
      state: string;
      country: string;
    };
  };
  manager?: string;
}

export interface EmployeeFormData {
  id: string;
  name: string;
  email: string;
  password: string;
  department: string;
  position: string;
  shiftTime: {
    start: string;
    end: string;
  };
  officeLocation: {
    lat: number;
    lng: number;
    address: {
      city: string;
      state: string;
      country: string;
    };
  };
  manager?: string;
}

export interface ValidationErrors {
  employeeId?: string;
  employeeName?: string;
  employeeEmail?: string;
  employeePassword?: string;
} 