export interface Manager {
  _id: string;
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
}

export interface ManagerFormData {
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
}

export interface ValidationErrors {
  managerId?: string;
  managerName?: string;
  managerEmail?: string;
  managerPassword?: string;
}