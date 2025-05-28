export interface Admin {
  id: string;
  name: string;
  email: string;
  password: string;
  accessLevel: 'Full' | 'Limited';
  status: 'Active' | 'Inactive';
}

export interface AdminFormData {
  id: string;
  name: string;
  email: string;
  password: string;
  accessLevel: 'Full' | 'Limited';
}

export interface ValidationErrors {
  adminId?: string;
  adminName?: string;
  adminEmail?: string;
  adminPassword?: string;
} 