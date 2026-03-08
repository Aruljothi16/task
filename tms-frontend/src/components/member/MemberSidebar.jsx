import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Settings, User, Activity, ChevronLeft, ChevronRight } from 'lucide-react';

const MemberSidebar = ({ isCollapsed, toggleSidebar }) => {
  const menuItems = [
    { path: '/member', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/member/tasks', label: 'Assigned Tasks', icon: <CheckSquare size={20} /> },
    { path: '/member/activity', label: 'Activity Logs', icon: <Activity size={20} /> },
    { path: '/member/settings', label: 'My Settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} style={{ width: isCollapsed ? '80px' : '280px', transition: 'width 0.3s ease', position: 'relative' }}>
      <ul className="sidebar-menu" style={{ paddingTop: '1rem' }}>
        {menuItems.map((item, index) => (
          <li key={index} style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
            <NavLink
              to={item.path}
              end={item.path === '/member'}
              className={({ isActive }) => isActive ? 'active' : ''}
              title={isCollapsed ? item.label : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: isCollapsed ? '0.875rem' : '0.875rem 1.25rem',
                borderRadius: '8px',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                width: isCollapsed ? 'fit-content' : '100%'
              }}
            >
              {item.icon}
              {!isCollapsed && <span style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>{item.label}</span>}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default MemberSidebar;
