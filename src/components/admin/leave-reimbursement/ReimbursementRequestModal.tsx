import React, { useState } from 'react';
import { ReimbursementRequest } from './types';

interface ReimbursementRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reimbursementRequest: Partial<ReimbursementRequest>) => void;
}

const ReimbursementRequestModal: React.FC<ReimbursementRequestModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit 
}) => {
  const [expenseType, setExpenseType] = useState('travel');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      expenseType,
      amount: parseFloat(amount),
      date,
      description,
      status: 'pending'
    });
    
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setExpenseType('travel');
    setAmount('');
    setDate('');
    setDescription('');
    setReceipt(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setReceipt(e.target.files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="neo-box p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">New Reimbursement Request</h3>
          <button className="neo-button p-2" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expense Type</label>
            <select 
              className="neo-select"
              value={expenseType}
              onChange={(e) => setExpenseType(e.target.value)}
              required
            >
              <option value="travel">Travel</option>
              <option value="training">Training</option>
              <option value="equipment">Equipment</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            <input 
              type="number" 
              className="neo-input" 
              placeholder="0.00"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input 
              type="date" 
              className="neo-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea 
              className="neo-input" 
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Receipt</label>
            <input 
              type="file" 
              className="neo-input"
              accept="image/*,.pdf"
              onChange={handleFileChange}
            />
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

export default ReimbursementRequestModal; 