import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../../styles/employee/dashboard.css';
import { useAuth } from '../../../context/AuthContext';
import { getDashboardData, LeaveData, ReimbursementData } from '../../../services/dashboardService';

const LeaveReimbursement: React.FC = () => {
  const { userId } = useAuth();
  const [leaveData, setLeaveData] = useState<LeaveData>({
    balances: {
      annualLeave: { total: 20, used: 5 },
      sickLeave: { total: 10, used: 2 },
      personalLeave: { total: 5, used: 2 }
    },
    recentRequests: []
  });
  const [reimbursementData, setReimbursementData] = useState<ReimbursementData>({
    recentRequests: [],
    summary: {
      pending: { amount: 0, count: 0 },
      approved: { amount: 0, count: 0 }
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!userId) return;
        setLoading(true);
        
        const dashboardData = await getDashboardData(userId);
        setLeaveData(dashboardData.leaveData);
        setReimbursementData(dashboardData.reimbursementData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching leave/reimbursement data:', err);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Skeleton loader for leave/reimbursement items
  const ItemSkeleton = () => (
    <div className="task-item animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="task-avatar bg-gray-300"></div>
          <div>
            <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-16"></div>
          </div>
        </div>
        <div className="h-6 bg-gray-300 rounded w-20"></div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
      {/* Leave Requests Section */}
      <div className="neo-box p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-700">Leave Requests</h2>
          <Link to="/employee/leave#leaveSection" className="neo-button primary px-4 py-2">
            <i className="bi bi-plus-lg mr-2"></i>New Request
          </Link>
        </div>

        {/* Leave Balance Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="neo-box p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {loading ? (
                <div className="h-7 bg-gray-300 rounded w-10 mx-auto"></div>
              ) : (
                leaveData.balances.annualLeave.total - leaveData.balances.annualLeave.used
              )}
            </div>
            <div className="text-sm text-gray-600">Annual Leave</div>
            <div className="text-xs text-gray-500">Remaining</div>
          </div>
          <div className="neo-box p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {loading ? (
                <div className="h-7 bg-gray-300 rounded w-10 mx-auto"></div>
              ) : (
                leaveData.balances.sickLeave.total - leaveData.balances.sickLeave.used
              )}
            </div>
            <div className="text-sm text-gray-600">Sick Leave</div>
            <div className="text-xs text-gray-500">Remaining</div>
          </div>
          <div className="neo-box p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {loading ? (
                <div className="h-7 bg-gray-300 rounded w-10 mx-auto"></div>
              ) : (
                leaveData.balances.personalLeave.total - leaveData.balances.personalLeave.used
              )}
            </div>
            <div className="text-sm text-gray-600">Personal</div>
            <div className="text-xs text-gray-500">Remaining</div>
          </div>
        </div>

        {/* Recent Leave Requests */}
        <div className="space-y-4">
          {loading ? (
            <>
              <ItemSkeleton />
              <ItemSkeleton />
            </>
          ) : error ? (
            <div className="text-center text-red-500 py-4">{error}</div>
          ) : leaveData.recentRequests.length === 0 ? (
            <div className="text-center text-gray-500 py-4">No recent leave requests found.</div>
          ) : (
            leaveData.recentRequests.map((leave) => (
              <div className="task-item" key={leave.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="task-avatar bg-blue-500">
                      {leave.type.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">{leave.type}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(leave.startDate).toLocaleDateString()} - 
                        {new Date(leave.endDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{leave.days} days</div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                    leave.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 text-center">
          <Link to="/employee/leave#leaveSection" className="neo-button p-2 inline-flex items-center gap-2">
            <span>View All Requests</span>
            <i className="bi bi-arrow-right"></i>
          </Link>
        </div>
      </div>

      {/* Reimbursement Requests Section */}
      <div className="neo-box p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-700">Reimbursement Requests</h2>
          <Link to="/employee/leave#reimbursementSection" className="neo-button primary px-4 py-2">
            <i className="bi bi-plus-lg mr-2"></i>New Request
          </Link>
        </div>

        {/* Recent Reimbursement Requests */}
        <div className="space-y-4 mb-6">
          {loading ? (
            <>
              <ItemSkeleton />
              <ItemSkeleton />
            </>
          ) : error ? (
            <div className="text-center text-red-500 py-4">{error}</div>
          ) : reimbursementData.recentRequests.length === 0 ? (
            <div className="text-center text-gray-500 py-4">No recent reimbursement requests found.</div>
          ) : (
            reimbursementData.recentRequests.map((request) => (
              <div className="task-item" key={request.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="task-avatar bg-green-500">
                      {request.type.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">{request.type}</div>
                      <div className="text-sm text-gray-600">{request.description}</div>
                      <div className="text-xs text-gray-500 mt-1">₹{request.amount.toFixed(2)}</div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    request.status === 'approved' ? 'bg-green-100 text-green-800' :
                    request.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reimbursement Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="neo-box p-4">
            <div className="text-sm text-gray-600 mb-1">Total Pending</div>
            <div className="text-2xl font-bold text-yellow-600">
              {loading ? (
                <div className="h-7 bg-gray-300 rounded w-24"></div>
              ) : (
                `₹${reimbursementData.summary.pending.amount.toFixed(2)}`
              )}
            </div>
            <div className="text-xs text-gray-500">
              {loading ? (
                <div className="h-3 bg-gray-300 rounded w-16 mt-1"></div>
              ) : (
                `${reimbursementData.summary.pending.count} requests`
              )}
            </div>
          </div>
          <div className="neo-box p-4">
            <div className="text-sm text-gray-600 mb-1">Total Approved</div>
            <div className="text-2xl font-bold text-green-600">
              {loading ? (
                <div className="h-7 bg-gray-300 rounded w-24"></div>
              ) : (
                `₹${reimbursementData.summary.approved.amount.toFixed(2)}`
              )}
            </div>
            <div className="text-xs text-gray-500">Last 30 days</div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link to="/employee/leave#reimbursementSection" className="neo-button p-2 inline-flex items-center gap-2">
            <span>View All Reimbursements</span>
            <i className="bi bi-arrow-right"></i>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LeaveReimbursement; 