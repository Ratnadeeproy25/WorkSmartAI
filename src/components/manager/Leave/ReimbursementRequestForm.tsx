import React, { useState, FormEvent } from 'react';

const ReimbursementRequestForm: React.FC = () => {
  const [formData, setFormData] = useState({
    expenseType: '',
    amount: '',
    dateOfExpense: '',
    description: '',
    justification: '',
    receipt: null as File | null
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, receipt: e.target.files![0] }));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    alert('Reimbursement request submitted successfully! Awaiting admin approval.');
    // In a real application, you would send the form data to a server
    console.log('Form submitted:', formData);
    
    // Reset form
    setFormData({
      expenseType: '',
      amount: '',
      dateOfExpense: '',
      description: '',
      justification: '',
      receipt: null
    });
  };

  return (
    <div className="neo-box p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-6">New Reimbursement Request</h3>
      <form id="reimbursementRequestForm" className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 mb-2">Expense Type</label>
            <select 
              className="neo-select" 
              required
              name="expenseType"
              value={formData.expenseType}
              onChange={handleChange}
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
              name="amount"
              value={formData.amount}
              onChange={handleChange}
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
          ></textarea>
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Receipt</label>
          <div className="neo-box p-4 text-center">
            <input 
              type="file" 
              id="receiptUpload" 
              className="hidden"
              name="receipt"
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.pdf"
            />
            <label htmlFor="receiptUpload" className="neo-button p-3 inline-flex items-center gap-2 cursor-pointer">
              <i className="bi bi-upload"></i>
              <span>Upload Receipt</span>
            </label>
            <p className="text-sm text-gray-500 mt-2">
              Supported formats: JPG, PNG, PDF
            </p>
          </div>
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

export default ReimbursementRequestForm; 