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

const AdminPage = () => {
  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content">
        <AdminSidebar />
        <div style={{ flex: 1, minWidth: 0 }}>
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
    </div>
  );
};

export default AdminPage;







