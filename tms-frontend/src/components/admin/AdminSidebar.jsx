import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, CheckSquare, Activity, Settings, ShieldCheck } from 'lucide-react';

const AdminSidebar = () => {
  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/admin/users', label: 'User Management', icon: <Users size={20} /> },
    { path: '/admin/projects', label: 'All Projects', icon: <FolderKanban size={20} /> },
    { path: '/admin/tasks', label: 'Task Tracking', icon: <CheckSquare size={20} /> },
    { path: '/admin/activity', label: 'Activity Log', icon: <Activity size={20} /> },
    { path: '/admin/settings', label: 'System Settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ padding: '0 1.5rem 2rem 1.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
          borderRadius: '8px',
          color: 'var(--primary)',
          fontWeight: '700'
        }}>
          <ShieldCheck size={24} />
          <span>ADMIN PANEL</span>
        </div>
      </div>
      <ul className="sidebar-menu">
        {menuItems.map((item, index) => (
          <li key={index} style={{ marginBottom: '0.5rem' }}>
            <NavLink
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) => isActive ? 'active' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '0.875rem 1.25rem',
                borderRadius: '8px',
                textDecoration: 'none',
                transition: 'all 0.3s ease'
              }}
            >
              {item.icon}
              <span style={{ fontWeight: '500' }}>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default AdminSidebar;







