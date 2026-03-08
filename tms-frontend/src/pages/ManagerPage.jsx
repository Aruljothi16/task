import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import ManagerSidebar from '../components/manager/ManagerSidebar';
import ManagerDashboard from '../components/manager/dashboard/ManagerDashboard';
import MyProjects from '../components/manager/projects/MyProjects';
import TasksList from '../components/manager/tasks/TasksList';
import ManagerTaskDetails from '../components/manager/tasks/ManagerTaskDetails';
import ManagerActivityLog from '../components/manager/activity/ManagerActivityLog';
import Settings from '../components/manager/settings/Settings';

import ChatBot from '../components/shared/ChatBot';

const ManagerPage = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  return (
    <div className="app-container">
      <Navbar toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} isCollapsed={isSidebarCollapsed} />
      <div className="main-content">
        <ManagerSidebar
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <div style={{ flex: 1, minWidth: 0, transition: 'all 0.3s ease' }}>
          <Routes>
            <Route path="/" element={<ManagerDashboard />} />
            <Route path="/projects" element={<MyProjects />} />
            <Route path="/tasks" element={<TasksList />} />
            <Route path="/tasks/:id" element={<ManagerTaskDetails />} />
            <Route path="/activity" element={<ManagerActivityLog />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
      <ChatBot />
    </div>
  );
};

export default ManagerPage;







