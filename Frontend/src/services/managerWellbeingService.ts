import axios from 'axios';
import { getManagerAuthHeaders } from './authService';
import { ReminderSettings } from '../components/manager/Wellbeing/types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const MANAGER_WELLBEING_URL = `${API_URL}/manager/wellbeing`;

// Calculate task completion rate from task data
const calculateTaskCompletionRate = (tasks: any[]): number => {
  if (!tasks || tasks.length === 0) return 85; // Default value
  
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  
  return Math.round((completedTasks / totalTasks) * 100);
};

// Calculate deadline pressure from task data
const calculateDeadlinePressure = (tasks: any[]): string => {
  if (!tasks || tasks.length === 0) return 'Low';
  
  const now = new Date();
  const overdueTasks = tasks.filter(task => 
    task.status !== 'completed' && new Date(task.dueDate) < now
  ).length;
  
  const urgentTasks = tasks.filter(task => {
    const dueDate = new Date(task.dueDate);
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);
    
    return task.status !== 'completed' && dueDate >= now && dueDate <= threeDaysFromNow;
  }).length;
  
  if (overdueTasks > 3 || urgentTasks > 5) return 'High';
  if (overdueTasks > 1 || urgentTasks > 2) return 'Moderate';
  return 'Low';
};

// Calculate workload from task data
const calculateWorkload = (tasks: any[]): string => {
  if (!tasks || tasks.length === 0) return 'Light';
  
  const activeTasks = tasks.filter(task => task.status !== 'completed').length;
  const highPriorityTasks = tasks.filter(task => task.priority === 'high').length;
  
  if (activeTasks > 10 || highPriorityTasks > 5) return 'Heavy';
  if (activeTasks > 5 || highPriorityTasks > 2) return 'Moderate';
  return 'Light';
};

// Get manager wellbeing data
export const getManagerWellbeingData = async (): Promise<any> => {
  try {
    const response = await axios.get(MANAGER_WELLBEING_URL, {
      headers: getManagerAuthHeaders()
    });
    
    const data = response.data;
    
    // If we have task data, calculate dynamic factors
    if (data.tasks) {
      const taskCompletionRate = calculateTaskCompletionRate(data.tasks);
      const deadlinePressure = calculateDeadlinePressure(data.tasks);
      const workload = calculateWorkload(data.tasks);
      
      // Update wellbeing metrics with calculated values
      if (data.wellbeingMetrics) {
        // Update job satisfaction with calculated task completion rate
        if (data.wellbeingMetrics.jobSatisfaction) {
          data.wellbeingMetrics.jobSatisfaction.factors.taskCompletionRate = taskCompletionRate;
        }
        
        // Update stress level with calculated factors
        if (data.wellbeingMetrics.stressLevel) {
          data.wellbeingMetrics.stressLevel.factors.deadlinePressure = deadlinePressure;
          data.wellbeingMetrics.stressLevel.factors.workload = workload;
        }
      }
    }
    
    // Return the structure expected by the context
    return {
      wellbeingMetrics: data.wellbeingMetrics,
      tasks: data.tasks,
      attendanceData: data.attendanceData,
      reminderSettings: data.reminderSettings
    };
  } catch (error: any) {
    console.error('Error fetching manager wellbeing data:', error);
    throw error;
  }
};

// Record mood entry
export const recordManagerMood = async (mood: string, note?: string): Promise<any> => {
  try {
    const response = await axios.post(`${MANAGER_WELLBEING_URL}/mood`, {
      mood,
      note,
      timestamp: new Date().toISOString()
    }, {
      headers: getManagerAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error recording manager mood:', error);
    throw error;
  }
};

// Start a break
export const startManagerBreak = async (type: string = 'regular', duration: number = 5): Promise<any> => {
  try {
    const response = await axios.post(`${MANAGER_WELLBEING_URL}/breaks/start`, {
      type,
      duration
    }, {
      headers: getManagerAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error starting manager break:', error);
    throw error;
  }
};

// End a break
export const endManagerBreak = async (breakId: string): Promise<any> => {
  try {
    const response = await axios.post(`${MANAGER_WELLBEING_URL}/breaks/${breakId}/end`, {}, {
      headers: getManagerAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error ending manager break:', error);
    throw error;
  }
};

// Record wellbeing activity
export const recordManagerActivity = async (activity: string): Promise<any> => {
  try {
    const response = await axios.post(`${MANAGER_WELLBEING_URL}/activity`, {
      activity
    }, {
      headers: getManagerAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error recording manager activity:', error);
    throw error;
  }
};

// Update reminder settings
export const updateManagerReminderSettings = async (settings: ReminderSettings): Promise<any> => {
  try {
    const response = await axios.put(`${MANAGER_WELLBEING_URL}/reminder-settings`, settings, {
      headers: getManagerAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error updating manager reminder settings:', error);
    throw error;
  }
};

// Get wellbeing history
export const getManagerWellbeingHistory = async (type?: string, startDate?: string, endDate?: string): Promise<any> => {
  try {
    const params: { [key: string]: string } = {};
    if (type) params.type = type;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axios.get(`${MANAGER_WELLBEING_URL}/history`, {
      headers: getManagerAuthHeaders(),
      params
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching manager wellbeing history:', error);
    throw error;
  }
};

// Get wellbeing insights
export const getManagerWellbeingInsights = async (): Promise<any> => {
  try {
    const response = await axios.get(`${MANAGER_WELLBEING_URL}/insights`, {
      headers: getManagerAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching manager wellbeing insights:', error);
    throw error;
  }
};

// Update wellbeing metrics
export const updateManagerWellbeingMetrics = async (metrics: any): Promise<any> => {
  try {
    const response = await axios.patch(`${MANAGER_WELLBEING_URL}/metrics`, {
      metrics
    }, {
      headers: getManagerAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error updating manager wellbeing metrics:', error);
    throw error;
  }
};

const managerWellbeingService = {
  getManagerWellbeingData,
  recordManagerMood,
  startManagerBreak,
  endManagerBreak,
  recordManagerActivity,
  updateManagerReminderSettings,
  getManagerWellbeingHistory,
  getManagerWellbeingInsights,
  updateManagerWellbeingMetrics,
  calculateTaskCompletionRate,
  calculateDeadlinePressure,
  calculateWorkload
};

export default managerWellbeingService; 