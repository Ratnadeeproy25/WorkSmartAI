import React from 'react';

interface TaskHeaderProps {
  onAddTask: () => void;
  onAddColumn: () => void;
}

const TaskHeader: React.FC<TaskHeaderProps> = ({ onAddTask, onAddColumn }) => {
  return (
    <div className="neo-box p-5 md:p-6 mb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manager Task Management</h1>
          <p className="text-md md:text-lg text-gray-600">Manage and track team tasks</p>
        </div>
        <div className="flex gap-4">
          <button 
            className="neo-button px-4 py-2"
            onClick={onAddColumn}
          >
            <i className="bi bi-plus-square mr-2"></i>Add Column
          </button>
          <button 
            className="neo-button primary px-4 py-2"
            onClick={onAddTask}
          >
            <i className="bi bi-plus-lg mr-2"></i>Add Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskHeader; 