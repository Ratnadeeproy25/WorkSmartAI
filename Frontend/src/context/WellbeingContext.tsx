import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import managerWellbeingService from '../services/managerWellbeingService';

interface WorkLifeBalance {
  score: number;
  history: number[];
  factors: {
    workHours: number;
    breaksCount: number;
    afterHoursWork: number;
    focusTime: number;
  };
}

interface StressLevel {
  score: number;
  history: number[];
  factors: {
    deadlinePressure: string;
    workload: string;
    teamSupport: string;
    workEnvironment: string;
  };
}

interface JobSatisfaction {
  score: number;
  history: number[];
  factors: {
    roleClarity: string;
    skillUtilization: string;
    growthOpportunities: string;
    teamDynamics: string;
    taskCompletionRate: number;
  };
}

interface TeamCollaboration {
  score: number;
  history: number[];
  factors: {
    communicationQuality: string;
    peerSupport: string;
    conflictResolution: string;
    teamworkEfficiency: string;
  };
}

interface TeamWellbeing {
  workLifeBalance: {
    score: number;
    history: number[];
  };
  stressLevel: {
    score: number;
    history: number[];
  };
  satisfaction: {
    score: number;
    history: number[];
  };
  collaboration: {
    score: number;
    history: number[];
  };
}

interface ManagerWellbeingMetrics {
  workLifeBalance: WorkLifeBalance;
  stressLevel: StressLevel;
  jobSatisfaction: JobSatisfaction;
  teamCollaboration: TeamCollaboration;
  teamWellbeing: TeamWellbeing;
}

interface WellbeingResponse {
  wellbeingMetrics?: ManagerWellbeingMetrics;
  tasks?: any[];
  attendanceData?: any[];
}

interface WellbeingContextType {
  managerWellbeing: ManagerWellbeingMetrics;
  updateWellbeing: (metrics: Partial<ManagerWellbeingMetrics>) => void;
  updateMood: (mood: 'great' | 'good' | 'okay' | 'bad') => void;
  loading: boolean;
  error: string | null;
  refreshWellbeingData: () => Promise<void>;
  calculateWorkLifeBalance: (factors: WorkLifeBalance['factors']) => number;
  calculateStressLevel: (factors: StressLevel['factors'], tasks?: any[]) => number;
  calculateJobSatisfaction: (factors: JobSatisfaction['factors'], taskCompletionRate: number) => number;
  calculateTeamCollaboration: (factors: TeamCollaboration['factors']) => number;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const defaultWellbeingMetrics: ManagerWellbeingMetrics = {
  workLifeBalance: {
    score: 82,
    history: [80, 81, 82, 81, 82],
    factors: {
      workHours: 8.5,
      breaksCount: 4,
      afterHoursWork: 1.0,
      focusTime: 6.5
    }
  },
  stressLevel: {
    score: 85,
    history: [83, 84, 85, 84, 85],
    factors: {
      deadlinePressure: 'Moderate',
      workload: 'High',
      teamSupport: 'High',
      workEnvironment: 'Positive'
    }
  },
  jobSatisfaction: {
    score: 90,
    history: [88, 89, 90, 90, 90],
    factors: {
      roleClarity: 'High',
      skillUtilization: 'Optimal',
      growthOpportunities: 'Good',
      teamDynamics: 'Excellent',
      taskCompletionRate: 85
    }
  },
  teamCollaboration: {
    score: 88,
    history: [86, 87, 88, 88, 88],
    factors: {
      communicationQuality: 'Excellent',
      peerSupport: 'High',
      conflictResolution: 'Good',
      teamworkEfficiency: 'High'
    }
  },
  teamWellbeing: {
    workLifeBalance: {
      score: 78,
      history: [76, 77, 78, 77, 78]
    },
    stressLevel: {
      score: 80,
      history: [79, 80, 80, 80, 80]
    },
    satisfaction: {
      score: 85,
      history: [84, 85, 85, 85, 85]
    },
    collaboration: {
      score: 82,
      history: [81, 82, 82, 82, 82]
    }
  }
};

const WellbeingContext = createContext<WellbeingContextType | undefined>(undefined);

export const WellbeingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [managerWellbeing, setManagerWellbeing] = useState<ManagerWellbeingMetrics>(defaultWellbeingMetrics);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();

