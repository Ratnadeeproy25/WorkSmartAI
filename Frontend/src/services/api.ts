import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { getAuthHeaders, getManagerAuthHeaders, getEmployeeAuthHeaders, getAdminAuthHeaders } from './authService';

// Request queue to limit concurrent requests
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private activeRequests = 0;
  private maxConcurrentRequests = 3; // Limit to 3 concurrent requests
  private requestDelay = 100; // 100ms delay between requests

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          this.activeRequests++;
          
          // Add delay to prevent overwhelming the server
          if (this.activeRequests > 1) {
            await new Promise(r => setTimeout(r, this.requestDelay));
          }
          
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;
          this.processQueue();
        }
      });
      
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.activeRequests < this.maxConcurrentRequests && this.queue.length > 0) {
      const nextRequest = this.queue.shift();
      if (nextRequest) {
        nextRequest();
      }
    }
  }
}

const requestQueue = new RequestQueue();

// Create an axios instance with base URL and default headers
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 second timeout
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

    // Add authentication token
    const token = localStorage.getItem('employeeToken') || localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // console.error('Request interceptor error:', error);
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
      // console.error('Request timeout - server took too long to respond');
      return Promise.reject({
        status: 408,
        message: 'Request timeout - server took too long to respond'
      });
    }
    
    // Handle CORS errors
    if (error.message && error.message.includes('Network Error')) {
      // console.error('Network Error - Possible CORS issue or server unavailable');
      return Promise.reject({
        status: 0,
        message: 'Network Error - Unable to connect to server. Please check your connection.'
      });
    }
    
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('employeeToken');
      localStorage.removeItem('employeeUserData');
      localStorage.removeItem('authToken');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/employee/login';
      }
    } else if (error.response && error.response.status === 429) {
      // Rate limit exceeded
      // console.warn('Rate limit exceeded, requests are being throttled');
    }
    
    // Handle permission errors (403 Forbidden)
    if (error.response && error.response.status === 403) {
      // console.error('Permission error:', error.response.data.message || 'You do not have permission to access this resource');
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

// Wrapper methods that use the request queue
const queuedApi = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return requestQueue.add(() => api.get<T>(url, config));
  },
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return requestQueue.add(() => api.post<T>(url, data, config));
  },
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return requestQueue.add(() => api.put<T>(url, data, config));
  },
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return requestQueue.add(() => api.delete<T>(url, config));
  },
  
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return requestQueue.add(() => api.patch<T>(url, data, config));
  }
};

export default queuedApi; 