import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as leaveService from '../services/leaveService';
import { LeaveBalance } from '../components/employee/LeaveReimbursement/types';

// Define context types
interface LeaveBalanceContextType {
  leaveBalances: LeaveBalance[];
  fetchLeaveBalances: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Create context with default values
const LeaveBalanceContext = createContext<LeaveBalanceContextType>({
  leaveBalances: [],
  fetchLeaveBalances: async () => {},
  refreshBalances: async () => {},
  isLoading: false,
  error: null,
  lastUpdated: null
});

// Define props for context provider
interface LeaveBalanceProviderProps {
  children: ReactNode;
}

// Create provider component
export const LeaveBalanceProvider: React.FC<LeaveBalanceProviderProps> = ({ children }) => {
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Function to fetch leave balances
  const fetchLeaveBalances = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const balances = await leaveService.getLeaveBalance();
      setLeaveBalances(balances);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching leave balances:', err);
      setError('Failed to load leave balances');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Force refresh function (bypasses cache if any)
  const refreshBalances = useCallback(async () => {
    console.log('🔄 Refreshing leave balances...');
    await fetchLeaveBalances();
  }, [fetchLeaveBalances]);

  // Fetch leave balances on initial load
  useEffect(() => {
    fetchLeaveBalances();
  }, [fetchLeaveBalances]);

  // Auto-refresh balances when user becomes active (e.g., returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && lastUpdated) {
        const now = new Date();
        const timeDiff = now.getTime() - lastUpdated.getTime();
        // Refresh if it's been more than 30 seconds since last update
        if (timeDiff > 30000) {
          console.log('👁️ Tab became active, refreshing leave balances...');
          refreshBalances();
        }
      }
    };

    const handleFocus = () => {
      if (lastUpdated) {
        const now = new Date();
        const timeDiff = now.getTime() - lastUpdated.getTime();
        // Refresh if it's been more than 10 seconds since last update
        if (timeDiff > 10000) {
          console.log('🎯 Window focused, refreshing leave balances...');
          refreshBalances();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshBalances, lastUpdated]);

  // Create value object to be provided to consumers
  const value = {
    leaveBalances,
    fetchLeaveBalances,
    refreshBalances,
    isLoading,
    error,
    lastUpdated
  };

  return (
    <LeaveBalanceContext.Provider value={value}>
      {children}
    </LeaveBalanceContext.Provider>
  );
};

// Custom hook for using the leave balance context
export const useLeaveBalance = () => useContext(LeaveBalanceContext);

export default LeaveBalanceContext; 