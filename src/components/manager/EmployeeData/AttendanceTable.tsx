import React from 'react';
import { AttendanceRecord } from './AttendanceSection';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({ 
  records, 
  currentPage, 
  totalPages, 
  onPageChange 
}) => {
  const handleViewDetails = (id: number) => {
    const record = records.find(r => r.id === id);
    if (record) {
      alert(`Viewing details for ${record.employee}
Date: ${record.date}
Check In: ${record.checkIn}
Check Out: ${record.checkOut}
Status: ${record.status}
Work Hours: ${record.workHours}`);
    }
  };

  const handleEditRecord = (id: number) => {
    const record = records.find(r => r.id === id);
    if (record) {
      alert(`Editing record for ${record.employee}
This would open an edit form in a real application.`);
    }
  };

  return (
    <div className="neo-box p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-700">Attendance Records</h2>
        <div className="flex gap-2">
          <button 
            className="neo-button p-2" 
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <i className="bi bi-chevron-left"></i>
          </button>
          <span className="neo-box px-4 py-2">Page {currentPage} of {totalPages}</span>
          <button 
            className="neo-button p-2" 
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-200">
              <th className="p-3">Employee</th>
              <th className="p-3">Department</th>
              <th className="p-3">Date</th>
              <th className="p-3">Check In</th>
              <th className="p-3">Check Out</th>
              <th className="p-3">Status</th>
              <th className="p-3">Work Hours</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr className="border-t border-gray-200" key={record.id}>
                <td className="p-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-300 mr-3"></div>
                    <div className="font-medium text-gray-700">{record.employee}</div>
                  </div>
                </td>
                <td className="p-3 text-gray-600">{record.department}</td>
                <td className="p-3 text-gray-600">{record.date}</td>
                <td className="p-3 text-gray-600">{record.checkIn}</td>
                <td className="p-3 text-gray-600">{record.checkOut}</td>
                <td className="p-3">
                  <span className={`status-badge status-${record.status}`}>
                    {record.status}
                  </span>
                </td>
                <td className="p-3 text-gray-600">{record.workHours}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button 
                      className="neo-button p-2" 
                      onClick={() => handleViewDetails(record.id)}
                    >
                      <i className="bi bi-eye text-blue-600"></i>
                    </button>
                    <button 
                      className="neo-button p-2" 
                      onClick={() => handleEditRecord(record.id)}
                    >
                      <i className="bi bi-pencil text-yellow-600"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable; 