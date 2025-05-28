import React, { useState } from 'react';
import leaveService from '../../../services/leaveService';

interface LeaveRequestFormProps {
  selectedDates: Set<string>;
  onLeaveRequested: () => void;
}

const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({ selectedDates, onLeaveRequested }) => {
  const [leaveType, setLeaveType] = useState<string>('annual');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sort the selected dates and get the first and last
  const getDatesRange = (): [string, string] | null => {
    if (selectedDates.size === 0) return null;
    
    const sortedDates = Array.from(selectedDates).sort();
    return [sortedDates[0], sortedDates[sortedDates.length - 1]];
  };

  const datesRange = getDatesRange();

  // Submit leave request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedDates.size === 0) {
      setError('Please select at least one date for your leave request');
      return;
    }
    
    if (!leaveType) {
      setError('Please select a leave type');
      return;
    }
    
    if (!reason) {
      setError('Please provide a reason for your leave request');
      return;
    }
    
    const datesRange = getDatesRange();
    if (!datesRange) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      
      await leaveService.requestLeave({
        type: leaveType as any, // Type casting since leaveType value format might differ
        startDate: datesRange[0],
        endDate: datesRange[1],
        reason: reason,
        duration: datesRange[0] === datesRange[1] ? 'full-day' : 'multiple-days'
      });
      
      setSuccess('Leave request submitted successfully');
      setReason('');
      onLeaveRequested();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="neo-box p-6 mb-8">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Request Leave</h3>
      
      {selectedDates.size > 0 ? (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="font-medium text-blue-700 mb-1">
            Selected: {selectedDates.size} day{selectedDates.size > 1 ? 's' : ''}
          </div>
          {datesRange && (
            <div className="text-sm text-blue-600">
              {datesRange[0] === datesRange[1] 
                ? `On ${new Date(datesRange[0]).toLocaleDateString()}`
                : `From ${new Date(datesRange[0]).toLocaleDateString()} to ${new Date(datesRange[1]).toLocaleDateString()}`
              }
            </div>
          )}
        </div>
      ) : (
        <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
          <div className="text-sm text-yellow-700">
            Please select dates on the calendar above for your leave request
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <div className="text-sm text-green-700">{success}</div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Leave Type
            </label>
            <select
              className="neo-input w-full"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              required
            >
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal Leave</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Duration
            </label>
            <div className="neo-input w-full bg-gray-100 py-2 px-3 text-gray-700">
              {selectedDates.size} day{selectedDates.size !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Reason
          </label>
          <textarea
            className="neo-input w-full h-24"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide a reason for your leave request"
            required
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="neo-button primary py-2 px-6"
            disabled={isSubmitting || selectedDates.size === 0}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveRequestForm; 