  // Calculate Work-Life Balance score based on factors
  const calculateWorkLifeBalance = (factors: WorkLifeBalance['factors']): number => {
    let score = 70; // Base score
    
    // Work hours factor (25% weight)
    if (factors.workHours >= 7 && factors.workHours <= 8) {
      score += 7.5; // Ideal work hours
    } else if (factors.workHours < 7) {
      score += 5; // Under-working might indicate efficiency
    } else if (factors.workHours > 10) {
      score -= 7.5; // Excessive work hours
    } else {
      score -= (factors.workHours - 8) * 2; // Gradual penalty for overtime
    }
    
    // Breaks count factor (25% weight)
    if (factors.breaksCount >= 3) {
      score += 7.5; // Good break frequency
    } else if (factors.breaksCount >= 1) {
      score += 5; // Some breaks
    } else {
      score -= 5; // No breaks taken
    }
    
    // After hours work factor (25% weight)
    if (factors.afterHoursWork === 0) {
      score += 7.5; // No overtime
    } else if (factors.afterHoursWork <= 1) {
      score += 2.5; // Minimal overtime
    } else {
      score -= factors.afterHoursWork * 2; // Penalty for excessive overtime
    }
    
    // Focus time factor (25% weight)
    if (factors.focusTime >= 5) {
      score += 7.5; // Good focus time
    } else if (factors.focusTime >= 3) {
      score += 5; // Moderate focus time
    } else {
      score += 2.5; // Low focus time
    }
    
    return Math.min(Math.max(Math.round(score), 70), 100);
  };

  // Calculate Stress Level score based on factors
  const calculateStressLevel = (factors: StressLevel['factors'], tasks?: any[]): number => {
    let score = 85; // Base score (higher is better for stress level)
    
    // Deadline pressure factor (30% weight)
    switch (factors.deadlinePressure) {
      case 'High':
        score -= 9;
        break;
      case 'Moderate':
        score -= 4.5;
        break;
      case 'Low':
        score += 0;
        break;
    }
    
    // Workload factor (30% weight)
    switch (factors.workload) {
      case 'Heavy':
        score -= 9;
        break;
      case 'Moderate':
        score -= 3;
        break;
      case 'Light':
        score += 3;
        break;
    }
    
    // Team support factor (20% weight)
    switch (factors.teamSupport) {
      case 'High':
        score += 6;
        break;
      case 'Moderate':
        score += 3;
        break;
      case 'Low':
        score -= 3;
        break;
    }
    
    // Work environment factor (20% weight)
    switch (factors.workEnvironment) {
      case 'Positive':
        score += 6;
        break;
      case 'Neutral':
        score += 0;
        break;
      case 'Negative':
        score -= 6;
        break;
    }
    
    return Math.min(Math.max(Math.round(score), 50), 100);
  };

  // Calculate Job Satisfaction score based on factors
  const calculateJobSatisfaction = (factors: JobSatisfaction['factors'], taskCompletionRate: number): number => {
    let score = 70; // Base score
    
    // Role clarity factor (20% weight)
    switch (factors.roleClarity) {
      case 'High':
        score += 6;
        break;
      case 'Good':
        score += 4;
        break;
      case 'Moderate':
        score += 2;
        break;
      case 'Low':
        score -= 2;
        break;
    }
    
    // Skill utilization factor (20% weight)
    switch (factors.skillUtilization) {
      case 'Optimal':
        score += 6;
        break;
      case 'Good':
        score += 4;
        break;
      case 'Moderate':
        score += 2;
        break;
      case 'Underutilized':
        score -= 2;
        break;
    }
    
    // Growth opportunities factor (20% weight)
    switch (factors.growthOpportunities) {
      case 'Good':
        score += 6;
        break;
      case 'Moderate':
        score += 3;
        break;
      case 'Limited':
        score -= 3;
        break;
    }
    
    // Team dynamics factor (20% weight)
    switch (factors.teamDynamics) {
      case 'Excellent':
        score += 6;
        break;
      case 'Good':
        score += 4;
        break;
      case 'Moderate':
        score += 2;
        break;
      case 'Poor':
        score -= 4;
        break;
    }
    
    // Task completion rate factor (20% weight)
    if (taskCompletionRate >= 90) {
      score += 6;
    } else if (taskCompletionRate >= 80) {
      score += 4;
    } else if (taskCompletionRate >= 70) {
      score += 2;
    } else if (taskCompletionRate >= 60) {
      score += 0;
    } else {
      score -= 3;
    }
    
    return Math.min(Math.max(Math.round(score), 60), 100);
  };

