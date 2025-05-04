export interface Manager {
  id: string;
  name: string;
  department: string;
  position: string;
  status: 'Active' | 'Inactive';
}

export interface ManagerFormData {
  id: string;
  name: string;
  department: string;
  position: string;
}

export interface ValidationErrors {
  managerId?: string;
  managerName?: string;
} 