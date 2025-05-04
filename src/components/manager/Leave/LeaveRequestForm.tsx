import React, { useState, FormEvent } from 'react';

const LeaveRequestForm: React.FC = () => {
  const [formData, setFormData] = useState({
    leaveType: '',
    duration: '',
    startDate: '',
    endDate: '',
    reason: '',
    handoverPlan: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    alert('Leave request submitted successfully! Awaiting admin approval.');
    // In a real application, you would send the form data to a server
    console.log('Form submitted:', formData);
    
    // Reset form
    setFormData({
      leaveType: '',
      duration: '',
      startDate: '',
      endDate: '',
      reason: '',
      handoverPlan: ''
    });
  };

  return (
    <div className="neo-box p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-6">New Leave Request</h3>
      <form id="leaveRequestForm" className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 mb-2">Leave Type</label>
            <select 
              className="neo-select" 
              required
              name="leaveType"
              value={formData.leaveType}
              onChange={handleChange}
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
              required
              name="duration"
              value={formData.duration}
              onChange={handleChange}
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
              className="neo-input" 
              required
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">End Date</label>
            <input 
              type="date" 
              className="neo-input" 
              required
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
            />
          </div>
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Reason</label>
          <textarea 
            className="neo-textarea" 
            placeholder="Please provide a reason for your leave request" 
            required
            name="reason"
            value={formData.reason}
            onChange={handleChange}
          ></textarea>
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Handover Plan</label>
          <textarea 
            className="neo-textarea" 
            placeholder="Please describe how your responsibilities will be managed during your absence" 
            required
            name="handoverPlan"
            value={formData.handoverPlan}
            onChange={handleChange}
          ></textarea>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="neo-button primary p-3 flex items-center gap-2">
            <i className="bi bi-send"></i>
            <span>Submit Request</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveRequestForm; 