import React, { useState } from 'react';
import { SecuritySettings as SecuritySettingsType } from './types';
import PasswordChange from './PasswordChange';
import TwoFactorAuth from './TwoFactorAuth';
import ActiveSessions from './ActiveSessions';
import LoginHistory from './LoginHistory';

interface SecuritySettingsProps {
  securitySettings: SecuritySettingsType;
  onRevokeSession: (sessionId: string) => void;
  showNotification: (message: string, type?: 'success' | 'error') => void;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  securitySettings,
  onRevokeSession,
  showNotification
}) => {
  return (
    <div className="neo-container p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-8">Security Settings</h2>

      <PasswordChange 
        showNotification={showNotification}
      />

      <TwoFactorAuth 
        showNotification={showNotification}
      />

      <ActiveSessions 
        sessions={securitySettings.sessions}
        onRevokeSession={onRevokeSession}
      />

      <LoginHistory 
        loginHistory={securitySettings.loginHistory}
      />
    </div>
  );
};

export default SecuritySettings; 