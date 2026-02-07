import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ items }) => {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <ul className="sidebar-menu">
        {items.map((item, index) => (
          <li key={index}>
            <Link
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
            >
              {item.icon && <span className="icon">{item.icon}</span>}
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;







