import React, { useState, useMemo, useCallback } from 'react';
import { LeaveRequest, ReimbursementRequest, RequestType } from './types';
import RequestCard from './RequestCard';

interface RequestsListProps {
  title: string;
  requests: (LeaveRequest | ReimbursementRequest)[];
  type: RequestType;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onComment: (id: string) => void;
  onShowHistory: (id: string) => void;
  onRevoke?: (id: string) => void;
  onBulkSelect?: (ids: string[]) => void;
  enableSelection?: boolean;
  exportEnabled?: boolean;
  onExport?: () => void;
}

const RequestsList: React.FC<RequestsListProps> = ({
  title,
  requests,
  type,
  onApprove,
  onReject,
  onComment,
  onShowHistory,
  onRevoke,
  onBulkSelect,
  enableSelection = false,
  exportEnabled = true,
  onExport
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());

  // Memoize filtered requests
  const filteredRequests = useMemo(() => {
    return selectedDepartment
      ? requests.filter(request => request.department.toLowerCase() === selectedDepartment.toLowerCase())
      : requests;
  }, [requests, selectedDepartment]);

  // Memoize selection handlers
  const handleSelect = useCallback((id: string, selected: boolean) => {
    const newSelectedRequests = new Set(selectedRequests);
    
    if (selected) {
      newSelectedRequests.add(id);
    } else {
      newSelectedRequests.delete(id);
    }
    
    setSelectedRequests(newSelectedRequests);
    
    if (onBulkSelect) {
      onBulkSelect(Array.from(newSelectedRequests));
    }
  }, [selectedRequests, onBulkSelect]);

  const handleDepartmentChange = useCallback((department: string) => {
    setSelectedDepartment(department);
  }, []);

  return (
    <div className="neo-box p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <div className="flex gap-4">
          <select 
            className="neo-select w-48"
            value={selectedDepartment}
            onChange={(e) => handleDepartmentChange(e.target.value)}
          >
            <option value="">All Departments</option>
            <option value="development">Development</option>
            <option value="design">Design</option>
            <option value="marketing">Marketing</option>
            <option value="hr">HR</option>
          </select>
          {exportEnabled && (
            <button className="neo-button primary p-2" onClick={onExport}>
              <i className="bi bi-download mr-2"></i>Export
            </button>
          )}
        </div>
      </div>
      <div className="space-y-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map(request => (
            <RequestCard
              key={request.id}
              request={request}
              type={type}
              onApprove={onApprove}
              onReject={onReject}
              onComment={onComment}
              onShowHistory={onShowHistory}
              onRevoke={onRevoke}
              onSelect={enableSelection ? handleSelect : undefined}
              isSelected={selectedRequests.has(request.id)}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No {type} requests found
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(RequestsList); 