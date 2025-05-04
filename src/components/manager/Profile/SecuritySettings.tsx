import React, { useState, useEffect } from 'react';

interface Session {
  id: number;
  device: string;
  icon: string;
  iconColor: string;
  lastActive: string;
  ip: string;
  location: string;
}

interface LoginHistory {
  id: number;
  device: string;
  location: string;
  ip: string;
  time: string;
}

const SecuritySettings: React.FC = () => {
  const [password, setPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    width: '0%',
    className: '',
    text: ''
  });
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  // Session and login history data
  const activeSessions: Session[] = [
    {
      id: 1,
      device: 'Chrome - Windows',
      icon: 'bi-windows',
      iconColor: 'text-blue-500',
      lastActive: '2 minutes ago',
      ip: '192.168.1.1',
      location: 'New York, USA'
    },
    {
      id: 2,
      device: 'Safari - iPhone',
      icon: 'bi-phone',
      iconColor: 'text-green-500',
      lastActive: '1 hour ago',
      ip: '192.168.1.2',
      location: 'Boston, USA'
    }
  ];

  const loginHistory: LoginHistory[] = [
    {
      id: 1,
      device: 'Chrome - Windows',
      location: 'New York, USA',
      ip: '192.168.1.1',
      time: '2 days ago'
    },
    {
      id: 2,
      device: 'Safari - iPhone',
      location: 'Boston, USA',
      ip: '192.168.1.2',
      time: '5 days ago'
    }
  ];

  // Initialize MFA steps
  useEffect(() => {
    if (mfaEnabled && activeStep === 1) {
      setActiveStep(2);
    }
  }, [mfaEnabled]);

  // Handle password strength
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    const strength = newPassword.length;
    let width = '0%';
    let className = '';
    let text = '';
    
    if (strength < 4) {
      width = '25%';
      className = 'password-strength-bar bg-red-500';
      text = 'Weak Password';
    } else if (strength < 8) {
      width = '50%';
      className = 'password-strength-bar bg-yellow-500';
      text = 'Medium Password';
    } else if (strength < 12) {
      width = '75%';
      className = 'password-strength-bar bg-green-500';
      text = 'Strong Password';
    } else {
      width = '100%';
      className = 'password-strength-bar bg-green-500';
      text = 'Very Strong Password';
    }
    
    setPasswordStrength({ width, className, text });
  };

  // Handle MFA toggle
  const handleMfaToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMfaEnabled(e.target.checked);
    
    if (e.target.checked) {
      setActiveStep(2);
    } else {
      setActiveStep(1);
    }
  };

  // Handle verification code submit
  const handleVerifyCode = () => {
    setActiveStep(3);
  };

  // Handle session revoke
  const handleRevokeSession = (id: number) => {
    // In a real app, this would call an API to revoke the session
    alert(`Session ${id} would be revoked in a real app.`);
  };

  return (
    <div className="neo-box p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-8">Security Settings</h2>

      {/* Change Password Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h3>
        <form className="space-y-4">
          <input 
            type="password" 
            placeholder="Current Password" 
            className="neo-input w-full p-3"
          />
          <input 
            type="password" 
            placeholder="New Password" 
            className="neo-input w-full p-3"
            value={password}
            onChange={handlePasswordChange}
          />
          <input 
            type="password" 
            placeholder="Confirm New Password" 
            className="neo-input w-full p-3"
          />
          <div className="password-strength">
            <div className={passwordStrength.className} style={{ width: passwordStrength.width }}></div>
          </div>
          <div className="password-strength-text text-gray-600">{passwordStrength.text}</div>
          <button type="button" className="neo-button primary w-full p-3 font-semibold">Update Password</button>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Two-Factor Authentication</h3>
        <div className="space-y-4">
          <div className={`mfa-step ${activeStep === 1 ? 'active' : activeStep > 1 ? 'completed' : ''}`}>
            <h4 className="font-semibold mb-2">Step 1: Enable 2FA</h4>
            <p className="text-sm mb-4">Choose your preferred 2FA method</p>
            <div className="flex items-center justify-between">
              <span>Authenticator App</span>
              <label className="security-toggle">
                <input 
                  type="checkbox" 
                  checked={mfaEnabled}
                  onChange={handleMfaToggle}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
          <div className={`mfa-step ${activeStep === 2 ? 'active' : activeStep > 2 ? 'completed' : ''}`}>
            <h4 className="font-semibold mb-2">Step 2: Scan QR Code</h4>
            <p className="text-sm mb-4">Scan this QR code with your authenticator app</p>
            <div className="neo-box p-4 w-48 h-48 mx-auto flex items-center justify-center">
              <i className="bi bi-qr-code-scan text-6xl text-gray-600"></i>
            </div>
          </div>
          <div className={`mfa-step ${activeStep === 3 ? 'active' : ''}`}>
            <h4 className="font-semibold mb-2">Step 3: Verify Setup</h4>
            <p className="text-sm mb-4">Enter the code from your authenticator app</p>
            <input 
              type="text" 
              placeholder="Enter 6-digit code" 
              className="neo-input w-full p-3"
            />
            {activeStep === 3 && (
              <button 
                type="button" 
                className="neo-button primary mt-4 w-full p-3 font-semibold"
                onClick={handleVerifyCode}
              >
                Verify and Enable
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Active Sessions</h3>
        <div className="space-y-4">
          {activeSessions.map(session => (
            <div key={session.id} className="session-card">
              <div className="session-header">
                <div className="session-icon">
                  <i className={`bi ${session.icon} ${session.iconColor}`}></i>
                </div>
                <div className="session-details">
                  <div className="session-title">{session.device}</div>
                  <div className="session-info">Last active: {session.lastActive}</div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="session-info">IP: {session.ip}</div>
                <div className="session-info">Location: {session.location}</div>
              </div>
              <div className="session-actions">
                <button 
                  className="revoke-button"
                  onClick={() => handleRevokeSession(session.id)}
                >
                  Revoke Access
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Login History */}
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Login History</h3>
        <div className="space-y-2">
          {loginHistory.map(login => (
            <div key={login.id} className="login-history-row">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-700">{login.device}</p>
                  <p className="text-sm text-gray-600">{login.location}</p>
                  <p className="text-sm text-gray-600">IP: {login.ip}</p>
                </div>
                <p className="text-sm text-gray-600">{login.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings; 