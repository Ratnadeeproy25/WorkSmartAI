import React, { useState, FormEvent, useRef } from 'react';
import { ReimbursementRequest, ExpenseType } from './types';

interface ReimbursementRequestFormProps {
  onSubmit: (
    reimbursementRequest: Omit<ReimbursementRequest, 'id' | 'createdAt' | 'status'> & { receipt: File[] }
  ) => void;
}

const ReimbursementRequestForm: React.FC<ReimbursementRequestFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    type: '',
    amount: '',
    date: '',
    description: ''
  });
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviewsVisible, setFilePreviewsVisible] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing again
    if (formError) {
      setFormError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      setFilePreviewsVisible(true);
      
      // Clear error if there was one about files
      if (formError && formError.includes('receipt')) {
        setFormError(null);
      }
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

    // Validate files
    if (files.length === 0) {
      setFormError('Please attach at least one receipt');
      return false;
    }

    // Validate file types and sizes
    const validFileTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    
    for (const file of files) {
      if (!validFileTypes.includes(file.type)) {
        setFormError('Only JPEG, PNG, and PDF files are allowed');
        return false;
      }
      
      if (file.size > maxFileSize) {
        setFormError('File size should not exceed 5MB');
        return false;
      }
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
        receipts: [], // This will be handled by the parent component
        receipt: files
      });
      
      // Reset form on successful submission
      setFormData({
        type: '',
        amount: '',
        date: '',
        description: ''
      });
      setFiles([]);
      setFilePreviewsVisible(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
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
        <div>
          <label className="block text-gray-700 mb-2">Receipt</label>
          <div className="neo-box p-4">
            <div className="flex items-center justify-center">
              <input 
                type="file" 
                ref={fileInputRef}
                id="receiptUpload" 
                name="receipt" 
                className="hidden" 
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.pdf"
                multiple
                disabled={isSubmitting}
              />
              <label 
                htmlFor="receiptUpload" 
                className={`neo-button p-3 flex items-center gap-2 cursor-pointer ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <i className="bi bi-upload"></i>
                <span>Upload Receipt</span>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">Supported formats: JPG, PNG, PDF (Max 5MB)</p>
          </div>
          
          {/* File Previews */}
          {filePreviewsVisible && files.length > 0 && (
            <div className="file-preview">
              {files.map((file, index) => (
                <div key={index} className="file-preview-item">
                  {file.type.startsWith('image/') ? (
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={file.name} 
                      className="file-preview-image" 
                    />
                  ) : (
                    <i className="bi bi-file-pdf text-3xl text-red-500"></i>
                  )}
                  
                  <div className="file-preview-info">
                    <div className="file-preview-name">{file.name}</div>
                    <div className="file-preview-size">{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
              ))}
            </div>
          )}
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