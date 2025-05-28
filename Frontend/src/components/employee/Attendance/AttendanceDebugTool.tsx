import React, { useState } from 'react';
import attendanceService from '../../../services/attendanceService';
import leaveService from '../../../services/leaveService';

interface DebugInfo {
  timestamp: string;
  action: string;
  status: 'success' | 'error' | 'info';
  details: any;
}

const AttendanceDebugTool: React.FC = () => {
  const [debugLogs, setDebugLogs] = useState<DebugInfo[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const addLog = (action: string, status: 'success' | 'error' | 'info', details: any) => {
    const log: DebugInfo = {
      timestamp: new Date().toLocaleTimeString(),
      action,
      status,
      details
    };
    setDebugLogs(prev => [...prev, log]);
  };

  const checkAuthentication = () => {
    addLog('Check Authentication', 'info', 'Starting authentication check...');
    
    // Check localStorage for user data
    const employeeData = localStorage.getItem('employeeUserData');
    const employeeToken = localStorage.getItem('employeeToken');
    const managerData = localStorage.getItem('managerUserData');
    const adminData = localStorage.getItem('adminUserData');
    
    addLog('Employee Data', employeeData ? 'success' : 'error', employeeData ? JSON.parse(employeeData) : 'Not found');
    addLog('Employee Token', employeeToken ? 'success' : 'error', employeeToken ? 'Token exists' : 'Token missing');
    addLog('Manager Data', managerData ? 'info' : 'info', managerData ? 'Manager session exists' : 'No manager session');
    addLog('Admin Data', adminData ? 'info' : 'info', adminData ? 'Admin session exists' : 'No admin session');
  };

  const testTodayAttendance = async () => {
    addLog('Test Today Attendance', 'info', 'Starting API test...');
    
    try {
      const result = await attendanceService.getTodayAttendance();
      addLog('Today Attendance API', 'success', result);
    } catch (error: any) {
      addLog('Today Attendance API', 'error', {
        status: error.status,
        message: error.message,
        data: error.data
      });
    }
  };

  const testAttendanceStats = async () => {
    addLog('Test Attendance Stats', 'info', 'Starting stats API test...');
    
    try {
      const result = await attendanceService.getAttendanceStats();
      addLog('Attendance Stats API', 'success', result);
    } catch (error: any) {
      addLog('Attendance Stats API', 'error', {
        status: error.status,
        message: error.message,
        data: error.data
      });
    }
  };

  const testLeaveDates = async () => {
    addLog('Test Leave Dates', 'info', 'Starting leave dates API test...');
    
    try {
      const result = await leaveService.getLeaveDates();
      addLog('Leave Dates API', 'success', result);
    } catch (error: any) {
      addLog('Leave Dates API', 'error', {
        status: error.status,
        message: error.message,
        data: error.data
      });
    }
  };

  const clearLogs = () => {
    setDebugLogs([]);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-yellow-600 text-white p-2 rounded-full shadow-lg hover:bg-yellow-700 z-50"
        title="Open Debug Tool"
      >
        <i className="bi bi-bug-fill"></i>
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 w-96 max-h-96 bg-white border rounded-lg shadow-lg z-50 overflow-hidden">
      <div className="bg-yellow-600 text-white p-3 flex justify-between items-center">
        <h4 className="font-semibold">Attendance Debug Tool</h4>
        <button onClick={() => setIsVisible(false)} className="text-white hover:text-gray-200">
          <i className="bi bi-x-lg"></i>
        </button>
      </div>
      
      <div className="p-3">
        <div className="flex gap-2 mb-3 flex-wrap">
          <button onClick={checkAuthentication} className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Auth</button>
          <button onClick={testTodayAttendance} className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Today</button>
          <button onClick={testAttendanceStats} className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Stats</button>
          <button onClick={testLeaveDates} className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Leave</button>
          <button onClick={clearLogs} className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700">Clear</button>
        </div>
        
        <div className="max-h-64 overflow-y-auto text-xs">
          {debugLogs.length === 0 ? (
            <p className="text-gray-500 italic">No logs yet. Click buttons above to test.</p>
          ) : (
            debugLogs.map((log, index) => (
              <div key={index} className={`mb-2 p-2 rounded border-l-4 ${
                log.status === 'success' ? 'border-green-500 bg-green-50' :
                log.status === 'error' ? 'border-red-500 bg-red-50' :
                'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex justify-between items-start">
                  <span className="font-semibold">{log.action}</span>
                  <span className="text-gray-500">{log.timestamp}</span>
                </div>
                <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap">
                  {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : log.details}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceDebugTool; 