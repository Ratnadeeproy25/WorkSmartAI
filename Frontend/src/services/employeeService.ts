import api from './api';
import { Employee, EmployeeFormData } from '../components/admin/employee-management/types';
import { UserProfile } from '../components/employee/Profile/types';

// Define interface for API responses
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Get all employees
export const getAllEmployees = async (): Promise<Employee[]> => {
  try {
    const response = await api.get<ApiResponse<Employee[]>>('/employees');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};

// Get employee profile by email
export const getEmployeeProfile = async (email: string): Promise<UserProfile> => {
  try {
    const response = await api.get<ApiResponse<UserProfile>>(`/employees/profile?email=${encodeURIComponent(email)}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching employee profile:', error);
    throw error;
  }
};

// Create new employee
export const createEmployee = async (employeeData: EmployeeFormData): Promise<Employee> => {
  try {
    const response = await api.post<ApiResponse<Employee>>('/employees', {
      ...employeeData,
      status: 'Active',
      ...(employeeData.manager ? { manager: employeeData.manager } : {})
    });
    return response.data.data;
  } catch (error) {
    console.error('Error creating employee:', error);
    throw error;
  }
};

// Update employee
export const updateEmployee = async (id: string, employeeData: EmployeeFormData): Promise<Employee> => {
  try {
    const response = await api.put<ApiResponse<Employee>>(`/employees/${id}`, {
      ...employeeData,
      ...(employeeData.manager ? { manager: employeeData.manager } : {})
    });
    return response.data.data;
  } catch (error) {
    console.error(`Error updating employee with ID ${id}:`, error);
    throw error;
  }
};

// Delete employee
export const deleteEmployee = async (id: string): Promise<void> => {
  try {
    await api.delete<ApiResponse<{}>>(`/employees/${id}`);
  } catch (error) {
    console.error(`Error deleting employee with ID ${id}:`, error);
    throw error;
  }
};

// Toggle employee status
export const toggleEmployeeStatus = async (id: string): Promise<Employee> => {
  try {
    const response = await api.patch<ApiResponse<Employee>>(`/employees/${id}/toggle-status`);
    return response.data.data;
  } catch (error) {
    console.error(`Error toggling status for employee with ID ${id}:`, error);
    throw error;
  }
};

// Set employee shift time
export const setEmployeeShiftTime = async (id: string, startTime: string, endTime: string): Promise<Employee> => {
  try {
    const response = await api.patch<ApiResponse<Employee>>(`/employees/${id}/shift-time`, {
      startTime,
      endTime
    });
    return response.data.data;
  } catch (error) {
    console.error(`Error setting shift time for employee with ID ${id}:`, error);
    throw error;
  }
};

// Set employee work location
export const setEmployeeWorkLocation = async (
  id: string, 
  address: string, 
  city: string = '', 
  country: string = '', 
  postalCode: string = ''
): Promise<Employee> => {
  try {
    const response = await api.patch<ApiResponse<Employee>>(`/employees/${id}/work-location`, {
      address,
      city,
      country,
      postalCode
    });
    return response.data.data;
  } catch (error) {
    console.error(`Error setting work location for employee with ID ${id}:`, error);
    throw error;
  }
};

// Get all departments
export const getAllDepartments = async (): Promise<string[]> => {
  try {
    const response = await api.get<ApiResponse<string[]>>('/employees/departments');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
};

// Get all departments from both employees and managers
export const getAllCombinedDepartments = async (): Promise<string[]> => {
  try {
    // Import manager service here to avoid circular dependency
    const { getAllDepartments: getManagerDepartments } = await import('./managerService');
    
    // Fetch departments from both sources
    const [employeeDepartments, managerDepartments] = await Promise.allSettled([
      getAllDepartments(),
      getManagerDepartments()
    ]);

    // Combine departments and remove duplicates
    const allDepartments = new Set<string>();
    
    if (employeeDepartments.status === 'fulfilled') {
      employeeDepartments.value.forEach(dept => allDepartments.add(dept));
    }
    
    if (managerDepartments.status === 'fulfilled') {
      managerDepartments.value.forEach(dept => allDepartments.add(dept));
    }

    // Convert to array and sort
    return Array.from(allDepartments).sort();
  } catch (error) {
    console.error('Error fetching combined departments:', error);
    throw error;
  }
};

// Generate new employee ID
export const generateEmployeeId = async (): Promise<string> => {
  try {
    const response = await api.get<ApiResponse<{id: string}>>('/employees/generate-id');
    return response.data.data.id;
  } catch (error) {
    console.error('Error generating employee ID:', error);
    throw error;
  }
};

// Update employee contact information
export const updateEmployeeContactInfo = async (email: string, phone: string, location: string): Promise<{contactInfo: {email: string, phone: string, location: string}}> => {
  try {
    const response = await api.patch<ApiResponse<{contactInfo: {email: string, phone: string, location: string}}>>(
      `/employees/profile/${encodeURIComponent(email)}/contact`,
      { phone, location }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error updating employee contact info:', error);
    throw error;
  }
};

// Update employee password
export const updateEmployeePassword = async (email: string, currentPassword: string, newPassword: string): Promise<void> => {
  try {
    await api.patch<ApiResponse<void>>(
      `/employees/profile/${encodeURIComponent(email)}/password`,
      { currentPassword, newPassword }
    );
  } catch (error) {
    console.error('Error updating employee password:', error);
    throw error;
  }
};

// Update employee profile picture
export const updateEmployeeProfilePicture = async (email: string, profilePicture: string): Promise<{profilePicture: string}> => {
  try {
    const response = await api.patch<ApiResponse<{profilePicture: string}>>(
      `/employees/profile/${encodeURIComponent(email)}/picture`,
      { profilePicture }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error updating employee profile picture:', error);
    throw error;
  }
}; 