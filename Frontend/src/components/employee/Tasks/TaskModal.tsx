import React, { useState, useEffect, useRef } from 'react';
import { Task, Subtask } from './types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/light.css';
import { useAuth } from '../../../context/AuthContext';
import taskService from '../../../services/taskService';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, 
  onClose, 
  task 
}) => {
  const auth = useAuth();
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when task changes or modal opens/closes
  useEffect(() => {
    if (isOpen && task) {
      // Populate form with task data
        setStatus(task.status);
    }
  }, [isOpen, task]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Update task status
      await taskService.updateTaskStatus(task.id, status);
      
      // Dispatch event to ensure UI updates
      window.dispatchEvent(new Event('employeeTasksUpdated'));
      onClose();
    } catch (error) {
      console.error('Failed to update task', error);
      setError('Failed to update task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" id="taskModal">
      <div className="neo-box w-full max-w-2xl bg-[#e0e5ec] max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-700">
            View Task
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form id="taskForm" className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
            {/* Title Field - Read Only */}
            <div className="space-y-2">
              <label className="block text-gray-700 font-medium">Title</label>
              <div className="w-full p-3 rounded-lg bg-[#e0e5ec] border-none outline-none shadow-inner text-gray-700">
                {task.title}
              </div>
            </div>

            {/* Description Field - Read Only */}
            <div className="space-y-2">
              <label className="block text-gray-700 font-medium">Description</label>
              <div className="p-3 rounded-lg bg-[#e0e5ec] shadow-inner text-gray-700 min-h-[100px]" 
                   dangerouslySetInnerHTML={{ __html: task.description }}>
              </div>
            </div>

            {/* Priority and Due Date - Read Only */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-gray-700 font-medium">Priority</label>
                <div className="w-full p-3 rounded-lg bg-[#e0e5ec] border-none outline-none shadow-inner text-gray-700">
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-gray-700 font-medium">Due Date</label>
                <div className="w-full p-3 rounded-lg bg-[#e0e5ec] border-none outline-none shadow-inner text-gray-700">
                  {new Date(task.dueDate).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Status Field - Editable */}
              <div className="space-y-2">
                <label className="block text-gray-700 font-medium">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#e0e5ec] border-none outline-none shadow-inner"
                  required
                >
                  <option value="todo">To Do</option>
                  <option value="inProgress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
            </div>

            {/* Subtasks - Read Only */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="space-y-2">
                <label className="block text-gray-700 font-medium">Subtasks</label>
                <div className="space-y-2">
                  {task.subtasks.map(subtask => (
                    <div key={subtask.id} className="flex items-center neo-box p-3">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                        onChange={() => {}} // Read-only checkbox
                        className="mr-3"
                        disabled
                    />
                      <span className={subtask.completed ? 'line-through text-gray-500' : ''}>
                            {subtask.title}
                          </span>
                    </div>
                  ))}
              </div>
            </div>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 p-4 md:p-6 border-t border-gray-200">
          <button onClick={onClose} className="neo-button">
              Cancel
            </button>
            <button
              type="submit"
              form="taskForm"
            className="neo-button primary"
            disabled={isLoading}
            >
            {isLoading ? 'Updating...' : 'Update Task Status'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal; 