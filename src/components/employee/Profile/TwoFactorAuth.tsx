import React, { useState } from 'react';

interface TwoFactorAuthProps {
  showNotification: (message: string, type?: 'success' | 'error') => void;
}

const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({ showNotification }) => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [verificationCode, setVerificationCode] = useState('');

  // Toggle 2FA
  const handle2FAToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isEnabled = e.target.checked;
    
    if (isEnabled) {
      setIs2FAEnabled(true);
      setActiveStep(1);
    } else {
      setIs2FAEnabled(false);
      setActiveStep(0);
      showNotification('Two-factor authentication disabled', 'success');
    }
  };

  // Handle verification code input
  const handleVerificationCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationCode(e.target.value);
  };

  // Handle verification code submission
  const handleVerifyCode = () => {
    if (verificationCode.length !== 6) {
      showNotification('Please enter a 6-digit code', 'error');
      return;
    }
    
    // In a real application, you'd verify the code with your backend
    // For this demo, we'll just simulate a successful verification
    if (verificationCode === '123456') {
      setActiveStep(3); // Move to completed step
      showNotification('Two-factor authentication enabled successfully', 'success');
    } else {
      showNotification('Invalid verification code', 'error');
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Two-Factor Authentication</h3>
      <div className="space-y-4">
        <div className={`mfa-step ${activeStep === 0 ? 'active' : activeStep > 0 ? 'completed' : ''}`}>
          <h4 className="font-semibold mb-2">Step 1: Enable 2FA</h4>
          <p className="text-sm mb-4">Choose your preferred 2FA method</p>
          <div className="flex items-center justify-between">
            <span>Authenticator App</span>
            <label className="security-toggle">
              <input 
                type="checkbox" 
                checked={is2FAEnabled}
                onChange={handle2FAToggle}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
        
        {activeStep >= 1 && (
          <div className={`mfa-step ${activeStep === 1 ? 'active' : activeStep > 1 ? 'completed' : ''}`}>
            <h4 className="font-semibold mb-2">Step 2: Scan QR Code</h4>
            <p className="text-sm mb-4">Scan this QR code with your authenticator app</p>
            <div className="neo-container p-4 w-48 h-48 mx-auto flex items-center justify-center">
              <i className="bi bi-qr-code-scan text-6xl text-gray-600"></i>
            </div>
            <div className="flex justify-end mt-4">
              <button 
                className="neo-button primary p-2"
                onClick={() => setActiveStep(2)}
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {activeStep >= 2 && (
          <div className={`mfa-step ${activeStep === 2 ? 'active' : activeStep > 2 ? 'completed' : ''}`}>
            <h4 className="font-semibold mb-2">Step 3: Verify Setup</h4>
            <p className="text-sm mb-4">Enter the code from your authenticator app</p>
            <input 
              type="text" 
              placeholder="Enter 6-digit code" 
              className="neo-input w-full p-3"
              value={verificationCode}
              onChange={handleVerificationCodeChange}
              maxLength={6}
            />
            <div className="flex justify-end mt-4">
              <button 
                className="neo-button primary p-2"
                onClick={handleVerifyCode}
              >
                Verify
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorAuth; 