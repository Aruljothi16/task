import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import MemberSidebar from '../components/member/MemberSidebar';
import MemberDashboard from '../components/member/dashboard/MemberDashboard';
import MyTasks from '../components/member/tasks/MyTasks';
import TaskDetails from '../components/member/tasks/TaskDetails';
import Settings from '../components/member/settings/Settings';
import MemberActivityLog from '../components/member/activity/MemberActivityLog';

const MemberPage = () => {
  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content">
        <MemberSidebar />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Routes>
            <Route path="/" element={<MemberDashboard />} />
            <Route path="/tasks" element={<MyTasks />} />
            <Route path="/tasks/:id" element={<TaskDetails />} />
            <Route path="/activity" element={<MemberActivityLog />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default MemberPage;







