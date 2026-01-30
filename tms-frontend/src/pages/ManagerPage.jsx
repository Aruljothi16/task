import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import ManagerSidebar from '../components/manager/ManagerSidebar';
import ManagerDashboard from '../components/manager/dashboard/ManagerDashboard';
import MyProjects from '../components/manager/projects/MyProjects';
import TasksList from '../components/manager/tasks/TasksList';
import ManagerTaskDetails from '../components/manager/tasks/ManagerTaskDetails';
import Settings from '../components/manager/settings/Settings';

const ManagerPage = () => {
  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content">
        <ManagerSidebar />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Routes>
            <Route path="/" element={<ManagerDashboard />} />
            <Route path="/projects" element={<MyProjects />} />
            <Route path="/tasks" element={<TasksList />} />
            <Route path="/tasks/:id" element={<ManagerTaskDetails />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default ManagerPage;






