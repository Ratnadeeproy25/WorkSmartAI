import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as managerLeaveService from '../services/managerLeaveService';
import { LeaveBalance } from '../components/employee/LeaveReimbursement/types';

// Define context types
interface ManagerLeaveBalanceContextType {
  leaveBalances: LeaveBalance[];
  fetchLeaveBalances: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Create context with default values
const ManagerLeaveBalanceContext = createContext<ManagerLeaveBalanceContextType>({
  leaveBalances: [],
  fetchLeaveBalances: async () => {},
  refreshBalances: async () => {},
  isLoading: false,
  error: null,
  lastUpdated: null
});

// Define props for context provider
interface ManagerLeaveBalanceProviderProps {
  children: ReactNode;
}

// Create provider component
export const ManagerLeaveBalanceProvider: React.FC<ManagerLeaveBalanceProviderProps> = ({ children }) => {
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Function to fetch manager leave balances
  const fetchLeaveBalances = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Fetching manager leave balances...');
      const balances = await managerLeaveService.getManagerLeaveBalance();
      console.log('✅ Manager leave balances fetched successfully:', balances);
      setLeaveBalances(balances);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('❌ Error fetching manager leave balances:', err);
      setError('Failed to load manager leave balances');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Force refresh function (bypasses cache if any)
  const refreshBalances = useCallback(async () => {
    console.log('🔄 Refreshing manager leave balances...');
    await fetchLeaveBalances();
  }, [fetchLeaveBalances]);

  // Fetch leave balances on initial load
  useEffect(() => {
    console.log('🚀 Initializing manager leave balance context...');
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
          console.log('👁️ Tab became active, refreshing manager leave balances...');
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
          console.log('🎯 Window focused, refreshing manager leave balances...');
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
    <ManagerLeaveBalanceContext.Provider value={value}>
      {children}
    </ManagerLeaveBalanceContext.Provider>
  );
};

// Custom hook for using the manager leave balance context
export const useManagerLeaveBalance = () => useContext(ManagerLeaveBalanceContext);

export default ManagerLeaveBalanceContext; 