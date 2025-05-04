import React, { useState, FormEvent } from 'react';
import { LeaveRequest, LeaveType, DurationType } from './types';

interface LeaveRequestFormProps {
  onSubmit: (leaveRequest: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => void;
}

const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    type: '',
    duration: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      type: formData.type as LeaveType,
      duration: formData.duration as DurationType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason
    });
    
    // Reset form
    setFormData({
      type: '',
      duration: '',
      startDate: '',
      endDate: '',
      reason: ''
    });
  };

  return (
    <div className="neo-box p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-6">New Leave Request</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 mb-2">Leave Type</label>
            <select 
              className="neo-select" 
              name="type" 
              value={formData.type} 
              onChange={handleChange}
              required
            >
              <option value="">Select Leave Type</option>
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal Leave</option>
              <option value="maternity">Maternity Leave</option>
              <option value="paternity">Paternity Leave</option>
              <option value="bereavement">Bereavement Leave</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Duration</label>
            <select 
              className="neo-select" 
              name="duration" 
              value={formData.duration} 
              onChange={handleChange}
              required
            >
              <option value="">Select Duration</option>
              <option value="half-day">Half Day</option>
              <option value="full-day">Full Day</option>
              <option value="multiple-days">Multiple Days</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 mb-2">Start Date</label>
            <input 
              type="date" 
              name="startDate" 
              className="neo-input" 
              value={formData.startDate} 
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">End Date</label>
            <input 
              type="date" 
              name="endDate" 
              className="neo-input" 
              value={formData.endDate} 
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Reason</label>
          <textarea 
            className="neo-textarea" 
            name="reason" 
            placeholder="Please provide a reason for your leave request" 
            value={formData.reason} 
            onChange={handleChange}
            required
          ></textarea>
        </div>
        <div className="flex justify-end">
          <button 
            type="submit" 
            className="neo-button primary p-3 flex items-center gap-2"
          >
            <i className="bi bi-send"></i>
            <span>Submit Request</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveRequestForm; 