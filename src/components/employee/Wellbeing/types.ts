export type MoodType = 'great' | 'good' | 'okay' | 'bad';

export interface MoodEntry {
  mood: MoodType;
  timestamp: string;
  note?: string;
}

export interface WellbeingMetrics {
  workLifeBalance: {
    score: number;
    history: number[];
    factors: {
      workHours: number;
      breaksCount: number;
      afterHoursWork: number;
      focusTime: number;
    };
  };
  stressLevel: {
    score: number;
    history: number[];
    factors: {
      deadlinePressure: string;
      workload: string;
      teamSupport: string;
      workEnvironment: string;
    };
  };
  jobSatisfaction: {
    score: number;
    history: number[];
    factors: {
      roleClarity: string;
      skillUtilization: string;
      growthOpportunities: string;
      teamDynamics: string;
    };
  };
  teamCollaboration: {
    score: number;
    history: number[];
    factors: {
      communicationQuality: string;
      peerSupport: string;
      conflictResolution: string;
      teamworkEfficiency: string;
    };
  };
}

export interface ActivityInfo {
  name: string;
  icon: string;
  duration: number; // in seconds
  benefits: string[];
}

export interface ActivityEntry {
  activity: string;
  timestamp: string;
}

export interface WellnessActivity {
  id: string;
  title: string;
  description: string;
  duration: string;
}

export interface WellnessTip {
  icon: string;
  iconColor: string;
  title: string;
  content: string;
}

export interface BreakHistoryEntry {
  timestamp: string;
  duration: number;
  type: string;
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
}

export interface NotificationTimestamps {
  lastBreak: string | null;
  lastMood: string | null;
  lastActivity: string | null;
} 