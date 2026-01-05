import React from 'react';
import Sidebar from '../common/Sidebar';
import { LayoutDashboard, FolderKanban, CheckSquare, Settings } from 'lucide-react';

const ManagerSidebar = () => {
  const menuItems = [
    { path: '/manager', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/manager/projects', label: 'My Projects', icon: <FolderKanban size={20} /> },
    { path: '/manager/tasks', label: 'Tasks', icon: <CheckSquare size={20} /> },
    { path: '/manager/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return <Sidebar items={menuItems} />;
};

export default ManagerSidebar;





