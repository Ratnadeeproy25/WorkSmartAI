import React from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../../styles/employee/dashboard.css';

const LeaveReimbursement: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
      {/* Leave Requests Section */}
      <div className="neo-box p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-700">Leave Requests</h2>
          <Link to="/leave#leaveSection" className="neo-button primary px-4 py-2">
            <i className="bi bi-plus-lg mr-2"></i>New Request
          </Link>
        </div>

        {/* Leave Balance Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="neo-box p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">15</div>
            <div className="text-sm text-gray-600">Annual Leave</div>
            <div className="text-xs text-gray-500">Remaining</div>
          </div>
          <div className="neo-box p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">8</div>
            <div className="text-sm text-gray-600">Sick Leave</div>
            <div className="text-xs text-gray-500">Remaining</div>
          </div>
          <div className="neo-box p-4 text-center">
            <div className="text-2xl font-bold text-green-600">3</div>
            <div className="text-sm text-gray-600">Personal</div>
            <div className="text-xs text-gray-500">Remaining</div>
          </div>
        </div>

        {/* Recent Leave Requests */}
        <div className="space-y-4">
          <div className="task-item">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="task-avatar bg-blue-500">AL</div>
                <div>
                  <div className="font-medium text-gray-700">Annual Leave</div>
                  <div className="text-sm text-gray-600">Dec 15-20, 2023</div>
                  <div className="text-xs text-gray-500 mt-1">5 days</div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">Approved</span>
            </div>
          </div>
          <div className="task-item">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="task-avatar bg-purple-500">SL</div>
                <div>
                  <div className="font-medium text-gray-700">Sick Leave</div>
                  <div className="text-sm text-gray-600">Dec 10, 2023</div>
                  <div className="text-xs text-gray-500 mt-1">1 day</div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">Pending</span>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link to="/leave#leaveSection" className="neo-button p-2 inline-flex items-center gap-2">
            <span>View All Requests</span>
            <i className="bi bi-arrow-right"></i>
          </Link>
        </div>
      </div>

      {/* Reimbursement Requests Section */}
      <div className="neo-box p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-700">Reimbursement Requests</h2>
          <Link to="/leave#reimbursementSection" className="neo-button primary px-4 py-2">
            <i className="bi bi-plus-lg mr-2"></i>New Request
          </Link>
        </div>

        {/* Recent Reimbursement Requests */}
        <div className="space-y-4 mb-6">
          <div className="task-item">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="task-avatar bg-green-500">TR</div>
                <div>
                  <div className="font-medium text-gray-700">Travel Expenses</div>
                  <div className="text-sm text-gray-600">Client Meeting - NYC</div>
                  <div className="text-xs text-gray-500 mt-1">$450.00</div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">Approved</span>
            </div>
          </div>
          <div className="task-item">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="task-avatar bg-blue-500">TE</div>
                <div>
                  <div className="font-medium text-gray-700">Training Expense</div>
                  <div className="text-sm text-gray-600">Online Course</div>
                  <div className="text-xs text-gray-500 mt-1">$299.00</div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">Pending</span>
            </div>
          </div>
        </div>

        {/* Reimbursement Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="neo-box p-4">
            <div className="text-sm text-gray-600 mb-1">Total Pending</div>
            <div className="text-2xl font-bold text-yellow-600">$299.00</div>
            <div className="text-xs text-gray-500">2 requests</div>
          </div>
          <div className="neo-box p-4">
            <div className="text-sm text-gray-600 mb-1">Total Approved</div>
            <div className="text-2xl font-bold text-green-600">$750.00</div>
            <div className="text-xs text-gray-500">Last 30 days</div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link to="/leave#reimbursementSection" className="neo-button p-2 inline-flex items-center gap-2">
            <span>View All Reimbursements</span>
            <i className="bi bi-arrow-right"></i>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LeaveReimbursement; 