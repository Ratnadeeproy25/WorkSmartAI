import managerTaskService from './managerTaskService';
import employeeTaskService from './taskService';

// Define a unified task service interface to ensure consistent API
export interface TaskService {
  getTasks: () => Promise<any[]>;
  getTaskById: (taskId: string) => Promise<any>;
  updateTaskStatus: (taskId: string, status: string) => Promise<any>;
  updateTaskProgress?: (taskId: string, progress: number) => Promise<any>;
  updateTaskTime?: (taskId: string, timeSpent: number) => Promise<any>;
  createTask?: (taskData: any) => Promise<any>;
  updateTask?: (taskId: string, taskData: any) => Promise<any>;
  deleteTask?: (taskId: string) => Promise<any>;
}

/**
 * Factory function that returns the appropriate task service based on user role
 * @param role - The user's role ('employee', 'manager', or 'admin')
 * @returns The appropriate task service with a consistent API
 */
export const getTaskService = (role: string | null): TaskService => {
  if (role === 'manager') {
    // Map manager-specific methods to the common interface
    return {
      getTasks: managerTaskService.getManagerTasks,
      getTaskById: managerTaskService.getTaskById,
      updateTaskStatus: managerTaskService.updateTaskStatus,
      createTask: managerTaskService.createTask,
      updateTask: managerTaskService.updateTask,
      deleteTask: managerTaskService.deleteTask,
      // Add any missing methods from employee service with empty implementations
      updateTaskProgress: () => Promise.reject({ message: 'Not implemented for managers' }),
      updateTaskTime: () => Promise.reject({ message: 'Not implemented for managers' })
    };
  } else {
    // Return employee service for all other roles (default)
    return employeeTaskService;
  }
};

export default getTaskService; 