import React, { useState, FormEvent } from 'react';
import { ReimbursementRequest, ExpenseType } from './types';

interface ReimbursementRequestFormProps {
  onSubmit: (
    reimbursementRequest: Omit<ReimbursementRequest, 'id' | 'createdAt' | 'status'>
  ) => void;
}

const ReimbursementRequestForm: React.FC<ReimbursementRequestFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    type: '',
    amount: '',
    date: '',
    description: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing again
    if (formError) {
      setFormError(null);
    }
  };

  const validateForm = (): boolean => {
    // Check all required fields
    if (!formData.type || !formData.amount || !formData.date || !formData.description) {
      setFormError('Please fill in all fields');
      return false;
    }

    // Validate amount
    if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      setFormError('Please enter a valid amount greater than 0');
      return false;
    }

    // Validate date
    const expenseDate = new Date(formData.date);
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    if (expenseDate > today) {
      setFormError('Expense date cannot be in the future');
      return false;
    }

    if (expenseDate < thirtyDaysAgo) {
      setFormError('Expenses must be submitted within 30 days');
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
      await onSubmit({
        type: formData.type as ExpenseType,
        amount: parseFloat(formData.amount),
        date: formData.date,
        description: formData.description.trim(),
        receipts: [] // Empty receipts array
      });
      
      // Reset form on successful submission
      setFormData({
        type: '',
        amount: '',
        date: '',
        description: ''
      });
    } catch (error) {
      console.error('Form submission error:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
    
    // Prevent any potential default form submission behavior
    return false;
  };

  return (
    <div className="neo-box p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-6">New Reimbursement Request</h3>
      
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
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 mb-2">Expense Type</label>
            <select 
              className="neo-select" 
              name="type" 
              value={formData.type} 
              onChange={handleChange}
              required
              disabled={isSubmitting}
            >
              <option value="">Select Expense Type</option>
              <option value="travel">Travel</option>
              <option value="meals">Meals</option>
              <option value="office-supplies">Office Supplies</option>
              <option value="training">Training</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Amount</label>
            <input 
              type="number" 
              name="amount" 
              className="neo-input" 
              placeholder="Enter amount" 
              value={formData.amount} 
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Date of Expense</label>
          <input 
            type="date" 
            name="date" 
            className="neo-input" 
            value={formData.date} 
            onChange={handleChange}
            required
            disabled={isSubmitting}
            max={new Date().toISOString().split('T')[0]} // Cannot select future dates
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Description</label>
          <textarea 
            className="neo-textarea" 
            name="description" 
            placeholder="Please provide details about the expense" 
            value={formData.description} 
            onChange={handleChange}
            required
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

export default ReimbursementRequestForm;