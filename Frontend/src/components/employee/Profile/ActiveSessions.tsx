import React from 'react';
import { SessionData } from './types';

interface ActiveSessionsProps {
  sessions: SessionData[];
  onRevokeSession: (sessionId: string) => void;
}

const ActiveSessions: React.FC<ActiveSessionsProps> = ({ sessions, onRevokeSession }) => {
  // Handle revoking a session
  const handleRevokeSession = (sessionId: string) => {
    if (window.confirm('Are you sure you want to revoke this session?')) {
      onRevokeSession(sessionId);
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Active Sessions</h3>
      
      {sessions.length === 0 ? (
        <p className="text-gray-600">No active sessions found.</p>
      ) : (
        <div className="space-y-4">
          {sessions.map(session => (
            <div key={session.id} className="session-card">
              <div className="session-header">
                <div className="session-icon">
                  <i className={`bi ${session.icon} ${session.iconColor}`}></i>
                </div>
                <div className="session-details">
                  <div className="session-title">{session.title}</div>
                  <div className="session-info">Last active: {session.lastActive}</div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="session-info">IP: {session.ip}</div>
                <div className="session-info">Location: {session.location}</div>
              </div>
              <div className="session-actions">
                <button 
                  className="revoke-button"
                  onClick={() => handleRevokeSession(session.id)}
                >
                  Revoke Access
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveSessions; 