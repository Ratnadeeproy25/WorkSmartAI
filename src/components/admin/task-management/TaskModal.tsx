import React, { useState, useEffect } from 'react';
import { Task } from './TaskManagement';

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
  onSubmit: (task: any) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onSubmit }) => {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [status, setStatus] = useState('todo');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [progress, setProgress] = useState(0);
  const [subtasks, setSubtasks] = useState<Array<{ text: string; completed: boolean }>>([]);
  const [newSubtask, setNewSubtask] = useState('');

  // Sample assignees data for selection
  const assignees = [
    { id: '1', name: 'John Doe', color: '#3b82f6' },
    { id: '2', name: 'Jane Smith', color: '#10b981' },
    { id: '3', name: 'Mike Johnson', color: '#f59e0b' },
    { id: '4', name: 'Sarah Williams', color: '#8b5cf6' },
  ];

  // Sample statuses for selection
  const statuses = [
    { id: 'todo', name: 'To Do' },
    { id: 'inProgress', name: 'In Progress' },
    { id: 'completed', name: 'Completed' },
    { id: 'blocked', name: 'Blocked' }
  ];

  // Initialize form with task data if editing
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.dueDate);
      setAssigneeId(task.assignee.id);
      setProgress(task.progress);
      setSubtasks(task.subtasks || []);
    } else {
      // Default values for new task
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setDueDate('');
      setAssigneeId('1'); // Default to first assignee
      setProgress(0);
      setSubtasks([]);
    }
  }, [task]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Find assignee object
    const assignee = assignees.find(a => a.id === assigneeId) || assignees[0];

    const taskData = {
      ...(task && { id: task.id }), // Include ID if editing existing task
      title,
      description,
      priority,
      status,
      dueDate,
      assignee,
      progress,
      subtasks,
      ...(task && { createdAt: task.createdAt }), // Preserve creation date if editing
    };

    onSubmit(taskData);
  };

  // Handle adding a subtask
  const handleAddSubtask = () => {
    if (newSubtask.trim() === '') return;
    
    setSubtasks([...subtasks, { text: newSubtask, completed: false }]);
    setNewSubtask('');
  };

  // Handle toggling subtask completion
  const toggleSubtaskCompletion = (index: number) => {
    const updatedSubtasks = [...subtasks];
    updatedSubtasks[index].completed = !updatedSubtasks[index].completed;
    setSubtasks(updatedSubtasks);

    // Update progress based on subtasks completion
    if (subtasks.length > 0) {
      const completedCount = updatedSubtasks.filter(st => st.completed).length;
      setProgress(Math.round((completedCount / updatedSubtasks.length) * 100));
    }
  };

  // Handle removing a subtask
  const removeSubtask = (index: number) => {
    const updatedSubtasks = [...subtasks];
    updatedSubtasks.splice(index, 1);
    setSubtasks(updatedSubtasks);

    // Update progress after removal
    if (updatedSubtasks.length > 0) {
      const completedCount = updatedSubtasks.filter(st => st.completed).length;
      setProgress(Math.round((completedCount / updatedSubtasks.length) * 100));
    } else {
      setProgress(0);
    }
  };

  // Close modal when clicking outside
  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleClickOutside}
    >
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 text-sm border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter task title"
                required
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full p-2.5 text-sm border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter task description"
              ></textarea>
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2.5 text-sm border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {statuses.map((statusOption) => (
                    <option key={statusOption.id} value={statusOption.id}>
                      {statusOption.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
                  className="w-full p-2.5 text-sm border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Due Date and Assignee */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2.5 text-sm border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">
                  Assignee
                </label>
                <select
                  id="assignee"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full p-2.5 text-sm border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {assignees.map((assigneeOption) => (
                    <option key={assigneeOption.id} value={assigneeOption.id}>
                      {assigneeOption.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="progress" className="block text-sm font-medium text-gray-700">
                  Progress
                </label>
                <span className="text-xs text-gray-500">{progress}%</span>
              </div>
              <input
                type="range"
                id="progress"
                min="0"
                max="100"
                step="5"
                value={progress}
                onChange={(e) => setProgress(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Subtasks */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtasks
              </label>
              
              <div className="space-y-2 mb-3">
                {subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => toggleSubtaskCompletion(index)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className={`ml-2 text-sm flex-1 ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {subtask.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSubtask(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="Add a subtask"
                  className="flex-1 p-2 text-sm border border-gray-200 rounded-l-lg focus:ring-indigo-500 focus:border-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="bg-indigo-600 text-white px-3 py-2 rounded-r-lg hover:bg-indigo-700"
                >
                  <i className="bi bi-plus"></i>
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                {task ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskModal; 