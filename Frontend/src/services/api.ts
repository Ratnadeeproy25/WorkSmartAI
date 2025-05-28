import axios from 'axios';
import { getAuthHeaders, getManagerAuthHeaders, getEmployeeAuthHeaders, getAdminAuthHeaders } from './authService';

// Create an axios instance with base URL and default headers
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // 15 seconds default timeout
  withCredentials: true, // Important for CORS with credentials
});

// Helper function to determine current user's role from localStorage
const getCurrentUserRole = (): string => {
  // Check in the same priority order as AuthContext
  const adminData = localStorage.getItem('adminUserData');
  const managerData = localStorage.getItem('managerUserData');
  const employeeData = localStorage.getItem('employeeUserData');
  
  if (adminData) {
    try {
      JSON.parse(adminData); // Validate it's valid JSON
      return 'admin';
    } catch (err) {
      localStorage.removeItem('adminUserData');
    }
  }
  
  if (managerData) {
    try {
      JSON.parse(managerData); // Validate it's valid JSON
      return 'manager';
    } catch (err) {
      localStorage.removeItem('managerUserData');
    }
  }
  
  if (employeeData) {
    try {
      JSON.parse(employeeData); // Validate it's valid JSON
      return 'employee';
    } catch (err) {
      localStorage.removeItem('employeeUserData');
    }
  }
  
  // Default to employee if no valid session found
  return 'employee';
};

// Helper function to determine role based on current browser path
const getRoleFromCurrentPath = (): string | undefined => {
  const currentPath = window.location.pathname;
  
  if (currentPath.startsWith('/admin/')) {
    return 'admin';
  } else if (currentPath.startsWith('/manager/')) {
    return 'manager';
  } else if (currentPath.startsWith('/employee/')) {
    return 'employee';
  }
  
  return undefined; // No role determined from path
};

// Add request interceptor to include auth token on every request
api.interceptors.request.use(
  (config) => {
    // Determine role from config (custom property) or URL
    let role: string | undefined = (config as any).role;
    
    // If no role specified in config, try to determine from API URL
    if (!role && config.url) {
      if (config.url.startsWith('/manager/')) role = 'manager';
      else if (config.url.startsWith('/employee/')) role = 'employee';
      else if (config.url.startsWith('/admin/')) role = 'admin';
      else if (config.url.startsWith('/attendance/all')) role = 'admin';
    }
    
    // If role is still not determined from URL, try to determine from current browser path
    if (!role) {
      role = getRoleFromCurrentPath();
    }
    
    // If role is still not determined from path, use current user's role from localStorage
    if (!role) {
      role = getCurrentUserRole();
    }
    
    // Add authorization headers from authService based on determined role
    let headers;
    if (role === 'admin') headers = getAdminAuthHeaders();
    else if (role === 'manager') headers = getManagerAuthHeaders();
    else headers = getEmployeeAuthHeaders();
    
    if (headers.Authorization && config.headers) {
      config.headers.Authorization = headers.Authorization;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common error scenarios
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - server took too long to respond');
      return Promise.reject({
        status: 408,
        message: 'Request timeout - server took too long to respond'
      });
    }
    
    // Handle CORS errors
    if (error.message && error.message.includes('Network Error')) {
      console.error('Network Error - Possible CORS issue or server unavailable');
      return Promise.reject({
        status: 0,
        message: 'Network Error - Unable to connect to server. Please check your connection.'
      });
    }
    
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // Optional: Redirect to login or clear token
      // window.location.href = '/login';
      // localStorage.removeItem('userData');
      console.error('Authentication error:', error.response.data.message || 'Authentication failed');
    }
    
    // Handle permission errors (403 Forbidden)
    if (error.response && error.response.status === 403) {
      console.error('Permission error:', error.response.data.message || 'You do not have permission to access this resource');
      return Promise.reject({
        status: 403,
        message: error.response.data.message || 'Access denied. You do not have permission to access this resource.',
        isPermissionError: true
      });
    }
    
    // Format the error for easier handling
    const formattedError = {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    };
    
    return Promise.reject(formattedError);
  }
);

export default api; 