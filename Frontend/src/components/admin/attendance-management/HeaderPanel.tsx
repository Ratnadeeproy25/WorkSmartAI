import React from 'react';

const HeaderPanel: React.FC = () => {
  return (
    <div className="neo-box p-6 mb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Attendance Management</h1>
          <p className="text-lg text-gray-600">Monitor and manage organization-wide attendance</p>
        </div>
        <div className="flex gap-4">
        </div>
      </div>
    </div>
  );
};

export default HeaderPanel; 