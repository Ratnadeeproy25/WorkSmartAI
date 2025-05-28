import React, { useState, useRef, useEffect } from 'react';
import '../../styles/login/MFASection.css';

interface MFASectionProps {
  timeLeft: number;
  onSuccess: () => void;
  onBack: () => void;
  otp: string;
}

const MFASection: React.FC<MFASectionProps> = ({ timeLeft, onSuccess, onBack, otp }) => {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isCodeValid, setIsCodeValid] = useState<boolean | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus the first input field when component mounts
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Handle input change
  const handleInput = (value: string, index: number) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) {
      return;
    }
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Reset validation state when user is typing
    setIsCodeValid(null);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    switch(e.key) {
      case 'ArrowLeft':
        if (index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
        break;
      case 'ArrowRight':
        if (index < 5) {
          inputRefs.current[index + 1]?.focus();
        }
        break;
      case 'Backspace':
        if (!code[index] && index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
        break;
      case 'Enter':
        if (!code.some(digit => digit === '')) {
          handleVerifyCode();
        }
        break;
      default:
        break;
    }
  };

  const handleVerifyCode = () => {
    validateCode(code.join(''));
  };

  const validateCode = (fullCode: string) => {
    if (fullCode.length === 6) {
      if (fullCode === otp) {
        setIsCodeValid(true);
        setTimeout(() => {
          onSuccess();
        }, 1000);
      } else {
        setIsCodeValid(false);
        setError('Invalid verification code. Please try again.');
      }
    } else {
      setError('Please enter all 6 digits');
    }
  };

  // Get the appropriate class for the input based on validation state
  const getInputClass = () => {
    if (isCodeValid === true) return "neo-input mfa-input input-correct";
    if (isCodeValid === false) return "neo-input mfa-input input-incorrect";
    return "neo-input mfa-input";
  };
  
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="neo-morphism p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Enter Verification Code</h2>
      
      <div className="mb-6 text-center">
        <p className="text-gray-600">Enter the 6-digit code from your QR scan to complete login</p>
      </div>
      
      <div className="flex justify-center gap-3 mb-6" style={{ flexWrap: 'nowrap' }}>
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleInput(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={getInputClass()}
            style={{
              width: '48px',
              height: '56px',
              fontSize: '2rem',
              fontWeight: 'bold',
              textAlign: 'center',
              backgroundColor: '#f3f4f6',
              boxShadow: 'inset 1px 1px 2px rgba(0, 0, 0, 0.1)'
            }}
          />
        ))}
      </div>
      
      {error && <div className="text-red-500 text-sm text-center mb-6">{error}</div>}
      
      <div className="text-center text-gray-600 mb-8">
        <div className="text-lg font-medium">Code expires in: {formatTimeLeft()}</div>
        <div className="timer-progress mt-2">
          <div 
            className="timer-progress-bar" 
            style={{ width: `${(timeLeft / 300) * 100}%` }}
          ></div>
        </div>
      </div>
      
      <div className="space-y-4">
        <button 
          onClick={handleVerifyCode}
          disabled={isCodeValid === true || code.some(digit => digit === '')}
          className="neo-button primary w-full py-3"
        >
          {isCodeValid === true ? 'Verified ✓' : 'Verify & Login'}
        </button>
        
        <button 
          onClick={onBack} 
          className="neo-button w-full py-3 px-4 text-gray-700 font-medium"
        >
          <i className="bi bi-arrow-left mr-2"></i>
          <span>Back to QR Code</span>
        </button>
      </div>
    </div>
  );
};

export default MFASection; 