import api from './api';
import axios from 'axios';

// Define interfaces
interface AuthResponse {
  success: boolean;
  data?: {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
    position?: string;
    token: string;
  };
  message?: string;
}

interface EmailVerifyResponse {
  success: boolean;
  message?: string;
}

// Role-specific token and user data keys
const MANAGER_TOKEN_KEY = 'managerToken';
const EMPLOYEE_TOKEN_KEY = 'employeeToken';
const MANAGER_USER_KEY = 'managerUserData';
const EMPLOYEE_USER_KEY = 'employeeUserData';
const ADMIN_TOKEN_KEY = 'adminToken';
const ADMIN_USER_KEY = 'adminUserData';

// Standard login with email and password
export const login = async (email: string, password: string, role: string): Promise<AuthResponse> => {
  try {
    // TODO: Use proper AxiosResponse<AuthResponse> type if available
    const response: any = await api.post('/auth/login', { email, password, role });
    if (response.data && response.data.success && response.data.data) {
      const userData = response.data.data;
      if (role === 'manager') {
        localStorage.setItem(MANAGER_USER_KEY, JSON.stringify(userData));
        localStorage.setItem(MANAGER_TOKEN_KEY, userData.token);
      } else if (role === 'employee') {
        localStorage.setItem(EMPLOYEE_USER_KEY, JSON.stringify(userData));
        localStorage.setItem(EMPLOYEE_TOKEN_KEY, userData.token);
      } else if (role === 'admin') {
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(userData));
        localStorage.setItem(ADMIN_TOKEN_KEY, userData.token);
      }
    }
    return response.data;
  } catch (error: any) {
    if (error.response) {
      return error.response.data as AuthResponse;
    }
    return {
      success: false,
      message: 'Network error occurred. Please try again.'
    };
  }
};

// QR code based login
export const loginWithQr = async (email: string, qrOtp: string, role: string): Promise<AuthResponse> => {
  try {
    const response = await api.post('/api/auth/login-qr', { email, qrOtp, role });
    return response.data as AuthResponse;
  } catch (error: any) {
    if (error.response) {
      return error.response.data as AuthResponse;
    }
    return {
      success: false,
      message: 'Network error occurred. Please try again.'
    };
  }
};

// Verify if email exists before proceeding to login
export const verifyEmail = async (email: string, role: string): Promise<EmailVerifyResponse> => {
  try {
    const response = await api.post('/api/auth/verify-email', { email, role });
    return response.data as EmailVerifyResponse;
  } catch (error: any) {
    if (error.response) {
      return error.response.data as EmailVerifyResponse;
    }
    return {
      success: false,
      message: 'Network error occurred. Please try again.'
    };
  }
};

// Get the currently logged in user
export const getCurrentUser = async (token: string): Promise<AuthResponse> => {
  try {
    const response = await api.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data as AuthResponse;
  } catch (error: any) {
    if (error.response) {
      return error.response.data as AuthResponse;
    }
    return {
      success: false,
      message: 'Authentication failed. Please login again.'
    };
  }
};

// Get manager token
export const getManagerToken = (): string | null => {
  const userData = localStorage.getItem(MANAGER_USER_KEY);
  if (userData) {
    try {
      const user = JSON.parse(userData);
      return user.token || null;
    } catch (err) {
      return null;
    }
  }
  return null;
};

// Get employee token
export const getEmployeeToken = (): string | null => {
  const userData = localStorage.getItem(EMPLOYEE_USER_KEY);
  if (userData) {
    try {
      const user = JSON.parse(userData);
      return user.token || null;
    } catch (err) {
      return null;
    }
  }
  return null;
};

// Get admin token
export const getAdminToken = (): string | null => {
  const userData = localStorage.getItem(ADMIN_USER_KEY);
  if (userData) {
    try {
      const user = JSON.parse(userData);
      return user.token || null;
    } catch (err) {
      return null;
    }
  }
  return null;
};

// Get manager auth headers
export const getManagerAuthHeaders = () => {
  const token = getManagerToken();
  return token
    ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
};

// Get employee auth headers
export const getEmployeeAuthHeaders = () => {
  const token = getEmployeeToken();
  return token
    ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
};

// Get admin auth headers
export const getAdminAuthHeaders = () => {
  const token = getAdminToken();
  return token
    ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
};

// DEPRECATED: Use getManagerToken/getEmployeeToken instead
export const getToken = (): string | null => {
  // Try manager, then employee
  return getManagerToken() || getEmployeeToken();
};

// DEPRECATED: Use getManagerAuthHeaders/getEmployeeAuthHeaders instead
export const getAuthHeaders = () => {
  // Try manager, then employee
  const token = getToken();
  return token
    ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
};

// Let's check if the file exists first
// If the file already has a getAuthHeaders function, we'll just fix typescript errors
// If it doesn't, we'll add the function

const API_URL = 'http://localhost:5000/api/auth';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

// Generic API response interface for type safety
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// User data interface
interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  token: string;
}

// Login function
export const loginWithCredentials = async (credentials: LoginCredentials) => {
  try {
    const response = await axios.post<ApiResponse<UserData>>(`${API_URL}/login`, credentials);
    
    if (response.data.success) {
      // Store user data in localStorage
      localStorage.setItem('userData', JSON.stringify({
        id: response.data.data.id,
        name: response.data.data.name,
        email: response.data.data.email,
        role: response.data.data.role,
        token: response.data.data.token
      }));
    }
    
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Login failed' };
  }
};

// Register function
export const register = async (data: RegisterData) => {
  try {
    const response = await axios.post<ApiResponse<UserData>>(`${API_URL}/register`, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Registration failed' };
  }
};

// Logout function
export const logout = () => {
  localStorage.removeItem(MANAGER_USER_KEY);
  localStorage.removeItem(EMPLOYEE_USER_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
  localStorage.removeItem(MANAGER_TOKEN_KEY);
  localStorage.removeItem(EMPLOYEE_TOKEN_KEY);
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem('userData'); // legacy
};

// Check if user is logged in
export const isLoggedIn = (): boolean => {
  const userData = localStorage.getItem('userData');
  return userData !== null;
};

// Get logged in user
export const getUser = () => {
  const userData = localStorage.getItem('userData');
  if (userData) {
    return JSON.parse(userData);
  }
  return null;
};

// Check if user has specific role
export const hasRole = (role: string): boolean => {
  const userData = localStorage.getItem('userData');
  if (userData) {
    const user = JSON.parse(userData);
    return user.role === role;
  }
  return false;
}