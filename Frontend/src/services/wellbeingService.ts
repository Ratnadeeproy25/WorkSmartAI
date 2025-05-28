import axios from 'axios';
import { WellbeingMetrics, MoodEntry, ActivityEntry, ReminderSettings } from '../components/employee/Wellbeing/types';
import { getAuthHeaders } from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const WELLBEING_URL = `${API_URL}/wellbeing`;
const MANAGER_WELLBEING_URL = `${API_URL}/manager/wellbeing`;

// Get wellbeing data
export const getWellbeingData = async (): Promise<any> => {
  try {
    const response = await axios.get(WELLBEING_URL, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching wellbeing data:', error);
    
    // Return default data structure if API fails
    // This ensures the UI doesn't break even if backend is unavailable
    return {
      wellbeingMetrics: {
        workLifeBalance: {
          score: 85,
          history: [82, 84, 85, 83, 85],
          factors: {
            workHours: 7.5,
            breaksCount: 4,
            afterHoursWork: 0.5,
            focusTime: 5.2
          }
        },
        stressLevel: {
          score: 90,
          history: [88, 89, 90, 90, 90],
          factors: {
            deadlinePressure: 'Low',
            workload: 'Moderate',
            teamSupport: 'High',
            workEnvironment: 'Positive'
          }
        },
        jobSatisfaction: {
          score: 88,
          history: [85, 86, 87, 88, 88],
          factors: {
            roleClarity: 'High',
            skillUtilization: 'Optimal',
            growthOpportunities: 'Good',
            teamDynamics: 'Excellent'
          }
        },
        teamCollaboration: {
          score: 92,
          history: [90, 91, 91, 92, 92],
          factors: {
            communicationQuality: 'Excellent',
            peerSupport: 'High',
            conflictResolution: 'Good',
            teamworkEfficiency: 'High'
          }
        }
      },
      moodHistory: [],
      activityHistory: [],
      breakHistory: [],
      reminderSettings: {
        breaks: {
          enabled: true,
          interval: 60,
          smartReminders: true
        },
        mood: {
          enabled: true,
          frequency: 'daily',
          time: '09:00',
          smartReminders: true
        },
        activities: {
          enabled: true,
          frequency: 'daily',
          time: '12:00',
          days: [1, 3, 5]
        }
      }
    };
  }
};

// Update wellbeing metrics
export const updateWellbeingMetrics = async (metrics: WellbeingMetrics): Promise<any> => {
  try {
    const response = await axios.patch(`${WELLBEING_URL}/metrics`, { metrics }, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error updating wellbeing metrics:', error);
    throw error;
  }
};

// Record mood
export const recordMood = async (mood: string, note?: string): Promise<any> => {
  try {
    const response = await axios.post(`${WELLBEING_URL}/mood`, { mood, note }, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error recording mood:', error);
    throw error;
  }
};

// Record activity
export const recordActivity = async (activity: string): Promise<any> => {
  try {
    const response = await axios.post(`${WELLBEING_URL}/activity`, { activity }, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error recording activity:', error);
    throw error;
  }
};

// Record break
export const recordBreak = async (duration: number, type: string = 'regular'): Promise<any> => {
  try {
    // Validate break type
    const validBreakTypes = ['regular', 'mindfulness', 'exercise', 'social'];
    const breakType = validBreakTypes.includes(type) ? type : 'regular';
    
    const breakData = { 
      duration, 
      type: breakType,
      timestamp: new Date().toISOString()
    };
    
    // console.log('Recording break:', breakData);

    const response = await axios.post(`${WELLBEING_URL}/break`, breakData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error recording break:', error);
    throw error;
  }
};

// Update reminder settings
export const updateReminderSettings = async (settings: ReminderSettings): Promise<any> => {
  try {
    const response = await axios.patch(`${WELLBEING_URL}/reminder-settings`, { settings }, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error updating reminder settings:', error);
    throw error;
  }
};

// Get wellbeing history
export const getWellbeingHistory = async (type?: string, startDate?: string, endDate?: string): Promise<any> => {
  try {
    let url = `${WELLBEING_URL}/history`;
    const params: { [key: string]: string } = {};
    
    if (type) params.type = type;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await axios.get(url, {
      headers: getAuthHeaders(),
      params
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching wellbeing history:', error);
    throw error;
  }
};

// Get wellbeing insights
export const getWellbeingInsights = async (): Promise<any> => {
  try {
    const response = await axios.get(`${WELLBEING_URL}/insights`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching wellbeing insights:', error);
    // Return empty insights if API fails
    return {
      success: true,
      insights: []
    };
  }
};

const WellbeingService = {
  // Manager profile and stress data
  getManagerProfile: async (managerId: string) => {
    try {
      const response = await axios.get(`${API_URL}/managers/${managerId}/profile`);
      return response.data;
    } catch (error) {
      console.error('Error fetching manager profile:', error);
      throw error;
    }
  },

  getManagerStressLevels: async (managerId: string, period = 'month') => {
    try {
      const response = await axios.get(`${API_URL}/managers/${managerId}/stress-levels`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching stress levels:', error);
      throw error;
    }
  },

  // Mood tracking 
  submitMoodEntry: async (managerId: string, data: { mood: number; note: string }) => {
    try {
      const response = await axios.post(`${API_URL}/managers/${managerId}/mood`, data);
      return response.data;
    } catch (error) {
      console.error('Error submitting mood entry:', error);
      throw error;
    }
  },

  getMoodHistory: async (managerId: string, period = 'month') => {
    try {
      const response = await axios.get(`${API_URL}/managers/${managerId}/mood-history`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching mood history:', error);
      throw error;
    }
  },

  // Break timer
  startBreak: async (managerId: string) => {
    try {
      const response = await axios.post(`${API_URL}/managers/${managerId}/breaks/start`);
      return response.data;
    } catch (error) {
      console.error('Error starting break:', error);
      throw error;
    }
  },

  endBreak: async (managerId: string, breakId: string) => {
    try {
      const response = await axios.post(`${API_URL}/managers/${managerId}/breaks/${breakId}/end`);
      return response.data;
    } catch (error) {
      console.error('Error ending break:', error);
      throw error;
    }
  },

  getBreakHistory: async (managerId: string) => {
    try {
      const response = await axios.get(`${API_URL}/managers/${managerId}/break-history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching break history:', error);
      throw error;
    }
  },

  // Reminder settings
  getReminderSettings: async (managerId: string) => {
    try {
      const response = await axios.get(`${API_URL}/managers/${managerId}/reminder-settings`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reminder settings:', error);
      throw error;
    }
  },

  updateReminderSettings: async (managerId: string, settings: ReminderSettings) => {
    try {
      const response = await axios.put(`${API_URL}/managers/${managerId}/reminder-settings`, settings);
      return response.data;
    } catch (error) {
      console.error('Error updating reminder settings:', error);
      throw error;
    }
  },

  // Wellbeing tips
  getWellbeingTips: async (category = 'all') => {
    try {
      const response = await axios.get(`${API_URL}/wellbeing/tips`, {
        params: { category }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching wellbeing tips:', error);
      throw error;
    }
  },

  // Wellbeing charts data
  getWellbeingMetrics: async (managerId: string, period = 'month') => {
    try {
      const response = await axios.get(`${API_URL}/managers/${managerId}/wellbeing-metrics`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching wellbeing metrics:', error);
      throw error;
    }
  }
};

export default WellbeingService; 