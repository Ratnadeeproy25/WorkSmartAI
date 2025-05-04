import React from 'react';

interface HeaderPanelProps {
  onNotificationsClick: () => void;
}

const HeaderPanel: React.FC<HeaderPanelProps> = ({
  onNotificationsClick
}) => {
  return (
    <div className="neo-box p-6 mb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Leave & Reimbursement Management</h1>
          <p className="text-lg text-gray-600">Manage organization-wide leave requests and reimbursements</p>
        </div>
        <div className="flex gap-4">
          <button className="neo-button p-3" onClick={onNotificationsClick}>
            <i className="bi bi-bell text-xl"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeaderPanel; 