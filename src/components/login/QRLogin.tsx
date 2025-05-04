import React, { useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import '../../styles/login/QRLogin.css';

interface QRLoginProps {
  selectedRole: string | null;
  timeLeft: number;
  isScanning: boolean;
  onScan: (scanning: boolean) => void;
  onSuccess: () => void;
  onToggleForm: () => void;
  onShowHelp: () => void;
  onBack: () => void;
  qrKey: number;
  qrOtp: string;
}

const QRLogin: React.FC<QRLoginProps> = ({
  selectedRole,
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

  const generateQRCode = useCallback(() => {
    if (selectedRole && qrRef.current) {
      const data = `WorkSmartAI-${selectedRole}-${qrOtp}`;
      QRCode.toCanvas(qrRef.current, data, {
        margin: 1,
        width: 180,
        color: {
          dark: '#4a5568',
          light: '#e0e5ec'
        }
      }).catch(err => {
        console.error('Error generating QR code:', err);
      });
    }
  }, [selectedRole, qrKey, qrOtp]);

  useEffect(() => {
    generateQRCode();
  }, [generateQRCode]);

  const handleSimulateScan = () => {
    if (isScanning) return;
    onScan(true);
    
    setTimeout(() => {
      onScan(false);
      onSuccess();
    }, 2000);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="neo-morphism p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">QR Code Login</h2>
      <div className="qr-container">
        <canvas ref={qrRef} className="w-full h-full"></canvas>
        {isScanning && <div className="qr-overlay"></div>}
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
        <button onClick={handleSimulateScan} className="neo-button primary full-width">
          <i className="bi bi-phone"></i>
          <span>Simulate Scan</span>
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
          <span>Back to Role Selection</span>
        </button>
      </div>
    </div>
  );
};

export default QRLogin; 