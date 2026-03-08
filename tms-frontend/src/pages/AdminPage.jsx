import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminDashboard from '../components/admin/dashboard/AdminDashboard';
import UsersList from '../components/admin/users/UsersList';
import ProjectsList from '../components/admin/projects/ProjectsList';
import TaskStatus from '../components/admin/tasks/TaskStatus';
import ActivityLog from '../components/admin/activity/ActivityLog';
import Settings from '../components/admin/settings/Settings';

import ChatBot from '../components/shared/ChatBot';

const AdminPage = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  return (
    <div className="app-container">
      <Navbar toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} isCollapsed={isSidebarCollapsed} />
      <div className="main-content">
        <AdminSidebar
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <div style={{ flex: 1, minWidth: 0, transition: 'all 0.3s ease' }}>
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/users" element={<UsersList />} />
            <Route path="/projects" element={<ProjectsList />} />
            <Route path="/tasks" element={<TaskStatus />} />
            <Route path="/activity" element={<ActivityLog />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
      <ChatBot />
    </div>
  );
};

export default AdminPage;







