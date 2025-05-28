import React from 'react';
import { LoginHistoryItem } from './types';

interface LoginHistoryProps {
  loginHistory: LoginHistoryItem[];
}

const LoginHistory: React.FC<LoginHistoryProps> = ({ loginHistory }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Login History</h3>
      
      {loginHistory.length === 0 ? (
        <p className="text-gray-600">No login history found.</p>
      ) : (
        <div className="space-y-2">
          {loginHistory.map(item => (
            <div key={item.id} className="login-history-row">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-700">{item.device}</p>
                  <p className="text-sm text-gray-600">{item.location}</p>
                  <p className="text-sm text-gray-600">IP: {item.ip}</p>
                </div>
                <p className="text-sm text-gray-600">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LoginHistory; 