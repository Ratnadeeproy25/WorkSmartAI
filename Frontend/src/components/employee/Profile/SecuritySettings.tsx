import React from 'react';
import PasswordChange from './PasswordChange';

interface SecuritySettingsProps {
  showNotification: (message: string, type?: 'success' | 'error') => void;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  showNotification
}) => {
  return (
    <div className="neo-container p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-8">Security Settings</h2>

      <PasswordChange 
        showNotification={showNotification}
      />
    </div>
  );
};

export default SecuritySettings; 