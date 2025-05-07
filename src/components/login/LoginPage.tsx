import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import RoleSelector from './RoleSelector';
import QRLogin from './QRLogin';
import StandardLogin from './StandardLogin';
import MFASection from './MFASection';
import PasswordReset from './PasswordReset';
import HelpSection from './HelpSection';
import '../../styles/login/LoginPage.css';

type ActiveSection = 'role' | 'qr' | 'standard' | 'mfa' | 'reset' | 'help';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>('role');
  const [isScanning, setIsScanning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [qrKey, setQrKey] = useState(Date.now());
  const [qrOtp, setQrOtp] = useState<string>(generateOtp());
  const [mfaTimeLeft, setMfaTimeLeft] = useState(300);
  const [showPopup, setShowPopup] = useState(true);

  function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  useEffect(() => {
    if (activeSection === 'qr') {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setQrKey(Date.now());
            setQrOtp(generateOtp());
            return 300;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeSection === 'mfa') {
      const timer = setInterval(() => {
        setMfaTimeLeft((prev) => {
          if (prev <= 0) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeSection]);

  useEffect(() => {
    setShowPopup(true);
  }, []);

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setTimeLeft(300);
    setQrKey(Date.now());
    setQrOtp(generateOtp());
    setActiveSection('qr');
  };

  const handleLoginSuccess = () => {
    if (selectedRole) {
      login(selectedRole);
    }
  };

  const goToMFA = () => {
    setMfaTimeLeft(timeLeft);
    setActiveSection('mfa');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#e6eaf0] p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">WorkSmart AI</h1>
        <p className="text-gray-600 text-lg">Employee Management System</p>
      </div>
      
      <div className="w-full max-w-md">
        {activeSection === 'role' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <RoleSelector onRoleSelect={handleRoleSelect} />
          </div>
        )}
        
        {activeSection === 'qr' && (
          <QRLogin
            selectedRole={selectedRole}
            timeLeft={timeLeft}
            isScanning={isScanning}
            onScan={setIsScanning}
            onSuccess={goToMFA}
            onToggleForm={() => setActiveSection('standard')}
            onShowHelp={() => setActiveSection('help')}
            onBack={() => setActiveSection('role')}
            qrKey={qrKey}
            qrOtp={qrOtp}
          />
        )}
        
        {activeSection === 'standard' && (
          <StandardLogin
            onSuccess={handleLoginSuccess}
            onToggleForm={() => setActiveSection('qr')}
            onShowReset={() => setActiveSection('reset')}
            onBack={() => setActiveSection('role')}
          />
        )}
        
        {activeSection === 'mfa' && (
          <MFASection
            timeLeft={mfaTimeLeft}
            onSuccess={handleLoginSuccess}
            otp={qrOtp}
            onBack={() => setActiveSection('role')}
          />
        )}
        
        {activeSection === 'reset' && (
          <PasswordReset
            onSuccess={() => setActiveSection('standard')}
            onBack={() => setActiveSection('standard')}
          />
        )}
        
        {activeSection === 'help' && (
          <HelpSection onBack={() => setActiveSection('qr')} />
        )}
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
            <h2 className="text-xl font-bold mb-2">Project Under Progress</h2>
            <p className="mb-4">This project is under progress. Many features are broken and under development. By the time being you explore the site</p>
            <h3 className="text-xl font-bold mb-2">Open for feedback</h3>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => setShowPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage; 