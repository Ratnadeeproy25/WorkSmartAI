import React, { useState, useEffect } from 'react';

interface Column {
  id: string;
  title: string;
  color: string;
}

interface ColumnModalProps {
  columnId: string | null;
  onClose: () => void;
}

const ColumnModal: React.FC<ColumnModalProps> = ({ columnId, onClose }) => {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#3b82f6');

  useEffect(() => {
    // Load data if editing an existing column
    if (columnId) {
      try {
        const savedColumns = localStorage.getItem('managerColumns');
        if (savedColumns) {
          const columns: Column[] = JSON.parse(savedColumns);
          const column = columns.find(c => c.id === columnId);
          
          if (column) {
            setTitle(column.title);
            setColor(column.color);
          }
        }
      } catch (error) {
        console.error('Failed to load column data', error);
      }
    }
  }, [columnId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const savedColumns = localStorage.getItem('managerColumns');
      let columns: Column[] = savedColumns ? JSON.parse(savedColumns) : [
        { id: 'todo', title: 'To Do', color: '#3b82f6' },
        { id: 'inProgress', title: 'In Progress', color: '#f59e0b' },
        { id: 'completed', title: 'Completed', color: '#10b981' },
        { id: 'blocked', title: 'Blocked', color: '#ef4444' }
      ];
      
      if (columnId) {
        // Update existing column
        columns = columns.map(column => 
          column.id === columnId ? { ...column, title, color } : column
        );
      } else {
        // Create new column
        const newColumn = {
          id: `column-${Date.now()}`,
          title,
          color
        };
        columns.push(newColumn);
      }
      
      localStorage.setItem('managerColumns', JSON.stringify(columns));
      window.dispatchEvent(new Event('tasksUpdated'));
      onClose();
    } catch (error) {
      console.error('Failed to save column', error);
      alert('Failed to save column. Please try again.');
    }
  };

  const handleDeleteColumn = () => {
    if (!columnId) return;
    
    if (window.confirm('Are you sure you want to delete this column? All tasks will be moved to the To Do column.')) {
      try {
        const savedColumns = localStorage.getItem('managerColumns');
        if (savedColumns) {
          const columns: Column[] = JSON.parse(savedColumns);
          
          // Make sure we don't delete the default columns
          if (['todo', 'inProgress', 'completed', 'blocked'].includes(columnId)) {
            alert('Cannot delete default columns.');
            return;
          }
          
          // Filter out the column to delete
          const updatedColumns = columns.filter(column => column.id !== columnId);
          localStorage.setItem('managerColumns', JSON.stringify(updatedColumns));
          
          // Move tasks from this column to To Do
          const savedTasks = localStorage.getItem('managerTasks');
          if (savedTasks) {
            const tasks = JSON.parse(savedTasks);
            const updatedTasks = tasks.map((task: any) => {
              if (task.status === columnId) {
                return { ...task, status: 'todo' };
              }
              return task;
            });
            localStorage.setItem('managerTasks', JSON.stringify(updatedTasks));
          }
          
          window.dispatchEvent(new Event('tasksUpdated'));
          onClose();
        }
      } catch (error) {
        console.error('Failed to delete column', error);
        alert('Failed to delete column. Please try again.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="neo-box p-6 w-full max-w-md mx-4 bg-[#e0e5ec]">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          {columnId ? 'Edit Column' : 'Add Column'}
        </h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-gray-700 mb-2">Column Title</label>
            <input 
              type="text" 
              className="neo-box w-full p-3 text-gray-700"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Column Color</label>
            <input 
              type="color" 
              className="neo-box w-full p-2"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            {columnId && (
              <button 
                type="button" 
                className="neo-button px-4 py-2 text-red-600"
                onClick={handleDeleteColumn}
              >
                <i className="bi bi-trash mr-2"></i>Delete Column
              </button>
            )}
            <div className={`flex gap-4 ${columnId ? '' : 'ml-auto'}`}>
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
              >
                Save Column
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ColumnModal; 