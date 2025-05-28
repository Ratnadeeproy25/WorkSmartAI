import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

// Helper function to check if a specific role session exists and is valid
const hasValidSessionForRole = (role: string): boolean => {
  let sessionKey: string;
  
  switch (role) {
    case 'admin':
      sessionKey = 'adminUserData';
      break;
    case 'manager':
      sessionKey = 'managerUserData';
      break;
    case 'employee':
      sessionKey = 'employeeUserData';
      break;
    default:
      return false;
  }
  
  const sessionData = localStorage.getItem(sessionKey);
  if (!sessionData) return false;
  
  try {
    const userData = JSON.parse(sessionData);
    return !!(userData && userData.token && userData.email);
  } catch (error) {
    // Invalid session data, remove it
    localStorage.removeItem(sessionKey);
    return false;
  }
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, userRole, isLoading } = useAuth();

  // Show loading indicator while authentication is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e6eaf0]">
        <div className="text-center">
          <i className="bi bi-arrow-repeat animate-spin text-3xl text-indigo-600"></i>
          <p className="mt-2 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If a specific role is required, check if there's a valid session for that role
  if (requiredRole) {
    const hasRequiredSession = hasValidSessionForRole(requiredRole);
    
    // If no valid session for the required role, redirect to login
    if (!hasRequiredSession) {
      return <Navigate to="/" replace />;
    }
    
    // If AuthContext recognizes the user and role matches, proceed
    if (isAuthenticated && userRole === requiredRole) {
      return <>{children}</>;
    }
    
    // If AuthContext doesn't recognize the user but we have a valid session for the required role,
    // this can happen when there are multiple sessions and AuthContext picked a different one.
    // In this case, we'll allow access since the specific role session exists.
    if (hasRequiredSession) {
      return <>{children}</>;
    }
    
    // If neither condition is met, redirect to login
    return <Navigate to="/" replace />;
  }

  // If no specific role required, just check general authentication
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute; 