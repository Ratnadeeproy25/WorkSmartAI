import React, { useState, useEffect } from 'react';
import { Column } from './TaskManagement';

interface ColumnModalProps {
  column: Column | null;
  onClose: () => void;
  onSubmit: (column: Omit<Column, 'id'> | Column) => void;
  onDelete?: () => void;
}

const ColumnModal: React.FC<ColumnModalProps> = ({ column, onClose, onSubmit, onDelete }) => {
  // Form state
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#3b82f6');

  // Predefined colors
  const colors = [
    { value: '#3b82f6', name: 'Blue' },
    { value: '#10b981', name: 'Green' },
    { value: '#f59e0b', name: 'Orange' },
    { value: '#ef4444', name: 'Red' },
    { value: '#8b5cf6', name: 'Purple' },
    { value: '#14b8a6', name: 'Teal' },
    { value: '#ec4899', name: 'Pink' },
    { value: '#6b7280', name: 'Gray' }
  ];

  // Initialize form with column data if editing
  useEffect(() => {
    if (column) {
      setTitle(column.title);
      setColor(column.color);
    } else {
      // Default values for new column
      setTitle('');
      setColor('#3b82f6');
    }
  }, [column]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const columnData = {
      ...(column && { id: column.id }), // Include ID if editing existing column
      title,
      color
    };

    onSubmit(columnData);
  };

  // Close modal when clicking outside
  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle delete button click
  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleClickOutside}
    >
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {column ? 'Edit Column' : 'Create New Column'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit}>
            {/* Column Title */}
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Column Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 text-sm border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter column title"
                required
              />
            </div>

            {/* Column Color */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Column Color
              </label>
              <div className="grid grid-cols-4 gap-2">
                {colors.map((colorOption) => (
                  <div 
                    key={colorOption.value} 
                    className={`cursor-pointer rounded-lg p-1 border-2 ${
                      color === colorOption.value ? 'border-indigo-500' : 'border-transparent'
                    }`}
                    onClick={() => setColor(colorOption.value)}
                  >
                    <div
                      className="w-full h-8 rounded-md"
                      style={{ backgroundColor: colorOption.value }}
                      title={colorOption.name}
                    ></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="h-3"
                  style={{ backgroundColor: color }}
                ></div>
                <div className="p-3 flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-800">{title || 'Column Title'}</span>
                    <span className="ml-2 text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">0</span>
                  </div>
                  <div className="flex space-x-1">
                    <button type="button" className="text-gray-400">
                      <i className="bi bi-pencil text-sm"></i>
                    </button>
                    <button type="button" className="text-gray-400">
                      <i className="bi bi-chevron-up text-sm"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-between pt-4 border-t">
              {onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-red-700 hover:text-red-800 rounded-lg"
                >
                  Delete Column
                </button>
              )}
              
              <div className="flex space-x-2 ml-auto">
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
                  {column ? 'Update Column' : 'Create Column'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ColumnModal; 