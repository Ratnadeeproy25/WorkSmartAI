import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../../styles/employee/dashboard.css';

const UpcomingDeadlines: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Upcoming Deadlines */}
      <div className="neo-box p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Upcoming Deadlines</h3>
        <div className="space-y-4">
          <div className="task-item">
            <div className="flex items-center">
              <div className="task-avatar bg-red-500">UR</div>
              <div>
                <div className="font-medium text-gray-700">User Research</div>
                <div className="text-sm text-gray-600">Due: Today</div>
              </div>
              <div className="ml-auto">
                <button className="neo-button p-2">
                  <i className="bi bi-three-dots-vertical"></i>
                </button>
              </div>
            </div>
          </div>
          <div className="task-item">
            <div className="flex items-center">
              <div className="task-avatar bg-yellow-500">PD</div>
              <div>
                <div className="font-medium text-gray-700">Project Documentation</div>
                <div className="text-sm text-gray-600">Due: Tomorrow</div>
              </div>
              <div className="ml-auto">
                <button className="neo-button p-2">
                  <i className="bi bi-three-dots-vertical"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="neo-box p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Recent Notifications</h3>
        <div className="space-y-4">
          <div className="announcement-item">
            <div className="flex items-start">
              <div className="announcement-avatar bg-blue-500">TM</div>
              <div>
                <div className="font-medium text-gray-700">Team Meeting</div>
                <div className="text-sm text-gray-600">2 hours ago</div>
              </div>
            </div>
          </div>
          <div className="announcement-item">
            <div className="flex items-start">
              <div className="announcement-avatar bg-green-500">PR</div>
              <div>
                <div className="font-medium text-gray-700">Project Review</div>
                <div className="text-sm text-gray-600">5 hours ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpcomingDeadlines; 