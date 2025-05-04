import React, { useState } from 'react';
import { RequestType } from './types';

interface LeaveFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  leaveType: string;
  duration: string;
}

interface ReimbursementFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  expenseType: string;
  amount: string;
}

type Filters = LeaveFilters | ReimbursementFilters;

interface FilterPanelProps {
  requestType: RequestType;
  onApplyFilters: (filters: Filters) => void;
  onResetFilters: () => void;
  isVisible: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ 
  requestType, 
  onApplyFilters, 
  onResetFilters,
  isVisible
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [duration, setDuration] = useState('');
  const [expenseType, setExpenseType] = useState('');
  const [amount, setAmount] = useState('');

  const handleApplyFilters = () => {
    if (requestType === 'leave') {
      onApplyFilters({
        dateRange: {
          startDate,
          endDate
        },
        leaveType,
        duration
      } as LeaveFilters);
    } else {
      onApplyFilters({
        dateRange: {
          startDate,
          endDate
        },
        expenseType,
        amount
      } as ReimbursementFilters);
    }
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setLeaveType('');
    setDuration('');
    setExpenseType('');
    setAmount('');
    onResetFilters();
  };

  if (!isVisible) return null;

  return (
    <div className="neo-box p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
          <div className="flex gap-2">
            <input 
              type="date" 
              className="neo-input" 
              placeholder="Start Date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input 
              type="date" 
              className="neo-input" 
              placeholder="End Date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        
        {requestType === 'leave' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
              <select 
                className="neo-select"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="personal">Personal Leave</option>
                <option value="emergency">Emergency Leave</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
              <select 
                className="neo-select"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                <option value="">Any Duration</option>
                <option value="1">1 Day</option>
                <option value="2-5">2-5 Days</option>
                <option value="5+">More than 5 Days</option>
              </select>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expense Type</label>
              <select 
                className="neo-select"
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="travel">Travel</option>
                <option value="training">Training</option>
                <option value="equipment">Equipment</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount Range</label>
              <select 
                className="neo-select"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              >
                <option value="">Any Amount</option>
                <option value="0-100">$0 - $100</option>
                <option value="100-500">$100 - $500</option>
                <option value="500+">$500+</option>
              </select>
            </div>
          </>
        )}
      </div>
      <div className="flex justify-end mt-4">
        <button className="neo-button p-2 mr-2" onClick={handleResetFilters}>
          <i className="bi bi-arrow-counterclockwise"></i>
          <span>Reset</span>
        </button>
        <button className="neo-button primary p-2" onClick={handleApplyFilters}>
          <i className="bi bi-check-lg"></i>
          <span>Apply Filters</span>
        </button>
      </div>
    </div>
  );
};

export default FilterPanel; 