import React from 'react';
import Sidebar from '../common/Sidebar';
import { LayoutDashboard, CheckSquare, Settings } from 'lucide-react';

const MemberSidebar = () => {
  const menuItems = [
    { path: '/member', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/member/tasks', label: 'My Tasks', icon: <CheckSquare size={20} /> },
    { path: '/member/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return <Sidebar items={menuItems} />;
};

export default MemberSidebar;





