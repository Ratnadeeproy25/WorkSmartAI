import api from './api';
import aiService from './aiService';

// Get all tasks created by the manager
export const getManagerTasks = async () => {
  try {
    const response = await api.get('/manager/tasks', { role: 'manager' });
    return response.data;
  } catch (error) {
    console.error('Error fetching manager tasks:', error);
    throw new Error(error.message || 'Failed to fetch tasks');
  }
};

// Get all tasks assigned to team members
export const getTeamTasks = async () => {
  try {
    const response = await api.get('/manager/tasks/team', { role: 'manager' });
    return response.data;
  } catch (error) {
    console.error('Error fetching team tasks:', error);
    throw new Error(error.message || 'Failed to fetch team tasks');
  }
};

// Get tasks by status
export const getTasksByStatus = async (status) => {
  try {
    const response = await api.get(`/manager/tasks/status/${status}`, { role: 'manager' });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${status} tasks:`, error);
    throw new Error(error.message || 'Failed to fetch tasks by status');
  }
};

// Get a task by ID
export const getTaskById = async (taskId) => {
  try {
    const response = await api.get(`/manager/tasks/${taskId}`, { role: 'manager' });
    return response.data;
  } catch (error) {
    console.error('Error fetching task:', error);
    throw new Error(error.message || 'Failed to fetch task');
  }
};

// Get team members (employees)
export const getTeamMembers = async () => {
  try {
    const response = await api.get('/manager/tasks/team-members', { role: 'manager' });
    return response.data;
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw new Error(error.message || 'Failed to fetch team members');
  }
};

// Create a new task and assign to an employee
export const createTask = async (taskData) => {
  try {
    const response = await api.post('/manager/tasks', taskData, { role: 'manager' });
    if (response.data) {
      // If a task was successfully created and an employee is assigned,
      // dispatch an event that employee views can listen to.
      window.dispatchEvent(new Event('employeeTasksUpdated'));
    }
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw new Error(error.message || 'Failed to create task');
  }
};

// Update task status
export const updateTaskStatus = async (taskId, status) => {
  try {
    const response = await api.patch(`/manager/tasks/${taskId}/status`, { status }, { role: 'manager' });
    
    // Automatically trigger AI learning when task is completed
    if (status === 'completed' && response.data.timeSpent > 0) {
      try {
        console.log('Manager triggering AI learning for completed task:', response.data.title);
        await aiService.updateModelWithTaskData(taskId);
      } catch (aiError) {
        console.error('Error updating AI model (non-blocking):', aiError);
        // Don't fail the task update if AI update fails
      }
    }
    
    if (response.data && response.data.assignee) {
      window.dispatchEvent(new Event('employeeTasksUpdated'));
    }
    return response.data;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw new Error(error.message || 'Failed to update task status');
  }
};

// Update task
export const updateTask = async (taskId, taskData) => {
  try {
    const response = await api.put(`/manager/tasks/${taskId}`, taskData, { role: 'manager' });
    
    // Automatically trigger AI learning when task is completed
    if (taskData.status === 'completed' && response.data.timeSpent > 0) {
      try {
        console.log('Manager triggering AI learning for completed task:', response.data.title);
        await aiService.updateModelWithTaskData(taskId);
      } catch (aiError) {
        console.error('Error updating AI model (non-blocking):', aiError);
        // Don't fail the task update if AI update fails
      }
    }
    
    if (response.data && response.data.assignee) {
      window.dispatchEvent(new Event('employeeTasksUpdated'));
    }
    return response.data;
  } catch (error) {
    console.error('Error updating task:', error);
    throw new Error(error.message || 'Failed to update task');
  }
};

// Delete task
export const deleteTask = async (taskId) => {
  try {
    const response = await api.delete(`/manager/tasks/${taskId}`, { role: 'manager' });
    if (response.data) {
      window.dispatchEvent(new Event('employeeTasksUpdated'));
    }
    return response.data;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw new Error(error.message || 'Failed to delete task');
  }
};

// Get task stats for dashboard
export const getTaskStats = async () => {
  try {
    const response = await api.get('/manager/tasks/stats', { role: 'manager' });
    return response.data;
  } catch (error) {
    console.error('Error fetching task stats:', error);
    throw new Error(error.message || 'Failed to fetch task stats');
  }
};

const managerTaskService = {
  getManagerTasks,
  getTeamTasks,
  getTasksByStatus,
  getTaskById,
  getTeamMembers,
  createTask,
  updateTaskStatus,
  updateTask,
  deleteTask,
  getTaskStats
};

export default managerTaskService; 