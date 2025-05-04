import React, { useState } from 'react';
import '../../styles/login/PasswordReset.css';

interface PasswordResetProps {
  onSuccess: () => void;
  onBack: () => void;
}

const PasswordReset: React.FC<PasswordResetProps> = ({ onSuccess, onBack }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [passwordMatchError, setPasswordMatchError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');

  const checkPasswordStrength = (password: string) => {
    let score = 0;
    let strength = '';

    if (password.length >= 8) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;

    switch(score) {
      case 0:
      case 1:
        strength = 'weak';
        break;
      case 2:
      case 3:
        strength = 'medium';
        break;
      case 4:
        strength = 'strong';
        break;
    }

    setPasswordStrength(strength);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMatchError('');

    if (newPassword !== confirmPassword) {
      setPasswordMatchError('Passwords do not match');
      return;
    }

    // Simulate password reset
    setTimeout(() => {
      onSuccess();
    }, 1000);
  };

  return (
    <div className="neo-morphism p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Reset Password</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              checkPasswordStrength(e.target.value);
            }}
            placeholder="New Password"
            className="neo-input w-full p-4 outline-none"
            required
          />
          <div className={`password-strength strength-${passwordStrength}`}></div>
          <div className="text-sm text-gray-600 mt-2">
            {passwordStrength && `Password strength: ${passwordStrength}`}
          </div>
        </div>
        <div>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            className="neo-input w-full p-4 outline-none"
            required
          />
          {passwordMatchError && (
            <div className="text-red-500 text-sm mt-2">{passwordMatchError}</div>
          )}
        </div>
        <div>
          <select
            value={securityQuestion}
            onChange={(e) => setSecurityQuestion(e.target.value)}
            className="neo-input w-full p-4 outline-none"
            required
          >
            <option value="">Select Security Question</option>
            <option value="1">What was your first pet's name?</option>
            <option value="2">What city were you born in?</option>
            <option value="3">What is your mother's maiden name?</option>
          </select>
        </div>
        <div>
          <input
            type="text"
            value={securityAnswer}
            onChange={(e) => setSecurityAnswer(e.target.value)}
            placeholder="Your Answer"
            className="neo-input w-full p-4 outline-none"
            required
          />
        </div>
        <button type="submit" className="neo-button primary w-full py-3 px-4 text-white font-medium">
          Reset Password
        </button>
        <button type="button" onClick={onBack} className="neo-button w-full py-3 px-4 text-gray-700 font-medium">
          Back to Login
        </button>
      </form>
    </div>
  );
};

export default PasswordReset; 