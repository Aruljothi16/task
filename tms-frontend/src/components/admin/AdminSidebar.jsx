import React from 'react';
import Sidebar from '../common/Sidebar';
import { LayoutDashboard, Users, FolderKanban, CheckSquare, Settings } from 'lucide-react';

const AdminSidebar = () => {
  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/admin/users', label: 'Users', icon: <Users size={20} /> },
    { path: '/admin/projects', label: 'Projects', icon: <FolderKanban size={20} /> },
    { path: '/admin/tasks', label: 'Tasks', icon: <CheckSquare size={20} /> },
    { path: '/admin/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return <Sidebar items={menuItems} />;
};

export default AdminSidebar;





