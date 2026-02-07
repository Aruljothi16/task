import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Settings, User, Activity } from 'lucide-react';

const MemberSidebar = () => {
  const menuItems = [
    { path: '/member', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/member/tasks', label: 'Assigned Tasks', icon: <CheckSquare size={20} /> },
    { path: '/member/activity', label: 'Activity Logs', icon: <Activity size={20} /> },
    { path: '/member/settings', label: 'My Settings', icon: <Settings size={20} /> },
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
          <User size={24} />
          <span>MEMBER PANEL</span>
        </div>
      </div>
      <ul className="sidebar-menu">
        {menuItems.map((item, index) => (
          <li key={index} style={{ marginBottom: '0.5rem' }}>
            <NavLink
              to={item.path}
              end={item.path === '/member'}
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

export default MemberSidebar;
