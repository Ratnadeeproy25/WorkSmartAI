import React, { useState, useMemo, useCallback } from 'react';
import { LeaveRequest, ReimbursementRequest, RequestType } from './types';
import RequestCard from './RequestCard';

interface RequestsListProps {
  title: string;
  requests: (LeaveRequest | ReimbursementRequest)[];
  type: RequestType;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRevoke?: (id: string) => void;
  exportEnabled?: boolean;
  onExport?: () => void;
  loading?: boolean;
}

const RequestsList: React.FC<RequestsListProps> = ({
  title,
  requests,
  type,
  onApprove,
  onReject,
  onRevoke,
  exportEnabled = true,
  onExport,
  loading = false
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  // Memoize filtered requests - handle mixed types when type is 'all'
  const filteredRequests = useMemo(() => {
    let filtered = requests;

    // Filter by type if specific type is selected
    if (type !== 'all') {
      filtered = requests.filter(request => request.requestType === type);
    }

    // Filter by department if selected
    if (selectedDepartment) {
      filtered = filtered.filter(request => 
        request.department.toLowerCase() === selectedDepartment.toLowerCase()
      );
    }

    return filtered;
  }, [requests, selectedDepartment, type]);

  // Get unique departments from all requests
  const departments = useMemo(() => {
    const deptSet = new Set(requests.map(req => req.department));
    return Array.from(deptSet).sort();
  }, [requests]);

  const handleDepartmentChange = useCallback((department: string) => {
    setSelectedDepartment(department);
  }, []);

  if (loading && requests.length === 0) {
    return (
      <div className="neo-box p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <div className="mt-2 text-gray-500">Loading requests...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="neo-box p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <div className="flex gap-4 items-center">
          <select 
            className="neo-select w-48"
            value={selectedDepartment}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            disabled={loading}
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept.toLowerCase()}>{dept}</option>
            ))}
          </select>
          {exportEnabled && (
            <button 
              className="neo-button primary p-2" 
              onClick={onExport}
              disabled={loading || filteredRequests.length === 0}
            >
              <i className="bi bi-download mr-2"></i>Export
            </button>
          )}
        </div>
      </div>
      
      {loading && requests.length > 0 && (
        <div className="mb-4 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Updating requests...
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map(request => (
            <RequestCard
              key={request.id}
              request={request}
              type={request.requestType}
              onApprove={onApprove}
              onReject={onReject}
              onRevoke={onRevoke}
              disabled={loading}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Loading requests...
              </>
            ) : (
              `No ${type === 'all' ? '' : type} requests found`
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(RequestsList); 