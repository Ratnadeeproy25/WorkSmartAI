export interface Skill {
  name: string;
  level: number;
  endorsements: number;
}

export interface SkillsData {
  technical: Skill[];
  soft: Skill[];
}

export interface TimelineItem {
  id: string;
  title: string;
  time: string;
  color: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  location: string;
}

export interface SessionData {
  id: string;
  title: string;
  lastActive: string;
  device: string;
  ip: string;
  location: string;
  icon: string;
  iconColor: string;
}

export interface LoginHistoryItem {
  id: string;
  device: string;
  location: string;
  ip: string;
  time: string;
}

export interface UserProfile {
  name: string;
  role: string;
  employeeId: string;
  profilePicture: string;
  status: 'available' | 'away' | 'busy';
  contactInfo: ContactInfo;
  skills: SkillsData;
  performanceData: number[];
  timeline: TimelineItem[];
}

export interface SecuritySettings {
  sessions: SessionData[];
  loginHistory: LoginHistoryItem[];
} 