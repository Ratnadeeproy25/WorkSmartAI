import React, { useState, useRef } from 'react';
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
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInput = (value: string, index: number) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(digit => digit !== '')) {
      validateCode(newCode.join(''));
    }
  };

  const validateCode = (fullCode: string) => {
    if (fullCode.length === 6) {
      if (fullCode === otp) {
        setTimeout(() => {
          onSuccess();
        }, 500);
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } else {
      setError('Please enter all 6 digits');
    }
  };

  return (
    <div className="neo-morphism p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Enter Verification Code</h2>
      <div className="flex justify-center gap-3 mb-8" style={{ flexWrap: 'nowrap' }}>
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleInput(e.target.value, index)}
            className="neo-input mfa-input text-center text-2xl font-semibold"
            style={{ width: '48px', height: '56px', fontSize: '2rem' }}
          />
        ))}
      </div>
      {error && <div className="text-red-500 text-sm text-center mb-6">{error}</div>}
      <div className="text-center text-gray-600 mb-8 text-lg font-medium">
        Code expires in: {timeLeft}s
      </div>
      <button onClick={onBack} className="neo-button w-full py-3 px-4 text-gray-700 font-medium">
        <i className="bi bi-arrow-left mr-2"></i>
        <span>Back to Role Selection</span>
      </button>
    </div>
  );
};

export default MFASection; 