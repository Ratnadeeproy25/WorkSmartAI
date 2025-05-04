import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: string | null;
  login: (role: string) => void;
  logout: () => void;
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
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const userData = localStorage.getItem('userData');
    if (userData) {
      const { role } = JSON.parse(userData);
      setIsAuthenticated(true);
      setUserRole(role);
    }
  }, []);

  const login = (role: string) => {
    localStorage.setItem('userData', JSON.stringify({ role }));
    setIsAuthenticated(true);
    setUserRole(role);
    
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
  };

  const logout = () => {
    localStorage.removeItem('userData');
    setIsAuthenticated(false);
    setUserRole(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 