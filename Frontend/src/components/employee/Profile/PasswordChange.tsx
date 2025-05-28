import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { updateEmployeePassword } from '../../../services/employeeService';

interface PasswordChangeProps {
  showNotification: (message: string, type?: 'success' | 'error') => void;
}

const PasswordChange: React.FC<PasswordChangeProps> = ({ showNotification }) => {
  const { userEmail } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    width: '0%',
    color: 'bg-gray-300',
    text: ''
  });

  // Handle password input change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setNewPassword(password);
    
    // Calculate password strength
    const strength = calculatePasswordStrength(password);
    setPasswordStrength(strength);
  };

  // Calculate password strength based on complexity
  const calculatePasswordStrength = (password: string) => {
    // This is a simplified password strength calculation
    // In a real application, you'd want a more sophisticated algorithm
    const length = password.length;
    
    if (length === 0) {
      return {
        score: 0,
        width: '0%',
        color: 'bg-gray-300',
        text: ''
      };
    } else if (length < 4) {
      return {
        score: 1,
        width: '25%',
        color: 'bg-red-500',
        text: 'Weak Password'
      };
    } else if (length < 8) {
      return {
        score: 2,
        width: '50%',
        color: 'bg-yellow-500',
        text: 'Medium Password'
      };
    } else if (length < 12) {
      return {
        score: 3,
        width: '75%',
        color: 'bg-green-500',
        text: 'Strong Password'
      };
    } else {
      return {
        score: 4,
        width: '100%',
        color: 'bg-green-500',
        text: 'Very Strong Password'
      };
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userEmail) {
      showNotification('User email not found', 'error');
      return;
    }
    
    // Validate form inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotification('All fields are required', 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showNotification('New passwords do not match', 'error');
      return;
    }
    
    if (passwordStrength.score < 2) {
      showNotification('Password is too weak', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await updateEmployeePassword(userEmail, currentPassword, newPassword);
      showNotification('Password updated successfully', 'success');
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStrength({
        score: 0,
        width: '0%',
        color: 'bg-gray-300',
        text: ''
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      showNotification(
        error.response?.data?.message || 'Failed to update password',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h3>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input 
          type="password" 
          placeholder="Current Password" 
          className="neo-input w-full p-3"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={isLoading}
        />
        <input 
          type="password" 
          placeholder="New Password" 
          className="neo-input w-full p-3"
          value={newPassword}
          onChange={handlePasswordChange}
          disabled={isLoading}
        />
        <input 
          type="password" 
          placeholder="Confirm New Password" 
          className="neo-input w-full p-3"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
        />
        <div className="password-strength">
          <div 
            className={`password-strength-bar ${passwordStrength.color}`} 
            style={{ width: passwordStrength.width }}
          ></div>
        </div>
        <div className="password-strength-text text-gray-600">
          {passwordStrength.text}
        </div>
        <button 
          type="submit" 
          className="neo-button primary w-full p-3 font-semibold"
          disabled={isLoading}
        >
          {isLoading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

export default PasswordChange; 