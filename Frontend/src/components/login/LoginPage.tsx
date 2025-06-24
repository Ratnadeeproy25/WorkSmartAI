import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../context/AuthContext';
import RoleSelector from './RoleSelector';
import QRLogin from './QRLogin';
import StandardLogin from './StandardLogin';
import MFASection from './MFASection';
import PasswordReset from './PasswordReset';
import HelpSection from './HelpSection';
import EmailInput from './EmailInput';
import '../../styles/login/LoginPage.css';

type ActiveSection = 'role' | 'email' | 'qr' | 'standard' | 'mfa' | 'reset' | 'help';

const LoginPage: React.FC = () => {
  const { login, loginWithQr } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [activeSection, setActiveSection] = useState<ActiveSection>('role');
  const [isScanning, setIsScanning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [qrKey, setQrKey] = useState(Date.now());
  const [qrOtp, setQrOtp] = useState<string>(generateOtp());
  const [mfaTimeLeft, setMfaTimeLeft] = useState(300);

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

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setTimeLeft(300);
    setQrKey(Date.now());
    setQrOtp(generateOtp());
    setActiveSection('email');
  };

  const handleEmailSubmit = (email: string) => {
    setUserEmail(email);
    setActiveSection('qr');
  };

  const handlePasswordLoginSuccess = async (email: string) => {
    setUserEmail(email);
    // LoginWithPassword is handled directly inside the StandardLogin component
  };

  const handleSwitchToPasswordFromEmail = () => {
    setActiveSection('standard');
  };

  // Step 1: Handle QR code scan success - move to MFA screen
  const handleQrScanSuccess = () => {
    // After QR is scanned successfully, go to MFA verification
    goToMFA();
  };

  // Step 2: Handle MFA verification success - complete the login process
  const handleMfaVerified = async () => {
    try {
      if (selectedRole && userEmail) {
        // Now perform the actual login with the QR details
        const success = await loginWithQr(selectedRole, userEmail, qrOtp);
        
        if (!success) {
          // If login fails, go back to QR scan
          setActiveSection('qr');
        }
        // If login succeeds, the AuthContext will handle navigation
      }
    } catch (err) {
      console.error('Error during login after MFA verification:', err);
      // If error occurs, go back to QR scan
      setActiveSection('qr');
    }
  };

  const goToMFA = () => {
    setMfaTimeLeft(300);
    setActiveSection('mfa');
  };

  return (
    <>
      <Helmet>
        <title>WorkSmart AI - Login</title>
      </Helmet>
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
          
          {activeSection === 'email' && (
            <EmailInput 
              onSubmit={handleEmailSubmit}
              onBack={() => setActiveSection('role')}
              onSwitchToPassword={handleSwitchToPasswordFromEmail}
              selectedRole={selectedRole}
            />
          )}
          
          {activeSection === 'qr' && (
            <QRLogin
              selectedRole={selectedRole}
              userEmail={userEmail}
              timeLeft={timeLeft}
              isScanning={isScanning}
              onScan={setIsScanning}
              onSuccess={handleQrScanSuccess}
              onToggleForm={() => setActiveSection('standard')}
              onShowHelp={() => setActiveSection('help')}
              onBack={() => setActiveSection('email')}
              qrKey={qrKey}
              qrOtp={qrOtp}
            />
          )}
          
          {activeSection === 'standard' && (
            <StandardLogin
              onSuccess={handlePasswordLoginSuccess}
              onToggleForm={() => setActiveSection('email')}
              onShowReset={() => setActiveSection('reset')}
              onBack={() => setActiveSection('role')}
            />
          )}
          
          {activeSection === 'mfa' && (
            <MFASection
              timeLeft={mfaTimeLeft}
              onSuccess={handleMfaVerified}
              otp={qrOtp}
              onBack={() => setActiveSection('qr')} // Go back to QR screen instead of role selection
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
      </div>
    </>
  );
};

export default LoginPage; 