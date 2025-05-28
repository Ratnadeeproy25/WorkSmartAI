import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { updateManagerPassword } from '../../../services/managerService';

const SecuritySettings: React.FC = () => {
  const { userEmail } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = useState({
    width: '0%',
    className: '',
    text: ''
  });

  // Handle password strength
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPasswordValue = e.target.value;
    setNewPassword(newPasswordValue);
    
    // Calculate password strength
    let strength = 0;
    if (newPasswordValue.length >= 8) strength += 1;
    if (/[A-Z]/.test(newPasswordValue)) strength += 1;
    if (/[a-z]/.test(newPasswordValue)) strength += 1;
    if (/[0-9]/.test(newPasswordValue)) strength += 1;
    if (/[^A-Za-z0-9]/.test(newPasswordValue)) strength += 1;
    
    let width = '0%';
    let className = '';
    let text = '';
    
    switch (strength) {
      case 0:
      case 1:
        width = '20%';
        className = 'password-strength-bar bg-red-500';
        text = 'Very Weak Password';
        break;
      case 2:
        width = '40%';
        className = 'password-strength-bar bg-orange-500';
        text = 'Weak Password';
        break;
      case 3:
        width = '60%';
        className = 'password-strength-bar bg-yellow-500';
        text = 'Medium Password';
        break;
      case 4:
        width = '80%';
        className = 'password-strength-bar bg-green-500';
        text = 'Strong Password';
        break;
      case 5:
        width = '100%';
        className = 'password-strength-bar bg-green-500';
        text = 'Very Strong Password';
        break;
    }
    
    setPasswordStrength({ width, className, text });
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error and success messages
    setError(null);
    setSuccess(null);
    
    if (!userEmail) {
      setError('You must be logged in to change your password');
      return;
    }
    
    if (!currentPassword) {
      setError('Current password is required');
      return;
    }
    
    if (!newPassword) {
      setError('New password is required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    // Validate password strength
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await updateManagerPassword(userEmail, currentPassword, newPassword);
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStrength({ width: '0%', className: '', text: '' });
      
      setSuccess('Password updated successfully');
    } catch (error: any) {
      console.error('Error updating password:', error);
      
      // Handle specific error messages from backend
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to update password. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="neo-box p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-8">Security Settings</h2>

      {/* Change Password Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h3>
        
        {success && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <p>{success}</p>
          </div>
        )}
        
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handlePasswordSubmit}>
          <input 
            type="password" 
            placeholder="Current Password" 
            className="neo-input w-full p-3"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isSubmitting}
          />
          <input 
            type="password" 
            placeholder="New Password" 
            className="neo-input w-full p-3"
            value={newPassword}
            onChange={handlePasswordChange}
            disabled={isSubmitting}
          />
          <input 
            type="password" 
            placeholder="Confirm New Password" 
            className="neo-input w-full p-3"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSubmitting}
          />
          <div className="password-strength">
            <div className={passwordStrength.className} style={{ width: passwordStrength.width }}></div>
          </div>
          <div className="password-strength-text text-gray-600">{passwordStrength.text}</div>
          <button 
            type="submit" 
            className="neo-button primary w-full p-3 font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <span className="mr-2">Updating...</span>
                <span className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></span>
              </span>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SecuritySettings; 