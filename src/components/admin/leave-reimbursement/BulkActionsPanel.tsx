import React from 'react';

interface BulkActionsPanelProps {
  onBulkApprove: () => void;
  onBulkReject: () => void;
  onBulkExport: () => void;
  onToggleFilters: () => void;
  hasSelectedItems: boolean;
}

const BulkActionsPanel: React.FC<BulkActionsPanelProps> = ({
  onBulkApprove,
  onBulkReject,
  onBulkExport,
  onToggleFilters,
  hasSelectedItems
}) => {
  return (
    <div className="neo-box p-6 mb-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <button 
            className="neo-button p-2 text-green-600" 
            onClick={onBulkApprove}
            disabled={!hasSelectedItems}
          >
            <i className="bi bi-check-all"></i>
            <span>Bulk Approve</span>
          </button>
          <button 
            className="neo-button p-2 text-red-600" 
            onClick={onBulkReject}
            disabled={!hasSelectedItems}
          >
            <i className="bi bi-x-lg"></i>
            <span>Bulk Reject</span>
          </button>
          <button 
            className="neo-button p-2 text-blue-600" 
            onClick={onBulkExport}
            disabled={!hasSelectedItems}
          >
            <i className="bi bi-download"></i>
            <span>Export Selected</span>
          </button>
        </div>
        <div className="flex gap-4">
          <button className="neo-button p-2" onClick={onToggleFilters}>
            <i className="bi bi-funnel"></i>
            <span>Advanced Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsPanel; 