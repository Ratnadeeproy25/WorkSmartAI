import React from 'react';
import { HistoryItem } from './types';

interface RequestHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
}

const RequestHistoryModal: React.FC<RequestHistoryModalProps> = ({ isOpen, onClose, history }) => {
  if (!isOpen) return null;

  const statusClasses = {
    pending: 'status-badge pending',
    approved: 'status-badge approved',
    rejected: 'status-badge rejected'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="neo-box p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Request History</h3>
          <button className="neo-button p-2" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="space-y-4">
          {history.length > 0 ? (
            history.map((item) => (
              <div className="request-card" key={item.id}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-700">{item.description}</div>
                    <div className="text-sm text-gray-600">{item.date} - {item.time}</div>
                    {item.person && <div className="text-sm text-gray-600">{item.person}</div>}
                  </div>
                  <span className={statusClasses[item.status]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-4">No history available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestHistoryModal; 