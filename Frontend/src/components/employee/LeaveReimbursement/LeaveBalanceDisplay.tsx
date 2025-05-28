import React, { useEffect, useRef, useState } from 'react';
import { LeaveBalance } from './types';
import * as leaveService from '../../../services/leaveService';
import { useLeaveBalance } from '../../../contexts/LeaveBalanceContext';

interface LeaveBalanceDisplayProps {
  leaveBalances: LeaveBalance[];
  onBalanceReset?: () => void;
}

const LeaveBalanceDisplay: React.FC<LeaveBalanceDisplayProps> = ({ leaveBalances, onBalanceReset }) => {
  const [isResetting, setIsResetting] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const { fetchLeaveBalances, refreshBalances, lastUpdated } = useLeaveBalance();
  const [previousBalances, setPreviousBalances] = useState<Record<string, number>>({});
  const [highlightedBalances, setHighlightedBalances] = useState<Record<string, boolean>>({});
  
  // Track previous balance values to detect changes
  useEffect(() => {
    const currentBalanceMap: Record<string, number> = {};
    const highlightMap: Record<string, boolean> = {};
    
    // Check if any balance has changed
    leaveBalances.forEach(balance => {
      const key = balance.type;
      currentBalanceMap[key] = balance.remaining;
      
      // If previous balance exists and doesn't match current, highlight it
      if (previousBalances[key] !== undefined && 
          previousBalances[key] !== balance.remaining) {
        highlightMap[key] = true;
      }
    });
    
    // Set highlights if there are any changes
    if (Object.keys(highlightMap).length > 0) {
      setHighlightedBalances(highlightMap);
      
      // Clear highlights after animation completes
      const timer = setTimeout(() => {
        setHighlightedBalances({});
      }, 1500);
      
      return () => clearTimeout(timer);
    }
    
    // Update previous balances for next comparison
    setPreviousBalances(currentBalanceMap);
  }, [leaveBalances]);
  
  const handleResetBalance = async () => {
    if (window.confirm('Are you sure you want to reset your leave balances? This will restore all default leave allocations for the current year.')) {
      try {
        setIsResetting(true);
        await leaveService.resetLeaveBalance();
        // Refresh both context and any parent components
        await fetchLeaveBalances();
        if (onBalanceReset) {
          onBalanceReset();
        }
      } catch (error) {
        console.error('Failed to reset leave balance:', error);
        alert('Failed to reset leave balance. Please try again later.');
      } finally {
        setIsResetting(false);
      }
    }
  };

  const handleRefreshBalance = async () => {
    try {
      setIsRefreshing(true);
      await refreshBalances();
    } catch (error) {
      console.error('Failed to refresh leave balance:', error);
      alert('Failed to refresh leave balance. Please try again later.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    
    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };
  
  return (
    <div className="neo-box p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Leave Balance</h3>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {formatLastUpdated(lastUpdated)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefreshBalance}
            className="neo-button text-sm py-1 px-3 flex items-center gap-1"
            disabled={isRefreshing}
            title="Refresh leave balance to see latest updates"
          >
            {isRefreshing ? (
              <>
                <i className="bi bi-arrow-repeat animate-spin"></i>
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise"></i>
                <span>Refresh</span>
              </>
            )}
          </button>
          <button
            onClick={handleResetBalance}
            className="neo-button text-sm py-1 px-3 flex items-center gap-1"
            disabled={isResetting}
            title="Reset leave balance to default values"
          >
            {isResetting ? (
              <>
                <i className="bi bi-hourglass-split animate-spin"></i>
                <span>Resetting...</span>
              </>
            ) : (
              <>
                <i className="bi bi-arrow-repeat"></i>
                <span>Reset</span>
              </>
            )}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {leaveBalances.map((balance, index) => (
          <div 
            key={index} 
            className={`neo-box p-6 text-center transition-all duration-500 ${
              highlightedBalances[balance.type] ? 'shadow-lg scale-105 ring-2 ring-blue-400' : ''
            }`}
          >
            <div 
              className={`text-2xl font-bold ${
                highlightedBalances[balance.type] ? 'animate-pulse' : ''
              }`}
              style={{ color: balance.color }}
            >
              {balance.remaining}
            </div>
            <div className="text-sm text-gray-600">{balance.type}</div>
            <div className="text-xs text-gray-500 mt-2">Days remaining</div>
            {highlightedBalances[balance.type] && previousBalances[balance.type] !== undefined && (
              <div className="mt-2 text-xs font-medium text-red-600">
                {previousBalances[balance.type] > balance.remaining
                  ? `↓ (-${(previousBalances[balance.type] - balance.remaining).toFixed(1)})`
                  : `↑ (+${(balance.remaining - previousBalances[balance.type]).toFixed(1)})`
                }
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <i className="bi bi-info-circle text-blue-600 mt-0.5"></i>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">💡 Leave Balance Updates</p>
            <p>Your leave balance updates automatically when:</p>
            <ul className="mt-1 ml-4 list-disc text-xs space-y-0.5">
              <li>You submit a new leave request</li>
              <li>Your manager or admin approves/rejects your requests</li>
              <li>You return to this page (auto-refresh)</li>
            </ul>
            <p className="mt-2 text-xs">If you don't see recent changes, click the <strong>Refresh</strong> button above.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveBalanceDisplay; 