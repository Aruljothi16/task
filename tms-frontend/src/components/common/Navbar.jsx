import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun, Palette, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleMode, changeColor } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h2>Task Management System</h2>
      </div>
      <div className="navbar-menu" style={{ gap: '1rem', display: 'flex', alignItems: 'center' }}>
        <div className="theme-controls" style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={toggleMode}
            className="btn btn-secondary"
            title="Toggle Dark Mode"
            style={{ padding: '0.5rem', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {theme.mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <button
            onClick={() => {
              const colors = ['blue', 'purple', 'green', 'orange'];
              const nextColor = colors[(colors.indexOf(theme.color) + 1) % colors.length];
              changeColor(nextColor);
            }}
            className="btn btn-secondary"
            title="Change Theme Color"
            style={{ padding: '0.5rem', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Palette size={18} />
          </button>
        </div>

        <span className="user-info">
          {user?.full_name} <span style={{ opacity: 0.7, fontSize: '0.8em', marginLeft: '4px' }}>({user?.role})</span>
        </span>
        <button onClick={handleLogout} className="btn btn-primary">
          <LogOut size={16} style={{ marginRight: '6px' }} />
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;





