import React from 'react';

interface HeaderPanelProps {
  onAddTask: () => void;
  onAddColumn: () => void;
}

const HeaderPanel: React.FC<HeaderPanelProps> = ({ onAddTask, onAddColumn }) => {
  return (
    <div className="neo-box p-6 mb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Task Management</h1>
          <p className="text-lg text-gray-600">Manage and organize your team's tasks</p>
        </div>
        <div className="flex gap-4">
          <button className="neo-button p-3">
            <i className="bi bi-bell text-xl"></i>
          </button>
          <button
            onClick={onAddColumn}
            className="neo-button p-3 flex items-center gap-2"
          >
            <i className="bi bi-columns-gap"></i>
            <span>Add Column</span>
          </button>
          <button
            onClick={onAddTask}
            className="neo-button p-3 flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <i className="bi bi-plus"></i>
            <span>Add Task</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeaderPanel; 