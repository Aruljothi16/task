import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import MemberSidebar from '../components/member/MemberSidebar';
import MemberDashboard from '../components/member/dashboard/MemberDashboard';
import MyTasks from '../components/member/tasks/MyTasks';
import TaskDetails from '../components/member/tasks/TaskDetails';
import Settings from '../components/member/settings/Settings';

const MemberPage = () => {
  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content">
        <MemberSidebar />
        <Routes>
          <Route path="/" element={<MemberDashboard />} />
          <Route path="/tasks" element={<MyTasks />} />
          <Route path="/tasks/:id" element={<TaskDetails />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
};

export default MemberPage;





