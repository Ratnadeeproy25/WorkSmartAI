import React, { useState, useEffect, useRef } from 'react';
import { Task, Subtask } from './types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/light.css';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: any) => void;
  task: Task | null;
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  task 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [progress, setProgress] = useState(0);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quill editor modules configuration
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ]
  };

  // Reset form when task changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        // Edit mode - populate form with task data
        setTitle(task.title);
        setDescription(task.description);
        setPriority(task.priority);
        setStatus(task.status);
        setDueDate(new Date(task.dueDate));
        setProgress(task.progress || 0);
        setSubtasks(task.subtasks || []);
      } else {
        // Add mode - reset form
        setTitle('');
        setDescription('');
        setPriority('');
        setStatus('');
        setDueDate(null);
        setProgress(0);
        setSubtasks([]);
      }
      setAttachments([]);
      setSubtaskInput('');
    }
  }, [isOpen, task]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare task data
    const taskData = {
      title,
      description,
      priority,
      status,
      dueDate: dueDate ? dueDate.toISOString() : new Date().toISOString(),
      progress,
      subtasks,
      assignee: {
        id: '1', // Current user (John Doe)
        name: 'John Doe',
        color: '#3b82f6'
      }
    };
    
    onSave(taskData);
  };

  // Add a new subtask
  const addSubtask = () => {
    if (subtaskInput.trim()) {
      const newSubtask: Subtask = {
        id: Date.now().toString(),
        title: subtaskInput.trim(),
        completed: false
      };
      setSubtasks([...subtasks, newSubtask]);
      setSubtaskInput('');
    }
  };

  // Handle subtask input keypress (add on Enter)
  const handleSubtaskKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubtask();
    }
  };

  // Remove a subtask
  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(subtask => subtask.id !== id));
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  // Render file preview
  const renderFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return (
        <img
          src={URL.createObjectURL(file)}
          alt={file.name}
          className="attachment-preview"
        />
      );
    } else {
      return (
        <div className="neo-box p-2 text-sm text-gray-600">
          {file.name}
        </div>
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" id="taskModal">
      <div className="neo-box w-full max-w-2xl bg-[#e0e5ec] max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-700">
            {task ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <form id="taskForm" className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
            {/* Title Field */}
            <div className="space-y-2">
              <label className="block text-gray-700 font-medium">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                className="w-full p-3 rounded-lg bg-[#e0e5ec] border-none outline-none shadow-inner"
                required
              />
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <label className="block text-gray-700 font-medium">Description</label>
              <div className="h-32 bg-[#e0e5ec] rounded-lg shadow-inner">
                <ReactQuill
                  value={description}
                  onChange={setDescription}
                  modules={modules}
                  placeholder="Enter task description..."
                  theme="snow"
                />
              </div>
            </div>

            {/* Priority and Status Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-gray-700 font-medium">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#e0e5ec] border-none outline-none shadow-inner"
                  required
                >
                  <option value="">Select Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-gray-700 font-medium">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#e0e5ec] border-none outline-none shadow-inner"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="todo">To Do</option>
                  <option value="inProgress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>

            {/* Due Date Field */}
            <div className="space-y-2">
              <label className="block text-gray-700 font-medium">Due Date</label>
              <Flatpickr
                value={dueDate || ""}
                onChange={([date]) => setDueDate(date)}
                options={{
                  enableTime: true,
                  dateFormat: 'Y-m-d H:i',
                  minDate: 'today'
                }}
                className="w-full p-3 rounded-lg bg-[#e0e5ec] border-none outline-none shadow-inner"
                placeholder="Select due date and time"
              />
            </div>

            {/* Progress Field */}
            <div className="space-y-2">
              <label className="block text-gray-700 font-medium">Progress</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  value={progress}
                  onChange={(e) => setProgress(parseInt(e.target.value))}
                  min="0"
                  max="100"
                  className="flex-1 h-2 rounded-lg appearance-none bg-[#e0e5ec] shadow-inner"
                />
                <span className="text-sm text-gray-600 min-w-[3rem]">{progress}%</span>
              </div>
            </div>

            {/* Subtasks Field */}
            <div className="space-y-2">
              <label className="block text-gray-700 font-medium">Subtasks</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={subtaskInput}
                    onChange={(e) => setSubtaskInput(e.target.value)}
                    onKeyPress={handleSubtaskKeyPress}
                    className="flex-1 p-3 rounded-lg bg-[#e0e5ec] border-none outline-none shadow-inner"
                    placeholder="Add subtask"
                  />
                  <button type="button" className="neo-button p-3" onClick={addSubtask}>
                    <i className="bi bi-plus"></i>
                  </button>
                </div>
                {subtasks.map(subtask => (
                  <div key={subtask.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="neo-box"
                      checked={subtask.completed}
                      onChange={() => {
                        setSubtasks(subtasks.map(st => 
                          st.id === subtask.id ? { ...st, completed: !st.completed } : st
                        ));
                      }}
                    />
                    <span className="text-gray-700">{subtask.title}</span>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700 ml-auto"
                      onClick={() => removeSubtask(subtask.id)}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Attachments Field */}
            <div className="space-y-2">
              <label className="block text-gray-700 font-medium">Attachments</label>
              <div className="p-4 rounded-lg bg-[#e0e5ec] shadow-inner text-center">
                <input
                  type="file"
                  id="attachments"
                  ref={fileInputRef}
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label htmlFor="attachments" className="neo-button p-3 inline-flex items-center gap-2 cursor-pointer">
                  <i className="bi bi-upload"></i>
                  <span>Upload Files</span>
                </label>
                <div className="flex flex-wrap gap-2 mt-4">
                  {attachments.map((file, index) => (
                    <div key={index} className="relative">
                      {renderFilePreview(file)}
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                        onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                      >
                        <i className="bi bi-x-lg text-xs"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-4 md:p-6 border-t border-gray-200">
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="neo-button px-4 py-2 md:px-6 md:py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="taskForm"
              className="neo-button primary px-4 py-2 md:px-6 md:py-2"
            >
              Save Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal; 