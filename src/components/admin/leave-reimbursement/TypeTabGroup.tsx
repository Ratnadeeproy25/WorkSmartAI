import React from 'react';
import { RequestType } from './types';

interface TypeTabGroupProps {
  activeType: RequestType;
  onTypeChange: (type: RequestType) => void;
}

const TypeTabGroup: React.FC<TypeTabGroupProps> = ({ activeType, onTypeChange }) => {
  return (
    <div className="flex flex-wrap gap-4 mb-8">
      <button 
        className={`tab-button ${activeType === 'leave' ? 'active' : ''}`}
        onClick={() => onTypeChange('leave')}
      >
        Leave Requests
      </button>
      <button 
        className={`tab-button ${activeType === 'reimbursement' ? 'active' : ''}`}
        onClick={() => onTypeChange('reimbursement')}
      >
        Reimbursement Requests
      </button>
    </div>
  );
};

export default TypeTabGroup; 