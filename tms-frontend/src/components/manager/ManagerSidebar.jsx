import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, Activity, Settings, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';

const ManagerSidebar = ({ isCollapsed, toggleSidebar }) => {
  const menuItems = [
    { path: '/manager', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/manager/projects', label: 'Assigned Projects', icon: <FolderKanban size={20} /> },
    { path: '/manager/tasks', label: 'Global Tasks', icon: <CheckSquare size={20} /> },
    { path: '/manager/activity', label: 'Activity Log', icon: <Activity size={20} /> },
    { path: '/manager/settings', label: 'My Settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} style={{ width: isCollapsed ? '80px' : '280px', transition: 'width 0.3s ease', position: 'relative' }}>
      <ul className="sidebar-menu" style={{ paddingTop: '1rem' }}>
        {menuItems.map((item, index) => (
          <li key={index} style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
            <NavLink
              to={item.path}
              end={item.path === '/manager'}
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

export default ManagerSidebar;







