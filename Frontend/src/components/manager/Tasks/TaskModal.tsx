import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/light.css';
import managerTaskService from '../../../services/managerTaskService';

interface TaskModalProps {
  taskId: string | null;
  onClose: () => void;
}

interface TeamMember {
  _id: string;
  id: string; // Custom employee ID like "EM001"
  name: string;
  email: string;
  position: string;
  department: string;
}

const TaskModal: React.FC<TaskModalProps> = ({ taskId, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [dueDate, setDueDate] = useState<Date | null>(new Date());
  const [assigneeId, setAssigneeId] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch team members when component mounts
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const members = await managerTaskService.getTeamMembers();
        setTeamMembers(members);
        
        // Don't automatically set a default assignee - let user select
        // Only set assignee when editing an existing task
      } catch (error) {
        console.error('Error fetching team members:', error);
        setError('Failed to load team members. Please try again later.');
      }
    };
    
    fetchTeamMembers();
  }, []); // Remove assigneeId dependency since we're not auto-selecting anymore

  // Load task data if editing an existing task
  useEffect(() => {
    const fetchTaskData = async () => {
      if (!taskId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const task = await managerTaskService.getTaskById(taskId);
        
        setTitle(task.title);
        setDescription(task.description);
        setPriority(task.priority);
        setStatus(task.status);
        setDueDate(new Date(task.dueDate));
        setAssigneeId(task.assignee.id);
      } catch (error) {
        console.error('Error fetching task:', error);
        setError('Failed to load task data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTaskData();
  }, [taskId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dueDate) {
      setError('Please set a due date');
      return;
    }
    
    if (!assigneeId) {
      setError('Please select an assignee');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Verify that we have a valid MongoDB ObjectId for the assignee
      const selectedEmployee = teamMembers.find(member => member._id === assigneeId);
      if (!selectedEmployee?._id) {
        throw new Error("Selected employee doesn't have a valid MongoDB ID");
      }
      
      // Log employee information to help debug
      console.log('Selected employee:', selectedEmployee);

      const payload = {
        title,
        description,
        priority,
        status,
        dueDate,
        assigneeId: selectedEmployee._id // Use the MongoDB _id
      };
      
      console.log('Sending task payload:', payload);
      
      if (taskId) {
        // Update existing task
        await managerTaskService.updateTask(taskId, payload);
      } else {
        // Create new task
        await managerTaskService.createTask(payload);
      }
      
      // Notify manager UI that tasks have been updated
      window.dispatchEvent(new Event('managerTasksUpdated'));
      
      // Also notify employee UI if a task was assigned/reassigned
      // This helps the employee view update if it's open
      if (payload.assigneeId) {
        window.dispatchEvent(new Event('employeeTasksUpdated'));
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      setError('Failed to save task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="neo-box p-6 w-full max-w-2xl mx-4 bg-[#e0e5ec] max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-semibold text-gray-700">
            {taskId ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="loading-spinner" />
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
        <form className="space-y-6 overflow-y-auto flex-grow pr-4 custom-scrollbar" onSubmit={handleSubmit}>
          <div>
            <label className="block text-gray-700 mb-2">Title</label>
            <input 
              type="text" 
              placeholder="Task Title" 
              className="neo-box w-full p-3 text-gray-700"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Description</label>
            <ReactQuill 
              theme="snow" 
              value={description} 
              onChange={setDescription}
              className="neo-box"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Priority</label>
              <select 
                className="neo-box w-full p-3 text-gray-700"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
                
            <div>
              <label className="block text-gray-700 mb-2">Status</label>
              <select 
                className="neo-box w-full p-3 text-gray-700"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                <option value="todo">To Do</option>
                <option value="inProgress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Due Date</label>
              <Flatpickr
                value={dueDate || new Date()}
                onChange={(dates) => {
                  if (dates.length > 0) {
                    setDueDate(dates[0]);
                  }
                }}
                options={{
                  enableTime: true,
                  dateFormat: "Y-m-d H:i",
                  minDate: "today"
                }}
                className="neo-box w-full p-3 text-gray-700 cursor-pointer"
              />
            </div>
                
            <div>
              <label className="block text-gray-700 mb-2">Assignee</label>
              <select 
                className="neo-box w-full p-3 text-gray-700"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                required
              >
                <option value="">Select Assignee</option>
                {teamMembers.map(member => (
                  <option key={member._id} value={member._id}>
                    {member.id} - {member.name} ({member.position})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button 
              type="button" 
              onClick={onClose}
              className="neo-button py-2 px-4 mr-2"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="neo-button py-2 px-4 primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : taskId ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
          </>
        )}
      </div>
    </div>
  );
};

export default TaskModal; 