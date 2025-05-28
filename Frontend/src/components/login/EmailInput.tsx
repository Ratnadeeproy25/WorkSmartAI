import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/login/EmailInput.css';

interface EmailInputProps {
  onSubmit: (email: string) => void;
  onBack: () => void;
  onSwitchToPassword: () => void;
  selectedRole: string | null;
}

const EmailInput: React.FC<EmailInputProps> = ({ 
  onSubmit, 
  onBack, 
  onSwitchToPassword,
  selectedRole 
}) => {
  const { verifyEmail, isLoading, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    if (!email) {
      setError('Email is required');
      return;
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!selectedRole) {
      setError('No role selected. Please go back and select a role.');
      return;
    }
    
    setIsVerifying(true);
    
    try {
      // Verify if email exists in the system
      const response = await verifyEmail(email, selectedRole);
      
      if (response.success) {
        onSubmit(email);
      } else {
        setError(response.message || 'Email not found in our system');
      }
    } catch (err) {
      setError('An error occurred while verifying your email');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="neo-morphism p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Enter Your Email</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            className="neo-input w-full px-4 py-3 rounded-lg"
            placeholder="your.email@company.com"
          />
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>

        <div className="flex flex-col space-y-3">
          <button
            type="submit"
            className="neo-button primary full-width"
            disabled={isVerifying || isLoading}
          >
            {(isVerifying || isLoading) ? (
              <><i className="bi bi-arrow-repeat animate-spin"></i> Verifying...</>
            ) : (
              <>Continue to QR Code</>
            )}
          </button>
          
          <button
            type="button"
            onClick={onSwitchToPassword}
            className="neo-button secondary full-width"
          >
            Switch to Password Login
          </button>
          
          <button
            type="button"
            onClick={onBack}
            className="neo-button secondary full-width"
          >
            <i className="bi bi-arrow-left"></i>
            <span>Back to Role Selection</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmailInput; 