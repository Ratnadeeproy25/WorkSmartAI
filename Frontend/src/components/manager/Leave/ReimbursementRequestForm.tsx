import React, { useState, FormEvent } from 'react';
import { ExpenseType } from '../../../components/employee/LeaveReimbursement/types';

interface ReimbursementRequestFormProps {
  onSubmit: (formData: FormData) => Promise<boolean>;
}

const ReimbursementRequestForm: React.FC<ReimbursementRequestFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    type: '',
    amount: '',
    dateOfExpense: '',
    description: '',
    justification: '',
  });
  const [receipts, setReceipts] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error on change
    if (formError) setFormError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to array and append to existing files
      const newFiles = Array.from(e.target.files);
      setReceipts(prev => [...prev, ...newFiles]);
    }
    
    // Reset the input field so the same file can be selected again if needed
    e.target.value = '';
  };

  const removeReceipt = (index: number) => {
    setReceipts(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    // Check all required fields
    if (!formData.type || !formData.amount || !formData.dateOfExpense || !formData.description) {
      setFormError('Please fill in all required fields');
      return false;
    }

    // Validate amount
    if (parseFloat(formData.amount) <= 0) {
      setFormError('Amount must be greater than zero');
      return false;
    }

    // Validate receipt
    if (receipts.length === 0) {
      setFormError('Please upload at least one receipt');
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
      // Create form data for multipart/form-data submission
      const submitData = new FormData();
      submitData.append('type', formData.type);
      submitData.append('amount', formData.amount);
      submitData.append('date', formData.dateOfExpense);
      submitData.append('description', 
        formData.description + (formData.justification ? `\n\nBusiness Justification: ${formData.justification}` : ''));
      
      // Append each receipt file
      receipts.forEach(file => {
        submitData.append('receipts', file);
      });
      
      await onSubmit(submitData);
      
      // Reset form on successful submission
      setFormData({
        type: '',
        amount: '',
        dateOfExpense: '',
        description: '',
        justification: ''
      });
      setReceipts([]);
      
      // Show success message
      alert('Reimbursement request submitted successfully! Awaiting approval.');
    } catch (error) {
      console.error('Form submission error:', error);
      
      let errorMessage = error instanceof Error ? error.message : 'Failed to submit request';
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format file size display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
      
      <form id="reimbursementRequestForm" className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 mb-2">Expense Type</label>
            <select 
              className="neo-select" 
              required
              name="type"
              value={formData.type}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              <option value="">Select Expense Type</option>
              <option value="travel">Travel</option>
              <option value="meals">Meals</option>
              <option value="office-supplies">Office Supplies</option>
              <option value="training">Training</option>
              <option value="team-building">Team Building</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Amount</label>
            <input 
              type="number" 
              className="neo-input" 
              placeholder="Enter amount" 
              required
              min="0"
              step="0.01"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Date of Expense</label>
          <input 
            type="date" 
            className="neo-input" 
            required
            name="dateOfExpense"
            value={formData.dateOfExpense}
            onChange={handleChange}
            disabled={isSubmitting}
            max={new Date().toISOString().split('T')[0]} // Can't select future dates
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Description</label>
          <textarea 
            className="neo-textarea" 
            placeholder="Please provide details about the expense" 
            required
            name="description"
            value={formData.description}
            onChange={handleChange}
            disabled={isSubmitting}
          ></textarea>
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Business Justification</label>
          <textarea 
            className="neo-textarea" 
            placeholder="Please explain how this expense benefits the business" 
            required
            name="justification"
            value={formData.justification}
            onChange={handleChange}
            disabled={isSubmitting}
          ></textarea>
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Receipts</label>
          <div className="neo-box p-4">
            <input 
              type="file" 
              id="receiptUpload" 
              className="hidden"
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.pdf"
              multiple
              disabled={isSubmitting}
            />
            <label htmlFor="receiptUpload" className="neo-button p-3 inline-flex items-center gap-2 cursor-pointer">
              <i className="bi bi-upload"></i>
              <span>Upload Receipt</span>
            </label>
            <p className="text-sm text-gray-500 mt-2">
              Supported formats: JPG, PNG, PDF
            </p>
            
            {/* Display uploaded files */}
            {receipts.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium">Uploaded Receipts:</h4>
                {receipts.map((file, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                    <div className="flex items-center">
                      <i className="bi bi-file-earmark mr-2"></i>
                      <span className="text-sm">{file.name} ({formatFileSize(file.size)})</span>
                    </div>
                    <button 
                      type="button" 
                      className="text-red-500 hover:text-red-700"
                      onClick={() => removeReceipt(idx)}
                      disabled={isSubmitting}
                    >
                      <i className="bi bi-x-circle"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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