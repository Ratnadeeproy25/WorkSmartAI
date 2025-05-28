import axios from 'axios';
import { API_URL } from '../config/constants';

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

// Get all admins
export const getAllAdmins = async (): Promise<Admin[]> => {
  try {
    const response = await axios.get(`${API_URL}/admins`);
    return response.data as Admin[];
  } catch (error) {
    console.error('Error fetching admins:', error);
    throw error;
  }
};

// Get admin by ID
export const getAdminById = async (id: string): Promise<Admin> => {
  try {
    const response = await axios.get(`${API_URL}/admins/${id}`);
    return response.data as Admin;
  } catch (error) {
    console.error(`Error fetching admin with ID ${id}:`, error);
    throw error;
  }
};

// Create new admin
export const createAdmin = async (adminData: AdminFormData): Promise<Admin> => {
  try {
    const response = await axios.post(`${API_URL}/admins`, adminData);
    return response.data as Admin;
  } catch (error) {
    console.error('Error creating admin:', error);
    throw error;
  }
};

// Update admin
export const updateAdmin = async (id: string, adminData: Partial<AdminFormData>): Promise<Admin> => {
  try {
    const response = await axios.put(`${API_URL}/admins/${id}`, adminData);
    return response.data as Admin;
  } catch (error) {
    console.error(`Error updating admin with ID ${id}:`, error);
    throw error;
  }
};

// Delete admin
export const deleteAdmin = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/admins/${id}`);
  } catch (error) {
    console.error(`Error deleting admin with ID ${id}:`, error);
    throw error;
  }
};

// Toggle admin status
export const toggleAdminStatus = async (id: string): Promise<Admin> => {
  try {
    const response = await axios.patch(`${API_URL}/admins/${id}/toggle-status`);
    return response.data as Admin;
  } catch (error) {
    console.error(`Error toggling admin status with ID ${id}:`, error);
    throw error;
  }
};

// Generate admin ID
export const generateAdminId = async (): Promise<string> => {
  try {
    const response = await axios.get<{ adminId: string }>(`${API_URL}/admins/generate-id`);
    return response.data.adminId;
  } catch (error) {
    console.error('Error generating admin ID:', error);
    throw error;
  }
}; 