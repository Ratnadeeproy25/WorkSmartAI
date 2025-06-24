import React, { useState, FormEvent } from 'react';
import { LeaveRequest, LeaveType, DurationType, LeaveBalance } from '../../../components/employee/LeaveReimbursement/types';

interface LeaveRequestFormProps {
  onSubmit: (leaveRequest: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => Promise<boolean>;
  leaveBalances: LeaveBalance[];
}

const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({ onSubmit, leaveBalances }) => {
  const [formData, setFormData] = useState({
    type: '',
    duration: '',
    startDate: '',
    endDate: '',
    reason: '',
    handoverPlan: '',
    isBackdated: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Clear error when user starts typing again
    if (formError) {
      setFormError(null);
    }
  };
  
  // Calculate the number of days between two dates
  const calculateDays = (startDate: Date, endDate: Date): number => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end days
    return diffDays;
  };
  
  // Check if there's enough leave balance for the requested type and duration
  const hasEnoughBalance = (type: string, days: number): boolean => {
    // Map frontend types to potential backend types
    const typeToCheck = type.toLowerCase();
    
    // Find the balance with appropriate matching
    const balance = leaveBalances.find(balance => {
      const balanceType = balance.type.toLowerCase();
      
      if (typeToCheck === 'annual' && balanceType.includes('annual')) return true;
      if (typeToCheck === 'sick' && balanceType.includes('sick')) return true;
      if (typeToCheck === 'personal' && balanceType.includes('personal')) return true;
      
      return false;
    });
    
    if (!balance) {
      return false; // Balance not found for this type
    }
    
    // For half-day requests, count as 0.5 days
    const adjustedDays = formData.duration === 'half-day' ? 0.5 : days;
    
    return balance.remaining >= adjustedDays;
  };

  const validateForm = (): boolean => {
    // Check all required fields
    if (!formData.type || !formData.duration || !formData.startDate || !formData.endDate || !formData.reason) {
      setFormError('Please fill in all fields');
      return false;
    }

    // Validate dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Only check for past dates if not backdated
    if (!formData.isBackdated && startDate < today) {
      setFormError('Start date cannot be in the past. Check "Backdated Leave" if you need to apply for past dates.');
      return false;
    }

    if (endDate < startDate) {
      setFormError('End date cannot be before start date');
      return false;
    }
    
    // Calculate the number of days requested
    const days = calculateDays(startDate, endDate);
    
    // Check leave balance
    if (!hasEnoughBalance(formData.type, days)) {
      const leaveType = formData.type.charAt(0).toUpperCase() + formData.type.slice(1);
      setFormError(`Insufficient ${leaveType} balance for the requested duration.`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const submitData = {
        type: formData.type as LeaveType,
        duration: formData.duration as DurationType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason.trim() + (formData.handoverPlan ? `\n\nHandover Plan: ${formData.handoverPlan.trim()}` : '')
      };

      // Add backdated flag if applicable
      if (formData.isBackdated) {
        (submitData as any).isBackdated = true;
      }

      await onSubmit(submitData);
      
      // Reset form on successful submission
      setFormData({
        type: '',
        duration: '',
        startDate: '',
        endDate: '',
        reason: '',
        handoverPlan: '',
        isBackdated: false
      });
      
      // Show success notification
      alert('Leave request submitted successfully! Awaiting approval.');
    } catch (error) {
      console.error('Form submission error:', error);
      
      let errorMessage = error instanceof Error ? error.message : 'Failed to submit request';
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="neo-box p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-6">New Leave Request</h3>
      
      {formError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{formError}</span>
          <span 
            className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
            onClick={() => setFormError(null)}
          >
            <i className="bi bi-x"></i>
          </span>
        </div>
      )}
      
      <form id="leaveRequestForm" className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 mb-2">Leave Type</label>
            <select 
              className="neo-select" 
              required
              name="type"
              value={formData.type}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              <option value="">Select Leave Type</option>
              {leaveBalances.map((balance, index) => {
                // Convert backend type (like "Sick Leave") to frontend type ("sick")
                let typeValue = '';
                if (balance.type.toLowerCase().includes('annual')) typeValue = 'annual';
                else if (balance.type.toLowerCase().includes('sick')) typeValue = 'sick';
                else if (balance.type.toLowerCase().includes('personal')) typeValue = 'personal';
                else typeValue = 'other';
                
                return (
                  <option key={index} value={typeValue}>
                    {balance.type} ({balance.remaining} days remaining)
                  </option>
                );
              })}
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
              min={formData.isBackdated ? undefined : new Date().toISOString().split('T')[0]}
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
              disabled={isSubmitting}
              min={formData.startDate || (formData.isBackdated ? undefined : new Date().toISOString().split('T')[0])}
            />
          </div>
        </div>
        
        {/* Backdated Leave Option */}
        <div className="border-t pt-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="isBackdated"
              checked={formData.isBackdated}
              onChange={handleChange}
              disabled={isSubmitting}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-gray-700 font-medium">Backdated Leave Application</span>
          </label>
          <p className="text-sm text-gray-500 mt-1 ml-7">
            Check this box if you're applying for leave that has already occurred or for dates in the past.
            {formData.isBackdated && (
              <span className="block text-orange-600 font-medium mt-1">
                ⚠️ Backdated applications may require additional justification and approval.
              </span>
            )}
          </p>
        </div>
        
        {/* Leave balance information */}
        {formData.type && formData.startDate && formData.endDate && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
            <h4 className="font-semibold mb-2">Leave Balance Check</h4>
            {formData.type && (() => {
              const selectedType = formData.type;
              // Find the matching balance using the same logic as in hasEnoughBalance
              const typeToCheck = selectedType.toLowerCase();
              const balance = leaveBalances.find(balance => {
                const balanceType = balance.type.toLowerCase();
                
                if (typeToCheck === 'annual' && balanceType.includes('annual')) return true;
                if (typeToCheck === 'sick' && balanceType.includes('sick')) return true;
                if (typeToCheck === 'personal' && balanceType.includes('personal')) return true;
                
                return false;
              });
              
              const start = new Date(formData.startDate);
              const end = new Date(formData.endDate);
              const days = calculateDays(start, end);
              const adjustedDays = formData.duration === 'half-day' ? 0.5 : days;
              
              return balance ? (
                <div>
                  <span className="font-medium">{balance.type}:</span> {balance.remaining} days available
                  <div className="mt-1">
                    <span className="font-medium">Requested:</span> {adjustedDays} {adjustedDays === 1 ? 'day' : 'days'}
                    <div className={`mt-1 ${balance.remaining >= adjustedDays ? 'text-green-700' : 'text-red-700'}`}>
                      {balance.remaining >= adjustedDays 
                        ? `Sufficient balance (${balance.remaining - adjustedDays} days will remain)` 
                        : `Insufficient balance (${Math.abs(balance.remaining - adjustedDays)} days short)`}
                    </div>
                  </div>
                </div>
              ) : <div>Selected leave type not found in your balances.</div>;
            })()}
          </div>
        )}
        
        <div>
          <label className="block text-gray-700 mb-2">Reason</label>
          <textarea 
            className="neo-textarea" 
            placeholder="Please provide a reason for your leave request" 
            required
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          ></textarea>
        </div>
        <div className="flex justify-end">
          <button 
            type="submit" 
            className="neo-button primary p-3 flex items-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <i className="bi bi-hourglass-split animate-spin"></i>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <i className="bi bi-send"></i>
                <span>Submit Request</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveRequestForm; 