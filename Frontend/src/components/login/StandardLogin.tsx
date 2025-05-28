import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/login/StandardLogin.css';

interface StandardLoginProps {
  onSuccess: (email: string) => void;
  onToggleForm: () => void;
  onShowReset: () => void;
  onBack: () => void;
}

const StandardLogin: React.FC<StandardLoginProps> = ({
  onSuccess,
  onToggleForm,
  onShowReset,
  onBack,
}) => {
  const { login, isLoading: authLoading, error: authError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'employee' // Default role, should be passed from parent
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.email) {
      setError('Email is required');
      return;
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!formData.password) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);
    
    try {
      // Use the actual login function from auth context
      const success = await login(formData.role, formData.email, formData.password);
      
      if (success) {
        onSuccess(formData.email);
      } else {
        setError(authError || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="neo-morphism p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Password Login</h2>
      {error && <div className="neo-error-box mb-6">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            className="neo-input w-full px-4 py-3 rounded-lg"
            placeholder="your.email@company.com"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              className="neo-input w-full px-4 py-3 rounded-lg"
            />
            <button 
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <i className="bi bi-eye-slash text-gray-600"></i>
              ) : (
                <i className="bi bi-eye text-gray-600"></i>
              )}
            </button>
          </div>
        </div>
        
        <div className="flex items-center">
          <input 
            type="checkbox" 
            id="remember" 
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" 
          />
          <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">Remember me</label>
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={isLoading || authLoading}
        >
          {!isLoading && !authLoading && <span>Login</span>}
          {(isLoading || authLoading) && <i className="bi bi-arrow-repeat animate-spin"></i>}
        </button>
        <div className="text-center">
          <button
            type="button"
            onClick={onShowReset}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Forgot Password?
          </button>
        </div>
        <div className="flex flex-col space-y-3">
          <button
            type="button"
            onClick={onToggleForm}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Switch to QR Login
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <i className="bi bi-arrow-left mr-2"></i>
            <span>Back to Role Selection</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default StandardLogin; 