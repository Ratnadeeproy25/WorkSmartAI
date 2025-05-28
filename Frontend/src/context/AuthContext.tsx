import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: string | null;
  userEmail: string | null;
  userName: string | null;
  userId: string | null;
  token: string | null;
  userEmployee: { id?: string } | null;
  login: (role: string, email: string, password: string) => Promise<boolean>;
  loginWithQr: (role: string, email: string, qrOtp: string) => Promise<boolean>;
  verifyEmail: (email: string, role: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userEmployee, setUserEmployee] = useState<{ id?: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in (admin, manager, or employee)
    const adminData = localStorage.getItem('adminUserData');
    const managerData = localStorage.getItem('managerUserData');
    const employeeData = localStorage.getItem('employeeUserData');
    let user = null;
    let role = null;
    
    if (adminData) {
      try {
        user = JSON.parse(adminData);
        role = 'admin';
      } catch (err) {
        localStorage.removeItem('adminUserData');
      }
    } else if (managerData) {
      try {
        user = JSON.parse(managerData);
        role = 'manager';
      } catch (err) {
        localStorage.removeItem('managerUserData');
      }
    } else if (employeeData) {
      try {
        user = JSON.parse(employeeData);
        role = 'employee';
      } catch (err) {
        localStorage.removeItem('employeeUserData');
      }
    }
    
    if (user && role) {
      setIsAuthenticated(true);
      setUserRole(role);
      setUserEmail(user.email);
      setUserName(user.name);
      setToken(user.token);
      setUserId(user.id);
      if (role === 'employee') {
        setUserEmployee({ id: user.id });
      }
    }
  }, []);

  const login = async (role: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(email, password, role);
      if (response.success && response.data) {
        const userData = {
          id: response.data.id,
          role,
          email,
          name: response.data.name,
          token: response.data.token
        };
        if (role === 'manager') {
          localStorage.setItem('managerUserData', JSON.stringify(userData));
        } else if (role === 'employee') {
          localStorage.setItem('employeeUserData', JSON.stringify(userData));
        } else if (role === 'admin') {
          localStorage.setItem('adminUserData', JSON.stringify(userData));
        }
        setIsAuthenticated(true);
        setUserRole(role);
        setUserEmail(email);
        setUserName(response.data.name);
        setToken(response.data.token);
        setUserId(response.data.id);
        if (role === 'employee') {
          setUserEmployee({ id: response.data.id });
        }
        // Navigate based on role
        switch (role) {
          case 'employee':
            navigate('/employee/dashboard');
            break;
          case 'manager':
            navigate('/manager/dashboard');
            break;
          case 'admin':
            navigate('/admin/dashboard');
            break;
          default:
            navigate('/');
        }
        setIsLoading(false);
        return true;
      } else {
        setError(response.message || 'Login failed');
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
      return false;
    }
  };

  const loginWithQr = async (role: string, email: string, qrOtp: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.loginWithQr(email, qrOtp, role);
      if (response.success && response.data) {
        const userData = {
          id: response.data.id,
          role,
          email,
          name: response.data.name,
          token: response.data.token
        };
        if (role === 'manager') {
          localStorage.setItem('managerUserData', JSON.stringify(userData));
        } else if (role === 'employee') {
          localStorage.setItem('employeeUserData', JSON.stringify(userData));
        } else if (role === 'admin') {
          localStorage.setItem('adminUserData', JSON.stringify(userData));
        }
        setIsAuthenticated(true);
        setUserRole(role);
        setUserEmail(email);
        setUserName(response.data.name);
        setToken(response.data.token);
        setUserId(response.data.id);
        if (role === 'employee') {
          setUserEmployee({ id: response.data.id });
        }
        // Navigate based on role
        switch (role) {
          case 'employee':
            navigate('/employee/dashboard');
            break;
          case 'manager':
            navigate('/manager/dashboard');
            break;
          case 'admin':
            navigate('/admin/dashboard');
            break;
          default:
            navigate('/');
        }
        setIsLoading(false);
        return true;
      } else {
        setError(response.message || 'QR login failed');
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
      return false;
    }
  };

  const verifyEmail = async (email: string, role: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.verifyEmail(email, role);
      setIsLoading(false);
      return response;
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
      return { success: false, message: 'Email verification failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminUserData');
    localStorage.removeItem('managerUserData');
    localStorage.removeItem('employeeUserData');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('managerToken');
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('userData'); // legacy
    setIsAuthenticated(false);
    setUserRole(null);
    setUserEmail(null);
    setUserName(null);
    setToken(null);
    setUserId(null);
    setUserEmployee(null);
    navigate('/');
  };

  const value = {
    isAuthenticated,
    userRole,
    userEmail,
    userName,
    userId,
    token,
    userEmployee,
    login,
    loginWithQr,
    verifyEmail,
    logout,
    isLoading,
    error
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export default AuthContext; 