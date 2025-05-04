import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/login/StandardLogin.css';

interface StandardLoginProps {
  onSuccess: () => void;
  onToggleForm: () => void;
  onShowReset: () => void;
  onBack: () => void;
}

const StandardLogin: React.FC<StandardLoginProps> = ({
  onSuccess,
  onToggleForm,
  onShowReset,
  onBack
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setEmailError('');
    setPasswordError('');

    // Simulate API call
    setTimeout(() => {
      if (email && password) {
        // Redirect to Employee Dashboard after successful login
        navigate('/employee/dashboard');
        onSuccess();
      } else {
        setEmailError('Please enter email and password');
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
          {emailError && <div className="text-red-500 text-sm mt-2">{emailError}</div>}
        </div>
        <div className="relative">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 bottom-3 text-gray-500 hover:text-gray-700"
          >
            <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
          </button>
          {passwordError && <div className="text-red-500 text-sm mt-2">{passwordError}</div>}
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
          disabled={isLoading}
        >
          {!isLoading && <span>Login</span>}
          {isLoading && <i className="bi bi-arrow-repeat animate-spin"></i>}
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