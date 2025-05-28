import React from 'react';
import { LeaveBalance as LeaveBalanceType } from '../../../components/employee/LeaveReimbursement/types';
import * as managerLeaveService from '../../../services/managerLeaveService';
import { useManagerLeaveBalance } from '../../../contexts/ManagerLeaveBalanceContext';

interface LeaveBalanceProps {
  leaveBalances: LeaveBalanceType[];
  onBalanceReset?: () => Promise<void>;
}

const LeaveBalance: React.FC<LeaveBalanceProps> = ({ leaveBalances, onBalanceReset }) => {
  const [isResetting, setIsResetting] = React.useState(false);
  const { fetchLeaveBalances } = useManagerLeaveBalance();

  const handleRefreshBalance = async () => {
    try {
      await fetchLeaveBalances();
    } catch (error) {
      console.error('Failed to refresh leave balance:', error);
      alert('Failed to refresh leave balance. Please try again later.');
    }
  };

  const handleResetBalance = async () => {
    if (window.confirm('Are you sure you want to reset your leave balances? This will restore all default leave allocations for the current year.')) {
      try {
        setIsResetting(true);
        await managerLeaveService.resetManagerLeaveBalance();
        // Refresh balances if parent provided the function
        if (onBalanceReset) {
          await onBalanceReset();
        }
      } catch (error) {
        console.error('Failed to reset manager leave balance:', error);
        alert('Failed to reset leave balance. Please try again later.');
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="neo-box p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Leave Balance</h3>
        <div className="flex gap-2">
          <button
            onClick={handleRefreshBalance}
            className="neo-button text-sm py-1 px-3 flex items-center gap-1"
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Refresh Balance</span>
          </button>
          <button
            onClick={handleResetBalance}
            className="neo-button text-sm py-1 px-3 flex items-center gap-1"
            disabled={isResetting}
          >
            {isResetting ? (
              <>
                <i className="bi bi-hourglass-split animate-spin"></i>
                <span>Resetting...</span>
              </>
            ) : (
              <>
                <i className="bi bi-arrow-repeat"></i>
                <span>Reset Balance</span>
              </>
            )}
          </button>
        </div>
      </div>
      {leaveBalances.length === 0 ? (
        <div className="text-gray-500 text-center py-6">
          No leave balances found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {leaveBalances.map((balance, index) => (
            <div className="neo-box p-6 text-center" key={index}>
              <div className={`text-2xl font-bold ${balance.color ? balance.color : 'text-blue-600'}`}>
                {balance.remaining}
              </div>
              <div className="text-sm text-gray-600">{balance.type}</div>
              <div className="text-xs text-gray-500 mt-2">Days remaining</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaveBalance; 