import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/light.css';
import { Task } from './KanbanBoard';

interface TaskModalProps {
  taskId: string | null;
  onClose: () => void;
}

interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

const TaskModal: React.FC<TaskModalProps> = ({ taskId, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [assignee, setAssignee] = useState('');
  const [progress, setProgress] = useState(0);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load data if editing an existing task
    if (taskId) {
      try {
        const savedTasks = localStorage.getItem('managerTasks');
        if (savedTasks) {
          const tasks: Task[] = JSON.parse(savedTasks);
          const task = tasks.find(t => t.id === taskId);
          
          if (task) {
            setTitle(task.title);
            setDescription(task.description);
            setPriority(task.priority);
            setStatus(task.status);
            setDueDate(new Date(task.dueDate));
            setAssignee(task.assignee.id);
            setProgress(task.progress || 0);
            
            // If the task has subtasks (this would be an extension to the Task interface)
            if ((task as any).subtasks) {
              setSubtasks((task as any).subtasks);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load task data', error);
      }
    }
  }, [taskId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dueDate) return; // Validate dueDate is set
    
    const taskData: any = {
      title,
      description,
      priority,
      status,
      dueDate: dueDate.toISOString(),
      assignee: {
        id: assignee,
        name: assignee === '1' ? 'John Doe' : 'Jane Smith',
        color: assignee === '1' ? '#3b82f6' : '#10b981'
      },
      progress,
      subtasks,
      // We would handle attachments differently in a real app
      // This is just a placeholder
    };
    
    try {
      const savedTasks = localStorage.getItem('managerTasks');
      let tasks: Task[] = savedTasks ? JSON.parse(savedTasks) : [];
      
      if (taskId) {
        // Update existing task
        tasks = tasks.map(task => 
          task.id === taskId ? { ...task, ...taskData } : task
        );
      } else {
        // Create new task
        const newTask = {
          id: `task-${Date.now()}`,
          createdAt: new Date().toISOString(),
          ...taskData
        };
        tasks.push(newTask);
      }
      
      localStorage.setItem('managerTasks', JSON.stringify(tasks));
      window.dispatchEvent(new Event('tasksUpdated'));
      onClose();
    } catch (error) {
      console.error('Failed to save task', error);
      alert('Failed to save task. Please try again.');
    }
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      const subtask = {
        id: `subtask-${Date.now()}`,
        text: newSubtask,
        completed: false
      };
      setSubtasks([...subtasks, subtask]);
      setNewSubtask('');
    }
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter(subtask => subtask.id !== id));
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(subtask => 
      subtask.id === id ? { ...subtask, completed: !subtask.completed } : subtask
    ));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setAttachments([...attachments, ...fileArray]);
      
      // Generate previews
      const previews: string[] = [];
      fileArray.forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = () => {
            previews.push(reader.result as string);
            if (previews.length === fileArray.length) {
              setAttachmentPreviews([...attachmentPreviews, ...previews]);
            }
          };
          reader.readAsDataURL(file);
        } else {
          previews.push('file');
        }
      });
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
                <option value="">Select Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
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
                <option value="">Select Status</option>
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
                className="neo-box w-full p-3 text-gray-700"
                value={dueDate || undefined}
                onChange={dates => setDueDate(dates[0])}
                options={{
                  enableTime: true,
                  dateFormat: 'Y-m-d H:i',
                  minDate: 'today'
                }}
                placeholder="Select due date"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Assignee</label>
              <select 
                className="neo-box w-full p-3 text-gray-700"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                required
              >
                <option value="">Select Assignee</option>
                <option value="1">John Doe</option>
                <option value="2">Jane Smith</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Progress</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              className="w-full"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value, 10))}
            />
            <span className="text-sm text-gray-600">{progress}%</span>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Subtasks</label>
            <div className="space-y-2">
              {subtasks.map(subtask => (
                <div key={subtask.id} className="flex gap-2 items-center">
                  <input 
                    type="checkbox" 
                    className="neo-box"
                    checked={subtask.completed}
                    onChange={() => handleToggleSubtask(subtask.id)}
                  />
                  <span className={`text-gray-700 ${subtask.completed ? 'line-through' : ''}`}>
                    {subtask.text}
                  </span>
                  <button 
                    type="button" 
                    className="text-red-500 hover:text-red-700 ml-auto"
                    onClick={() => handleRemoveSubtask(subtask.id)}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="neo-box flex-1 p-2 text-gray-700" 
                  placeholder="Add subtask"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                />
                <button 
                  type="button" 
                  className="neo-button p-2"
                  onClick={handleAddSubtask}
                >
                  <i className="bi bi-plus"></i>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Attachments</label>
            <div className="neo-box p-4 text-center">
              <input 
                type="file" 
                ref={fileInputRef}
                multiple 
                className="hidden"
                onChange={handleFileChange}
              />
              <button 
                type="button" 
                className="neo-button p-3 inline-flex items-center gap-2 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="bi bi-upload"></i>
                <span>Upload Files</span>
              </button>
              <div className="flex flex-wrap gap-2 mt-4">
                {attachmentPreviews.map((preview, index) => (
                  preview === 'file' ? (
                    <div key={index} className="neo-box p-2 text-sm text-gray-600">
                      {attachments[index].name}
                    </div>
                  ) : (
                    <img 
                      key={index} 
                      src={preview} 
                      alt="Attachment preview" 
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )
                ))}
              </div>
            </div>
          </div>
        </form>
        <div className="flex justify-end gap-4 mt-6 flex-shrink-0 border-t pt-4">
          <button 
            type="button" 
            className="neo-button px-6 py-2"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="neo-button primary px-6 py-2"
            onClick={handleSubmit}
          >
            Save Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal; 