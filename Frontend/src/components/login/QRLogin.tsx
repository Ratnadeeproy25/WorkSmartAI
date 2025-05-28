import React, { useEffect, useRef, useCallback, useState } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext';
import '../../styles/login/QRLogin.css';

interface QRLoginProps {
  selectedRole: string | null;
  userEmail: string;
  timeLeft: number;
  isScanning: boolean;
  onScan: (scanning: boolean) => void;
  onSuccess: () => void; // This will trigger moving to MFA screen
  onToggleForm: () => void;
  onShowHelp: () => void;
  onBack: () => void;
  qrKey: number;
  qrOtp: string;
}

const QRLogin: React.FC<QRLoginProps> = ({
  selectedRole,
  userEmail,
  timeLeft,
  isScanning,
  onScan,
  onSuccess,
  onToggleForm,
  onShowHelp,
  onBack,
  qrKey,
  qrOtp
}) => {
  const qrRef = useRef<HTMLCanvasElement>(null);
  const { isLoading, error } = useAuth();
  const [qrError, setQrError] = useState<string | null>(null);

  const generateQRCode = useCallback(() => {
    if (selectedRole && qrRef.current) {
      setQrError(null);
      
      // QR code contains only the OTP value for simplicity
      const qrData = qrOtp;
      
      try {
        QRCode.toCanvas(qrRef.current, qrData, {
          margin: 1,
          width: 220,
          color: {
            dark: '#1E293B', // Darker blue-gray that matches neo-morphism theme
            light: '#ffffff'
          },
          errorCorrectionLevel: 'H'
        }).catch(err => {
          console.error('Error generating QR code:', err);
          setQrError('Failed to generate QR code');
        });
      } catch (err) {
        console.error('Error generating QR code:', err);
        setQrError('Failed to generate QR code');
      }
    }
  }, [selectedRole, qrKey, qrOtp]);

  useEffect(() => {
    generateQRCode();
  }, [generateQRCode]);

  // This function only simulates scanning the QR code
  const handleSimulateScan = () => {
    if (isScanning || isLoading || !selectedRole) return;
    
    onScan(true);
    
    // Simulate a 1.5 second scanning process
    setTimeout(() => {
      onScan(false);
      // After scanning, move to MFA verification
      onSuccess();
    }, 1500);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="neo-morphism p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">QR Code Login</h2>
      <p className="text-center text-gray-600 mb-4">Scanning as: {userEmail}</p>
      
      {(error || qrError) && (
        <div className="neo-error-box mb-4">
          {error || qrError}
        </div>
      )}
      
      <div className="flex flex-col items-center mb-6">
        <div className="qr-container">
          <canvas ref={qrRef} className="w-full h-full"></canvas>
          {isScanning && <div className="qr-overlay"></div>}
        </div>
        
        <p className="text-sm text-gray-500 mt-3 text-center">
          Scan this QR code to receive your verification code
        </p>
      </div>
      
      <div className="timer-container">
        <div className="timer-text">{`${minutes}:${seconds.toString().padStart(2, '0')}`}</div>
        <div className="timer-progress">
          <div 
            className="timer-progress-bar" 
            style={{ width: `${(timeLeft / 300) * 100}%` }}
          ></div>
        </div>
      </div>
      
      <div className="qr-actions">
        <button 
          onClick={handleSimulateScan} 
          className="neo-button primary full-width"
          disabled={isScanning || isLoading}
        >
          {(isScanning || isLoading) ? (
            <><i className="bi bi-arrow-repeat animate-spin"></i> Scanning QR Code...</>
          ) : (
            <><i className="bi bi-phone"></i> Simulate QR Scan</>
          )}
        </button>
        <button 
          onClick={onShowHelp} 
          className="help-button"
        >
          <i className="bi bi-question-circle"></i>
          Need help?
        </button>
        <button onClick={onToggleForm} className="neo-button secondary full-width">
          Switch to Password Login
        </button>
        <button onClick={onBack} className="neo-button secondary full-width">
          <i className="bi bi-arrow-left"></i>
          <span>Back to Email Entry</span>
        </button>
      </div>
    </div>
  );
};

export default QRLogin; 