import api from './api';
import { getToken } from './authService';

// Helper to get auth headers from the current token
const getAuthHeaders = (role) => {
  const token = getToken();
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      role: role
    };
  }
  return {};
};

// Get all tasks for current employee
export const getTasks = async () => {
  try {
    const headers = getAuthHeaders('employee');
    // console.log("Auth headers for getTasks:", headers);
    
    const response = await api.get('/tasks', { ...headers });
    
    if (!response.data) {
      // console.error("Empty response data returned");
      return [];
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    
    // Check if it's an auth error and handle accordingly
    if (error.status === 401) {
      console.error("Authentication error, try logging in again");
    }
    
    return []; // Return empty array instead of throwing
  }
};

// Get a single task by ID
export const getTaskById = async (taskId) => {
  try {
    const response = await api.get(`/tasks/${taskId}`, { role: 'employee' });
    return response.data;
  } catch (error) {
    console.error('Error fetching task:', error);
    throw new Error(error.message || 'Failed to fetch task');
  }
};

// Update only task status
export const updateTaskStatus = async (taskId, status) => {
  try {
    const response = await api.patch(`/tasks/${taskId}/status`, { status }, { role: 'employee' });
    return response.data;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw new Error(error.message || 'Failed to update task status');
  }
};

// Update task progress
export const updateTaskProgress = async (taskId, progress) => {
  try {
    const response = await api.patch(`/tasks/${taskId}/progress`, { progress }, { role: 'employee' });
    return response.data;
  } catch (error) {
    console.error('Error updating task progress:', error);
    throw new Error(error.message || 'Failed to update task progress');
  }
};

// Update time spent on task
export const updateTaskTime = async (taskId, timeSpent) => {
  try {
    const response = await api.patch(`/tasks/${taskId}/time`, { timeSpent }, { role: 'employee' });
    return response.data;
  } catch (error) {
    console.error('Error updating time spent:', error);
    throw new Error(error.message || 'Failed to update time spent');
  }
};

const taskService = {
  getTasks,
  getTaskById,
  updateTaskStatus,
  updateTaskProgress,
  updateTaskTime
};

export default taskService; 