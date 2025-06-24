import React from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../../context/AuthContext';
import Sidebar from '../Sidebar';
import Header from './Header';
import LeaveReimbursementWidget from '../LeaveReimbursement/LeaveReimbursementWidget';
import TaskAssigned from './TaskAssigned';
// import TaskProgress from './TaskProgress';
import '../../../styles/employee/dashboard.css';

const Dashboard: React.FC = () => {
  const { userName, userEmail } = useAuth();
  
  return (
    <>
      <Helmet>
        <title>WorkSmart AI - Employee Dashboard</title>
      </Helmet>
      <div className="min-h-screen bg-[#e0e5ec]">
        <Sidebar />
        <div className="main-content p-6">
          <div className="max-w-7xl mx-auto">
            <Header />
            <TaskAssigned />
            <LeaveReimbursementWidget />
            {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <TaskProgress />
            </div> */}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard; 