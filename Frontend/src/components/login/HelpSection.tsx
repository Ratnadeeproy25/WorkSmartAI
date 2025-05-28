import React from 'react';
import '../../styles/login/HelpSection.css';

interface HelpSectionProps {
  onBack: () => void;
}

const HelpSection: React.FC<HelpSectionProps> = ({ onBack }) => {
  return (
    <div className="neo-morphism p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Need Help?</h2>
      <div className="space-y-4">
        <div className="help-card">
          <h3 className="font-semibold text-gray-800 mb-2">QR Code Login Issues</h3>
          <p className="text-sm text-gray-600">Make sure your camera has permission to access the QR code scanner.</p>
        </div>
        <div className="help-card">
          <h3 className="font-semibold text-gray-800 mb-2">Password Reset</h3>
          <p className="text-sm text-gray-600">Click on 'Forgot Password' to reset your password.</p>
        </div>
        <div className="help-card">
          <h3 className="font-semibold text-gray-800 mb-2">Contact Support</h3>
          <p className="text-sm text-gray-600">Email: support@worksmart.ai</p>
          <p className="text-sm text-gray-600">Phone: +1 (555) 123-4567</p>
        </div>
      </div>
      <button onClick={onBack} className="neo-button w-full py-3 px-4 text-gray-700 font-medium mt-6">
        Back to Login
      </button>
    </div>
  );
};

export default HelpSection; 