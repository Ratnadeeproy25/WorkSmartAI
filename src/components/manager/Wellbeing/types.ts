export interface WorkLifeBalance {
  score: number;
  history: number[];
  factors: {
    workHours: number;
    breaksCount: number;
    afterHoursWork: number;
    focusTime: number;
  };
}

export interface StressLevel {
  score: number;
  history: number[];
  factors: {
    deadlinePressure: string;
    workload: string;
    teamSupport: string;
    workEnvironment: string;
  };
}

export interface JobSatisfaction {
  score: number;
  history: number[];
  factors: {
    roleClarity: string;
    skillUtilization: string;
    growthOpportunities: string;
    teamDynamics: string;
  };
}

export interface TeamCollaboration {
  score: number;
  history: number[];
  factors: {
    communicationQuality: string;
    peerSupport: string;
    conflictResolution: string;
    teamworkEfficiency: string;
  };
}

export interface TeamWellbeing {
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

export type MoodType = 'great' | 'good' | 'okay' | 'bad';

export interface MoodEntry {
  mood: MoodType;
  timestamp: string;
  note?: string;
}

export interface BreakHistoryItem {
  id: number;
  time: string;
  completed: boolean;
}

export interface ActivityEntry {
  activity: string;
  timestamp: string;
}

export interface ManagerWellbeingMetrics {
  workLifeBalance: WorkLifeBalance;
  stressLevel: StressLevel;
  jobSatisfaction: JobSatisfaction;
  teamCollaboration: TeamCollaboration;
  teamWellbeing: TeamWellbeing;
}

export interface ReminderSettings {
  breaks: {
    enabled: boolean;
    interval: number; // in minutes
    smartReminders: boolean;
  };
  mood: {
    enabled: boolean;
    frequency: 'daily' | 'twice-daily' | 'hourly';
    time?: string; // for daily reminders, format: "HH:MM"
    smartReminders: boolean;
  };
  activities: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    time?: string; // format: "HH:MM"
    days?: number[]; // 0-6 for days of the week
  };
  teamWellbeing: {
    enabled: boolean;
    frequency: 'weekly' | 'bi-weekly';
    day: number; // 0-6 for day of the week
    time?: string; // format: "HH:MM"
  };
}

export interface NotificationTimestamps {
  lastBreak: string | null;
  lastMood: string | null;
  lastActivity: string | null;
  lastTeamCheck: string | null;
} 