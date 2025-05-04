import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

interface WellbeingContextType {
  managerWellbeing: ManagerWellbeingMetrics;
  updateWellbeing: (metrics: Partial<ManagerWellbeingMetrics>) => void;
  updateMood: (mood: 'great' | 'good' | 'okay' | 'bad') => void;
}

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
      teamDynamics: 'Excellent'
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

  useEffect(() => {
    // Load from localStorage if available
    const savedMetrics = localStorage.getItem('managerWellbeingMetrics');
    if (savedMetrics) {
      try {
        const parsed = JSON.parse(savedMetrics);
        setManagerWellbeing(current => ({ ...current, ...parsed }));
      } catch (error) {
        console.error('Error parsing wellbeing metrics:', error);
      }
    }
  }, []);

  const updateWellbeing = (metrics: Partial<ManagerWellbeingMetrics>) => {
    setManagerWellbeing(current => {
      const updated = { ...current, ...metrics };
      // Save to localStorage
      localStorage.setItem('managerWellbeingMetrics', JSON.stringify(updated));
      return updated;
    });
  };

  const updateMood = (mood: 'great' | 'good' | 'okay' | 'bad') => {
    const moodScores = {
      great: { stress: 90, satisfaction: 95 },
      good: { stress: 80, satisfaction: 85 },
      okay: { stress: 70, satisfaction: 75 },
      bad: { stress: 55, satisfaction: 60 }
    };

    setManagerWellbeing(current => {
      const updated = {
        ...current,
        stressLevel: {
          ...current.stressLevel,
          score: moodScores[mood].stress
        },
        jobSatisfaction: {
          ...current.jobSatisfaction,
          score: moodScores[mood].satisfaction
        }
      };
      
      // Save to localStorage
      localStorage.setItem('managerWellbeingMetrics', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <WellbeingContext.Provider value={{ managerWellbeing, updateWellbeing, updateMood }}>
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