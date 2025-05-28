import React, { useState } from 'react';
import { LeaveRequest } from './types';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leaveRequest: Partial<LeaveRequest>) => void;
}

const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [leaveType, setLeaveType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      leaveType,
      startDate,
      endDate,
      reason,
      status: 'pending'
    });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setLeaveType('annual');
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="neo-box p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">New Leave Request</h3>
          <button className="neo-button p-2" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
            <select 
              className="neo-select"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              required
            >
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal Leave</option>
              <option value="emergency">Emergency Leave</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input 
                type="date" 
                className="neo-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input 
                type="date" 
                className="neo-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
            <textarea 
              className="neo-input" 
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            ></textarea>
          </div>
          <div className="flex justify-end gap-4">
            <button type="button" className="neo-button p-2" onClick={onClose}>Cancel</button>
            <button type="submit" className="neo-button primary p-2">Submit Request</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveRequestModal; 