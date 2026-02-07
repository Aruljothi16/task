import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, Activity, Settings, Briefcase } from 'lucide-react';

const ManagerSidebar = () => {
  const menuItems = [
    { path: '/manager', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/manager/projects', label: 'Assigned Projects', icon: <FolderKanban size={20} /> },
    { path: '/manager/tasks', label: 'Global Tasks', icon: <CheckSquare size={20} /> },
    { path: '/manager/activity', label: 'Activity Log', icon: <Activity size={20} /> },
    { path: '/manager/settings', label: 'My Settings', icon: <Settings size={20} /> },
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
          <Briefcase size={24} />
          <span>MANAGER PANEL</span>
        </div>
      </div>
      <ul className="sidebar-menu">
        {menuItems.map((item, index) => (
          <li key={index} style={{ marginBottom: '0.5rem' }}>
            <NavLink
              to={item.path}
              end={item.path === '/manager'}
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

export default ManagerSidebar;







