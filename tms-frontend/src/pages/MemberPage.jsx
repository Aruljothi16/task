import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import MemberSidebar from '../components/member/MemberSidebar';
import MemberDashboard from '../components/member/dashboard/MemberDashboard';
import MyTasks from '../components/member/tasks/MyTasks';
import TaskDetails from '../components/member/tasks/TaskDetails';
import Settings from '../components/member/settings/Settings';
import MemberActivityLog from '../components/member/activity/MemberActivityLog';

import ChatBot from '../components/shared/ChatBot';

const MemberPage = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  return (
    <div className="app-container">
      <Navbar toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} isCollapsed={isSidebarCollapsed} />
      <div className="main-content">
        <MemberSidebar
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <div style={{ flex: 1, minWidth: 0, transition: 'all 0.3s ease' }}>
          <Routes>
            <Route path="/" element={<MemberDashboard />} />
            <Route path="/tasks" element={<MyTasks />} />
            <Route path="/tasks/:id" element={<TaskDetails />} />
            <Route path="/activity" element={<MemberActivityLog />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
      <ChatBot />
    </div>
  );
};

export default MemberPage;