  // Calculate Team Collaboration score based on factors
  const calculateTeamCollaboration = (factors: TeamCollaboration['factors']): number => {
    let score = 70; // Base score
    
    // Communication quality factor (25% weight)
    switch (factors.communicationQuality) {
      case 'Excellent':
        score += 7.5;
        break;
      case 'Good':
        score += 5;
        break;
      case 'Moderate':
        score += 2.5;
        break;
      case 'Poor':
        score -= 2.5;
        break;
    }
    
    // Peer support factor (25% weight)
    switch (factors.peerSupport) {
      case 'High':
        score += 7.5;
        break;
      case 'Moderate':
        score += 5;
        break;
      case 'Low':
        score -= 2.5;
        break;
    }
    
    // Conflict resolution factor (25% weight)
    switch (factors.conflictResolution) {
      case 'Good':
        score += 7.5;
        break;
      case 'Moderate':
        score += 5;
        break;
      case 'Poor':
        score -= 2.5;
        break;
    }
    
    // Teamwork efficiency factor (25% weight)
    switch (factors.teamworkEfficiency) {
      case 'High':
        score += 7.5;
        break;
      case 'Moderate':
        score += 5;
        break;
      case 'Low':
        score -= 2.5;
        break;
    }
    
    return Math.min(Math.max(Math.round(score), 60), 100);
  };

  const fetchWellbeingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated and is a manager
      if (!auth.isAuthenticated) {
        setError('Authentication required');
        setLoading(false);
        return;
      }
      
      if (auth.userRole !== 'manager') {
        setError('Access denied. Only managers can access this resource');
        setLoading(false);
        return;
      }
      
      // Use the manager wellbeing service to fetch data
      const data: WellbeingResponse = await managerWellbeingService.getManagerWellbeingData();
      
      console.log('Received wellbeing data:', {
        hasWellbeingMetrics: !!data.wellbeingMetrics,
        workLifeBalanceScore: data.wellbeingMetrics?.workLifeBalance?.score,
        stressLevelScore: data.wellbeingMetrics?.stressLevel?.score,
        jobSatisfactionScore: data.wellbeingMetrics?.jobSatisfaction?.score,
        teamCollaborationScore: data.wellbeingMetrics?.teamCollaboration?.score
      });
      
      // Update wellbeing metrics from backend data
      if (data.wellbeingMetrics) {
        // Use backend calculated scores directly instead of recalculating
        setManagerWellbeing(data.wellbeingMetrics);
      } else {
        // Use default metrics only if no backend data exists
        setManagerWellbeing(defaultWellbeingMetrics);
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching wellbeing data:', err);
      setError(err.response?.data?.message || 'Failed to fetch wellbeing data');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.isAuthenticated && auth.userRole === 'manager') {
      fetchWellbeingData();
      
      // Set up interval to refresh data every 5 minutes
      const refreshInterval = setInterval(() => {
        fetchWellbeingData();
      }, 5 * 60 * 1000);
      
      return () => {
        clearInterval(refreshInterval);
      };
    } else {
      console.log('WellbeingContext: User not authenticated or not a manager', {
        isAuthenticated: auth.isAuthenticated,
        userRole: auth.userRole
      });
      setLoading(false);
    }
  }, [auth.isAuthenticated, auth.userRole]);

  const updateWellbeing = async (metrics: Partial<ManagerWellbeingMetrics>) => {
    // Update local state with the provided metrics
    const updatedMetrics = { ...managerWellbeing, ...metrics };
    
    // Update local state immediately for UI responsiveness
    setManagerWellbeing(updatedMetrics);
    
    try {
      if (!auth.isAuthenticated || auth.userRole !== 'manager') {
        setError('Authentication required');
        return;
      }
      
      // Send updated metrics to backend
      await managerWellbeingService.updateManagerWellbeingMetrics(updatedMetrics);
      
      // Refresh data from backend to get accurate calculations
      await fetchWellbeingData();
    } catch (err: any) {
      console.error('Error updating wellbeing metrics:', err);
      setError(err.response?.data?.message || 'Failed to sync wellbeing metrics');
    }
  };

  const updateMood = async (mood: 'great' | 'good' | 'okay' | 'bad') => {
    try {
      if (!auth.isAuthenticated || auth.userRole !== 'manager') {
        setError('Authentication required');
        return;
      }
      
      // Send mood data to backend first
      await managerWellbeingService.recordManagerMood(mood);
      
      // Then refresh the data to get updated metrics from backend
      await fetchWellbeingData();
      
    } catch (err: any) {
      console.error('Error updating mood:', err);
      setError(err.response?.data?.message || 'Failed to record mood');
    }
  };

  const refreshWellbeingData = async () => {
    await fetchWellbeingData();
  };

  return (
    <WellbeingContext.Provider value={{ 
      managerWellbeing, 
      updateWellbeing, 
      updateMood,
      loading,
      error,
      refreshWellbeingData,
      calculateWorkLifeBalance,
      calculateStressLevel,
      calculateJobSatisfaction,
      calculateTeamCollaboration
    }}>
      {children}
    </WellbeingContext.Provider>
  );
};

export const useWellbeingContext = () => {
  const context = useContext(WellbeingContext);
  if (context === undefined) {
    throw new Error('useWellbeingContext must be used within a WellbeingProvider');
  }
  return context;
}; 