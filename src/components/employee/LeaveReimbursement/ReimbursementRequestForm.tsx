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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      setFilePreviewsVisible(true);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      alert('Please attach at least one receipt');
      return;
    }
    
    onSubmit({
      type: formData.type as ExpenseType,
      amount: parseFloat(formData.amount),
      date: formData.date,
      description: formData.description,
      receipts: [], // This will be handled by the parent component
      receipt: files
    });
    
    // Reset form
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
  };

  return (
    <div className="neo-box p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-6">New Reimbursement Request</h3>
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
              />
              <label 
                htmlFor="receiptUpload" 
                className="neo-button p-3 flex items-center gap-2 cursor-pointer"
              >
                <i className="bi bi-upload"></i>
                <span>Upload Receipt</span>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">Supported formats: JPG, PNG, PDF</p>
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
          >
            <i className="bi bi-send"></i>
            <span>Submit Request</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReimbursementRequestForm; 