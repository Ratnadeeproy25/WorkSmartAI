import React from 'react';
import { AttendanceRecord } from './types';

interface AttendanceTableProps {
  attendanceData: AttendanceRecord[];
  type: 'employee' | 'manager';
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({ 
  attendanceData, 
  type, 
  onView, 
  onEdit, 
  onDelete 
}) => {
  const statusIcons = {
    present: 'bi-check-circle',
    absent: 'bi-x-circle',
    late: 'bi-clock',
    leave: 'bi-calendar-check'
  };

  return (
    <div className="table-container overflow-hidden">
      <div className="table-header p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-700">
            {type === 'employee' ? 'Employee' : 'Manager'} Attendance Records
          </h2>
          <div className="flex gap-2">
            <button className="neo-button p-2" id={`${type}PrevPage`}>
              <i className="bi bi-chevron-left"></i>
            </button>
            <span className="neo-box px-4 py-2" id={`${type}PageInfo`}>
              Page 1 of 1
            </span>
            <button className="neo-button p-2" id={`${type}NextPage`}>
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-200">
              <th className="p-3">{type === 'employee' ? 'Employee' : 'Manager'}</th>
              <th className="p-3">Department</th>
              <th className="p-3">Date</th>
              <th className="p-3">Check In</th>
              <th className="p-3">Check Out</th>
              <th className="p-3">Status</th>
              <th className="p-3">Work Hours</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody id={`${type}AttendanceTable`}>
            {attendanceData.map((record) => (
              <tr key={record.id} className="table-row">
                <td className="p-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-300 mr-3"></div>
                    <div className="font-medium text-gray-700">{record.name}</div>
                  </div>
                </td>
                <td className="p-3 text-gray-600">{record.department}</td>
                <td className="p-3 text-gray-600">{record.date}</td>
                <td className="p-3 text-gray-600">{record.checkIn}</td>
                <td className="p-3 text-gray-600">{record.checkOut}</td>
                <td className="p-3">
                  <span className={`status-badge status-${record.status}`}>
                    <i className={`bi ${statusIcons[record.status]}`}></i>
                    {record.status}
                  </span>
                </td>
                <td className="p-3 text-gray-600">{record.workHours}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button 
                      className="neo-button p-2" 
                      onClick={() => onView(record.id)}
                    >
                      <i className="bi bi-eye text-blue-600"></i>
                    </button>
                    <button 
                      className="neo-button p-2" 
                      onClick={() => onEdit(record.id)}
                    >
                      <i className="bi bi-pencil text-yellow-600"></i>
                    </button>
                    <button 
                      className="neo-button p-2" 
                      onClick={() => onDelete(record.id)}
                    >
                      <i className="bi bi-trash text-red-600"></i>
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